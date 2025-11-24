import { useCallback, useEffect, useMemo, useState } from "react";
import DataTableShell, {
  DataTableColumn,
  DataTableFilterConfig,
  DataTableFilterConfigDefinition,
  getDataTablePaging,
  useDebouncedSearch,
  useServerDataTable,
} from "./DataTableShell";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/httpClient";

export type ServerDataTableColumn<TData = unknown> = Omit<
  DataTableColumn<TData>,
  "filterConfigHeader" | "filterConfigFooter"
> & {
  filterConfigHeader?: DataTableFilterConfigDefinition;
  filterConfigFooter?: DataTableFilterConfigDefinition;
};

export interface ServerDataTableProps<TData = unknown> {
  columns: ServerDataTableColumn<TData>[];
  endpoint: string;
  token?: string | null;
  getRowKey?: (row: TData, index: number) => string | number;
  pageSizeInitial?: number;
  pageSizeOptions?: number[];
  searchMinLength?: number;
  searchDelayMs?: number;
  emptyMessage?: string;
  mapErrorMessage?: (err: unknown) => string | null;
  onResetFilters?: () => void;
  deps?: readonly unknown[];
}

function getFilterStateFromColumns<TData>(
  columns: DataTableColumn<TData>[],
): {
  extraFilters: Record<string, string | number | null | undefined>;
  filterDeps: unknown[];
} {
  const extraFilters: Record<string, string | number | null | undefined> = {};
  const filterDeps: unknown[] = [];

  const getConfigForColumn = (
    column: DataTableColumn<TData>,
  ): DataTableFilterConfig | undefined => {
    return column.filterConfigHeader ?? column.filterConfigFooter;
  };

  for (const column of columns) {
    const config = getConfigForColumn(column);
    if (!config) continue;

    if (config.kind === "text" || config.kind === "select") {
      const key = config.queryKey ?? column.id;
      const rawValue = config.getValue();
      filterDeps.push(rawValue);
      const trimmed = rawValue.trim();
      if (trimmed) {
        extraFilters[key] = trimmed;
      }
      continue;
    }

    if (config.kind === "number-range") {
      const minKey = config.minQueryKey;
      const maxKey = config.maxQueryKey;

      const rawMin = config.getMin();
      filterDeps.push(rawMin);
      const trimmedMin = rawMin.trim();
      if (minKey && trimmedMin) {
        extraFilters[minKey] = trimmedMin;
      }

      const rawMax = config.getMax();
      filterDeps.push(rawMax);
      const trimmedMax = rawMax.trim();
      if (maxKey && trimmedMax) {
        extraFilters[maxKey] = trimmedMax;
      }
      continue;
    }

    if (config.kind === "date-range") {
      const fromKey = config.fromQueryKey;
      const toKey = config.toQueryKey;

      const rawFrom = config.getFrom();
      filterDeps.push(rawFrom);
      const trimmedFrom = rawFrom.trim();
      if (fromKey && trimmedFrom) {
        extraFilters[fromKey] = trimmedFrom;
      }

      const rawTo = config.getTo();
      filterDeps.push(rawTo);
      const trimmedTo = rawTo.trim();
      if (toKey && trimmedTo) {
        extraFilters[toKey] = trimmedTo;
      }
      continue;
    }
  }

  return { extraFilters, filterDeps };
}

export default function ServerDataTable<TData = unknown>({
  columns,
  endpoint,
  token,
  getRowKey,
  pageSizeInitial = 10,
  pageSizeOptions,
  searchMinLength = 3,
  searchDelayMs = 2500,
  emptyMessage = "No records found.",
  mapErrorMessage,
  onResetFilters,
  deps,
}: ServerDataTableProps<TData>) {
  const [sortColumn, setSortColumn] = useState(0);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterState, setFilterState] = useState<Record<string, string>>({});

  const { token: authToken } = useAuth();
  const effectiveToken = token ?? authToken;

  const defaultMapErrorMessage = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        return "Your session has expired. Please sign in again.";
      }
      return "Failed to load data from server.";
    }
    return "An unexpected error occurred while loading data.";
  }, []);

  const effectiveMapErrorMessage = mapErrorMessage ?? defaultMapErrorMessage;

  const {
    search,
    pendingSearch,
    setPendingSearch,
    reset: resetSearch,
  } = useDebouncedSearch({
    minLength: searchMinLength,
    delayMs: searchDelayMs,
    onCommit: () => setPageIndex(0),
  });

  const columnsWithState: DataTableColumn<TData>[] = useMemo(
    () =>
      columns.map((column) => {
        const buildConfig = (
          config: DataTableFilterConfigDefinition | undefined,
        ): DataTableFilterConfig | undefined => {
          if (!config) return undefined;

          if (config.kind === "text") {
            const key = config.queryKey ?? column.id;
            return {
              kind: "text",
              placeholder: config.placeholder,
              queryKey: config.queryKey,
              getValue: () => filterState[key] ?? "",
              setValue: (value: string) => {
                setFilterState((prev) => ({ ...prev, [key]: value }));
              },
            };
          }

          if (config.kind === "select") {
            const key = config.queryKey ?? column.id;
            return {
              kind: "select",
              options: config.options,
              queryKey: config.queryKey,
              getValue: () => filterState[key] ?? "",
              setValue: (value: string) => {
                setFilterState((prev) => ({ ...prev, [key]: value }));
              },
            };
          }

          if (config.kind === "number-range") {
            const minKey = config.minQueryKey ?? `${column.id}:min`;
            const maxKey = config.maxQueryKey ?? `${column.id}:max`;
            return {
              kind: "number-range",
              minPlaceholder: config.minPlaceholder,
              maxPlaceholder: config.maxPlaceholder,
              minQueryKey: config.minQueryKey,
              maxQueryKey: config.maxQueryKey,
              getMin: () => filterState[minKey] ?? "",
              setMin: (value: string) => {
                setFilterState((prev) => ({ ...prev, [minKey]: value }));
              },
              getMax: () => filterState[maxKey] ?? "",
              setMax: (value: string) => {
                setFilterState((prev) => ({ ...prev, [maxKey]: value }));
              },
            };
          }

          if (config.kind === "date-range") {
            const fromKey = config.fromQueryKey ?? `${column.id}:from`;
            const toKey = config.toQueryKey ?? `${column.id}:to`;
            return {
              kind: "date-range",
              fromQueryKey: config.fromQueryKey,
              toQueryKey: config.toQueryKey,
              getFrom: () => filterState[fromKey] ?? "",
              setFrom: (value: string) => {
                setFilterState((prev) => ({ ...prev, [fromKey]: value }));
              },
              getTo: () => filterState[toKey] ?? "",
              setTo: (value: string) => {
                setFilterState((prev) => ({ ...prev, [toKey]: value }));
              },
            };
          }

          return undefined;
        };

        return {
          ...column,
          filterConfigHeader: buildConfig(column.filterConfigHeader),
          filterConfigFooter: buildConfig(column.filterConfigFooter),
        };
      }),
    [columns, filterState],
  );

  const { extraFilters, filterDeps } = useMemo(
    () => getFilterStateFromColumns(columnsWithState),
    [columnsWithState],
  );

  const buildQueryOptions = useCallback(
    ({ pageIndex: qPageIndex, pageSize: qPageSize }) => ({
      start: qPageIndex * qPageSize,
      length: qPageSize,
      search,
      sortColumn,
      sortDir,
      extraFilters,
    }),
    [search, sortColumn, sortDir, extraFilters],
  );

  const userDeps = deps ?? [];
  const mergedDeps = [search, sortColumn, sortDir, ...filterDeps, ...userDeps];

  const {
    data,
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
    recordsTotal,
    recordsFiltered,
    loading,
    error,
  } = useServerDataTable<TData>({
    endpoint,
    token: effectiveToken,
    pageSizeInitial,
    buildQueryOptions,
    deps: mergedDeps,
    mapErrorMessage: effectiveMapErrorMessage,
  });

  useEffect(() => {
    const hasDeps = filterDeps.length > 0 || userDeps.length > 0;
    if (!hasDeps) return;
    setPageIndex(0);
  }, [setPageIndex, ...filterDeps, ...userDeps]);

  const {
    currentFrom,
    currentTo,
    totalForDisplay,
    totalPages,
    currentPage,
    goToPage,
  } = getDataTablePaging({
    pageIndex,
    pageSize,
    recordsTotal,
    recordsFiltered,
    onPageIndexChange: setPageIndex,
  });

  const handleSort = (columnIndex: number) => {
    setPageIndex(0);
    setSortColumn((prevCol) => {
      if (prevCol === columnIndex) {
        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevCol;
      }
      setSortDir("asc");
      return columnIndex;
    });
  };

  const handleResetFilters = () => {
    setPageIndex(0);
    resetSearch();
    setFilterState((prev) => {
      if (!prev || Object.keys(prev).length === 0) {
        return prev;
      }

      const next: Record<string, string> = {};
      for (const key of Object.keys(prev)) {
        next[key] = "";
      }
      return next;
    });
    if (onResetFilters) {
      onResetFilters();
    }
  };

  const enhancedColumns: DataTableColumn<TData>[] = useMemo(
    () =>
      columnsWithState.map((column, index) => {
        if (!column.sortable) {
          return column;
        }

        const isCurrent = index === sortColumn;

        return {
          ...column,
          sortDirection: isCurrent ? sortDir : null,
          onSort: () => handleSort(index),
        };
      }),
    [columnsWithState, sortColumn, sortDir],
  );

  return (
    <DataTableShell<TData>
      columns={enhancedColumns}
      data={data}
      getRowKey={getRowKey}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={(nextSize) => {
        setPageSize(nextSize);
        setPageIndex(0);
      }}
      searchValue={pendingSearch}
      onSearchChange={setPendingSearch}
      onResetFilters={handleResetFilters}
      currentFrom={currentFrom}
      currentTo={currentTo}
      total={totalForDisplay}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={goToPage}
    />
  );
}
