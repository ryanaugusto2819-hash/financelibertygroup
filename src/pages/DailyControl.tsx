import { DashboardLayout } from "@/components/DashboardLayout";
import { DailyFlowTable } from "@/components/DailyFlowTable";
import { DateFilter } from "@/components/DateFilter";
import { useFinance } from "@/context/FinanceContext";
import { dailyEntries, formatCurrency, formatCompact, formatDate } from "@/lib/finance-data";
import { KPICard } from "@/components/KPICard";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const DailyControl = () => {
  const { selectedDate, setSelectedDate } = useFinance();
  const todayData = dailyEntries.find(d => d.date === selectedDate);

  return (
    <DashboardLayout title="Controle Diário" subtitle="Movimentação financeira dia a dia">
      <div className="flex items-center gap-4 mb-6">
        <DateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Day KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KPICard label={`Entradas — ${formatDate(selectedDate)}`} value={todayData?.totalIn || 0} prefix="R$" icon={ArrowUpRight} index={0} variant="positive" />
        <KPICard label={`Saídas — ${formatDate(selectedDate)}`} value={todayData?.totalOut || 0} prefix="R$" icon={ArrowDownRight} index={1} variant="negative" />
        <KPICard label={`Lucro Bruto — ${formatDate(selectedDate)}`} value={todayData?.grossProfit || 0} prefix="R$" icon={TrendingUp} index={2}
          variant={(todayData?.grossProfit || 0) >= 0 ? "positive" : "negative"} />
      </div>

      {/* Chart */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Fluxo Diário — Últimos 12 dias</h3>
        <p className="text-xs text-muted-foreground mb-4">Lucro bruto diário</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={[...dailyEntries].reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
              formatter={(value: number) => [formatCurrency(value), ""]}
              labelFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("pt-BR")} />
            <ReferenceLine y={0} stroke="hsl(215, 15%, 35%)" />
            <Bar dataKey="grossProfit" name="Lucro Bruto" radius={[3, 3, 0, 0]}
              fill="hsl(152, 60%, 48%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Histórico Diário</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-3 font-medium">Data</th>
                <th className="text-right pb-3 font-medium">Entradas</th>
                <th className="text-right pb-3 font-medium">Saídas</th>
                <th className="text-right pb-3 font-medium">Lucro Bruto</th>
                <th className="text-right pb-3 font-medium">Margem</th>
              </tr>
            </thead>
            <tbody>
              {dailyEntries.map(d => {
                const margin = d.totalIn > 0 ? ((d.grossProfit / d.totalIn) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={d.date} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${d.date === selectedDate ? "bg-primary/5" : ""}`}>
                    <td className="py-3 font-mono text-muted-foreground">{formatDate(d.date)}</td>
                    <td className="py-3 text-right font-mono text-chart-positive">{formatCurrency(d.totalIn)}</td>
                    <td className="py-3 text-right font-mono text-chart-negative">{formatCurrency(d.totalOut)}</td>
                    <td className={`py-3 text-right font-mono font-bold ${d.grossProfit >= 0 ? "text-chart-positive" : "text-chart-negative"}`}>
                      {formatCurrency(d.grossProfit)}
                    </td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyControl;
