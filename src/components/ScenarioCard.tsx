import { formatCurrency } from "@/lib/finance-data";
import { motion } from "framer-motion";

interface Props {
  percentage: number;
  totalReceivable: number;
  totalExpenses: number;
  adsSpend?: number;
  index: number;
  highlight?: boolean;
}

export function ScenarioCard({ percentage, totalReceivable, totalExpenses, adsSpend = 0, index, highlight }: Props) {
  const projected = totalReceivable * (percentage / 100);
  const totalCosts = totalExpenses + adsSpend;
  const profit = projected - totalCosts;
  const isPositive = profit >= 0;

  const accentClass =
    percentage === 100
      ? "accent-green"
      : percentage >= 70
        ? "accent-blue"
        : percentage >= 60
          ? "accent-amber"
          : "accent-red";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`cfo-card p-5 ${accentClass} ${highlight ? "glow-primary" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Cenário {percentage}%
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {highlight ? "Provável" : "Cenário"}
        </span>
      </div>
      <p className="text-lg font-bold font-mono text-foreground mb-1">{formatCurrency(projected)}</p>
      <p className="text-[10px] text-muted-foreground mb-3">Receita Projetada</p>
      <div className="border-t border-border/50 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">Lucro Projetado</span>
          <span className={`text-xs font-bold font-mono ${isPositive ? "text-chart-positive" : "text-chart-negative"}`}>
            {formatCurrency(profit)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
