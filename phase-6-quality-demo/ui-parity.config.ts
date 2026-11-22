import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** `npm run ui:parity`: screenshot every screen and compose it next to its Stitch design. */
export default defineConfig({
  ...base,
  testMatch: ["phase-6-quality-demo/ui-parity/capture.spec.ts"],
  workers: 1,
});
