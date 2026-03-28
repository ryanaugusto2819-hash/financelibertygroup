import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { expenseBreakdown } from "@/lib/financial-data";

export function ExpensePieChart() {
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Composição de Despesas</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Distribuição percentual</p>
      </div>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={expenseBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {expenseBreakdown.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 20%, 11%)",
                border: "1px solid hsl(222, 15%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2">
          {expenseBreakdown.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-mono font-medium text-foreground ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
