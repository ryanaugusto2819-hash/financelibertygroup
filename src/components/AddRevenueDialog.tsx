import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { getTodayBR } from "@/lib/finance-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddRevenueDialogProps {
  onAdded: () => void;
}

export function AddRevenueDialog({ onAdded }: AddRevenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client: "",
    description: "",
    amount: "",
    date: getTodayBR(),
    status: "pendente" as string,
    country: "" as string,
    payment_method: "" as string,
  });

  const handleSubmit = async () => {
    if (!form.client || !form.amount || !form.date) {
      toast.error("Preencha cliente, valor e data.");
      return;
    }
    const amount = parseFloat(form.amount.replace(/[^\d.,\-]/g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("revenues").insert({
      client: form.client,
      description: form.description || form.client,
      amount,
      date: form.date,
      status: form.status,
      country: form.country || null,
      payment_method: form.payment_method || null,
    });
    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar receita.");
      return;
    }

    toast.success("Receita adicionada!");
    setForm({ client: "", description: "", amount: "", date: getTodayBR(), status: "pendente", country: "", payment_method: "" });
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Adicionar Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Receita Manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Cliente *</Label>
            <Input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Nome do cliente" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Venda produto X" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valor (R$) *</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <Label className="text-xs">Data *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">País</Label>
              <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brasil">🇧🇷 Brasil</SelectItem>
                  <SelectItem value="uruguay">🇺🇾 Uruguay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Método de Pagamento</Label>
            <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Adicionar Receita"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
