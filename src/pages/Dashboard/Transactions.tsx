import AdminPageShell from "../../components/layout/AdminPageShell";
import TransactionsTable from "../../components/tables/Transactions/TransactionsTable";

export default function Transactions() {
  return (
    <AdminPageShell
      metaTitle="Transactions | Insignia Admin"
      metaDescription="List of wallet transactions for the Insignia admin dashboard."
      pageTitle="Transactions"
      showBreadcrumb
      useCard={false}
    >
      <TransactionsTable />
    </AdminPageShell>
  );
}
