/**
 * Local stand-in for `vercel dev`: serves the same `api/*.ts` entry files on http://localhost:3000.
 * Vite (port 5173) proxies `/api` here (app/vite.config.ts). Run with `npm run dev`.
 * The handlers are web-standard `(Request) => Response`, exactly as on Vercel (see api-router.ts).
 */
import { createServer } from "node:http";
import { handleApi } from "./api-router.js";

const PORT = Number(process.env.API_PORT ?? 3000);

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  return handleApi(req, res, url);
}).listen(PORT, () => console.log(`KaamBill API (local) on http://localhost:${PORT}/api`));
