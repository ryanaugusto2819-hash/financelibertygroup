import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { RevenueExpenseChart } from "@/components/RevenueExpenseChart";
import { CashFlowChart } from "@/components/CashFlowChart";
import { BudgetTable } from "@/components/BudgetTable";
import { TransactionsTable } from "@/components/TransactionsTable";
import { ExpensePieChart } from "@/components/ExpensePieChart";
import { kpis } from "@/lib/financial-data";

const Index = () => {
  return (
    <DashboardLayout title="Dashboard Financeiro" subtitle="Visão executiva — Março 2025">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} kpi={kpi} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RevenueExpenseChart />
        <CashFlowChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TransactionsTable limit={5} />
        </div>
        <div className="space-y-4">
          <ExpensePieChart />
          <BudgetTable />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
