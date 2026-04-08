import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LIBERTY_ADS_URL = "https://simuftsgwryjubmkbnaj.supabase.co";
const LIBERTY_ADS_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbXVmdHNnd3J5anVibWtibmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTc4NjAsImV4cCI6MjA4Nzc3Mzg2MH0.wPVlWxu-zCwwjguTLQ1Iz-Vh7n09b-0YHWcn4oaUBwk";

function aggregateMetrics(metrics: any[]) {
  const totalSpend = metrics.reduce((s, m) => s + (m.spend || 0), 0);
  const totalImpressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0);
  const totalClicks = metrics.reduce((s, m) => s + (m.clicks || 0), 0);
  const totalLeads = metrics.reduce((s, m) => s + (m.leads || 0), 0);

  const byCampaign: Record<string, { name: string; spend: number; impressions: number; clicks: number; leads: number }> = {};
  for (const m of metrics) {
    const key = m.campaign_id || "unknown";
    if (!byCampaign[key]) {
      byCampaign[key] = { name: m.campaign_name || "Sem nome", spend: 0, impressions: 0, clicks: 0, leads: 0 };
    }
    byCampaign[key].spend += m.spend || 0;
    byCampaign[key].impressions += m.impressions || 0;
    byCampaign[key].clicks += m.clicks || 0;
    byCampaign[key].leads += m.leads || 0;
  }

  const byDate: Record<string, number> = {};
  for (const m of metrics) {
    byDate[m.date] = (byDate[m.date] || 0) + (m.spend || 0);
  }

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalLeads,
    costPerLead: totalLeads > 0 ? totalSpend / totalLeads : null,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    byCampaign: Object.values(byCampaign),
    byDate,
    totalAds: metrics.length,
  };
}

function tokenizeCampaignName(name: string) {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Detect country from campaign tokens, including names like "(EMA-BR) ..."
function getCampaignCountry(name: string): "brasil" | "uruguay" | "unknown" {
  const tokens = tokenizeCampaignName(name);

  if (tokens.includes("br") || tokens.includes("brasil") || tokens.includes("brazil")) {
    return "brasil";
  }

  if (tokens.includes("uy") || tokens.includes("uruguay") || tokens.includes("uruguai")) {
    return "uruguay";
  }

  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from, to } = await req.json().catch(() => ({}));

    if (!from || !to) {
      return new Response(
        JSON.stringify({ error: "Missing 'from' and 'to' date parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(`${LIBERTY_ADS_URL}/functions/v1/facebookMetrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LIBERTY_ADS_ANON_KEY}`,
        "apikey": LIBERTY_ADS_ANON_KEY,
      },
      body: JSON.stringify({ from, to }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("LibertyAds API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch ads data", details: errorData }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawMetrics = data.data || [];

    // Convert BM4/BM5 spend from USD to BRL (R$ 5.10)
    const USD_TO_BRL = 5.10;
    const metrics = rawMetrics.map((m: any) =>
      m.bm_account === "bm4" || m.bm_account === "bm5"
        ? { ...m, spend: (m.spend || 0) * USD_TO_BRL }
        : m
    );

    // Split by country based on campaign name
    const brasilMetrics = metrics.filter((m: any) => getCampaignCountry(m.campaign_name) === "brasil");
    const uruguayMetrics = metrics.filter((m: any) => getCampaignCountry(m.campaign_name) === "uruguay");
    // Unknown goes to "all" only
    
    return new Response(
      JSON.stringify({
        ...aggregateMetrics(metrics),
        brasil: aggregateMetrics(brasilMetrics),
        uruguay: aggregateMetrics(uruguayMetrics),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-ads-spend error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
