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

export function KPICard({
  label,
  value,
  change,
  prefix,
  suffix,
  icon: Icon,
  index,
  variant = "default",
}: KPICardProps) {
  const isPositive = (change ?? 0) >= 0;

  const displayValue = prefix === "R$" ? formatCurrency(value) : `${value.toLocaleString("pt-BR")}${suffix || ""}`;

  const accentClass =
    variant === "positive"
      ? "accent-green"
      : variant === "negative"
        ? "accent-red"
        : variant === "warning"
          ? "accent-amber"
          : "accent-purple";

  const iconBoxClass =
    variant === "positive"
      ? "icon-box-green"
      : variant === "negative"
        ? "icon-box-red"
        : variant === "warning"
          ? "icon-box-amber"
          : "icon-box-purple";

  const valueColor =
    variant === "positive"
      ? "text-chart-positive"
      : variant === "negative"
        ? "text-chart-negative"
        : variant === "warning"
          ? "text-chart-warning"
          : "text-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`cfo-card p-5 group ${accentClass}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`icon-box ${iconBoxClass}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold font-mono tracking-tight ${valueColor}`}>{displayValue}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-chart-positive" />
          ) : (
            <TrendingDown className="w-3 h-3 text-chart-negative" />
          )}
          <span
            className={`text-[10px] font-medium font-mono ${isPositive ? "text-chart-positive" : "text-chart-negative"}`}
          >
            {isPositive ? "+" : ""}
            {change}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
