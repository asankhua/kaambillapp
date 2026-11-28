/**
 * Builds the pitch deck PDF from phase-8-finale/deck/deck.html (one 16:9 page per slide).
 *   npm run deck      → docs/KaamBill-pitch-deck.pdf
 * Everything in the deck is real text, so the PDF can be read and searched, not only looked at.
 * Needs Playwright's Chromium (already installed for the e2e tests).
 */
import { chromium } from "@playwright/test";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const html = join(root, "phase-8-finale", "deck", "deck.html");
const out = join(root, "docs", "KaamBill-pitch-deck.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: "load" });
await page.pdf({
  path: out,
  width: "1280px",
  height: "720px",
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();
console.log(`Wrote ${out}`);
