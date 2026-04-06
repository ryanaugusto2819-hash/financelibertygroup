import React, { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScenarioCard } from "@/components/ScenarioCard";
import { formatCurrency, formatDate, formatCompact, getTotalExpensesMonth } from "@/lib/finance-data";
import { Badge } from "@/components/ui/badge";
import { useLibertyData } from "@/hooks/useLibertyData";
import { useFinance } from "@/context/FinanceContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { KPICard } from "@/components/KPICard";
import { DollarSign, Wallet, Clock, XCircle, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { AddRevenueDialog } from "@/components/AddRevenueDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const statusColor: Record<string, string> = {
  pago: "hsl(152, 60%, 48%)",
  pendente: "hsl(40, 90%, 58%)",
  cancelado: "hsl(0, 72%, 55%)",
  reembolso: "hsl(0, 72%, 55%)",
};

const statusBadgeVariant = (status: string) => {
  if (status === "pago") return "default" as const;
  if (status === "cancelado" || status === "reembolso") return "destructive" as const;
  return "secondary" as const;
};

interface ReceivablesProps {
  country?: "brasil" | "uruguay";
}

const Receivables = ({ country }: ReceivablesProps = {}) => {
  const { dateRange, setCountryFilter, countryFilter } = useFinance();
  const { data, isLoading, error } = useLibertyData(dateRange.from, dateRange.to);
  const totalExpenses = getTotalExpensesMonth();
  const queryClient = useQueryClient();
  const [payDialog, setPayDialog] = useState<{ id: string; nome: string } | null>(null);
  const [payMethod, setPayMethod] = useState("pix");
  const [paying, setPaying] = useState(false);

  const handleMarkAsPago = async () => {
    if (!payDialog) return;
    setPaying(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("update-liberty-pedido", {
        body: { pedidoId: payDialog.id, status_pagamento: "pago", forma_pagamento: payMethod },
      });
      if (error) throw error;
      toast.success(`Pedido de ${payDialog.nome} marcado como pago!`);
      queryClient.invalidateQueries({ queryKey: ["liberty-data"] });
      setPayDialog(null);
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + (err?.message || "erro desconhecido"));
    } finally {
      setPaying(false);
    }
  };

  // Sync country prop to context
  React.useEffect(() => {
    if (country) {
      setCountryFilter(country);
    } else {
      setCountryFilter("todos");
    }
  }, [country, setCountryFilter]);

  // Load manual revenues filtered by country
  const { data: manualRevenues = [] } = useQuery({
    queryKey: ["revenues", dateRange.from, dateRange.to, country],
    queryFn: async () => {
      let query = supabase
        .from("revenues")
        .select("*")
        .gte("date", dateRange.from)
        .lte("date", dateRange.to)
        .order("created_at", { ascending: false });
      if (country) {
        query = query.eq("country", country);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleDeleteRevenue = async (id: string) => {
    const { error } = await supabase.from("revenues").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir receita.");
      return;
    }
    toast.success("Receita excluída.");
    queryClient.invalidateQueries({ queryKey: ["revenues"] });
  };

  // Select summary based on country
  const summary = useMemo(() => {
    if (!data) return undefined;
    if (country === "brasil") return data.summaryBrasil;
    if (country === "uruguay") return data.summaryUruguay;
    return data.summary;
  }, [data, country]);

  const pedidos = useMemo(() => {
    const all = data?.pedidos ?? [];
    if (!country) return all;
    return all.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      if (country === "brasil") return pais === "br" || pais === "brasil";
      if (country === "uruguay") return pais === "uy" || pais === "uruguay";
      return false;
    });
  }, [data, country]);

  // Combine manual revenue totals with Liberty data
  const manualTotal = useMemo(() => manualRevenues.reduce((s, r) => s + Number(r.amount), 0), [manualRevenues]);
  const manualPago = useMemo(() => manualRevenues.filter(r => r.status === "pago").reduce((s, r) => s + Number(r.amount), 0), [manualRevenues]);
  const manualPendente = useMemo(() => manualRevenues.filter(r => r.status === "pendente").reduce((s, r) => s + Number(r.amount), 0), [manualRevenues]);

  const byStatus = summary ? [
    { name: "Pago", value: (summary.totalPago ?? 0) + manualPago, fill: statusColor.pago },
    { name: "Pendente", value: (summary.totalPendente ?? 0) + manualPendente, fill: statusColor.pendente },
    { name: "Cancelado", value: summary.totalCancelado, fill: statusColor.cancelado },
  ] : [];

  return (
    <DashboardLayout title={country === "brasil" ? "🇧🇷 Receitas Brasil" : country === "uruguay" ? "🇺🇾 Receitas Uruguay" : "Capital em Giro"} subtitle="Receita real do LibertyPainel + Receitas Manuais" hideCountryFilter={!!country}>
      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="glass-card p-6 mb-6 text-center text-destructive text-sm">
          Erro ao carregar dados: {error.message}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KPICard label="Receita Total" value={(summary?.totalValor ?? 0) + manualTotal} prefix="R$" icon={DollarSign} index={0} />
            <KPICard label="Recebido" value={(summary?.totalPago ?? 0) + manualPago} prefix="R$" icon={Wallet} index={1} variant="positive" />
            <KPICard label="Pendente" value={(summary?.totalPendente ?? 0) + manualPendente} prefix="R$" icon={Clock} index={2} variant="warning" />
            <KPICard label="Cancelado" value={summary?.totalCancelado ?? 0} prefix="R$" icon={XCircle} index={3} variant="negative" />
          </div>

          {/* Scenarios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <ScenarioCard percentage={100} totalReceivable={(summary?.totalPendente ?? 0) + manualPendente} totalExpenses={totalExpenses} index={0} />
            <ScenarioCard percentage={70} totalReceivable={(summary?.totalPendente ?? 0) + manualPendente} totalExpenses={totalExpenses} index={1} highlight />
            <ScenarioCard percentage={60} totalReceivable={(summary?.totalPendente ?? 0) + manualPendente} totalExpenses={totalExpenses} index={2} />
            <ScenarioCard percentage={50} totalReceivable={(summary?.totalPendente ?? 0) + manualPendente} totalExpenses={totalExpenses} index={3} />
          </div>

          {/* Chart */}
          <div className="glass-card p-6 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Receita por Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(value: number) => [formatCurrency(value), ""]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byStatus.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Manual Revenues Section */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Receitas Manuais ({manualRevenues.length})</h3>
              <AddRevenueDialog onAdded={() => queryClient.invalidateQueries({ queryKey: ["revenues"] })} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-3 font-medium">Cliente</th>
                    <th className="text-left pb-3 font-medium">Descrição</th>
                    <th className="text-left pb-3 font-medium">País</th>
                    <th className="text-left pb-3 font-medium">Data</th>
                    <th className="text-right pb-3 font-medium">Valor</th>
                    <th className="text-center pb-3 font-medium">Status</th>
                    <th className="text-center pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {manualRevenues.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium text-foreground">{r.client}</td>
                      <td className="py-3 text-muted-foreground">{r.description}</td>
                      <td className="py-3 text-muted-foreground">{r.country === "brasil" ? "🇧🇷" : r.country === "uruguay" ? "🇺🇾" : "—"}</td>
                      <td className="py-3 font-mono text-muted-foreground">{formatDate(r.date)}</td>
                      <td className="py-3 text-right font-mono font-medium text-foreground">{formatCurrency(Number(r.amount))}</td>
                      <td className="py-3 text-center">
                        <Badge variant={statusBadgeVariant(r.status)} className="text-[10px]">{r.status}</Badge>
                      </td>
                      <td className="py-3 text-center">
                        <button onClick={() => handleDeleteRevenue(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {manualRevenues.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground italic">Nenhuma receita manual cadastrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Liberty Pedidos Table */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Pedidos LibertyPainel ({summary?.total ?? 0})</h3>
              <span className="text-xs text-muted-foreground">{summary?.countPagos} pagos · {summary?.countPendentes} pendentes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-3 font-medium">Cliente</th>
                    <th className="text-left pb-3 font-medium">Produto</th>
                    <th className="text-left pb-3 font-medium">País</th>
                    <th className="text-left pb-3 font-medium">Data</th>
                    <th className="text-right pb-3 font-medium">Valor</th>
                    <th className="text-center pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium text-foreground">{p.nome}</td>
                      <td className="py-3 text-muted-foreground">{p.produto}</td>
                      <td className="py-3 text-muted-foreground">{p.pais === "brasil" ? "🇧🇷" : p.pais === "uruguay" ? "🇺🇾" : p.pais}</td>
                      <td className="py-3 font-mono text-muted-foreground">{formatDate(p.data_entrada)}</td>
                      <td className="py-3 text-right font-mono font-medium text-foreground">{formatCurrency(p.valor)}</td>
                      <td className="py-3 text-center">
                        <Badge variant={statusBadgeVariant(p.status_pagamento)} className="text-[10px]">
                          {p.status_pagamento}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {pedidos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground italic">Nenhum pedido encontrado no período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Receivables;
