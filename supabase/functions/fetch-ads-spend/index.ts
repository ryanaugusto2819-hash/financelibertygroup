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

// Detect country from campaign name (e.g. "BR - ..." or "UY - ...")
function getCampaignCountry(name: string): "brasil" | "uruguay" | "unknown" {
  const n = (name || "").toLowerCase();
  if (n.startsWith("(br") || n.startsWith("br ") || n.startsWith("br-") || n.startsWith("br_") || n.includes("brasil")) return "brasil";
  if (n.startsWith("(uy") || n.startsWith("uy ") || n.startsWith("uy-") || n.startsWith("uy_") || n.includes("uruguay")) return "uruguay";
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
    const metrics = data.data || [];

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
