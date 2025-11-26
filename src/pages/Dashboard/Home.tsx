import AdminPageShell from "../../components/layout/AdminPageShell";
import ComponentCard from "../../components/common/ComponentCard";
import TopTransactionsPerUserChart from "../../components/charts/wallet/TopTransactionsPerUserChart";
import TopUsersChart from "../../components/charts/wallet/TopUsersChart";
import TransactionsVolumeChart from "../../components/charts/wallet/TransactionsVolumeChart";

export default function Home() {
  return (
    <AdminPageShell
      metaTitle="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
      metaDescription="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      pageTitle="Dashboard"
      showBreadcrumb={false}
      useCard={false}
    >
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <ComponentCard title="Transactions Volume">
            <TransactionsVolumeChart />
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <ComponentCard title="Top Transactions Per User">
            <TopTransactionsPerUserChart />
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <ComponentCard title="Top Users by Outbound Value">
            <TopUsersChart />
          </ComponentCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
