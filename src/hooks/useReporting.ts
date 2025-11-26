import { useEffect, useState } from "react";
import { apiRequest, ApiError, mapApiErrorToMessage } from "../lib/httpClient";
import { API_ENDPOINTS } from "../lib/apiEndpoints";
import { useAuth } from "../context/AuthContext";
import { useGlobalLoading } from "../components/common/GlobalLoadingProvider";

type TopTransactionRow = {
  username: string;
  amount: number;
};

type TopUserRow = {
  username: string;
  transacted_value: number;
};

export type RangeKey = "7d" | "30d" | "all";
export type TxTypeFilter = "ALL" | "DEBIT" | "CREDIT";

export type VolumePoint = {
  date: string; // YYYY-MM-DD
  totalAmount: number;
  count: number;
};

type ReportingHookResult<T> = {
  hasToken: boolean;
  data: T[];
  loading: boolean;
  error: string | null;
};

type UseTopTransactionsPerUserResult = ReportingHookResult<TopTransactionRow> & {
  range: RangeKey;
  setRange: (range: RangeKey) => void;
};

export function useTopTransactionsPerUser(): UseTopTransactionsPerUserResult {
  const { token } = useAuth();
  const hasToken = Boolean(token);
  const { startLoading, stopLoading } = useGlobalLoading();

  const [data, setData] = useState<TopTransactionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    if (!token) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      startLoading();
      setLoading(true);
      setError(null);

      try {
        const { dateFrom, dateTo } = getRangeDates(range);

        const params = new URLSearchParams();
        if (dateFrom) {
          params.set("dateFrom", dateFrom);
        }
        if (dateTo) {
          params.set("dateTo", dateTo);
        }

        const path =
          params.toString().length > 0
            ? `${API_ENDPOINTS.topTransactionsPerUser}?${params.toString()}`
            : API_ENDPOINTS.topTransactionsPerUser;

        const response = await apiRequest<TopTransactionRow[]>({
          path,
          method: "GET",
          token,
          headers: {
            Accept: "application/json",
          },
        });

        if (!cancelled) {
          setData(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof ApiError && err.status === 401) {
          return;
        }

        const message = mapApiErrorToMessage(err, {
          defaultMessage: "Failed to load top transactions.",
          rateLimitMessage:
            "Too many requests while loading top transactions. Please wait a moment and try again.",
          serverErrorMessage:
            "Server error while loading top transactions. Please try again later.",
        });
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        stopLoading();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, range]);

  return { hasToken, data, loading, error, range, setRange };
}

type UseTransactionsVolumeResult = ReportingHookResult<VolumePoint> & {
  range: RangeKey;
  setRange: (range: RangeKey) => void;
  typeFilter: TxTypeFilter;
  setTypeFilter: (filter: TxTypeFilter) => void;
};

function formatDateForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRangeDates(range: RangeKey): { dateFrom?: string; dateTo?: string } {
  if (range === "all") {
    return {};
  }

  const today = new Date();
  const endToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const daysBack = range === "7d" ? 6 : 29;
  const start = new Date(endToday);
  start.setDate(endToday.getDate() - daysBack);

  // Backend interprets dateTo as a Date and uses `createdAt <= dateTo`.
  // To include the whole "today" in the range, we send the start of tomorrow
  // as the upper bound, so all transactions from today (any time) are included.
  const endExclusive = new Date(endToday);
  endExclusive.setDate(endExclusive.getDate() + 1);

  return {
    dateFrom: formatDateForQuery(start),
    dateTo: formatDateForQuery(endExclusive),
  };
}

export function useTransactionsVolume(): UseTransactionsVolumeResult {
  const { token } = useAuth();
  const hasToken = Boolean(token);
  const { startLoading, stopLoading } = useGlobalLoading();

  const [range, setRange] = useState<RangeKey>("30d");
  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("ALL");
  const [data, setData] = useState<VolumePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      startLoading();
      setLoading(true);
      setError(null);

      try {
        const { dateFrom, dateTo } = getRangeDates(range);

        const baseParams = new URLSearchParams();
        baseParams.set("draw", "1");
        baseParams.set("length", "100");
        baseParams.set("order[0][column]", "0");
        baseParams.set("order[0][dir]", "asc");

        if (dateFrom) {
          baseParams.set("dateFrom", dateFrom);
        }
        if (dateTo) {
          baseParams.set("dateTo", dateTo);
        }

        if (typeFilter !== "ALL") {
          baseParams.set("type", typeFilter);
        }

        const pageSize = 100;
        const allRows: {
          id: string;
          createdAt: string;
          amount: number;
          type: string;
        }[] = [];

        let start = 0;
        const maxPages = 20; // safety cap to avoid infinite loops

        for (let page = 0; page < maxPages; page += 1) {
          const params = new URLSearchParams(baseParams);
          params.set("start", String(start));

          const response = await apiRequest<{
            data?: {
              id: string;
              createdAt: string;
              amount: number;
              type: string;
            }[];
          }>({
            path: `${API_ENDPOINTS.transactions}?${params.toString()}`,
            method: "GET",
            token,
            headers: {
              Accept: "application/json",
            },
          });

          if (cancelled) return;

          const rows = Array.isArray(response.data) ? response.data : [];
          allRows.push(...rows);

          if (rows.length < pageSize) {
            break;
          }

          start += pageSize;
        }

        const buckets = new Map<string, { total: number; count: number }>();

        for (const tx of allRows) {
          const created = new Date(tx.createdAt);
          if (Number.isNaN(created.getTime())) continue;

          const key = formatDateForQuery(created);
          const prev = buckets.get(key) ?? { total: 0, count: 0 };

          const amountAbs = Math.abs(tx.amount);
          let contribution = 0;

          if (typeFilter === "ALL") {
            if (tx.type === "CREDIT") {
              contribution = amountAbs;
            } else if (tx.type === "DEBIT") {
              contribution = -amountAbs;
            } else {
              continue;
            }
          } else if (typeFilter === "DEBIT") {
            if (tx.type !== "DEBIT") continue;
            contribution = amountAbs;
          } else if (typeFilter === "CREDIT") {
            if (tx.type !== "CREDIT") continue;
            contribution = amountAbs;
          } else {
            contribution = amountAbs;
          }

          buckets.set(key, {
            total: prev.total + contribution,
            count: prev.count + 1,
          });
        }

        const sortedDates = Array.from(buckets.keys()).sort();

        const points: VolumePoint[] = sortedDates.map((date) => {
          const bucket = buckets.get(date)!;
          return {
            date,
            totalAmount: bucket.total,
            count: bucket.count,
          };
        });

        setData(points);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 401) {
          return;
        }

        const message = mapApiErrorToMessage(err, {
          defaultMessage: "Failed to load transactions volume.",
          rateLimitMessage:
            "Too many requests while loading transactions volume. Please wait a moment and try again.",
          serverErrorMessage:
            "Server error while loading transactions volume. Please try again later.",
        });
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        stopLoading();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, range, typeFilter]);

  return {
    hasToken,
    data,
    loading,
    error,
    range,
    setRange,
    typeFilter,
    setTypeFilter,
  };
}

type UseTopUsersLeaderboardResult = ReportingHookResult<TopUserRow> & {
  range: RangeKey;
  setRange: (range: RangeKey) => void;
};

export function useTopUsersLeaderboard(): UseTopUsersLeaderboardResult {
  const { token } = useAuth();
  const hasToken = Boolean(token);
  const { startLoading, stopLoading } = useGlobalLoading();

  const [data, setData] = useState<TopUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    if (!token) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      startLoading();
      setLoading(true);
      setError(null);

      try {
        const { dateFrom, dateTo } = getRangeDates(range);

        const params = new URLSearchParams();
        if (dateFrom) {
          params.set("dateFrom", dateFrom);
        }
        if (dateTo) {
          params.set("dateTo", dateTo);
        }

        const path =
          params.toString().length > 0
            ? `${API_ENDPOINTS.topUsers}?${params.toString()}`
            : API_ENDPOINTS.topUsers;

        const response = await apiRequest<TopUserRow[]>({
          path,
          method: "GET",
          token,
          headers: {
            Accept: "application/json",
          },
        });

        if (!cancelled) {
          setData(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof ApiError && err.status === 401) {
          return;
        }

        const message = mapApiErrorToMessage(err, {
          defaultMessage: "Failed to load top users.",
          rateLimitMessage:
            "Too many requests while loading top users. Please wait a moment and try again.",
          serverErrorMessage:
            "Server error while loading top users. Please try again later.",
        });
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        stopLoading();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, range]);

  return { hasToken, data, loading, error, range, setRange };
}
