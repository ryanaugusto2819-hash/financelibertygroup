import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { ScenarioCard } from "@/components/ScenarioCard";
import { DateFilter } from "@/components/DateFilter";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { ExpensePieChart } from "@/components/ExpensePieChart";
import {
  formatCurrency, formatCompact, formatDate,
  getTotalReceivable, getReceivedTotal,
  getTotalAccountsPayable, dailyEntries, monthlyFlowData, receivables,
} from "@/lib/finance-data";
import { useFinance } from "@/context/FinanceContext";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  Landmark, Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

const Index = () => {
  const { selectedDate, dateRange, expenses } = useFinance();

  // Filter data by selected period
  const periodExpenses = useMemo(() =>
    expenses.filter(e => e.date >= dateRange.from && e.date <= dateRange.to),
    [expenses, dateRange]
  );

  const periodDailyEntries = useMemo(() =>
    dailyEntries.filter(d => d.date >= dateRange.from && d.date <= dateRange.to),
    [dateRange]
  );

  const periodIncome = periodDailyEntries.reduce((s, d) => s + d.totalIn, 0);
  const periodOut = periodDailyEntries.reduce((s, d) => s + d.totalOut, 0);
  const periodGrossProfit = periodIncome - periodOut;

  const totalExpensesPeriod = periodExpenses.reduce((s, e) => s + e.amount, 0);

  // Receivables filtered by period
  const periodReceivables = useMemo(() =>
    receivables.filter(r => r.dueDate >= dateRange.from && r.dueDate <= dateRange.to),
    [dateRange]
  );
  const totalReceivable = periodReceivables.filter(r => r.status !== "recebido").reduce((s, r) => s + (r.amount - r.paidAmount), 0);
  const totalReceived = periodReceivables.filter(r => r.status === "recebido" || r.status === "parcial").reduce((s, r) => s + r.paidAmount, 0);

  const totalPayable = getTotalAccountsPayable();
  const scheduledExpenses = periodExpenses.filter(e => e.status === "agendado").reduce((s, e) => s + e.amount, 0);
  const totalPayableWithScheduled = totalPayable + scheduledExpenses;
  const currentCash = 1456200;

  // Period label
  const isSingleDay = dateRange.from === dateRange.to;
  const periodLabel = isSingleDay
    ? formatDate(dateRange.from)
    : `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`;

  return (
    <DashboardLayout title="Painel Financeiro" subtitle="Controle financeiro executivo">
      {/* Date Filter */}
      <div className="flex items-center justify-between mb-6">
        <DateFilter />
        <AddExpenseDialog />
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KPICard label="Receita em Caixa" value={currentCash} prefix="R$" icon={Wallet} index={0} variant="positive" />
        <KPICard label="Total a Pagar + Agendadas" value={totalPayableWithScheduled} prefix="R$" icon={Landmark} index={1} variant="negative" />
        <KPICard label="Saldo (Caixa - Obrigações)" value={currentCash - totalPayableWithScheduled} prefix="R$" icon={Target} index={2} variant={(currentCash - totalPayableWithScheduled) >= 0 ? "positive" : "negative"} />
      </div>

      {/* Receita Gerada e Recebida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <KPICard label="Receita Total Gerada (A Receber)" value={totalReceivable} prefix="R$" icon={DollarSign} index={0} />
        <KPICard label="Receita Total Já Recebida" value={totalReceived} prefix="R$" icon={Wallet} index={1} variant="positive" />
      </div>

      {/* Cenários de Pagamento */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Projeção de Receita — Cenários de Pagamento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScenarioCard percentage={100} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} index={0} />
          <ScenarioCard percentage={70} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} index={1} highlight />
          <ScenarioCard percentage={60} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} index={2} />
          <ScenarioCard percentage={50} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} index={3} />
        </div>
      </div>

      {/* Period Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <KPICard label={`Entradas (${periodLabel})`} value={periodIncome} prefix="R$" icon={ArrowUpRight} index={0} variant="positive" />
        <KPICard label={`Saídas (${periodLabel})`} value={periodOut} prefix="R$" icon={ArrowDownRight} index={1} variant="negative" />
        <KPICard label={`Lucro Líquido (${isSingleDay ? "Dia" : "Período"})`} value={periodGrossProfit * 0.85} prefix="R$" icon={TrendingUp} index={2} variant={periodGrossProfit >= 0 ? "positive" : "negative"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Daily Flow Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Fluxo Diário</h3>
          <p className="text-xs text-muted-foreground mb-4">Entradas vs Saídas — {periodLabel}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={periodDailyEntries.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => [formatCurrency(value), ""]}
                labelFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("pt-BR")} />
              <Bar dataKey="totalIn" name="Entradas" fill="hsl(152, 60%, 48%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="totalOut" name="Saídas" fill="hsl(0, 72%, 55%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Evolução Mensal</h3>
          <p className="text-xs text-muted-foreground mb-4">Receita · Despesa · Lucro</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyFlowData}>
              <defs>
                <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => [formatCurrency(value), ""]} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(152, 60%, 48%)" strokeWidth={2} fill="url(#gradR)" />
              <Area type="monotone" dataKey="despesa" name="Despesa" stroke="hsl(0, 72%, 55%)" strokeWidth={2} fill="url(#gradD)" />
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(40, 90%, 58%)" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Expenses + Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Period Costs */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Custos do Período</h3>
          <p className="text-xs text-muted-foreground mb-4">{periodLabel}</p>
          <div className="space-y-2">
            {periodExpenses.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Nenhum custo registrado neste período.</p>
            )}
            {periodExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs font-medium text-foreground">{e.description}</p>
                  <p className="text-[10px] text-muted-foreground">{e.category} · {formatDate(e.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-chart-negative">{formatCurrency(e.amount)}</p>
                  <Badge variant={e.status === "pago" ? "default" : "secondary"} className="text-[9px] mt-0.5">{e.status}</Badge>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total do Período</span>
              <span className="text-xs font-mono font-bold text-foreground">{formatCurrency(totalExpensesPeriod)}</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <ExpensePieChart />

        {/* Capital em Giro */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Capital em Giro — A Receber</h3>
          <p className="text-xs text-muted-foreground mb-4">Top clientes pendentes</p>
          <div className="space-y-2">
            {receivables.filter(r => r.status !== "recebido").slice(0, 6).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs font-medium text-foreground">{r.client}</p>
                  <p className="text-[10px] text-muted-foreground">Venc: {formatDate(r.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-chart-info">{formatCurrency(r.amount - r.paidAmount)}</p>
                  <Badge variant={r.status === "atrasado" ? "destructive" : "secondary"} className="text-[9px] mt-0.5">{r.status.replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
