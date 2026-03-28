import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { KPI } from "@/lib/financial-data";
import { formatCurrency } from "@/lib/financial-data";

interface KPICardProps {
  kpi: KPI;
  index: number;
}

export function KPICard({ kpi, index }: KPICardProps) {
  const isPositive = kpi.change >= 0;

  const displayValue = kpi.prefix === "R$"
    ? formatCurrency(kpi.value)
    : `${kpi.value}${kpi.suffix || ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card p-5 group hover:border-primary/30 transition-all duration-300"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {kpi.label}
      </p>
      <p className="text-2xl font-bold text-foreground font-mono tracking-tight">
        {displayValue}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 text-chart-positive" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-chart-negative" />
        )}
        <span
          className={`text-xs font-medium font-mono ${
            isPositive ? "text-chart-positive" : "text-chart-negative"
          }`}
        >
          {isPositive ? "+" : ""}
          {kpi.change}%
        </span>
        <span className="text-xs text-muted-foreground">vs mês anterior</span>
      </div>
    </motion.div>
  );
}
