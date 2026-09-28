export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const tokenStore = {
  get: () => sessionStorage.getItem("ticketflow-token"),
  set: (value: string) => sessionStorage.setItem("ticketflow-token", value),
  clear: () => sessionStorage.removeItem("ticketflow-token"),
};
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    public?: boolean;
  } = {},
): Promise<T> {
  const token = options.public ? null : tokenStore.get();
  const response = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    signal: options.signal,
    headers: {
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token && token === tokenStore.get())
      window.dispatchEvent(new Event("session-expired"));
    const message =
      data && typeof data === "object" && "message" in data
        ? data.message
        : "The request could not be completed. Please try again.";
    throw new ApiError(
      response.status,
      Array.isArray(message) ? message.join(". ") : String(message),
    );
  }
  return data as T;
}
export function queryString(
  params: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return query.toString();
}
