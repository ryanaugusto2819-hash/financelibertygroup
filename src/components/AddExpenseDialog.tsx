import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { expenseCategories } from "@/lib/finance-data";
import { toast } from "sonner";

export function AddExpenseDialog() {
  const { addExpense } = useFinance();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("custo");
  const [form, setForm] = useState({
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    type: "variavel" as "fixa" | "variavel" | "extraordinaria",
    status: "pendente" as "pago" | "pendente" | "agendado",
    paymentSource: "nao_paga" as "caixa" | "saque" | "nao_paga",
    country: "" as "" | "brasil" | "uruguay",
  });

  const [salaryForm, setSalaryForm] = useState({
    employeeName: "",
    role: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: "pendente" as "pago" | "pendente" | "agendado",
    country: "ambos" as "brasil" | "uruguay" | "ambos",
    frequency: "mensal" as "mensal" | "quinzenal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.category || !form.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    addExpense({
      description: form.description,
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      type: form.type,
      status: form.status,
      paymentSource: form.paymentSource,
      country: form.country || undefined,
    });
    toast.success("Custo lançado com sucesso!");
    setOpen(false);
    setForm({ description: "", category: "", amount: "", date: new Date().toISOString().split("T")[0], type: "variavel", status: "pendente", paymentSource: "nao_paga", country: "" });
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.employeeName || !salaryForm.amount) {
      toast.error("Preencha nome e valor do salário");
      return;
    }
    const countryLabel = salaryForm.country === "brasil" ? "🇧🇷" : salaryForm.country === "uruguay" ? "🇺🇾" : "🇧🇷🇺🇾";
    const baseName = salaryForm.role
      ? `Salário - ${salaryForm.employeeName} (${salaryForm.role}) ${countryLabel}`
      : `Salário - ${salaryForm.employeeName} ${countryLabel}`;

    if (salaryForm.frequency === "quinzenal") {
      const halfAmount = parseFloat(salaryForm.amount) / 2;
      const baseDate = new Date(salaryForm.date + "T12:00:00");
      const secondDate = new Date(baseDate);
      secondDate.setDate(secondDate.getDate() + 15);
      const secondDateStr = secondDate.toISOString().split("T")[0];

      addExpense({
        description: `${baseName} (1ª quinzena)`,
        category: "Salários",
        amount: halfAmount,
        date: salaryForm.date,
        type: "fixa",
        status: salaryForm.status,
        country: salaryForm.country as any,
      });
      addExpense({
        description: `${baseName} (2ª quinzena)`,
        category: "Salários",
        amount: halfAmount,
        date: secondDateStr,
        type: "fixa",
        status: salaryForm.status,
        country: salaryForm.country as any,
      });
      toast.success("Salário quinzenal lançado (2 parcelas)!");
    } else {
      addExpense({
        description: baseName,
        category: "Salários",
        amount: parseFloat(salaryForm.amount),
        date: salaryForm.date,
        type: "fixa",
        status: salaryForm.status,
        country: salaryForm.country as any,
      });
      toast.success("Salário lançado com sucesso!");
    }
    setOpen(false);
    setSalaryForm({ employeeName: "", role: "", amount: "", date: new Date().toISOString().split("T")[0], status: "pendente", country: "ambos", frequency: "mensal" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Lançar Custo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Novo Custo</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custo">Custo Geral</TabsTrigger>
            <TabsTrigger value="salario" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Salário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custo">
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Compra de materiais" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input id="amount" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixa">Fixa</SelectItem>
                      <SelectItem value="variavel">Variável</SelectItem>
                      <SelectItem value="extraordinaria">Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Select value={form.country || "none"} onValueChange={v => setForm(f => ({ ...f, country: v === "none" ? "" : v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Todos</SelectItem>
                      <SelectItem value="brasil">🇧🇷 Brasil</SelectItem>
                      <SelectItem value="uruguay">🇺🇾 Uruguay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Saiu de onde?</Label>
                  <Select value={form.paymentSource} onValueChange={v => setForm(f => ({ ...f, paymentSource: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caixa">Conta Bancária (Caixa)</SelectItem>
                      <SelectItem value="saque">Saque Pendente</SelectItem>
                      <SelectItem value="nao_paga">Não Paga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Lançar Custo</Button>
            </form>
          </TabsContent>

          <TabsContent value="salario">
            <form onSubmit={handleSalarySubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Nome do Funcionário *</Label>
                <Input id="employeeName" value={salaryForm.employeeName} onChange={e => setSalaryForm(f => ({ ...f, employeeName: e.target.value }))} placeholder="Ex: João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo / Função</Label>
                  <Input id="role" value={salaryForm.role} onChange={e => setSalaryForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Vendedor" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryAmount">Salário Mensal (R$) *</Label>
                  <Input id="salaryAmount" type="number" min="0" step="0.01" value={salaryForm.amount} onChange={e => setSalaryForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="salaryDate">Data</Label>
                  <Input id="salaryDate" type="date" value={salaryForm.date} onChange={e => setSalaryForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={salaryForm.status} onValueChange={v => setSalaryForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Select value={salaryForm.country} onValueChange={v => setSalaryForm(f => ({ ...f, country: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambos">🇧🇷🇺🇾 Ambos</SelectItem>
                      <SelectItem value="brasil">🇧🇷 Brasil</SelectItem>
                      <SelectItem value="uruguay">🇺🇾 Uruguay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Salários são lançados como despesa <strong>fixa</strong> e divididos por 30 dias nas projeções.
                Funcionários com "Ambos" aparecem nos dois filtros de país.
              </p>
              <Button type="submit" className="w-full">Lançar Salário</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
