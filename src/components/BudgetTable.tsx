import { budgetData, formatCurrency } from "@/lib/financial-data";
import { Progress } from "@/components/ui/progress";

export function BudgetTable() {
  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">Orçado vs Realizado</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Análise de desvio orçamentário</p>
      </div>
      <div className="space-y-4">
        {budgetData.map((item) => {
          const pct = (item.actual / item.budgeted) * 100;
          const diff = item.actual - item.budgeted;
          const overBudget = diff > 0;
          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{item.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono">
                    {formatCurrency(item.actual)} / {formatCurrency(item.budgeted)}
                  </span>
                  <span
                    className={`font-mono font-medium ${
                      overBudget ? "text-chart-negative" : "text-chart-positive"
                    }`}
                  >
                    {overBudget ? "+" : ""}
                    {formatCurrency(diff)}
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(pct, 100)}
                className="h-1.5 bg-muted"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
