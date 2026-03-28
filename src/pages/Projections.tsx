import { DashboardLayout } from "@/components/DashboardLayout";
import { ScenarioCard } from "@/components/ScenarioCard";
import {
  formatCurrency, formatCompact, getTotalReceivable, getTotalExpensesMonth,
  getTotalAccountsPayable, getTotalScheduledRevenue, getWeightedScheduledRevenue,
  getCashEstimate, scheduledRevenues, formatDate, monthlyFlowData,
} from "@/lib/finance-data";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { motion } from "framer-motion";

const Projections = () => {
  const totalReceivable = getTotalReceivable();
  const totalExpenses = getTotalExpensesMonth();
  const totalPayable = getTotalAccountsPayable();
  const scheduledTotal = getTotalScheduledRevenue();
  const weightedTotal = getWeightedScheduledRevenue();
  const cashEstimate = getCashEstimate();

  // Projection data for chart
  const projectionData = [50, 60, 70, 80, 90, 100].map(pct => ({
    cenario: `${pct}%`,
    receita: totalReceivable * pct / 100,
    lucro: (totalReceivable * pct / 100) - totalExpenses,
  }));

  // Cash flow projection months
  const cashProjection = [
    { month: "Abr", optimista: 1650000, realista: 1420000, pessimista: 1180000 },
    { month: "Mai", optimista: 1820000, realista: 1550000, pessimista: 1250000 },
    { month: "Jun", optimista: 2010000, realista: 1680000, pessimista: 1310000 },
    { month: "Jul", optimista: 2200000, realista: 1800000, pessimista: 1350000 },
  ];

  return (
    <DashboardLayout title="Projeções" subtitle="Cenários financeiros e estimativas">
      {/* Scenarios */}
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Projeção por Cenário de Pagamento
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ScenarioCard percentage={100} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={0} />
        <ScenarioCard percentage={70} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={1} highlight />
        <ScenarioCard percentage={60} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={2} />
        <ScenarioCard percentage={50} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={3} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Receita vs Lucro por Cenário</h3>
          <p className="text-xs text-muted-foreground mb-4">Impacto da inadimplência no resultado</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
              <XAxis dataKey="cenario" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => [formatCurrency(value), ""]} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="receita" name="Receita" fill="hsl(210, 80%, 55%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="lucro" name="Lucro" fill="hsl(152, 60%, 48%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Projeção de Caixa</h3>
          <p className="text-xs text-muted-foreground mb-4">Otimista · Realista · Pessimista</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cashProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => [formatCurrency(value), ""]} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line type="monotone" dataKey="optimista" name="Otimista" stroke="hsl(152, 60%, 48%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="realista" name="Realista" stroke="hsl(40, 90%, 58%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pessimista" name="Pessimista" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Estimativa de Caixa</p>
          <p className="text-xl font-bold font-mono text-chart-positive">{formatCurrency(cashEstimate)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Saldo atual + receita ponderada - obrigações</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Receita Agendada (Ponderada)</p>
          <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(weightedTotal)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total: {formatCurrency(scheduledTotal)} · Ponderada por probabilidade</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Obrigações Futuras</p>
          <p className="text-xl font-bold font-mono text-chart-negative">{formatCurrency(totalPayable)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Contas a pagar pendentes</p>
        </motion.div>
      </div>

      {/* Scheduled Revenue Table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Receita Agendada</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-3 font-medium">Cliente</th>
                <th className="text-left pb-3 font-medium">Descrição</th>
                <th className="text-left pb-3 font-medium">Previsão</th>
                <th className="text-right pb-3 font-medium">Valor</th>
                <th className="text-right pb-3 font-medium">Probabilidade</th>
                <th className="text-right pb-3 font-medium">Ponderado</th>
              </tr>
            </thead>
            <tbody>
              {scheduledRevenues.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium text-foreground">{r.client}</td>
                  <td className="py-3 text-muted-foreground">{r.description}</td>
                  <td className="py-3 font-mono text-muted-foreground">{formatDate(r.expectedDate)}</td>
                  <td className="py-3 text-right font-mono text-foreground">{formatCurrency(r.amount)}</td>
                  <td className="py-3 text-right">
                    <Badge variant={r.probability >= 80 ? "default" : r.probability >= 60 ? "secondary" : "outline"} className="text-[10px]">
                      {r.probability}%
                    </Badge>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-chart-positive">{formatCurrency(r.amount * r.probability / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Projections;
