import { DashboardLayout } from "@/components/DashboardLayout";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { DateFilter } from "@/components/DateFilter";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatDate, expenseCategories } from "@/lib/finance-data";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

const PIE_COLORS = [
  "hsl(152, 60%, 48%)", "hsl(210, 80%, 55%)", "hsl(40, 90%, 58%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(180, 60%, 45%)",
  "hsl(30, 70%, 50%)", "hsl(320, 60%, 50%)", "hsl(60, 70%, 50%)", "hsl(100, 50%, 45%)",
];

const Expenses = () => {
  const { expenses, selectedDate, setSelectedDate } = useFinance();

  const totalMonth = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDay = expenses.filter(e => e.date === selectedDate).reduce((s, e) => s + e.amount, 0);

  // By category
  const byCategory = expenseCategories.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.value > 0);

  return (
    <DashboardLayout title="Custos & Despesas" subtitle="Controle detalhado de gastos">
      <div className="flex items-center justify-between mb-6">
        <DateFilter />
        <AddExpenseDialog />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total do Mês</p>
          <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(totalMonth)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total do Dia ({formatDate(selectedDate)})</p>
          <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(totalDay)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Média Diária</p>
          <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(totalMonth / 28)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Pie Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => [formatCurrency(value), ""]} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Full Table */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Todos os Lançamentos</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Data</th>
                  <th className="text-left pb-3 font-medium">Descrição</th>
                  <th className="text-left pb-3 font-medium">Categoria</th>
                  <th className="text-left pb-3 font-medium">Tipo</th>
                  <th className="text-right pb-3 font-medium">Valor</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-mono text-muted-foreground">{formatDate(e.date)}</td>
                    <td className="py-2.5 font-medium text-foreground">{e.description}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] uppercase tracking-wider">{e.category}</span>
                    </td>
                    <td className="py-2.5 text-[10px] text-muted-foreground capitalize">{e.type}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-chart-negative">{formatCurrency(e.amount)}</td>
                    <td className="py-2.5 text-center">
                      <Badge variant={e.status === "pago" ? "default" : e.status === "agendado" ? "outline" : "secondary"} className="text-[9px]">{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
