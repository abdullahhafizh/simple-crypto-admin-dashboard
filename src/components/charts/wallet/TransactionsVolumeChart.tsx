import { useEffect, useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
  useTransactionsVolume,
  type RangeKey,
  type TxTypeFilter,
} from "../../../hooks/useReporting";
import { formatAmount } from "../../../lib/formatters";
import ChartSkeleton from "../common/ChartSkeleton";
import { useToast } from "../../common/ToastProvider";

export default function TransactionsVolumeChart() {
  const {
    hasToken,
    data: points,
    loading,
    error,
    range,
    setRange,
    typeFilter,
    setTypeFilter,
  } = useTransactionsVolume();

  const { showToast } = useToast();

  useEffect(() => {
    if (!error) return;
    const message = error.trim();
    if (!message) return;
    showToast(message, "error");
  }, [error, showToast]);

  const categories = useMemo(
    () => points.map((p) => p.date),
    [points],
  );

  const series = useMemo(
    () => [
      {
        name: "Total volume",
        data: points.map((p) => p.totalAmount),
      },
    ],
    [points],
  );

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        height: 260,
        toolbar: {
          show: false,
        },
        fontFamily: "Outfit, sans-serif",
      },
      colors: ["#465FFF"],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
        width: 2,
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.4,
          opacityTo: 0,
        },
      },
      grid: {
        xaxis: {
          lines: { show: false },
        },
        yaxis: {
          lines: { show: true },
        },
      },
      xaxis: {
        type: "category",
        categories,
        labels: {
          rotate: -45,
          style: {
            fontSize: "10px",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val) =>
            typeof val === "number" ? formatAmount(val) : String(val),
          style: {
            fontSize: "12px",
          },
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => formatAmount(val),
        },
      },
    }),
    [categories],
  );

  if (!hasToken) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        Sign in to see transactions volume.
      </div>
    );
  }

  const ranges: { key: RangeKey; label: string }[] = [
    { key: "7d", label: "7D" },
    { key: "30d", label: "30D" },
    { key: "all", label: "All" },
  ];

  const types: { key: TxTypeFilter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "DEBIT", label: "Debit" },
    { key: "CREDIT", label: "Credit" },
  ];

  const isEmpty = points.length === 0;

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
        No transactions found for this range.
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
          <Chart options={options} series={series} type="area" height={260} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div className="flex flex-col items-stretch gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {ranges.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`px-3 py-2 text-xs font-medium rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {types.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md hover:text-gray-900 dark:hover:text-white ${
                  typeFilter === key
                    ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {body}
    </div>
  );
}
