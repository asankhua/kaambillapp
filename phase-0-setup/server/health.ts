import { describeEnv, getEnv } from "./env.js";

/** GET /api/health: deploy check. Reports configuration status, never secret values. */
export function GET(): Response {
  try {
    return Response.json({ ok: true, env: describeEnv(getEnv()) });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
