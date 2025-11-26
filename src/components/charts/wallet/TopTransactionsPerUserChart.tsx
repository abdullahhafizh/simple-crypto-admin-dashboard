import { useEffect, useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
  useTopTransactionsPerUser,
  type RangeKey,
} from "../../../hooks/useReporting";
import { formatAmount } from "../../../lib/formatters";
import ChartSkeleton from "../common/ChartSkeleton";
import { useToast } from "../../common/ToastProvider";

export default function TopTransactionsPerUserChart() {
  const { hasToken, data, loading, error, range, setRange } =
    useTopTransactionsPerUser();

  const { showToast } = useToast();

  useEffect(() => {
    if (!error) return;
    const message = error.trim();
    if (!message) return;
    showToast(message, "error");
  }, [error, showToast]);

  const categories = useMemo(
    () => data.map((item) => item.username),
    [data],
  );

  const series = useMemo(
    () => [
      {
        name: "Amount",
        data: data.map((item) => item.amount),
      },
    ],
    [data],
  );

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 260,
      toolbar: {
        show: false,
      },
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "60%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
      labels: {
        formatter: (val) => {
          const num = Number(val);
          if (!Number.isFinite(num)) {
            return String(val);
          }
          const normalized = Math.abs(num) < 1e-6 ? 0 : num;
          return formatAmount(normalized);
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString("en-US"),
      },
    },
    colors: ["#465FFF"],
  };

  if (!hasToken) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        Sign in to see your top transactions.
      </div>
    );
  }

  const isEmpty = data.length === 0;
  const ranges: { key: RangeKey; label: string }[] = [
    { key: "7d", label: "7D" },
    { key: "30d", label: "30D" },
    { key: "all", label: "All" },
  ];

  let body;
  if (loading && isEmpty) {
    body = <ChartSkeleton opacityClass="opacity-60" />;
  } else if (error && isEmpty) {
    body = (
      <div className="flex items-center justify-center h-64 text-sm text-error-500">
        {error}
      </div>
    );
  } else if (isEmpty) {
    body = (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transactions found yet.
      </div>
    );
  } else {
    body = (
      <div className="relative min-w-[400px] h-64">
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            loading ? "opacity-100" : "opacity-0"
          }`}
        >
          <ChartSkeleton
            minWidthClass="w-full"
            opacityClass="opacity-60"
          />
        </div>
        <div className="h-full">
          <Chart options={options} series={series} type="bar" height={260} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div className="flex items-center justify-end mb-3">
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          {ranges.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${
                range === key
                  ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {body}
    </div>
  );
}

