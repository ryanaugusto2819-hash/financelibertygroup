import { DashboardLayout } from "@/components/DashboardLayout";
import { ScenarioCard } from "@/components/ScenarioCard";
import { receivables, formatCurrency, formatDate, getTotalReceivable, getTotalExpensesMonth } from "@/lib/finance-data";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCompact } from "@/lib/finance-data";

const Receivables = () => {
  const totalReceivable = getTotalReceivable();
  const totalExpenses = getTotalExpensesMonth();

  const byStatus = [
    { name: "A Receber", value: receivables.filter(r => r.status === "a_receber").reduce((s, r) => s + r.amount - r.paidAmount, 0), fill: "hsl(210, 80%, 55%)" },
    { name: "Atrasado", value: receivables.filter(r => r.status === "atrasado").reduce((s, r) => s + r.amount - r.paidAmount, 0), fill: "hsl(0, 72%, 55%)" },
    { name: "Parcial", value: receivables.filter(r => r.status === "parcial").reduce((s, r) => s + r.amount - r.paidAmount, 0), fill: "hsl(40, 90%, 58%)" },
    { name: "Recebido", value: receivables.filter(r => r.status === "recebido").reduce((s, r) => s + r.paidAmount, 0), fill: "hsl(152, 60%, 48%)" },
  ];

  return (
    <DashboardLayout title="Capital em Giro" subtitle="Gestão de recebíveis e projeções">
      {/* Scenarios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ScenarioCard percentage={100} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={0} />
        <ScenarioCard percentage={70} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={1} highlight />
        <ScenarioCard percentage={60} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={2} />
        <ScenarioCard percentage={50} totalReceivable={totalReceivable} totalExpenses={totalExpenses} index={3} />
      </div>

      {/* Chart */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recebíveis por Status</h3>
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

      {/* Table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Detalhamento de Recebíveis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-3 font-medium">Cliente</th>
                <th className="text-left pb-3 font-medium">Descrição</th>
                <th className="text-left pb-3 font-medium">Vencimento</th>
                <th className="text-right pb-3 font-medium">Valor</th>
                <th className="text-right pb-3 font-medium">Recebido</th>
                <th className="text-right pb-3 font-medium">Saldo</th>
                <th className="text-center pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium text-foreground">{r.client}</td>
                  <td className="py-3 text-muted-foreground">{r.description}</td>
                  <td className="py-3 font-mono text-muted-foreground">{formatDate(r.dueDate)}</td>
                  <td className="py-3 text-right font-mono font-medium text-foreground">{formatCurrency(r.amount)}</td>
                  <td className="py-3 text-right font-mono text-chart-positive">{formatCurrency(r.paidAmount)}</td>
                  <td className="py-3 text-right font-mono font-bold text-chart-info">{formatCurrency(r.amount - r.paidAmount)}</td>
                  <td className="py-3 text-center">
                    <Badge variant={r.status === "recebido" ? "default" : r.status === "atrasado" ? "destructive" : "secondary"} className="text-[10px]">
                      {r.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Receivables;
