import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const libertyUrl = "https://gwvhvvmghkpgtiofnivo.supabase.co";
    const libertyKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dmh2dm1naGtwZ3Rpb2ZuaXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDEyNTIsImV4cCI6MjA4Nzg3NzI1Mn0.mdyn-P2fWruiwjDKincla1PI3UVcMMnCGQPW5IAIb5g";
    const libertyClient = createClient(libertyUrl, libertyKey);

    const body = await req.json().catch(() => ({}));
    const { from, to } = body;

    // Use data_entrada for date filtering (matches Google Sheets input)
    const dateField = "data_entrada";

    let query = libertyClient
      .from("pedidos")
      .select("id, nome, produto, valor, quantidade, status_pagamento, data_entrada, data_pagamento, pais, vendedor, departamento, cidade, forma_pagamento, valor_frete")
      .order("created_at", { ascending: false });

    if (from) {
      query = query.gte(dateField, from);
    }
    if (to) {
      query = query.lte(dateField, to);
    }

    const { data: pedidos, error } = await query.limit(2000);

    if (error) {
      console.error("Error fetching pedidos:", error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }

    const allPedidos = pedidos ?? [];
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
