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
    const libertyUrl = Deno.env.get("LIBERTY_SUPABASE_URL") || "";
    const libertyKey = Deno.env.get("LIBERTY_SERVICE_ROLE_KEY") || Deno.env.get("LIBERTY_SUPABASE_ANON_KEY") || "";
    
    if (!libertyUrl || !libertyKey) {
      throw new Error("Liberty credentials not configured");
    }

    const libertyClient = createClient(libertyUrl, libertyKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const { pedidoId, status_pagamento, forma_pagamento } = body;

    if (!pedidoId || !status_pagamento) {
      return new Response(JSON.stringify({ error: "pedidoId and status_pagamento are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updateData: Record<string, unknown> = {
      status_pagamento,
    };

    if (status_pagamento === "pago") {
      // Set data_pagamento to today in YYYY-MM-DD format (Brasília timezone)
      const now = new Date();
      const brDate = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      updateData.data_pagamento = brDate;
    }

    if (forma_pagamento) {
      updateData.forma_pagamento = forma_pagamento;
    }

    console.log("Updating pedido:", pedidoId, "with:", JSON.stringify(updateData));

    const { data, error } = await libertyClient
      .from("pedidos")
      .update(updateData)
      .eq("id", pedidoId)
      .select()
      .single();

    if (error) {
      console.error("Error updating pedido:", JSON.stringify(error));
      throw new Error(`Failed to update: ${error.message}`);
    }

    console.log("Updated successfully:", data?.id);

    return new Response(JSON.stringify({ success: true, pedido: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("update-liberty-pedido error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
