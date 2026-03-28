import { DashboardLayout } from "@/components/DashboardLayout";
import { BudgetTable } from "@/components/BudgetTable";

const Budget = () => (
  <DashboardLayout title="Orçamento" subtitle="Controle orçamentário detalhado">
    <div className="max-w-3xl">
      <BudgetTable />
    </div>
  </DashboardLayout>
);

export default Budget;
