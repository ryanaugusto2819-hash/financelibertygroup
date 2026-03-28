import { DashboardLayout } from "@/components/DashboardLayout";
import { accountsPayable, formatCurrency, formatDate, getTotalAccountsPayable } from "@/lib/finance-data";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";

const AccountsPayable = () => {
  const totalPending = getTotalAccountsPayable();
  const overdue = accountsPayable.filter(a => a.status === "atrasado");
  const upcoming = accountsPayable.filter(a => a.status === "pendente").sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Group by category
  const byCategory = upcoming.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout title="Contas a Pagar" subtitle="Obrigações e despesas futuras">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border-chart-negative/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-chart-negative" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pendente</p>
          </div>
          <p className="text-2xl font-bold font-mono text-chart-negative">{formatCurrency(totalPending)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="w-4 h-4 text-chart-warning" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Próximos 7 dias</p>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {formatCurrency(upcoming.filter(a => {
              const diff = (new Date(a.dueDate).getTime() - new Date("2025-03-28").getTime()) / (1000 * 60 * 60 * 24);
              return diff >= 0 && diff <= 7;
            }).reduce((s, a) => s + a.amount, 0))}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass-card p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Itens Pendentes</p>
          <p className="text-2xl font-bold font-mono text-foreground">{upcoming.length}</p>
        </motion.div>
      </div>

      {/* By Category Summary */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Resumo por Categoria</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(byCategory).map(([cat, amount]) => (
            <div key={cat} className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
              <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Detalhamento</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-3 font-medium">Fornecedor</th>
                <th className="text-left pb-3 font-medium">Descrição</th>
                <th className="text-left pb-3 font-medium">Categoria</th>
                <th className="text-left pb-3 font-medium">Vencimento</th>
                <th className="text-right pb-3 font-medium">Valor</th>
                <th className="text-center pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...overdue, ...upcoming].map(a => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium text-foreground">{a.supplier}</td>
                  <td className="py-3 text-muted-foreground">{a.description}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] uppercase tracking-wider">{a.category}</span>
                  </td>
                  <td className="py-3 font-mono text-muted-foreground">{formatDate(a.dueDate)}</td>
                  <td className="py-3 text-right font-mono font-bold text-chart-negative">{formatCurrency(a.amount)}</td>
                  <td className="py-3 text-center">
                    <Badge variant={a.status === "atrasado" ? "destructive" : a.status === "pago" ? "default" : "secondary"} className="text-[10px]">
                      {a.status}
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

export default AccountsPayable;
