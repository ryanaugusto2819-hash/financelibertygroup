import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanLine, Upload, Loader2, Check, X } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface ExtractedExpense {
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "fixa" | "variavel" | "extraordinaria";
  status: "pago" | "pendente" | "agendado";
  selected?: boolean;
}

export function AIExpenseImportDialog() {
  const { addExpense } = useFinance();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "loading" | "review">("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ExtractedExpense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setPreview(null);
    setExpenses([]);
    setError(null);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Envie apenas imagens (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setStep("loading");
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("extract-expenses", {
          body: { imageBase64: base64 },
        });

        if (fnError) throw new Error(fnError.message);

        if (data?.error) throw new Error(data.error);

        if (!data?.expenses?.length) {
          throw new Error("Nenhuma despesa encontrada na imagem. Tente com uma imagem mais clara.");
        }

        setExpenses(data.expenses.map((exp: ExtractedExpense) => ({ ...exp, selected: true })));
        setStep("review");
      } catch (err: any) {
        console.error("AI extraction error:", err);
        setError(err.message || "Erro ao processar imagem");
        setStep("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleExpense = (index: number) => {
    setExpenses((prev) =>
      prev.map((e, i) => (i === index ? { ...e, selected: !e.selected } : e))
    );
  };

  const toggleAll = () => {
    const allSelected = expenses.every((e) => e.selected);
    setExpenses((prev) => prev.map((e) => ({ ...e, selected: !allSelected })));
  };

  const importSelected = () => {
    const selected = expenses.filter((e) => e.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos uma despesa");
      return;
    }

    selected.forEach((exp) => {
      addExpense({
        description: exp.description,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        type: exp.type,
        status: exp.status,
      });
    });

    toast.success(`${selected.length} despesa(s) importada(s) com sucesso!`);
    setOpen(false);
    reset();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <ScanLine className="w-3.5 h-3.5" />
          Importar via IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            Importar Despesas com IA
          </DialogTitle>
        </DialogHeader>

        {/* STEP: Upload */}
        {step === "upload" && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Envie uma foto ou print de um extrato bancário e a IA irá extrair as despesas automaticamente.
            </p>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                Clique ou arraste uma imagem aqui
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG ou JPEG • Máximo 10MB
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {/* STEP: Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center py-10 gap-4">
            {preview && (
              <img
                src={preview}
                alt="Extrato"
                className="w-48 h-auto rounded-lg border border-border opacity-70"
              />
            )}
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Analisando extrato...</p>
              <p className="text-xs text-muted-foreground mt-1">
                A IA está extraindo as despesas da imagem
              </p>
            </div>
          </div>
        )}

        {/* STEP: Review */}
        {step === "review" && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {expenses.length} despesa(s) encontrada(s). Revise e confirme:
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
                {expenses.every((e) => e.selected) ? "Desmarcar" : "Marcar"} Todas
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {expenses.map((exp, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    exp.selected
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/20 opacity-60"
                  }`}
                >
                  <Checkbox
                    checked={exp.selected}
                    onCheckedChange={() => toggleExpense(i)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {exp.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {exp.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(exp.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-mono font-bold text-chart-negative whitespace-nowrap">
                    {formatCurrency(exp.amount)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Total selecionado:{" "}
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(
                    expenses.filter((e) => e.selected).reduce((s, e) => s + e.amount, 0)
                  )}
                </span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={importSelected}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Importar ({expenses.filter((e) => e.selected).length})
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
