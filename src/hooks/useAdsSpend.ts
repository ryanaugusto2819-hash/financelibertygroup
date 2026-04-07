import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useAdsSpend(from?: string, to?: string) {
  return useQuery<AdsSpendData>({
    queryKey: ["ads-spend", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-ads-spend", {
        body: { from, to },
      });
      if (error) throw error;
      return data as AdsSpendData;
    },
    enabled: !!from && !!to,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}
