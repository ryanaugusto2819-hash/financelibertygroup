import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cashFlowData, formatCompact } from "@/lib/financial-data";

export function CashFlowChart() {
  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">Fluxo de Caixa</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Operacional · Investimento · Financiamento</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={cashFlowData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 20%, 11%)",
              border: "1px solid hsl(222, 15%, 18%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`R$ ${formatCompact(value)}`, ""]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "hsl(215, 15%, 55%)" }}
          />
          <Bar dataKey="operacional" name="Operacional" fill="hsl(152, 60%, 48%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="investimento" name="Investimento" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="financiamento" name="Financiamento" fill="hsl(40, 90%, 58%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
