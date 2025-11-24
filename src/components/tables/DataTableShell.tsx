import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "../ui/table";
import { apiRequest, ApiError } from "../../lib/httpClient";

type PageItem =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

type DataTableColumnAlign = "left" | "center" | "right";

export type DataTableFilterKind =
  | "text"
  | "select"
  | "number-range"
  | "date-range";

export type DataTableFilterConfigDefinition =
  | {
      kind: "text";
      placeholder?: string;
      queryKey?: string;
    }
  | {
      kind: "select";
      options: { label: ReactNode; value: string }[];
      queryKey?: string;
    }
  | {
      kind: "number-range";
      minPlaceholder?: string;
      maxPlaceholder?: string;
      minQueryKey?: string;
      maxQueryKey?: string;
    }
  | {
      kind: "date-range";
      fromQueryKey?: string;
      toQueryKey?: string;
    };

export type DataTableFilterConfig =
  | {
      kind: "text";
      getValue: () => string;
      setValue: (value: string) => void;
      placeholder?: string;
      queryKey?: string;
    }
  | {
      kind: "select";
      getValue: () => string;
      setValue: (value: string) => void;
      options: { label: ReactNode; value: string }[];
      queryKey?: string;
    }
  | {
      kind: "number-range";
      getMin: () => string;
      setMin: (value: string) => void;
      getMax: () => string;
      setMax: (value: string) => void;
      minPlaceholder?: string;
      maxPlaceholder?: string;
      minQueryKey?: string;
      maxQueryKey?: string;
    }
  | {
      kind: "date-range";
      getFrom: () => string;
      setFrom: (value: string) => void;
      getTo: () => string;
      setTo: (value: string) => void;
      fromQueryKey?: string;
      toQueryKey?: string;
    };

export interface DataTableColumn<TData = unknown> {
  id: string;
  header: ReactNode;
  align?: DataTableColumnAlign;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  headerFilter?: ReactNode;
  footerLabel?: ReactNode;
  footerFilter?: ReactNode;
  filterConfigHeader?: DataTableFilterConfig;
  filterConfigFooter?: DataTableFilterConfig;
  renderCell: (row: TData) => ReactNode;
}

export interface DataTableShellProps<TData = unknown> {
  // Dynamic table definitions
  columns?: DataTableColumn<TData>[];
  data?: TData[];
  getRowKey?: (row: TData, index: number) => string | number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;

  // Fallback: allow direct children markup for advanced/custom use cases
  children?: ReactNode;

  // Shared toolbar + pagination props
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange: (size: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onResetFilters?: () => void;
  currentFrom: number;
  currentTo: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface DebouncedSearchOptions {
  initialValue?: string;
  minLength?: number;
  delayMs?: number;
  onCommit?: (value: string) => void;
}

export function useDebouncedSearch({
  initialValue = "",
  minLength = 3,
  delayMs = 2500,
  onCommit,
}: DebouncedSearchOptions = {}) {
  const [search, setSearch] = useState(initialValue);
  const [pendingSearch, setPendingSearch] = useState(initialValue);

  useEffect(() => {
    const value = pendingSearch;
    const trimmed = value.trim();

    if (trimmed.length >= minLength || trimmed.length === 0) {
      setSearch(trimmed);
      onCommit?.(trimmed);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearch(trimmed);
      onCommit?.(trimmed);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingSearch, minLength, delayMs, onCommit]);

  const reset = () => {
    setSearch("");
    setPendingSearch("");
    onCommit?.("");
  };

  return { search, pendingSearch, setPendingSearch, reset } as const;
}

export interface DataTablePagingArgs {
  pageIndex: number;
  pageSize: number;
  recordsTotal: number;
  recordsFiltered: number;
  onPageIndexChange: (index: number) => void;
}

export interface DataTablePagingInfo {
  currentFrom: number;
  currentTo: number;
  totalForDisplay: number;
  totalPages: number;
  currentPage: number;
  goToPage: (page: number) => void;
}

export function getDataTablePaging({
  pageIndex,
  pageSize,
  recordsTotal,
  recordsFiltered,
  onPageIndexChange,
}: DataTablePagingArgs): DataTablePagingInfo {
  const totalForDisplay = recordsFiltered || recordsTotal;

  const totalPages =
    pageSize > 0 ? Math.max(1, Math.ceil(totalForDisplay / pageSize)) : 1;

  const currentPage = pageIndex + 1;
  const start = pageIndex * pageSize;
  const currentFrom = totalForDisplay === 0 ? 0 : start + 1;
  const currentTo = Math.min(start + pageSize, totalForDisplay);

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    onPageIndexChange(next - 1);
  };

  return {
    currentFrom,
    currentTo,
    totalForDisplay,
    totalPages,
    currentPage,
    goToPage,
  };
}

export interface DataTablesQueryOptions {
  start: number;
  length: number;
  search?: string;
  sortColumn: number;
  sortDir: "asc" | "desc";
  extraFilters?: Record<string, string | number | null | undefined>;
}

export function buildDataTablesQueryParams({
  start,
  length,
  search,
  sortColumn,
  sortDir,
  extraFilters,
}: DataTablesQueryOptions): URLSearchParams {
  const params = new URLSearchParams();

  params.set("draw", "1");
  params.set("start", String(start));
  params.set("length", String(length));

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    params.set("search[value]", trimmedSearch);
  }

  if (extraFilters) {
    for (const [key, value] of Object.entries(extraFilters)) {
      if (value === null || value === undefined) continue;
      const str = String(value).trim();
      if (!str) continue;
      params.set(key, str);
    }
  }

  params.set("order[0][column]", String(sortColumn));
  params.set("order[0][dir]", sortDir);

  return params;
}

export interface DataTablesApiResponse<TData> {
  data?: TData[];
  recordsTotal?: number;
  recordsFiltered?: number;
}

export interface UseServerDataTableOptions<TData> {
  endpoint: string;
  token?: string | null;
  pageSizeInitial?: number;
  buildQueryOptions: (ctx: {
    pageIndex: number;
    pageSize: number;
  }) => DataTablesQueryOptions;
  deps?: readonly unknown[];
  mapErrorMessage?: (err: unknown) => string | null;
}

export interface UseServerDataTableResult<TData> {
  data: TData[];
  pageSize: number;
  setPageSize: (size: number) => void;
  pageIndex: number;
  setPageIndex: (index: number) => void;
  recordsTotal: number;
  recordsFiltered: number;
  loading: boolean;
  error: string | null;
}

export function useServerDataTable<TData>(
  options: UseServerDataTableOptions<TData>,
): UseServerDataTableResult<TData> {
  const {
    endpoint,
    token,
    pageSizeInitial = 10,
    buildQueryOptions,
    deps = [],
    mapErrorMessage,
  } = options;

  const [pageSize, setPageSize] = useState(pageSizeInitial);
  const [pageIndex, setPageIndex] = useState(0);
  const [data, setData] = useState<TData[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsFiltered, setRecordsFiltered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const queryOptions = buildQueryOptions({ pageIndex, pageSize });
      const params = buildDataTablesQueryParams(queryOptions);

      try {
        const response = await apiRequest<DataTablesApiResponse<TData>>({
          path: `${endpoint}?${params.toString()}`,
          method: "GET",
          token: token ?? undefined,
          headers: {
            Accept: "application/json",
          },
        });

        setData(response.data ?? []);
        setRecordsTotal(response.recordsTotal ?? 0);
        setRecordsFiltered(response.recordsFiltered ?? 0);
      } catch (err) {
        const message = mapErrorMessage
          ? mapErrorMessage(err)
          : err instanceof ApiError
          ? "Failed to load data from server."
          : "An unexpected error occurred while loading data.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();

    return () => {
      controller.abort();
    };
  }, [endpoint, token, pageIndex, pageSize, buildQueryOptions, mapErrorMessage, ...deps]);

  return {
    data,
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
    recordsTotal,
    recordsFiltered,
    loading,
    error,
  };
}

export function renderColumnFilter(
  config: DataTableFilterConfig | undefined,
  loading: boolean,
) {
  if (!config) return null;

  if (config.kind === "text") {
    return (
      <input
        type="text"
        className="h-8 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        placeholder={config.placeholder}
        value={config.getValue()}
        onChange={(event) => config.setValue(event.target.value)}
      />
    );
  }

  if (config.kind === "select") {
    return (
      <select
        className="h-8 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-xs text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
        value={config.getValue()}
        onChange={(event) => config.setValue(event.target.value)}
      >
        {config.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (config.kind === "number-range") {
    return (
      <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
        <input
          type="number"
          className="h-8 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:w-24"
          placeholder={config.minPlaceholder ?? "Min"}
          value={config.getMin()}
          onChange={(event) => config.setMin(event.target.value)}
        />
        <input
          type="number"
          className="h-8 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:w-24"
          placeholder={config.maxPlaceholder ?? "Max"}
          value={config.getMax()}
          onChange={(event) => config.setMax(event.target.value)}
        />
      </div>
    );
  }

  if (config.kind === "date-range") {
    return (
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <input
          type="date"
          className="h-8 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          value={config.getFrom()}
          onChange={(event) => config.setFrom(event.target.value)}
        />
        <input
          type="date"
          className="h-8 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          value={config.getTo()}
          onChange={(event) => config.setTo(event.target.value)}
        />
      </div>
    );
  }

  return null;
}

export default function DataTableShell<TData = unknown>({
  columns,
  data,
  getRowKey,
  loading = false,
  error,
  emptyMessage = "No records found.",
  children,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  onResetFilters,
  currentFrom,
  currentTo,
  total,
  currentPage,
  totalPages,
  onPageChange,
}: DataTableShellProps<TData>) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const pageSizes =
    pageSizeOptions && pageSizeOptions.length > 0
      ? pageSizeOptions
      : [10, 25, 50, 100];

  const safeTotalPages = totalPages > 0 ? totalPages : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);

  const canPrev = safeCurrentPage > 1;
  const canNext = safeCurrentPage < safeTotalPages;

  const pageItems = useMemo<PageItem[]>(() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, index) => ({
        type: "page" as const,
        page: index + 1,
      }));
    }

    const items: PageItem[] = [];

    const addPage = (page: number) => {
      items.push({ type: "page", page });
    };

    const addEllipsis = (key: string) => {
      items.push({ type: "ellipsis", key });
    };

    if (safeCurrentPage <= 4) {
      for (let page = 1; page <= 5; page++) {
        addPage(page);
      }
      addEllipsis("end");
      addPage(safeTotalPages);
    } else if (safeCurrentPage >= safeTotalPages - 3) {
      addPage(1);
      addEllipsis("start");
      for (let page = safeTotalPages - 4; page <= safeTotalPages; page++) {
        addPage(page);
      }
    } else {
      addPage(1);
      addEllipsis("start");
      for (let page = safeCurrentPage - 1; page <= safeCurrentPage + 1; page++) {
        addPage(page);
      }
      addEllipsis("end");
      addPage(safeTotalPages);
    }

    return items;
  }, [safeCurrentPage, safeTotalPages]);

  const handleFirst = () => {
    if (!canPrev) return;
    onPageChange(1);
  };

  const handlePrev = () => {
    if (!canPrev) return;
    onPageChange(safeCurrentPage - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    onPageChange(safeCurrentPage + 1);
  };

  const handleLast = () => {
    if (!canNext) return;
    onPageChange(safeTotalPages);
  };

  const handlePageClick = (page: number) => {
    if (page === safeCurrentPage) return;
    onPageChange(page);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 p-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.05]">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>Show</span>
          <div className="relative z-20 bg-transparent">
            <select
              className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={pageSize}
              onChange={(event) => {
                const nextSize = Number(event.target.value) || pageSizes[0];
                onPageSizeChange(nextSize);
              }}
            >
              {pageSizes.map((size) => (
                <option
                  key={size}
                  value={size}
                  className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                >
                  {size}
                </option>
              ))}
            </select>
            <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
              <svg
                className="stroke-current"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none left-3 top-1/2 dark:text-gray-400">
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.042 9.374C3.042 5.877 5.877 3.042 9.375 3.042C12.873 3.042 15.708 5.877 15.708 9.374C15.708 12.87 12.873 15.705 9.375 15.705C5.877 15.705 3.042 12.87 3.042 9.374ZM9.375 1.542C5.049 1.542 1.542 5.048 1.542 9.374C1.542 13.699 5.049 17.205 9.375 17.205C11.268 17.205 13.003 16.534 14.357 15.418L17.177 18.238C17.47 18.531 17.945 18.531 18.238 18.238C18.531 17.945 18.531 17.47 18.238 17.177L15.418 14.357C16.537 13.003 17.209 11.267 17.209 9.374C17.209 5.048 13.701 1.542 9.375 1.542Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              type="text"
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[260px]"
              placeholder="Search..."
              value={searchValue}
              ref={searchInputRef}
              onChange={(event) =>
                onSearchChange((event.target as HTMLInputElement).value)
              }
              onKeyUp={(event) =>
                onSearchChange((event.target as HTMLInputElement).value)
              }
            />
            {onResetFilters && searchValue.trim().length > 0 && (
              <button
                type="button"
                aria-label="Reset filters"
                onClick={() => {
                  onSearchChange("");
                  onResetFilters();
                  searchInputRef.current?.focus();
                }}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-500 dark:text-gray-400"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current"
                >
                  <path
                    d="M6 6L14 14M14 6L6 14"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        {columns && data ? (
          <Table>
            {/* Main header row */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {columns.map((column) => {
                  const alignClass =
                    column.align === "right"
                      ? "text-end"
                      : column.align === "center"
                      ? "text-center"
                      : "";

                  const isSortable = column.sortable && column.onSort;

                  return (
                    <TableCell
                      key={column.id}
                      isHeader
                      className={`px-5 py-3 text-theme-xs ${alignClass}`}
                    >
                      {isSortable ? (
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={column.onSort}
                        >
                          <p className="font-medium text-gray-500 dark:text-gray-400">
                            {column.header}
                          </p>
                          <button
                            type="button"
                            aria-label="Sort column"
                            className="flex flex-col gap-0.5"
                          >
                            <svg
                              className={`text-gray-300 dark:text-gray-700 ${
                                column.sortDirection === "asc"
                                  ? "text-brand-500"
                                  : ""
                              }`}
                              width="8"
                              height="5"
                              viewBox="0 0 8 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
                                fill="currentColor"
                              />
                            </svg>
                            <svg
                              className={`text-gray-300 dark:text-gray-700 ${
                                column.sortDirection === "desc"
                                  ? "text-brand-500"
                                  : ""
                              }`}
                              width="8"
                              height="5"
                              viewBox="0 0 8 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p className="font-medium text-gray-500 dark:text-gray-400">
                          {column.header}
                        </p>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHeader>

            {/* Optional header filter row */}
            {columns.some((column) => column.headerFilter || column.filterConfigHeader) && (
              <TableHeader>
                <TableRow>
                  {columns.map((column) => {
                    const alignClass =
                      column.align === "right"
                        ? "text-end"
                        : column.align === "center"
                        ? "text-center"
                        : "";

                    const headerFilterNode =
                      column.headerFilter ??
                      renderColumnFilter(column.filterConfigHeader, loading);

                    return (
                      <TableCell
                        key={column.id}
                        className={`px-5 py-2 text-theme-xs ${alignClass}`}
                      >
                        {headerFilterNode ?? null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHeader>
            )}

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {/* Loading skeleton rows */}
              {loading &&
                Array.from({ length: pageSize }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <TableCell key={column.id} className="px-5 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {/* Error state */}
              {!loading && error && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="px-5 py-6 text-center text-sm text-error-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {/* Empty state */}
              {!loading && !error && data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {!loading &&
                !error &&
                data.map((row, rowIndex) => (
                  <TableRow
                    key={
                      getRowKey ? getRowKey(row, rowIndex) : (rowIndex as number)
                    }
                  >
                    {columns.map((column) => {
                      const alignClass =
                        column.align === "right"
                          ? "text-end"
                          : column.align === "center"
                          ? "text-center"
                          : "text-start";

                      return (
                        <TableCell
                          key={column.id}
                          className={`px-5 py-4 text-sm text-gray-700 dark:text-gray-200 ${alignClass}`}
                        >
                          {column.renderCell(row)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
            </TableBody>

            {/* Optional footer filter row */}
            {columns.some((column) => column.footerFilter || column.filterConfigFooter) && (
              <TableFooter>
                <TableRow>
                  {columns.map((column) => {
                    const alignClass =
                      column.align === "right"
                        ? "text-end"
                        : column.align === "center"
                        ? "text-center"
                        : "";

                    const footerFilterNode =
                      column.footerFilter ??
                      renderColumnFilter(column.filterConfigFooter, loading);

                    return (
                      <TableCell
                        key={column.id}
                        className={`px-5 py-2 text-theme-xs ${alignClass}`}
                      >
                        {footerFilterNode ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {column.footerLabel ?? column.header}
                            </span>
                            {footerFilterNode}
                          </div>
                        ) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        ) : (
          children
        )}
      </div>

      <div className="border-t border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
        <div className="flex flex-col gap-3 text-sm text-gray-600 xl:flex-row xl:items-center xl:justify-between dark:text-gray-400">
          <div className="pb-3 xl:pb-0">
            <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
              {total > 0 ? (
                <>
                  Showing <span className="font-medium">{currentFrom}</span> to{" "}
                  <span className="font-medium">{currentTo}</span> of{" "}
                  <span className="font-medium">{total}</span> entries
                </>
              ) : (
                <>Showing 0 entries</>
              )}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 xl:justify-end">
            <button
              type="button"
              disabled={!canPrev}
              onClick={handleFirst}
              className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              First
            </button>
            <button
              type="button"
              disabled={!canPrev}
              onClick={handlePrev}
              className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {pageItems.map((item) =>
                item.type === "ellipsis" ? (
                  <span
                    key={item.key}
                    className="px-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => handlePageClick(item.page)}
                    className={
                      item.page === safeCurrentPage
                        ? "flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500"
                        : "flex h-10 w-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
                    }
                  >
                    {item.page}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              disabled={!canNext}
              onClick={handleNext}
              className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Next
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={handleLast}
              className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
