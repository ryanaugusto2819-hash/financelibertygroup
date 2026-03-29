import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const libertyUrl = Deno.env.get("LIBERTY_SUPABASE_URL");
    const libertyKey = Deno.env.get("LIBERTY_SUPABASE_ANON_KEY");

    if (!libertyUrl || !libertyKey) {
      throw new Error("LibertyPainel credentials not configured");
    }

    const libertyClient = createClient(libertyUrl, libertyKey);

    const { from, to } = await req.json().catch(() => ({}));

    // Fetch pedidos (orders) from LibertyPainel
    let query = libertyClient
      .from("pedidos")
      .select("id, nome, produto, valor, quantidade, status_pagamento, data_entrada, data_pagamento, pais, vendedor, departamento, cidade")
      .order("data_entrada", { ascending: false });

    if (from) query = query.gte("data_entrada", from);
    if (to) query = query.lte("data_entrada", to);

    const { data: pedidos, error } = await query.limit(1000);

    if (error) {
      console.error("Error fetching pedidos:", error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }

    // Aggregate summary
    const total = pedidos?.length ?? 0;
    const totalValor = pedidos?.reduce((s, p) => s + (p.valor || 0), 0) ?? 0;
    const pagos = pedidos?.filter(p => p.status_pagamento === "pago") ?? [];
    const totalPago = pagos.reduce((s, p) => s + (p.valor || 0), 0);
    const pendentes = pedidos?.filter(p => p.status_pagamento === "pendente") ?? [];
    const totalPendente = pendentes.reduce((s, p) => s + (p.valor || 0), 0);
    const cancelados = pedidos?.filter(p => p.status_pagamento === "cancelado" || p.status_pagamento === "reembolso") ?? [];
    const totalCancelado = cancelados.reduce((s, p) => s + (p.valor || 0), 0);

    return new Response(JSON.stringify({
      pedidos: pedidos ?? [],
      summary: {
        total,
        totalValor,
        totalPago,
        totalPendente,
        totalCancelado,
        countPagos: pagos.length,
        countPendentes: pendentes.length,
        countCancelados: cancelados.length,
      },
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
