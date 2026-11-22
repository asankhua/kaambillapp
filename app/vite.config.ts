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
  build: { outDir: "dist", emptyOutDir: true },
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
        globPatterns: ["**/*.{js,css,html,svg,png,ttf,webmanifest}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
