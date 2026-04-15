/**
 * WhatsApp Webhook — receives messages from Z-API and processes with Claude AI
 *
 * Z-API sends POST with payload:
 *   { phone, fromMe, text: { message }, messageId, ... }
 *
 * Configure this URL in Z-API dashboard as "Webhook de Recebimento".
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Z-API health check
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", service: "liberty-ai-webhook" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Z-API payload normalization
    const fromMe = body.fromMe === true;
    const messageText = (body.text?.message || body.message || "").trim();
    const phone = (body.phone || body.from || "").replace(/\D/g, "");
    const messageId = body.messageId || body.id || `msg_${Date.now()}`;

    // Ignore outbound or empty messages
    if (fromMe || !messageText || !phone) {
      return new Response("OK", { status: 200 });
    }

    // Log inbound message
    await supabase.from("whatsapp_conversations").upsert(
      { direction: "inbound", message: messageText, message_id: messageId, phone, processed: false },
      { onConflict: "message_id", ignoreDuplicates: true }
    );

    // Look for pending suggestion
    const { data: pendingSuggestion } = await supabase
      .from("optimization_suggestions")
      .select("*, campaign_configs(name, campaign_id)")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let responseMessage = "";

    if (!pendingSuggestion) {
      responseMessage = await handleGeneralCommand(supabase, messageText, phone);
    } else {
      responseMessage = await handleSuggestionReply(supabase, messageText, messageId, pendingSuggestion);
    }

    // Send reply
    if (responseMessage) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: responseMessage, phone }),
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Error", { status: 500 });
  }
});

// ── Handle reply to an optimization suggestion ─────────────────
async function handleSuggestionReply(
  supabase: any,
  messageText: string,
  messageId: string,
  suggestion: Record<string, unknown>
): Promise<string> {
  const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!claudeApiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return "❌ Erro interno. Tente novamente mais tarde.";
  }

  const prompt = `Você interpreta respostas de usuários sobre sugestões de otimização de campanhas de marketing.

Contexto da sugestão pendente:
- Tipo: ${suggestion.suggestion_type}
- Campanha: ${(suggestion.campaign_configs as Record<string, unknown>)?.name}
- Valor atual: ${suggestion.current_value}
- Valor sugerido: ${suggestion.suggested_value} (${suggestion.change_percent}% de variação)
- Raciocínio: ${suggestion.reasoning}

Mensagem do usuário: "${messageText}"

Classifique a intenção. Responda SOMENTE em JSON válido:
{
  "intent": "approval" | "rejection" | "question" | "custom_value" | "unknown",
  "custom_value": <número ou null>,
  "question_text": "<pergunta ou null>",
  "response_message": "<resposta amigável para o usuário em português com emojis>"
}

Palavras de aprovação: sim, pode, ok, claro, confirma, vai lá, aceito, tá bom, concordo, faz isso, pode fazer, autorizo
Palavras de rejeição: não, nao, cancela, para, negativo, recuso, deixa, melhor não, agora não`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const aiData = await aiRes.json();
  const aiText = aiData.content?.[0]?.text || "";

  let interpretation: Record<string, unknown> = {
    intent: "unknown",
    response_message: "Não entendi. Responda *SIM* para aprovar ou *NÃO* para recusar.",
  };

  try {
    const match = aiText.match(/\{[\s\S]*\}/);
    if (match) interpretation = JSON.parse(match[0]);
  } catch {
    console.warn("Failed to parse AI response:", aiText);
  }

  // Apply action based on intent
  const sid = suggestion.id as string;

  if (interpretation.intent === "approval") {
    await supabase
      .from("optimization_suggestions")
      .update({ status: "applied", applied_at: new Date().toISOString() })
      .eq("id", sid);

  } else if (interpretation.intent === "rejection") {
    await supabase
      .from("optimization_suggestions")
      .update({ status: "rejected" })
      .eq("id", sid);

  } else if (interpretation.intent === "custom_value" && interpretation.custom_value) {
    await supabase
      .from("optimization_suggestions")
      .update({
        suggested_value: interpretation.custom_value,
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .eq("id", sid);
  }

  // Update conversation with intent
  await supabase
    .from("whatsapp_conversations")
    .update({ intent: interpretation.intent as string, processed: true, suggestion_id: sid })
    .eq("message_id", messageId);

  return (interpretation.response_message as string) || "";
}

// ── Handle general commands (no pending suggestion) ────────────
async function handleGeneralCommand(
  supabase: any,
  message: string,
  _phone: string
): Promise<string> {
  const lower = message.toLowerCase().trim();

  if (lower === "status" || lower === "resumo" || lower === "relatório") {
    const { data: pending } = await supabase
      .from("optimization_suggestions")
      .select("suggestion_type, created_at, campaign_configs(name)")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recent } = await supabase
      .from("optimization_suggestions")
      .select("suggestion_type, status, applied_at, campaign_configs(name)")
      .in("status", ["applied", "approved"])
      .order("created_at", { ascending: false })
      .limit(3);

    let msg = "📊 *Liberty AI — Status*\n\n";

    if (!pending || pending.length === 0) {
      msg += "✅ Nenhuma sugestão pendente.\n";
    } else {
      msg += `⏳ *Pendentes (${pending.length}):*\n`;
      for (const s of pending) {
        const camp = (s.campaign_configs as Record<string, unknown>)?.name || "—";
        msg += `• ${camp}: ${formatType(s.suggestion_type)}\n`;
      }
      msg += "\n";
    }

    if (recent && recent.length > 0) {
      msg += "✅ *Recentes aplicadas:*\n";
      for (const s of recent) {
        const camp = (s.campaign_configs as Record<string, unknown>)?.name || "—";
        msg += `• ${camp}: ${formatType(s.suggestion_type)}\n`;
      }
    }

    msg += "\n_Liberty AI monitorando suas campanhas 🤖_";
    return msg;
  }

  if (lower === "ajuda" || lower === "help" || lower === "comandos") {
    return `🤖 *Liberty AI — Comandos*\n\n*status* — Ver sugestões pendentes\n*resumo* — Resumo de atividade\n*ajuda* — Esta mensagem\n\nQuando eu enviar uma sugestão, responda:\n✅ *SIM* para aprovar\n❌ *NÃO* para recusar\n💬 Ou faça uma pergunta\n\n_Posso entender linguagem natural!_`;
  }

  // Use Claude for unknown natural language
  const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!claudeApiKey) return "";

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Você é Liberty AI, assistente de otimização de campanhas Facebook Ads. Não há sugestão pendente. O usuário enviou: "${message}". Responda de forma breve e útil em português. Mencione os comandos disponíveis: status, resumo, ajuda.`,
      }],
    }),
  });

  const aiData = await aiRes.json();
  return aiData.content?.[0]?.text || "Olá! Envie *ajuda* para ver os comandos disponíveis.";
}

function formatType(type: string): string {
  const map: Record<string, string> = {
    budget_increase: "Aumento de orçamento",
    budget_decrease: "Redução de orçamento",
    pause: "Pausar campanha",
    resume: "Retomar campanha",
    creative_rotate: "Rotação de criativo",
    audience_adjust: "Ajuste de público",
    schedule_adjust: "Ajuste de horário",
  };
  return map[type] || type;
}
