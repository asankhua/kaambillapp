/**
 * Local stand-in for `vercel dev`: serves the same `api/*.ts` entry files on http://localhost:3000.
 * Vite (port 5173) proxies `/api` here (app/vite.config.ts). Run with `npm run dev`.
 * The handlers are web-standard `(Request) => Response`, exactly as on Vercel.
 */
import { createServer, type IncomingMessage } from "node:http";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = Number(process.env.API_PORT ?? 3000);

type Handler = (req: Request) => Response | Promise<Response>;

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
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
}).listen(PORT, () => console.log(`KaamBill API (local) on http://localhost:${PORT}/api`));
