import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Cotação UYU → BRL
const UYU_TO_BRL = 7.77;

function convertUYUtoBRL(valor: number): number {
  return Math.round((valor / UYU_TO_BRL) * 100) / 100;
}

function buildSummary(pedidos: any[]) {
  const total = pedidos.length;
  const totalValor = pedidos.reduce((s, p) => s + (p.valor || 0), 0);
  const pagos = pedidos.filter(p => p.status_pagamento === "pago");
  const totalPago = pagos.reduce((s, p) => s + (p.valor || 0), 0);
  const pendentes = pedidos.filter(p => p.status_pagamento === "pendente");
  const totalPendente = pendentes.reduce((s, p) => s + (p.valor || 0), 0);
  const cancelados = pedidos.filter(p => p.status_pagamento === "cancelado" || p.status_pagamento === "reembolso");
  const totalCancelado = cancelados.reduce((s, p) => s + (p.valor || 0), 0);

  const pagosPix = pagos.filter(p => (p.forma_pagamento || "").toLowerCase() === "pix");
  const pagosCartao = pagos.filter(p => ["cartao", "cartão"].includes((p.forma_pagamento || "").toLowerCase()));
  const pagosBoleto = pagos.filter(p => (p.forma_pagamento || "").toLowerCase() === "boleto");

  return {
    total,
    totalValor,
    totalPago,
    totalPendente,
    totalCancelado,
    countPagos: pagos.length,
    countPendentes: pendentes.length,
    countCancelados: cancelados.length,
    totalPagoPix: pagosPix.reduce((s, p) => s + (p.valor || 0), 0),
    totalPagoCartao: pagosCartao.reduce((s, p) => s + (p.valor || 0), 0),
    totalPagoBoleto: pagosBoleto.reduce((s, p) => s + (p.valor || 0), 0),
    countPagosPix: pagosPix.length,
    countPagosCartao: pagosCartao.length,
    countPagosBoleto: pagosBoleto.length,
    totalFrete: pedidos.reduce((s, p) => s + (p.valor_frete || 0), 0),
    totalQuantidadePagos: pedidos.reduce((s, p) => s + (p.quantidade || 0), 0),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const libertyUrl = Deno.env.get("LIBERTY_SUPABASE_URL") || "https://gwvhvvmghkpgtiofnivo.supabase.co";
    const libertyKey = Deno.env.get("LIBERTY_SERVICE_ROLE_KEY") || Deno.env.get("LIBERTY_SUPABASE_ANON_KEY") || "";
    const libertyClient = createClient(libertyUrl, libertyKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const { from, to } = body;

    const dateField = "data_entrada";

    let query = libertyClient
      .from("pedidos")
      .select("id, nome, produto, valor, quantidade, status_pagamento, data_entrada, data_pagamento, pais, vendedor, departamento, cidade, forma_pagamento, valor_frete, telefone")
      .order("created_at", { ascending: false });

    if (from) {
      query = query.gte(dateField, from);
    }
    if (to) {
      query = query.lte(dateField, to);
    }

    const { data: pedidos, error } = await query.limit(2000);

    if (error) {
      console.error("Error fetching pedidos:", JSON.stringify(error));
      throw new Error(`Failed to fetch data: ${error.message}`);
    }

    // Deduplicate by telefone + data_entrada (same person, same day)
    const seen = new Set<string>();
    const dedupedPedidos = (pedidos ?? []).filter(p => {
      const tel = (p.telefone || "").trim();
      const key = tel ? `${tel}|${p.data_entrada}` : `${(p.nome || "").trim().toLowerCase()}|${p.data_entrada}|${p.valor}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const allPedidos = dedupedPedidos.map(p => {
      const pais = (p.pais || "").toLowerCase();
      const isUY = pais === "uy" || pais === "uruguay";
      if (isUY) {
        return {
          ...p,
          valor_original_uyu: p.valor,
          valor: convertUYUtoBRL(p.valor || 0),
          valor_frete: convertUYUtoBRL(p.valor_frete || 0),
        };
      }
      return p;
    });

    const brasilPedidos = allPedidos.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      return pais === "br" || pais === "brasil";
    });
    const uruguayPedidos = allPedidos.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      return pais === "uy" || pais === "uruguay";
    });

    return new Response(JSON.stringify({
      pedidos: allPedidos,
      summary: buildSummary(allPedidos),
      summaryBrasil: buildSummary(brasilPedidos),
      summaryUruguay: buildSummary(uruguayPedidos),
      cotacaoUYU: UYU_TO_BRL,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-liberty-data error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
