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
  "Pessoal", "Infraestrutura", "Marketing", "TI", "Fornecedores", 
  "Administrativo", "Seguros", "Logística", "Impostos", "Outros"
];

export const expenseByCategoryData: { name: string; value: number; fill: string }[] = [];

export const monthlyFlowData: { month: string; receita: number; despesa: number; lucro: number }[] = [];

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
