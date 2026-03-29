// ============= Finance Data Models =============

export interface Receivable {
  id: string;
  client: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "a_receber" | "recebido" | "atrasado" | "parcial";
  paidAmount: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "fixa" | "variavel" | "extraordinaria";
  status: "pago" | "pendente" | "agendado";
  country?: "brasil" | "uruguay";
}

export interface DailyEntry {
  date: string;
  totalIn: number;
  totalOut: number;
  grossProfit: number;
}

export interface AccountPayable {
  id: string;
  supplier: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "pago" | "pendente" | "atrasado";
  category: string;
}

export interface ScheduledRevenue {
  id: string;
  client: string;
  description: string;
  amount: number;
  expectedDate: string;
  probability: number; // 0-100
}

// ============= Data =============

export const receivables: Receivable[] = [];

export const expenses: Expense[] = [];

export const accountsPayable: AccountPayable[] = [];

export const scheduledRevenues: ScheduledRevenue[] = [];

export const dailyEntries: DailyEntry[] = [];

export const expenseCategories = [
  "Pessoal", "Salários", "Infraestrutura", "Marketing", "TI", "Fornecedores", 
  "Administrativo", "Seguros", "Logística", "Impostos", "Outros"
];

export const expenseByCategoryData: { name: string; value: number; fill: string }[] = [];

export const monthlyFlowData: { month: string; receita: number; despesa: number; lucro: number }[] = [];

// ============= Computed Data =============

export function getTotalReceivable(): number {
  return receivables
    .filter(r => r.status !== "recebido")
    .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
}

export function getReceivedTotal(): number {
  return receivables
    .filter(r => r.status === "recebido" || r.status === "parcial")
    .reduce((sum, r) => sum + r.paidAmount, 0);
}

export function getProjectedReceivable(percentage: number): number {
  return getTotalReceivable() * (percentage / 100);
}

export function getTotalExpensesMonth(): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getTotalExpensesDay(date: string): number {
  return expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0);
}

export function getTotalAccountsPayable(): number {
  return accountsPayable.filter(a => a.status === "pendente").reduce((sum, a) => sum + a.amount, 0);
}

export function getTotalScheduledRevenue(): number {
  return scheduledRevenues.reduce((sum, r) => sum + r.amount, 0);
}

export function getWeightedScheduledRevenue(): number {
  return scheduledRevenues.reduce((sum, r) => sum + (r.amount * r.probability / 100), 0);
}

export function getCashEstimate(): number {
  const currentCash = 0;
  const expectedIn = getWeightedScheduledRevenue();
  const expectedOut = getTotalAccountsPayable();
  return currentCash + expectedIn - expectedOut;
}

export function getGrossProfit(): number {
  const totalRevenue = getReceivedTotal();
  return totalRevenue - getTotalExpensesMonth();
}

export function getNetProfit(): number {
  const gross = getGrossProfit();
  const taxes = gross * 0.15;
  return gross - taxes;
}

// ============= Timezone Helpers =============

/** Returns today's date as yyyy-MM-dd in America/Sao_Paulo timezone */
export function getTodayBR(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Returns a Date object representing "now" in Sao Paulo (for date-fns math) */
export function getNowBR(): Date {
  const brStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(brStr);
}

// ============= Formatting =============

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}
