import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Imagem é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um assistente financeiro que extrai despesas de extratos bancários e comprovantes.
Analise a imagem enviada e extraia TODAS as transações de despesa (saídas/débitos) encontradas.

Para cada despesa, retorne os seguintes campos:
- description: descrição da transação
- category: classifique em uma dessas categorias: Pessoal, Infraestrutura, Marketing, TI, Fornecedores, Administrativo, Seguros, Logística, Impostos, Outros
- amount: valor numérico (sempre positivo, sem R$)
- date: data no formato YYYY-MM-DD
- type: classifique como "fixa", "variavel" ou "extraordinaria"
- status: "pago"

Responda APENAS com o resultado da tool call. Não inclua texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia todas as despesas desta imagem de extrato/comprovante bancário.",
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_expenses",
              description: "Retorna as despesas extraídas da imagem",
              parameters: {
                type: "object",
                properties: {
                  expenses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        category: {
                          type: "string",
                          enum: ["Pessoal", "Infraestrutura", "Marketing", "TI", "Fornecedores", "Administrativo", "Seguros", "Logística", "Impostos", "Outros"],
                        },
                        amount: { type: "number" },
                        date: { type: "string", description: "YYYY-MM-DD" },
                        type: { type: "string", enum: ["fixa", "variavel", "extraordinaria"] },
                        status: { type: "string", enum: ["pago", "pendente", "agendado"] },
                      },
                      required: ["description", "category", "amount", "date", "type", "status"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["expenses"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_expenses" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar imagem com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "IA não conseguiu extrair despesas da imagem. Tente com uma imagem mais clara." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expenses = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, ...expenses }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
