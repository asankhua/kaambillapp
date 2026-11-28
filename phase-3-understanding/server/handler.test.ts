import { beforeAll, describe, expect, it } from "vitest";

// The app must start and answer without any secret key: no GROQ_API_KEY, no .env.
process.env.GROQ_API_KEY = "";
process.env.ALLOWED_ORIGINS = "https://kaambillapp.onrender.com";

type Handler = typeof import("./extract.js");
let h: Handler;
beforeAll(async () => {
  h = await import("./extract.js");
});

const body = JSON.stringify({ turn: { text: "2 MCB", source: "text" } });
const post = (headers: Record<string, string>) =>
  new Request("http://localhost:3000/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });

describe("/api/extract without a Groq key", () => {
  it("answers 503 key_not_set (the app shows a 'key not set' message) instead of crashing", async () => {
    const res = await h.POST(post({ origin: "http://localhost:3000", host: "localhost:3000" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "key_not_set" });
  });
});

describe("origin check", () => {
  it("accepts the server's own origin on any host and port (docker compose, a LAN address)", async () => {
    for (const [origin, host] of [
      ["http://localhost:3000", "localhost:3000"],
      ["http://192.168.1.20:8080", "192.168.1.20:8080"],
      ["https://kaambillapp.onrender.com", "kaambillapp.onrender.com"],
    ] as const) {
      const res = await h.POST(post({ origin, host }));
      expect(res.status, origin).toBe(503); // passed the origin check, stopped at the missing key
    }
  });

  it("accepts an allowlisted origin even when the host differs", async () => {
    const res = await h.POST(
      post({ origin: "https://kaambillapp.onrender.com", host: "internal:10000" }),
    );
    expect(res.status).toBe(503);
  });

  it("still blocks a page from another site", async () => {
    const res = await h.POST(post({ origin: "https://evil.example", host: "localhost:3000" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "origin_not_allowed" });
  });
});
