const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

export interface ApiErrorDetails {
  status: number;
  statusText: string;
  bodyText?: string;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  bodyText?: string;

  constructor(message: string, details: ApiErrorDetails) {
    super(message);
    this.status = details.status;
    this.statusText = details.statusText;
    this.bodyText = details.bodyText;
  }
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const { path, method = "GET", body, token, headers = {} } = options;

  const url = new URL(path, API_BASE_URL);

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers: finalHeaders,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => undefined);
    throw new ApiError(`API request failed with status ${response.status}`, {
      status: response.status,
      statusText: response.statusText,
      bodyText,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => undefined)) as T | undefined;
  return data as T;
}

export function buildAuthHeader(token: string | null | undefined): string | undefined {
  if (!token) {
    return undefined;
  }

  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}
