import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { expenseByCategoryData, formatCurrency } from "@/lib/finance-data";

export function ExpensePieChart() {
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Despesas por Categoria</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Distribuição do mês</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={expenseByCategoryData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {expenseByCategoryData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 20%, 11%)",
              border: "1px solid hsl(222, 15%, 18%)",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            formatter={(value: number) => [formatCurrency(value), ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        {expenseByCategoryData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
            <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
