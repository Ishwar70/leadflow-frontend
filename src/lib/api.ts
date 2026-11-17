export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
    public details?: unknown,
  ) {
    super(message);
  }
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

type Query = Record<string, string | number | boolean | undefined | null>;

export function qs(params: Query = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function request<T>(method: string, path: string, body?: unknown, raw = false): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (raw && res.ok) return res as unknown as T;
  let json: { success: boolean; data?: unknown; meta?: unknown; error?: { code: string; message: string; fieldErrors?: Record<string, string>; details?: unknown } } | null = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response (e.g. gateway error)
  }
  if (!res.ok || !json?.success) {
    const err = json?.error;
    throw new ApiError(res.status, err?.code ?? "NETWORK_ERROR", err?.message ?? `Request failed (${res.status})`, err?.fieldErrors, err?.details);
  }
  return (json.meta !== undefined ? { data: json.data, meta: json.meta } : json.data) as T;
}

export const api = {
  get: <T>(path: string, params?: Query) => request<T>("GET", `${path}${qs(params)}`),
  list: <T>(path: string, params?: Query) => request<Paginated<T>>("GET", `${path}${qs(params)}`),
  post: <T>(path: string, body: unknown = {}) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown = {}) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
  download: async (path: string, params: Query, filename: string) => {
    const res = await request<Response>("GET", `${path}${qs(params)}`, undefined, true);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
