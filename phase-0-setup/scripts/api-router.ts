/**
 * Serves the `api/*.ts` entry files, the same way `vercel dev` / Vercel does: `/api/<name>` runs
 * `api/<name>.ts` and calls its exported method (GET, POST, …) with a web-standard Request.
 * Shared by the local API (`dev-api.ts`) and the production server for the Hugging Face Space (`serve.ts`).
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Repository root (this file lives in phase-0-setup/scripts). */
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type Handler = (req: Request) => Response | Promise<Response>;

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

function sendJson(res: ServerResponse, status: number, body: string) {
  res.writeHead(status, { "content-type": "application/json" }).end(body);
}

/** Handles one request whose path starts with /api. Never throws. */
export async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<void> {
  const route = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const file = join(repoRoot, "api", `${route}.ts`);
  try {
    if (!route || route.includes("..") || !existsSync(file)) {
      return sendJson(res, 404, '{"error":"not_found"}');
    }
    const mod = (await import(pathToFileURL(file).href)) as Record<string, Handler | undefined>;
    const handler = mod[req.method ?? "GET"];
    if (!handler) return sendJson(res, 405, '{"error":"method_not_allowed"}');

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers))
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    const body = await readBody(req);
    const response = await handler(
      new Request(url, {
        method: req.method,
        headers,
        body: body ? new Uint8Array(body) : undefined,
      }),
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    console.log(`${req.method} ${url.pathname} → ${response.status}`);
  } catch (e) {
    console.error(`${req.method} ${url.pathname} failed:`, e);
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    res.end('{"error":"internal"}');
  }
}
