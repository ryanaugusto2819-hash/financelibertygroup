import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/finance-data";

interface KPICardProps {
  label: string;
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  index: number;
  variant?: "default" | "positive" | "negative" | "warning";
}

export function KPICard({ label, value, change, prefix, suffix, icon: Icon, index, variant = "default" }: KPICardProps) {
  const isPositive = (change ?? 0) >= 0;

  const displayValue = prefix === "R$"
    ? formatCurrency(value)
    : `${value.toLocaleString("pt-BR")}${suffix || ""}`;

  const borderClass = variant === "positive" ? "border-chart-positive/20" :
    variant === "negative" ? "border-chart-negative/20" :
    variant === "warning" ? "border-chart-warning/20" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`glass-card p-4 group hover:border-primary/30 transition-all duration-300 ${borderClass}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <p className="text-xl font-bold text-foreground font-mono tracking-tight">
        {displayValue}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-chart-positive" />
          ) : (
            <TrendingDown className="w-3 h-3 text-chart-negative" />
          )}
          <span className={`text-[10px] font-medium font-mono ${isPositive ? "text-chart-positive" : "text-chart-negative"}`}>
            {isPositive ? "+" : ""}{change}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
