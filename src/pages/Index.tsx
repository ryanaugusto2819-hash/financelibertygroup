import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { ScenarioCard } from "@/components/ScenarioCard";
import { DateFilter } from "@/components/DateFilter";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { ExpensePieChart } from "@/components/ExpensePieChart";
import {
  formatCurrency, formatCompact, formatDate,
  getTotalReceivable, getReceivedTotal, getTotalExpensesMonth,
  getTotalExpensesDay, getTotalIncomeDay, getTotalOutDay, getGrossProfitDay,
  getTotalAccountsPayable, getCashEstimate, getTotalScheduledRevenue,
  getWeightedScheduledRevenue, dailyEntries, monthlyFlowData, receivables,
} from "@/lib/finance-data";
import { useFinance } from "@/context/FinanceContext";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CalendarClock, PiggyBank, Landmark, BarChart3, Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { selectedDate, setSelectedDate, expenses } = useFinance();

  const totalReceivable = getTotalReceivable();
  const totalReceived = getReceivedTotal();
  const totalExpensesMonth = expenses.reduce((s, e) => s + e.amount, 0);
  const todayExpenses = expenses.filter(e => e.date === selectedDate).reduce((s, e) => s + e.amount, 0);
  const todayIncome = getTotalIncomeDay(selectedDate);
  const todayOut = getTotalOutDay(selectedDate);
  const todayGrossProfit = todayIncome - todayOut;
  const totalPayable = getTotalAccountsPayable();
  const scheduledExpenses = expenses.filter(e => e.status === "agendado").reduce((s, e) => s + e.amount, 0);
  const totalPayableWithScheduled = totalPayable + scheduledExpenses;
  const cashEstimate = getCashEstimate();
  const scheduledTotal = getTotalScheduledRevenue();
  const currentCash = 1456200;

  // Lucro bruto e líquido do mês
  const grossProfitMonth = totalReceived - totalExpensesMonth;
  const netProfitMonth = grossProfitMonth * 0.85; // estimativa impostos

  return (
    <DashboardLayout title="Painel Financeiro" subtitle="Controle financeiro executivo">
      {/* Date Filter */}
      <div className="flex items-center justify-between mb-6">
        <DateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <AddExpenseDialog />
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPICard label="Receita em Caixa" value={currentCash} prefix="R$" icon={Wallet} index={0} variant="positive" />
        <KPICard label="Receita Agendada" value={scheduledTotal} prefix="R$" icon={CalendarClock} index={1} />
        <KPICard label="Total a Pagar + Agendadas" value={totalPayableWithScheduled} prefix="R$" icon={Landmark} index={2} variant="negative" />
        <KPICard label="Saldo (Caixa - Obrigações)" value={currentCash - totalPayableWithScheduled} prefix="R$" icon={Target} index={3} variant={(currentCash - totalPayableWithScheduled) >= 0 ? "positive" : "negative"} />
        <KPICard label={`Lucro Bruto do Dia`} value={todayGrossProfit} prefix="R$" icon={TrendingUp} index={4} variant={todayGrossProfit >= 0 ? "positive" : "negative"} />
        <KPICard label="Estimativa de Caixa" value={cashEstimate} prefix="R$" icon={PiggyBank} index={5} variant="positive" />
      </div>

      {/* Cenários de Pagamento */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Projeção de Receita — Cenários de Pagamento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScenarioCard percentage={100} totalReceivable={totalReceivable} totalExpenses={totalExpensesMonth} index={0} />
          <ScenarioCard percentage={70} totalReceivable={totalReceivable} totalExpenses={totalExpensesMonth} index={1} highlight />
          <ScenarioCard percentage={60} totalReceivable={totalReceivable} totalExpenses={totalExpensesMonth} index={2} />
          <ScenarioCard percentage={50} totalReceivable={totalReceivable} totalExpenses={totalExpensesMonth} index={3} />
        </div>
      </div>

      {/* Daily Summary + Lucro */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label={`Entrou Hoje (${formatDate(selectedDate)})`} value={todayIncome} prefix="R$" icon={ArrowUpRight} index={0} variant="positive" />
        <KPICard label={`Saiu Hoje (${formatDate(selectedDate)})`} value={todayOut} prefix="R$" icon={ArrowDownRight} index={1} variant="negative" />
        <KPICard label="Lucro Bruto (Mês)" value={grossProfitMonth} prefix="R$" icon={TrendingUp} index={2} variant={grossProfitMonth >= 0 ? "positive" : "negative"} />
        <KPICard label="Lucro Líquido (Mês)" value={netProfitMonth} prefix="R$" icon={Target} index={3} variant={netProfitMonth >= 0 ? "positive" : "negative"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Daily Flow Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Fluxo Diário</h3>
          <p className="text-xs text-muted-foreground mb-4">Entradas vs Saídas — Últimos dias</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyEntries.slice(0, 10).reverse()}>
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
        {/* Today's Costs */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Custos do Dia</h3>
          <p className="text-xs text-muted-foreground mb-4">{formatDate(selectedDate)}</p>
          <div className="space-y-2">
            {expenses.filter(e => e.date === selectedDate).length === 0 && (
              <p className="text-xs text-muted-foreground italic">Nenhum custo registrado nesta data.</p>
            )}
            {expenses.filter(e => e.date === selectedDate).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs font-medium text-foreground">{e.description}</p>
                  <p className="text-[10px] text-muted-foreground">{e.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-chart-negative">{formatCurrency(e.amount)}</p>
                  <Badge variant={e.status === "pago" ? "default" : "secondary"} className="text-[9px] mt-0.5">{e.status}</Badge>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total do Dia</span>
              <span className="text-xs font-mono font-bold text-foreground">{formatCurrency(todayExpenses)}</span>
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
