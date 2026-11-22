/**
 * Per-client rate limit for /api/extract (architecture.md §13.4).
 * Uses Upstash Redis (REST) when configured, otherwise an in-memory window, which only holds
 * per serverless instance, so it's fine for dev/demo but not a hard production limit.
 */
const memory = new Map<string, number[]>();

export async function allowRequest(
  key: string,
  limitPerMin: number,
  redis?: { url: string; token: string },
  now = Date.now(),
): Promise<boolean> {
  if (redis?.url && redis.token) {
    const bucket = `rl:${key}:${Math.floor(now / 60_000)}`;
    const res = await fetch(`${redis.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", bucket],
        ["EXPIRE", bucket, "70"],
      ]),
    });
    if (res.ok) {
      const [[, count]] = (await res.json()) as [[unknown, number], unknown];
      return count <= limitPerMin;
    }
    // Redis unavailable: fall through to the in-memory limit rather than blocking users.
  }
  const windowStart = now - 60_000;
  const hits = (memory.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limitPerMin) {
    memory.set(key, hits);
    return false;
  }
  hits.push(now);
  memory.set(key, hits);
  return true;
}

export function resetRateLimitForTests() {
  memory.clear();
}
