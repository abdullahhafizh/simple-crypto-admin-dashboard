import { useMemo } from "react";
import { API_ENDPOINTS } from "../../../lib/apiEndpoints";
import { formatAmount, formatDateTime } from "../../../lib/formatters";
import ServerDataTable, {
  ServerDataTableColumn,
} from "../ServerDataTable";

export type TransactionRow = {
  id: string;
  createdAt: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  from_username: string | null;
  to_username: string;
};

export default function TransactionsTable() {
  const columns: ServerDataTableColumn<TransactionRow>[] = useMemo(
    () => [
      {
        id: "createdAt",
        header: "Date / Time",
        sortable: true,
        filterConfigHeader: {
          kind: "date-range",
          fromQueryKey: "dateFrom",
          toQueryKey: "dateTo",
        },
        filterConfigFooter: {
          kind: "date-range",
          fromQueryKey: "dateFrom",
          toQueryKey: "dateTo",
        },
        renderCell: (row) =>
          formatDateTime((row as TransactionRow).createdAt),
      },
      {
        id: "from",
        header: "From",
        sortable: true,
        filterConfigHeader: {
          kind: "text",
          placeholder: "From username",
          queryKey: "from",
        },
        filterConfigFooter: {
          kind: "text",
          placeholder: "From username",
          queryKey: "from",
        },
        renderCell: (row) => (row as TransactionRow).from_username ?? "-",
      },
      {
        id: "to",
        header: "To",
        sortable: true,
        filterConfigHeader: {
          kind: "text",
          placeholder: "To username",
          queryKey: "to",
        },
        filterConfigFooter: {
          kind: "text",
          placeholder: "To username",
          queryKey: "to",
        },
        renderCell: (row) => (row as TransactionRow).to_username,
      },
      {
        id: "type",
        header: "Type",
        sortable: true,
        filterConfigHeader: {
          kind: "select",
          options: [
            { label: "All", value: "" },
            { label: "DEBIT", value: "DEBIT" },
            { label: "CREDIT", value: "CREDIT" },
          ],
          queryKey: "type",
        },
        filterConfigFooter: {
          kind: "select",
          options: [
            { label: "All", value: "" },
            { label: "DEBIT", value: "DEBIT" },
            { label: "CREDIT", value: "CREDIT" },
          ],
          queryKey: "type",
        },
        renderCell: (row) => (row as TransactionRow).type,
      },
      {
        id: "amount",
        header: "Amount",
        align: "right",
        sortable: true,
        filterConfigHeader: {
          kind: "number-range",
          minPlaceholder: "Min",
          maxPlaceholder: "Max",
          minQueryKey: "minAmount",
          maxQueryKey: "maxAmount",
        },
        filterConfigFooter: {
          kind: "number-range",
          minPlaceholder: "Min",
          maxPlaceholder: "Max",
          minQueryKey: "minAmount",
          maxQueryKey: "maxAmount",
        },
        renderCell: (row) => {
          const tx = row as TransactionRow;
          const formatted = formatAmount(tx.amount);
          const display =
            tx.type === "DEBIT" ? `Rp-${formatted}` : `Rp${formatted}`;
          const colorClass =
            tx.type === "DEBIT"
              ? "text-error-600 dark:text-error-500"
              : "text-success-600 dark:text-success-500";

          return <span className={colorClass}>{display}</span>;
        },
      },
    ],
    [],
  );

  return (
    <ServerDataTable<TransactionRow>
      columns={columns}
      endpoint={API_ENDPOINTS.transactions}
      getRowKey={(row) => row.id}
      pageSizeInitial={10}
      emptyMessage="No transactions found."
    />
  );
}
