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

// pagosNoPeriodo = pedidos pagos filtrados por data_pagamento (recebimento real)
// pedidos = pedidos filtrados por data_entrada (entradas do período)
function buildSummary(pedidos: any[], pagosNoPeriodo: any[]) {
  const total = pedidos.length;
  const totalValor = pedidos.reduce((s, p) => s + (p.valor || 0), 0);

  // totalPago usa data_pagamento para refletir o que foi RECEBIDO no período
  const pagos = pagosNoPeriodo;
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
    totalFrete: pagos.reduce((s, p) => s + (p.valor_frete || 0), 0),
    totalQuantidadePagos: pagos.reduce((s, p) => s + (p.quantidade || 0), 0),
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

    const SELECT_FIELDS = "id, nome, produto, valor, quantidade, status_pagamento, data_entrada, data_pagamento, pais, vendedor, departamento, cidade, forma_pagamento, valor_frete, telefone";

    // Query 1: pedidos do período filtrados por data_entrada (entradas/pendentes/cancelados)
    let queryEntrada = libertyClient
      .from("pedidos")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false });

    if (from) queryEntrada = queryEntrada.gte("data_entrada", from);
    if (to)   queryEntrada = queryEntrada.lte("data_entrada", to);

    // Query 2: pedidos PAGOS no período filtrados por data_pagamento (recebimento real)
    // data_pagamento é TIMESTAMPTZ: usar fim do dia no fuso de Brasília (-03:00)
    // para não cortar pagamentos feitos depois da meia-noite UTC no mesmo dia BR.
    let queryPagos = libertyClient
      .from("pedidos")
      .select(SELECT_FIELDS)
      .eq("status_pagamento", "pago");

    if (from) queryPagos = queryPagos.gte("data_pagamento", from + "T00:00:00-03:00");
    if (to)   queryPagos = queryPagos.lte("data_pagamento", to   + "T23:59:59.999-03:00");

    const [{ data: pedidosEntrada, error }, { data: pedidosPagos, error: errorPagos }] =
      await Promise.all([queryEntrada.limit(2000), queryPagos.limit(2000)]);

    if (error) {
      console.error("Error fetching pedidos:", JSON.stringify(error));
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
    if (errorPagos) {
      console.error("Error fetching pagos:", JSON.stringify(errorPagos));
      throw new Error(`Failed to fetch pagos: ${errorPagos.message}`);
    }

    // Dedup helper: mesma pessoa no mesmo dia = mesmo pedido
    function dedup(list: any[]): any[] {
      const seen = new Set<string>();
      return (list ?? []).filter(p => {
        const tel = (p.telefone || "").trim();
        const key = tel
          ? `${tel}|${p.data_entrada}`
          : `${(p.nome || "").trim().toLowerCase()}|${p.data_entrada}|${p.valor}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Conversão UYU → BRL
    function convertPedido(p: any) {
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
    }

    const allPedidos = dedup(pedidosEntrada).map(convertPedido);
    const allPagos   = dedup(pedidosPagos).map(convertPedido);

    const brasilPedidos = allPedidos.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      return pais === "br" || pais === "brasil";
    });
    const uruguayPedidos = allPedidos.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      return pais === "uy" || pais === "uruguay";
    });

    const brasilPagos = allPagos.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      return pais === "br" || pais === "brasil";
    });
    const uruguayPagos = allPagos.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      return pais === "uy" || pais === "uruguay";
    });

    return new Response(JSON.stringify({
      pedidos: allPedidos,
      summary:        buildSummary(allPedidos,      allPagos),
      summaryBrasil:  buildSummary(brasilPedidos,   brasilPagos),
      summaryUruguay: buildSummary(uruguayPedidos,  uruguayPagos),
      cotacaoUYU: UYU_TO_BRL,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-liberty-data error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
