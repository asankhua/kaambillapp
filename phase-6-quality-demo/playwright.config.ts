import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/** End-to-end tests live in each phase's e2e/ folder; this config (Phase 6) runs them all. */
export default defineConfig({
  testDir: repoRoot,
  testMatch: ["phase-*/e2e/**/*.spec.ts", "domain-*/e2e/**/*.spec.ts"],
  outputDir: `${repoRoot}/test-results`,
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4173",
    ...devices["Pixel 5"],
    viewport: { width: 360, height: 800 },
    channel: "chromium",
  },
  webServer: {
    command:
      "npm run build && npx vite preview --config app/vite.config.ts --port 4173 --strictPort",
    cwd: repoRoot,
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
