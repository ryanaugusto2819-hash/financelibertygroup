import React, { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DateFilter } from "@/components/DateFilter";
import { KPICard } from "@/components/KPICard";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddRevenueDialog } from "@/components/AddRevenueDialog";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatDate } from "@/lib/finance-data";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Scale, Wallet, CalendarClock, Landmark } from "lucide-react";
import { toast } from "sonner";

const CaixaRelDashboard = () => {
  const { dateRange, allExpenses, updateExpense, setCountryFilter } = useFinance();
  const queryClient = useQueryClient();

  React.useEffect(() => { setCountryFilter("caixarel"); }, [setCountryFilter]);

  // Todas as receitas do CAIXA REL (sem filtro de data)
  const { data: revenues = [] } = useQuery({
    queryKey: ["revenues", "caixarel", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenues")
        .select("*")
        .eq("country", "caixarel")
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Despesas exclusivas do CAIXA REL
  const relExpenses = useMemo(
    () => allExpenses.filter(e => e.country === "caixarel"),
    [allExpenses]
  );

  const inPeriod = (d: string) => d >= dateRange.from && d <= dateRange.to;

  // Entradas reais (pagas) no período
  const entradasPeriodo = useMemo(
    () => revenues.filter(r => r.status === "pago" && inPeriod(r.date)).reduce((s, r) => s + Number(r.amount), 0),
    [revenues, dateRange]
  );

  // Saídas pagas no período
  const saidasPeriodo = useMemo(
    () => relExpenses.filter(e => e.status === "pago" && inPeriod(e.date)).reduce((s, e) => s + e.amount, 0),
    [relExpenses, dateRange]
  );

  const diferencaPeriodo = entradasPeriodo - saidasPeriodo;

  // Saldo em caixa geral = todas entradas reais - todas saídas pagas
  const entradasTotais = useMemo(
    () => revenues.filter(r => r.status === "pago").reduce((s, r) => s + Number(r.amount), 0),
    [revenues]
  );
  const saidasTotais = useMemo(
    () => relExpenses.filter(e => e.status === "pago").reduce((s, e) => s + e.amount, 0),
    [relExpenses]
  );
  const saldoGeral = entradasTotais - saidasTotais;

  // Despesas futuras (agendadas / pendentes)
  const futuras = useMemo(
    () => relExpenses.filter(e => e.status !== "pago").sort((a, b) => a.date.localeCompare(b.date)),
    [relExpenses]
  );
  const despesasFuturas = futuras.reduce((s, e) => s + e.amount, 0);
  const saldoAposFuturas = saldoGeral - despesasFuturas;

  const handleMarkPaid = async (id: string) => {
    const result = await updateExpense(id, { status: "pago" });
    if (!result.success) {
      toast.error(result.error || "Erro ao marcar como paga.");
      return;
    }
    toast.success("Despesa marcada como PAGA. Saldo atualizado.");
  };

  return (
    <DashboardLayout title="🏦 CAIXA REL" subtitle="Controle de entradas e saídas" hideCountryFilter>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <DateFilter />
        <div className="flex gap-2">
          <AddRevenueDialog lockCountry="caixarel" onAdded={() => queryClient.invalidateQueries({ queryKey: ["revenues"] })} />
          <AddExpenseDialog lockCountry="caixarel" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <KPICard label="Entradas (período)" value={entradasPeriodo} prefix="R$" icon={ArrowUpRight} index={0} variant="positive" />
        <KPICard label="Saídas (período)" value={saidasPeriodo} prefix="R$" icon={ArrowDownRight} index={1} variant="negative" />
        <KPICard label="Diferença (período)" value={diferencaPeriodo} prefix="R$" icon={Scale} index={2} variant={diferencaPeriodo >= 0 ? "positive" : "negative"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KPICard label="Saldo em Caixa Geral" value={saldoGeral} prefix="R$" icon={Wallet} index={3} variant={saldoGeral >= 0 ? "positive" : "negative"}>
          <div className="flex justify-between items-center"><span className="text-[10px] text-muted-foreground">Entradas reais</span><span className="text-[10px] font-mono text-chart-positive">{formatCurrency(entradasTotais)}</span></div>
          <div className="flex justify-between items-center"><span className="text-[10px] text-muted-foreground">Saídas pagas</span><span className="text-[10px] font-mono text-chart-negative">{formatCurrency(saidasTotais)}</span></div>
        </KPICard>
        <KPICard label="Despesas Futuras" value={despesasFuturas} prefix="R$" icon={CalendarClock} index={4} variant="warning">
          <div className="flex justify-between items-center"><span className="text-[10px] text-muted-foreground">Lançamentos agendados</span><span className="text-[10px] font-mono text-foreground">{futuras.length}</span></div>
        </KPICard>
        <KPICard label="Saldo Geral − Despesas Futuras" value={saldoAposFuturas} prefix="R$" icon={Landmark} index={5} variant={saldoAposFuturas >= 0 ? "positive" : "negative"} />
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Despesas Agendadas</h3>
        {futuras.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma despesa agendada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Data</th>
                  <th className="text-left pb-3 font-medium">Descrição</th>
                  <th className="text-left pb-3 font-medium">Categoria</th>
                  <th className="text-right pb-3 font-medium">Valor</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {futuras.map(e => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2.5 text-muted-foreground">{formatDate(e.date)}</td>
                    <td className="py-2.5 text-foreground">{e.description}</td>
                    <td className="py-2.5 text-muted-foreground">{e.category}</td>
                    <td className="py-2.5 text-right font-mono text-chart-negative">{formatCurrency(e.amount)}</td>
                    <td className="py-2.5 text-center"><Badge variant="outline" className="text-[9px]">AGENDADA</Badge></td>
                    <td className="py-2.5 text-right">
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleMarkPaid(e.id)}>
                        Marcar Paga
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CaixaRelDashboard;
