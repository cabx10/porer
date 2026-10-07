export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}
