import { transactions, formatCurrency } from "@/lib/financial-data";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props {
  limit?: number;
}

export function TransactionsTable({ limit }: Props) {
  const data = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">Transações Recentes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{data.length} transações</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left pb-3 font-medium">Data</th>
              <th className="text-left pb-3 font-medium">Descrição</th>
              <th className="text-left pb-3 font-medium">Categoria</th>
              <th className="text-right pb-3 font-medium">Valor</th>
              <th className="text-center pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((txn) => (
              <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 text-muted-foreground font-mono">
                  {new Date(txn.date).toLocaleDateString("pt-BR")}
                </td>
                <td className="py-3 text-foreground font-medium">{txn.description}</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] uppercase tracking-wider">
                    {txn.category}
                  </span>
                </td>
                <td className="py-3 text-right font-mono font-medium">
                  <span className="inline-flex items-center gap-1">
                    {txn.type === "receita" ? (
                      <ArrowUpRight className="w-3 h-3 text-chart-positive" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-chart-negative" />
                    )}
                    <span className={txn.type === "receita" ? "text-chart-positive" : "text-chart-negative"}>
                      {formatCurrency(txn.amount)}
                    </span>
                  </span>
                </td>
                <td className="py-3 text-center">
                  <Badge
                    variant={
                      txn.status === "concluído" ? "default" :
                      txn.status === "pendente" ? "secondary" : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {txn.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
