/**
 * Campaign Monitor — Analyzes campaigns with Claude AI and sends WhatsApp suggestions
 *
 * Can be triggered:
 *   - Manually from the dashboard (POST with body { campaign_id? })
 *   - Via Supabase scheduled cron (pg_cron or external cron)
 *   - Via external CRON service (e.g. cron-job.org)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Optional: restrict to specific campaign
    let body: { campaign_id?: string; force?: boolean } = {};
    try { body = await req.json(); } catch { /* no body */ }

    // Get active campaign configs
    let campaignQuery = supabase
      .from("campaign_configs")
      .select("*")
      .eq("monitoring_enabled", true);

    if (body.campaign_id) {
      campaignQuery = campaignQuery.eq("id", body.campaign_id);
    }

    const { data: campaigns, error: campError } = await campaignQuery;

    if (campError || !campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active campaigns to monitor", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load Z-API config (check it exists)
    const { data: zapiConfig } = await supabase
      .from("zapi_config")
      .select("id, phone")
      .eq("is_active", true)
      .maybeSingle();

    if (!zapiConfig) {
      return new Response(
        JSON.stringify({ error: "Z-API not configured. Please set up Z-API in the dashboard." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load AI training data (ordered by priority)
    const { data: trainingData } = await supabase
      .from("ai_training_data")
      .select("type, category, title, content, priority")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    const trainingContext = (trainingData || [])
      .map((t) => `[${t.type.toUpperCase()} — ${t.category}]\n${t.title}:\n${t.content}`)
      .join("\n\n---\n\n");

    const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const campaign of campaigns) {
      const campaignStart = Date.now();

      // Skip if there's already a pending suggestion (unless force)
      if (!body.force) {
        const { data: existing } = await supabase
          .from("optimization_suggestions")
          .select("id")
          .eq("campaign_config_id", campaign.id)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (existing) {
          results.push({ campaign: campaign.name, status: "skipped", reason: "pending suggestion already exists" });
          continue;
        }
      }

      // Fetch campaign metrics from existing fetch-ads-spend function
      let metricsData: Record<string, unknown> = {};
      try {
        const metricsRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-ads-spend`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ country: campaign.country }),
          }
        );
        if (metricsRes.ok) {
          metricsData = await metricsRes.json();
        }
      } catch (e) {
        console.warn(`Could not fetch metrics for ${campaign.name}:`, e);
      }

      // Build analysis prompt
      const analysisPrompt = `${trainingContext}

===== DADOS DA CAMPANHA PARA ANÁLISE =====

Campanha: "${campaign.name}"
País: ${campaign.country}
Facebook Campaign ID: ${campaign.campaign_id || "não configurado"}

Parâmetros de Orçamento:
- Orçamento atual: R$ ${campaign.budget_current}
- Orçamento mínimo permitido: R$ ${campaign.budget_min}
- Orçamento máximo permitido: R$ ${campaign.budget_max}

Metas de Performance:
- ROAS alvo: ${campaign.target_roas || "não definido"}
- CPA alvo: ${campaign.target_cpa ? `R$ ${campaign.target_cpa}` : "não definido"}
- CTR alvo: ${campaign.target_ctr ? `${campaign.target_ctr}%` : "não definido"}

Métricas Atuais (dados do período recente):
${JSON.stringify(metricsData, null, 2)}

===== INSTRUÇÃO =====

Analise os dados acima com base nas regras de treinamento fornecidas.
Determine se há uma oportunidade clara de otimização com base em dados concretos.

Responda SOMENTE com JSON válido (sem markdown, sem texto extra):
{
  "should_suggest": true | false,
  "suggestion_type": "budget_increase" | "budget_decrease" | "pause" | "resume" | "creative_rotate" | "audience_adjust" | "schedule_adjust" | null,
  "current_value": <número atual ou null>,
  "suggested_value": <valor sugerido ou null>,
  "change_percent": <percentual de variação ou null>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<análise detalhada em português — mínimo 3 linhas>",
  "whatsapp_message": "<mensagem formatada para WhatsApp com emojis — máximo 600 chars — inclua métricas, análise, sugestão e impacto esperado>"
}

Se não houver oportunidade clara ou dados suficientes, retorne should_suggest: false.`;

      // Call Claude Sonnet for analysis
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": claudeApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          messages: [{ role: "user", content: analysisPrompt }],
        }),
      });

      const aiData = await aiRes.json();
      const aiText = aiData.content?.[0]?.text || "";
      const durationMs = Date.now() - campaignStart;

      let analysis: Record<string, unknown> = { should_suggest: false, reasoning: "Failed to parse AI response" };
      try {
        const match = aiText.match(/\{[\s\S]*\}/);
        if (match) analysis = JSON.parse(match[0]);
      } catch {
        console.warn(`Failed to parse AI response for ${campaign.name}:`, aiText);
      }

      // Log analysis
      await supabase.from("ai_analysis_logs").insert({
        campaign_config_id: campaign.id,
        analysis_type: body.force ? "manual_check" : "scheduled_check",
        input_data: { campaign, metricsData: metricsData },
        output_data: analysis,
        tokens_used: (aiData.usage?.input_tokens || 0) + (aiData.usage?.output_tokens || 0),
        duration_ms: durationMs,
        error: !analysis.should_suggest ? null : undefined,
      });

      if (!analysis.should_suggest) {
        results.push({ campaign: campaign.name, status: "no_action", confidence: analysis.confidence, reasoning: analysis.reasoning });
        continue;
      }

      // Create suggestion record
      const { data: suggestion, error: sugErr } = await supabase
        .from("optimization_suggestions")
        .insert({
          campaign_config_id: campaign.id,
          suggestion_type: analysis.suggestion_type,
          current_value: analysis.current_value,
          suggested_value: analysis.suggested_value,
          change_percent: analysis.change_percent,
          reasoning: analysis.reasoning as string,
          metrics_snapshot: metricsData,
          status: "pending",
        })
        .select()
        .single();

      if (sugErr || !suggestion) {
        results.push({ campaign: campaign.name, status: "error", error: sugErr?.message });
        continue;
      }

      // Format and send WhatsApp message
      const whatsappMsg = `${analysis.whatsapp_message}\n\n━━━━━━━━━━━━━━━━\n✅ Responda *SIM* para aprovar\n❌ Responda *NÃO* para recusar\n💬 Ou faça uma pergunta\n\n_Válido por 24h · Liberty AI 🤖_`;

      const sendRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: whatsappMsg, suggestion_id: suggestion.id }),
        }
      );

      const sendData = await sendRes.json();

      results.push({
        campaign: campaign.name,
        status: sendRes.ok ? "suggestion_sent" : "send_failed",
        suggestion_type: analysis.suggestion_type,
        confidence: analysis.confidence,
        suggestion_id: suggestion.id,
        whatsapp_error: sendRes.ok ? null : sendData.error,
      });
    }

    return new Response(
      JSON.stringify({ results, total_campaigns: campaigns.length, duration_ms: Date.now() - startTime }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Campaign monitor error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
