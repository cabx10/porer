export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// All requests go through the Vite proxy (/api, /uploads, /socket.io), so the
// client never hard-codes the API host.
export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const isForm = opts.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(isForm || opts.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  // A stored token that the server rejects means the session is gone
  // (expired, or the database was reset): sign the user out.
  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:expired"));
  }
  if (!res.ok) throw new ApiError(data?.error || res.statusText || "Request failed", res.status);
  return data as T;
}
