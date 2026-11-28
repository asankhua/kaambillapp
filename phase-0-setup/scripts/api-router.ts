/**
 * Runs the `api/<route>.ts` handler for an `/api/...` request, the way Vercel does.
 * Shared by the local API (dev-api.ts, `npm run dev`) and the production server (serve.ts, `npm start`).
 * The handlers are web-standard `(Request) => Response`, exactly as on Vercel.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type Handler = (req: Request) => Response | Promise<Response>;

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

/** `root` is the repo root (the folder that contains `api/`). */
export async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
  port: number,
): Promise<void> {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const route = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const file = join(root, "api", `${route}.ts`);
  try {
    if (!url.pathname.startsWith("/api/") || route.includes("..") || !existsSync(file)) {
      res.writeHead(404, { "content-type": "application/json" }).end('{"error":"not_found"}');
      return;
    }
    const mod = (await import(pathToFileURL(file).href)) as Record<string, Handler | undefined>;
    const handler = mod[req.method ?? "GET"];
    if (!handler) {
      res
        .writeHead(405, { "content-type": "application/json" })
        .end('{"error":"method_not_allowed"}');
      return;
    }
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
