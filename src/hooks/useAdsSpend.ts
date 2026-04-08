import { useQuery } from "@tanstack/react-query";

const LIBERTY_ADS_URL = "https://simuftsgwryjubmkbnaj.supabase.co";
const LIBERTY_ADS_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbXVmdHNnd3J5anVibWtibmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTc4NjAsImV4cCI6MjA4Nzc3Mzg2MH0.wPVlWxu-zCwwjguTLQ1Iz-Vh7n09b-0YHWcn4oaUBwk";
const USD_TO_BRL = 5.10;

export interface AdsCountryData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  costPerLead: number | null;
  ctr: number;
  byCampaign: {
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
  }[];
  byDate: Record<string, number>;
  totalAds: number;
}

export interface AdsSpendData extends AdsCountryData {
  brasil: AdsCountryData;
  uruguay: AdsCountryData;
}

function tokenizeCampaignName(name: string): string[] {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function getCampaignCountry(name: string): "brasil" | "uruguay" | "unknown" {
  const tokens = tokenizeCampaignName(name);
  if (tokens.includes("br") || tokens.includes("brasil") || tokens.includes("brazil")) return "brasil";
  if (tokens.includes("uy") || tokens.includes("uruguay") || tokens.includes("uruguai")) return "uruguay";
  return "unknown";
}

function aggregateMetrics(metrics: any[]): AdsCountryData {
  const totalSpend = metrics.reduce((s, m) => s + (m.spend || 0), 0);
  const totalImpressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0);
  const totalClicks = metrics.reduce((s, m) => s + (m.clicks || 0), 0);
  const totalLeads = metrics.reduce((s, m) => s + (m.leads || 0), 0);

  const byCampaignMap: Record<string, { name: string; spend: number; impressions: number; clicks: number; leads: number }> = {};
  for (const m of metrics) {
    const key = m.campaign_id || "unknown";
    if (!byCampaignMap[key]) {
      byCampaignMap[key] = { name: m.campaign_name || "Sem nome", spend: 0, impressions: 0, clicks: 0, leads: 0 };
    }
    byCampaignMap[key].spend += m.spend || 0;
    byCampaignMap[key].impressions += m.impressions || 0;
    byCampaignMap[key].clicks += m.clicks || 0;
    byCampaignMap[key].leads += m.leads || 0;
  }

  const byDate: Record<string, number> = {};
  for (const m of metrics) {
    if (m.date) byDate[m.date] = (byDate[m.date] || 0) + (m.spend || 0);
  }

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalLeads,
    costPerLead: totalLeads > 0 ? totalSpend / totalLeads : null,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    byCampaign: Object.values(byCampaignMap),
    byDate,
    totalAds: metrics.length,
  };
}

export function useAdsSpend(from?: string, to?: string) {
  return useQuery<AdsSpendData>({
    queryKey: ["ads-spend", from, to],
    queryFn: async () => {
      const response = await fetch(`${LIBERTY_ADS_URL}/functions/v1/facebookMetrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LIBERTY_ADS_ANON_KEY}`,
          apikey: LIBERTY_ADS_ANON_KEY,
        },
        body: JSON.stringify({ from, to }),
      });

      if (!response.ok) throw new Error("Erro ao buscar métricas de anúncios");

      const data = await response.json();
      const rawMetrics: any[] = data.data || [];

      // Converte BM4/BM5 de USD para BRL (R$ 5,10) — conversão feita aqui no frontend
      const metrics = rawMetrics.map((m) =>
        m.bm_account === "bm4" || m.bm_account === "bm5"
          ? { ...m, spend: (m.spend || 0) * USD_TO_BRL }
          : m
      );

      const brasilMetrics = metrics.filter((m) => getCampaignCountry(m.campaign_name) === "brasil");
      const uruguayMetrics = metrics.filter((m) => getCampaignCountry(m.campaign_name) === "uruguay");

      return {
        ...aggregateMetrics(metrics),
        brasil: aggregateMetrics(brasilMetrics),
        uruguay: aggregateMetrics(uruguayMetrics),
      };
    },
    enabled: !!from && !!to,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}
