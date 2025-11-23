import PageMeta from "../../components/common/PageMeta";

export default function Transactions() {
  return (
    <>
      <PageMeta
        title="Transactions | Insignia Admin"
        description="List of wallet transactions for the Insignia admin dashboard."
      />
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Transactions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Transactions table and filters will be implemented in later phases.
        </p>
      </div>
    </>
  );
}
