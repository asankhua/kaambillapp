import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Unit tests live next to the code in each phase folder (`npm run test:phase -- 4` runs one phase). */
export default defineConfig({
  root: fileURLToPath(new URL("..", import.meta.url)),
  test: {
    include: ["phase-*/**/*.test.{ts,tsx}", "domain-*/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/e2e/**", "phase-1-ui-ux-design/design/**"],
    environment: "node",
  },
});
