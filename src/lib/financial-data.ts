export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "receita" | "despesa";
  amount: number;
  status: "concluído" | "pendente" | "cancelado";
}

export interface KPI {
  label: string;
  value: number;
  change: number;
  prefix?: string;
  suffix?: string;
}

export interface BudgetItem {
  category: string;
  budgeted: number;
  actual: number;
}

export const kpis: KPI[] = [
  { label: "Receita Total", value: 2847500, change: 12.5, prefix: "R$" },
  { label: "Despesas Totais", value: 1923400, change: -3.2, prefix: "R$" },
  { label: "Lucro Líquido", value: 924100, change: 18.7, prefix: "R$" },
  { label: "Margem EBITDA", value: 32.4, change: 4.1, suffix: "%" },
  { label: "Fluxo de Caixa", value: 1456200, change: 8.3, prefix: "R$" },
  { label: "ROI", value: 24.8, change: 2.6, suffix: "%" },
];

export const revenueExpenseData = [
  { month: "Jan", receita: 380000, despesa: 290000 },
  { month: "Fev", receita: 420000, despesa: 310000 },
  { month: "Mar", receita: 390000, despesa: 285000 },
  { month: "Abr", receita: 450000, despesa: 320000 },
  { month: "Mai", receita: 480000, despesa: 340000 },
  { month: "Jun", receita: 520000, despesa: 330000 },
  { month: "Jul", receita: 510000, despesa: 345000 },
  { month: "Ago", receita: 540000, despesa: 350000 },
  { month: "Set", receita: 560000, despesa: 360000 },
  { month: "Out", receita: 580000, despesa: 355000 },
  { month: "Nov", receita: 610000, despesa: 370000 },
  { month: "Dez", receita: 650000, despesa: 390000 },
];

export const cashFlowData = [
  { month: "Jan", operacional: 120000, investimento: -45000, financiamento: -20000 },
  { month: "Fev", operacional: 135000, investimento: -30000, financiamento: -25000 },
  { month: "Mar", operacional: 110000, investimento: -60000, financiamento: -15000 },
  { month: "Abr", operacional: 150000, investimento: -35000, financiamento: -20000 },
  { month: "Mai", operacional: 160000, investimento: -40000, financiamento: -18000 },
  { month: "Jun", operacional: 175000, investimento: -50000, financiamento: -22000 },
];

export const budgetData: BudgetItem[] = [
  { category: "Folha de Pagamento", budgeted: 850000, actual: 830000 },
  { category: "Marketing", budgeted: 250000, actual: 278000 },
  { category: "Infraestrutura", budgeted: 180000, actual: 165000 },
  { category: "P&D", budgeted: 320000, actual: 310000 },
  { category: "Administrativo", budgeted: 120000, actual: 135000 },
  { category: "Comercial", budgeted: 200000, actual: 205000 },
];

export const transactions: Transaction[] = [
  { id: "TXN001", date: "2025-03-28", description: "Faturamento Cliente Alpha Corp", category: "Vendas", type: "receita", amount: 185000, status: "concluído" },
  { id: "TXN002", date: "2025-03-27", description: "Pagamento Fornecedor TechParts", category: "Fornecedores", type: "despesa", amount: 42500, status: "concluído" },
  { id: "TXN003", date: "2025-03-27", description: "Faturamento Cliente Beta Systems", category: "Vendas", type: "receita", amount: 97000, status: "pendente" },
  { id: "TXN004", date: "2025-03-26", description: "Folha de Pagamento - Março", category: "Folha", type: "despesa", amount: 280000, status: "concluído" },
  { id: "TXN005", date: "2025-03-26", description: "Licenças de Software", category: "TI", type: "despesa", amount: 15800, status: "concluído" },
  { id: "TXN006", date: "2025-03-25", description: "Faturamento Cliente Gamma Ltd", category: "Vendas", type: "receita", amount: 63000, status: "concluído" },
  { id: "TXN007", date: "2025-03-25", description: "Aluguel Escritório Central", category: "Infraestrutura", type: "despesa", amount: 35000, status: "concluído" },
  { id: "TXN008", date: "2025-03-24", description: "Campanha Google Ads", category: "Marketing", type: "despesa", amount: 22000, status: "pendente" },
  { id: "TXN009", date: "2025-03-24", description: "Consultoria Jurídica", category: "Administrativo", type: "despesa", amount: 18500, status: "concluído" },
  { id: "TXN010", date: "2025-03-23", description: "Faturamento Cliente Delta Inc", category: "Vendas", type: "receita", amount: 142000, status: "concluído" },
];

export const expenseBreakdown = [
  { name: "Folha", value: 43, fill: "hsl(152, 60%, 48%)" },
  { name: "Marketing", value: 14, fill: "hsl(40, 90%, 58%)" },
  { name: "Infraestrutura", value: 9, fill: "hsl(210, 80%, 55%)" },
  { name: "P&D", value: 16, fill: "hsl(280, 60%, 55%)" },
  { name: "Admin", value: 7, fill: "hsl(0, 72%, 55%)" },
  { name: "Comercial", value: 11, fill: "hsl(180, 60%, 45%)" },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}
