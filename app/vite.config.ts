import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

/** The app shell: wires the phase folders together (../phase-*). Run from the repo root: `npm run dev`. */
const appDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  root: appDir,
  // .env lives at the repo root. Only VITE_* vars reach the browser.
  envDir: repoRoot,
  server: {
    fs: { allow: [repoRoot] },
    // Local dev: proxy /api to the local API (`npm run dev:api`, port 3000) or `vercel dev`.
    proxy: { "/api": "http://localhost:3000" },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Two pages: the landing page at "/" and the KaamBill app at "/app/" (embedded in the landing page too).
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL("index.html", import.meta.url)),
        app: fileURLToPath(new URL("app/index.html", import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script-defer", // keep the SW register script off the render-blocking path
      includeAssets: ["favicon.svg"],
      workbox: {
        // Precache the app, the lazy jsPDF chunk and the PDF fonts so a finalized bill can be
        // turned into a PDF + QR offline (phase-5 acceptance).
        globPatterns: ["**/*.{js,css,html,svg,png,ttf,webmanifest,txt}"],
        // A new deploy must take over at once. Without these two the new service worker waits for a
        // "SKIP_WAITING" message that nothing sends (the register script is the plain one), so returning
        // visitors and installed PWAs kept an old app and an old landing page until every tab was closed.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // The landing page (/) is NOT cached by the service worker: it is a marketing page that changes
        // with every deploy, and a cached copy made returning visitors keep seeing an old version.
        // Only the app (/app/) works offline.
        globIgnores: ["index.html", "assets/landing-*"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Offline navigation fallback is the app, not the landing page.
        navigateFallback: "/app/index.html",
        navigateFallbackAllowlist: [/^\/app\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: "KaamBill: Bol ke bill banaiye",
        short_name: "KaamBill",
        description: "Hands-free voice billing for Indian tradespeople",
        lang: "hi-IN",
        theme_color: "#0B7A4B",
        background_color: "#F9F9FF",
        display: "standalone",
        orientation: "portrait",
        start_url: "/app/",
        scope: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
