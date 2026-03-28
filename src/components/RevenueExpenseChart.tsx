import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { revenueExpenseData, formatCompact } from "@/lib/financial-data";

export function RevenueExpenseChart() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Receita vs Despesas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Evolução mensal — 2025</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-chart-positive" />
            <span className="text-xs text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-chart-negative" />
            <span className="text-xs text-muted-foreground">Despesas</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={revenueExpenseData}>
          <defs>
            <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="receita" stroke="hsl(152, 60%, 48%)" strokeWidth={2} fill="url(#gradReceita)" />
          <Area type="monotone" dataKey="despesa" stroke="hsl(0, 72%, 55%)" strokeWidth={2} fill="url(#gradDespesa)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
