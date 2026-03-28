import { DashboardLayout } from "@/components/DashboardLayout";
import { CashFlowChart } from "@/components/CashFlowChart";

const CashFlow = () => (
  <DashboardLayout title="Fluxo de Caixa" subtitle="Análise de entradas e saídas">
    <CashFlowChart />
  </DashboardLayout>
);

export default CashFlow;
