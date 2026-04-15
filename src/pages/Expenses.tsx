import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AIExpenseImportDialog } from "@/components/AIExpenseImportDialog";
import { DateFilter } from "@/components/DateFilter";
import { useFinance } from "@/context/FinanceContext";
import { Expense, formatCurrency, formatDate, expenseCategories, PaymentSource } from "@/lib/finance-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

const PIE_COLORS = [
  "hsl(152, 60%, 48%)", "hsl(210, 80%, 55%)", "hsl(40, 90%, 58%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(180, 60%, 45%)",
  "hsl(30, 70%, 50%)", "hsl(320, 60%, 50%)", "hsl(60, 70%, 50%)", "hsl(100, 50%, 45%)",
];

const PAYMENT_SOURCE_LABELS: Record<string, string> = {
  caixa: "Caixa",
  saque: "Saque",
  nao_paga: "Não Paga",
};

interface ExpensesProps {
  country?: "brasil" | "uruguay";
}

const Expenses = ({ country }: ExpensesProps = {}) => {
  const { expenses, selectedDate, updateExpense, deleteExpense, setCountryFilter } = useFinance();

  // Sync country prop to context
  React.useEffect(() => {
    if (country) {
      setCountryFilter(country);
    } else {
      setCountryFilter("todos");
    }
  }, [country, setCountryFilter]);

  const totalMonth = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDay = expenses.filter(e => e.date === selectedDate).reduce((s, e) => s + e.amount, 0);
  const byCategory = expenseCategories.map(cat => ({
    name: cat, value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.value > 0);

  return (
    <DashboardLayout title={country === "brasil" ? "🇧🇷 Despesas Brasil" : country === "uruguay" ? "🇺🇾 Despesas Uruguay" : "Custos & Despesas"} subtitle="Controle detalhado de gastos" hideCountryFilter={!!country}>
      <div className="flex items-center justify-between mb-6">
        <DateFilter />
        <div className="flex gap-2">
          <AIExpenseImportDialog />
          <AddExpenseDialog />
        </div>
      </div>

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
                  <th className="text-left pb-3 font-medium">Fonte</th>
                  <th className="text-right pb-3 font-medium">Valor</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                  <th className="text-center pb-3 font-medium">Ações</th>
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
                    <td className="py-2.5 text-[10px] text-muted-foreground">
                      {e.paymentSource ? PAYMENT_SOURCE_LABELS[e.paymentSource] : "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-chart-negative">{formatCurrency(e.amount)}</td>
                    <td className="py-2.5 text-center">
                      <Badge variant={e.status === "pago" ? "default" : e.status === "agendado" ? "outline" : "secondary"} className="text-[9px]">{e.status}</Badge>
                    </td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <EditExpenseDialog expense={e} onSave={updateExpense} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover "{e.description}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  const result = await deleteExpense(e.id);
                                  if (!result.success) {
                                    toast.error(result.error || "Erro ao remover despesa.");
                                    return;
                                  }
                                  toast.success("Despesa removida.");
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground italic">Nenhuma despesa cadastrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Edit expense dialog
function EditExpenseDialog({ expense, onSave }: { expense: Expense; onSave: (id: string, data: Partial<Omit<Expense, "id">>) => Promise<{ success: boolean; error?: string }> }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState(expense.category);
  const [type, setType] = useState(expense.type);
  const [status, setStatus] = useState(expense.status);
  const [date, setDate] = useState(expense.date);
  const [paymentSource, setPaymentSource] = useState<PaymentSource | "">(expense.paymentSource || "");
  const [country, setCountry] = useState(expense.country || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSave(expense.id, {
      description, amount: parseFloat(amount), category, type, status, date,
      paymentSource: paymentSource || undefined,
      country: (country || undefined) as "brasil" | "uruguay" | undefined,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao salvar alterações.");
      return;
    }

    toast.success("Despesa atualizada.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixa">Fixa</SelectItem>
                  <SelectItem value="variavel">Variável</SelectItem>
                  <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fonte Pagamento</Label>
              <Select value={paymentSource || "none"} onValueChange={v => setPaymentSource(v === "none" ? "" : v as any)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                  <SelectItem value="saque">Saque</SelectItem>
                  <SelectItem value="nao_paga">Não Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>País</Label>
              <Select value={country || "none"} onValueChange={v => setCountry(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  <SelectItem value="brasil">🇧🇷 Brasil</SelectItem>
                  <SelectItem value="uruguay">🇺🇾 Uruguay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full">Salvar Alterações</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Expenses;
