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

// ============= Mock Data =============

export const receivables: Receivable[] = [
  { id: "REC001", client: "Alpha Corp", description: "Contrato mensal - Março", amount: 185000, dueDate: "2025-04-05", status: "a_receber", paidAmount: 0 },
  { id: "REC002", client: "Beta Systems", description: "Projeto ERP - Parcela 3/6", amount: 97000, dueDate: "2025-04-10", status: "a_receber", paidAmount: 0 },
  { id: "REC003", client: "Gamma Ltd", description: "Consultoria Q1", amount: 63000, dueDate: "2025-03-28", status: "recebido", paidAmount: 63000 },
  { id: "REC004", client: "Delta Inc", description: "Licenciamento anual", amount: 142000, dueDate: "2025-03-15", status: "atrasado", paidAmount: 0 },
  { id: "REC005", client: "Epsilon SA", description: "Manutenção - Março", amount: 54000, dueDate: "2025-04-01", status: "a_receber", paidAmount: 0 },
  { id: "REC006", client: "Zeta Tech", description: "Desenvolvimento App", amount: 230000, dueDate: "2025-04-15", status: "a_receber", paidAmount: 0 },
  { id: "REC007", client: "Omega Digital", description: "Marketing Digital", amount: 78000, dueDate: "2025-03-20", status: "parcial", paidAmount: 45000 },
  { id: "REC008", client: "Kappa Solutions", description: "Suporte Premium", amount: 35000, dueDate: "2025-04-08", status: "a_receber", paidAmount: 0 },
  { id: "REC009", client: "Lambda Corp", description: "Infraestrutura Cloud", amount: 115000, dueDate: "2025-04-20", status: "a_receber", paidAmount: 0 },
  { id: "REC010", client: "Sigma Group", description: "Treinamento Equipe", amount: 42000, dueDate: "2025-03-25", status: "recebido", paidAmount: 42000 },
];

export const expenses: Expense[] = [
  { id: "DES001", date: "2025-03-28", description: "Folha de Pagamento", category: "Pessoal", amount: 280000, type: "fixa", status: "pago" },
  { id: "DES002", date: "2025-03-28", description: "Aluguel Sede", category: "Infraestrutura", amount: 35000, type: "fixa", status: "pago" },
  { id: "DES003", date: "2025-03-28", description: "Energia Elétrica", category: "Infraestrutura", amount: 8500, type: "variavel", status: "pago" },
  { id: "DES004", date: "2025-03-28", description: "Google Ads", category: "Marketing", amount: 22000, type: "variavel", status: "pendente" },
  { id: "DES005", date: "2025-03-28", description: "Licenças Software", category: "TI", amount: 15800, type: "fixa", status: "pago" },
  { id: "DES006", date: "2025-03-27", description: "Fornecedor TechParts", category: "Fornecedores", amount: 42500, type: "variavel", status: "pago" },
  { id: "DES007", date: "2025-03-27", description: "Consultoria Jurídica", category: "Administrativo", amount: 18500, type: "extraordinaria", status: "pago" },
  { id: "DES008", date: "2025-03-26", description: "Material de Escritório", category: "Administrativo", amount: 3200, type: "variavel", status: "pago" },
  { id: "DES009", date: "2025-03-26", description: "Seguro Empresarial", category: "Seguros", amount: 12000, type: "fixa", status: "pago" },
  { id: "DES010", date: "2025-03-25", description: "Telefonia/Internet", category: "TI", amount: 4800, type: "fixa", status: "pago" },
  { id: "DES011", date: "2025-03-25", description: "Combustível Frota", category: "Logística", amount: 9500, type: "variavel", status: "pago" },
  { id: "DES012", date: "2025-03-24", description: "Manutenção Equipamentos", category: "Infraestrutura", amount: 7800, type: "extraordinaria", status: "pago" },
];

export const accountsPayable: AccountPayable[] = [
  { id: "CP001", supplier: "Imobiliária Central", description: "Aluguel Abril", amount: 35000, dueDate: "2025-04-05", status: "pendente", category: "Infraestrutura" },
  { id: "CP002", supplier: "AWS", description: "Cloud Services - Abril", amount: 28000, dueDate: "2025-04-10", status: "pendente", category: "TI" },
  { id: "CP003", supplier: "RH Total", description: "Folha Abril (est.)", amount: 285000, dueDate: "2025-04-30", status: "pendente", category: "Pessoal" },
  { id: "CP004", supplier: "Google", description: "Ads Abril", amount: 25000, dueDate: "2025-04-15", status: "pendente", category: "Marketing" },
  { id: "CP005", supplier: "Seguradora XYZ", description: "Seguro Trimestral", amount: 36000, dueDate: "2025-04-20", status: "pendente", category: "Seguros" },
  { id: "CP006", supplier: "TechParts", description: "Peças - Pedido #4521", amount: 55000, dueDate: "2025-04-12", status: "pendente", category: "Fornecedores" },
  { id: "CP007", supplier: "Contabilidade Silva", description: "Honorários Abril", amount: 8500, dueDate: "2025-04-10", status: "pendente", category: "Administrativo" },
  { id: "CP008", supplier: "Telecom Brasil", description: "Telefonia Abril", amount: 4800, dueDate: "2025-04-08", status: "pendente", category: "TI" },
];

export const scheduledRevenues: ScheduledRevenue[] = [
  { id: "RA001", client: "Alpha Corp", description: "Contrato mensal - Abril", amount: 185000, expectedDate: "2025-04-05", probability: 95 },
  { id: "RA002", client: "Beta Systems", description: "Projeto ERP - Parcela 4/6", amount: 97000, expectedDate: "2025-04-15", probability: 90 },
  { id: "RA003", client: "Epsilon SA", description: "Manutenção - Abril", amount: 54000, expectedDate: "2025-04-01", probability: 85 },
  { id: "RA004", client: "Zeta Tech", description: "Desenvolvimento App - Fase 2", amount: 150000, expectedDate: "2025-04-20", probability: 70 },
  { id: "RA005", client: "Nova Corp", description: "Proposta Consultoria", amount: 120000, expectedDate: "2025-05-01", probability: 50 },
  { id: "RA006", client: "Kappa Solutions", description: "Suporte Premium - Abril", amount: 35000, expectedDate: "2025-04-08", probability: 95 },
  { id: "RA007", client: "Lambda Corp", description: "Infra Cloud - Abril", amount: 115000, expectedDate: "2025-04-20", probability: 80 },
];

export const dailyEntries: DailyEntry[] = [
  { date: "2025-03-28", totalIn: 105000, totalOut: 361300, grossProfit: -256300 },
  { date: "2025-03-27", totalIn: 97000, totalOut: 61000, grossProfit: 36000 },
  { date: "2025-03-26", totalIn: 63000, totalOut: 15200, grossProfit: 47800 },
  { date: "2025-03-25", totalIn: 142000, totalOut: 14300, grossProfit: 127700 },
  { date: "2025-03-24", totalIn: 78000, totalOut: 7800, grossProfit: 70200 },
  { date: "2025-03-23", totalIn: 0, totalOut: 0, grossProfit: 0 },
  { date: "2025-03-22", totalIn: 0, totalOut: 0, grossProfit: 0 },
  { date: "2025-03-21", totalIn: 54000, totalOut: 32000, grossProfit: 22000 },
  { date: "2025-03-20", totalIn: 185000, totalOut: 48000, grossProfit: 137000 },
  { date: "2025-03-19", totalIn: 35000, totalOut: 22000, grossProfit: 13000 },
  { date: "2025-03-18", totalIn: 120000, totalOut: 95000, grossProfit: 25000 },
  { date: "2025-03-17", totalIn: 67000, totalOut: 28000, grossProfit: 39000 },
];

export const expenseCategories = [
  "Pessoal", "Infraestrutura", "Marketing", "TI", "Fornecedores", 
  "Administrativo", "Seguros", "Logística", "Impostos", "Outros"
];

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

export function getTotalIncomeDay(date: string): number {
  const entry = dailyEntries.find(d => d.date === date);
  return entry?.totalIn || 0;
}

export function getTotalOutDay(date: string): number {
  const entry = dailyEntries.find(d => d.date === date);
  return entry?.totalOut || 0;
}

export function getGrossProfitDay(date: string): number {
  const entry = dailyEntries.find(d => d.date === date);
  return entry?.grossProfit || 0;
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
  const currentCash = 1456200; // saldo atual
  const expectedIn = getWeightedScheduledRevenue();
  const expectedOut = getTotalAccountsPayable();
  return currentCash + expectedIn - expectedOut;
}

export function getGrossProfit(): number {
  const totalRevenue = getReceivedTotal() + receivables.filter(r => r.status === "recebido").reduce((s, r) => s + r.amount, 0);
  return totalRevenue - getTotalExpensesMonth();
}

export function getNetProfit(): number {
  const gross = getGrossProfit();
  const taxes = gross * 0.15; // estimate
  return gross - taxes;
}

// Monthly chart data
export const monthlyFlowData = [
  { month: "Out", receita: 580000, despesa: 355000, lucro: 225000 },
  { month: "Nov", receita: 610000, despesa: 370000, lucro: 240000 },
  { month: "Dez", receita: 650000, despesa: 390000, lucro: 260000 },
  { month: "Jan", receita: 520000, despesa: 340000, lucro: 180000 },
  { month: "Fev", receita: 560000, despesa: 350000, lucro: 210000 },
  { month: "Mar", receita: 624000, despesa: 459600, lucro: 164400 },
];

export const expenseByCategoryData = [
  { name: "Pessoal", value: 280000, fill: "hsl(152, 60%, 48%)" },
  { name: "Infraestrutura", value: 51300, fill: "hsl(210, 80%, 55%)" },
  { name: "Marketing", value: 22000, fill: "hsl(40, 90%, 58%)" },
  { name: "TI", value: 20600, fill: "hsl(280, 60%, 55%)" },
  { name: "Fornecedores", value: 42500, fill: "hsl(0, 72%, 55%)" },
  { name: "Administrativo", value: 21700, fill: "hsl(180, 60%, 45%)" },
  { name: "Seguros", value: 12000, fill: "hsl(30, 70%, 50%)" },
  { name: "Logística", value: 9500, fill: "hsl(320, 60%, 50%)" },
];

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
