/**
 * Generic JSON POST for structured-extraction endpoints (KaamBill /api/extract, new-domain endpoints):
 * 6 s timeout, one retry on network/5xx (never on 4xx), OfflineError when there's no connection.
 */
export class OfflineError extends Error {
  override name = "OfflineError";
}
export class ExtractError extends Error {
  override name = "ExtractError";
  constructor(
    message: string,
    readonly status: number,
    /** The server's `error` code when it sent one, e.g. "key_not_set" (no GROQ_API_KEY on the server). */
    readonly code?: string,
  ) {
    super(message);
  }
}

async function errorCode(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : undefined;
  } catch {
    return undefined;
  }
}

export async function postStructured<T>(
  path: string,
  body: unknown,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 6000,
): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw new OfflineError("offline");
  const base = import.meta.env?.VITE_API_BASE_URL ?? "/api";
  const payload = JSON.stringify(body);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        signal: ctrl.signal,
      });
      if (res.ok) return (await res.json()) as T;
      const code = await errorCode(res);
      const err = new ExtractError(`${path} failed: ${res.status}`, res.status, code);
      // 4xx and a missing server key are final: retrying would give the same answer.
      if (res.status < 500 || code === "key_not_set") throw err;
      lastError = err;
    } catch (err) {
      if (err instanceof ExtractError && (err.status < 500 || err.code === "key_not_set"))
        throw err;
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw new OfflineError("offline");
  throw lastError instanceof Error ? lastError : new Error(`${path} failed`);
}
