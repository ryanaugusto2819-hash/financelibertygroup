import { DashboardLayout } from "@/components/DashboardLayout";
import { TransactionsTable } from "@/components/TransactionsTable";

const Transactions = () => (
  <DashboardLayout title="Transações" subtitle="Histórico completo de movimentações">
    <TransactionsTable />
  </DashboardLayout>
);

export default Transactions;
