import { supabase } from "@/integrations/supabase/client";

export type FinanceManualValueKey = "manualCash" | "manualSaqueBR" | "manualSaqueUY" | "fbAdsPaid";

type ManualValuesMap = Partial<Record<FinanceManualValueKey, number | null>>;

const manualValuesTable = "finance_manual_values";
const manualValuesClient = supabase as any;

export async function fetchFinanceManualValues(): Promise<ManualValuesMap> {
  const { data, error } = await manualValuesClient
    .from(manualValuesTable)
    .select("key, value");

  if (error) throw error;

  return (data ?? []).reduce((acc: ManualValuesMap, row: { key: FinanceManualValueKey; value: number | null }) => {
    acc[row.key] = row.value === null ? null : Number(row.value);
    return acc;
  }, {});
}

export async function saveFinanceManualValue(key: FinanceManualValueKey, value: number | null) {
  if (value === null) {
    const { error } = await manualValuesClient.from(manualValuesTable).delete().eq("key", key);
    if (error) throw error;
    return;
  }

  const { error } = await manualValuesClient
    .from(manualValuesTable)
    .upsert({ key, value }, { onConflict: "key" });

  if (error) throw error;
}