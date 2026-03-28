import { DashboardLayout } from "@/components/DashboardLayout";
import { RevenueExpenseChart } from "@/components/RevenueExpenseChart";
import { ExpensePieChart } from "@/components/ExpensePieChart";

const Reports = () => (
  <DashboardLayout title="Relatórios" subtitle="Análises e indicadores financeiros">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RevenueExpenseChart />
      <ExpensePieChart />
    </div>
  </DashboardLayout>
);

export default Reports;
