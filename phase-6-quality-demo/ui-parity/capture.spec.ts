/**
 * UI parity capture: drives every screen of the built app (390 px wide, 2×, like the Stitch export)
 * and writes "Stitch | build" side-by-side images to eval/results/ui-parity/.
 * Run: `npm run ui:parity` (not part of `npm run e2e`).
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mockExtract, onboard, textBox } from "../../phase-0-setup/testing/fixtures";

const here = dirname(fileURLToPath(import.meta.url));
const design = resolve(here, "../../phase-1-ui-ux-design/design");
const out = resolve(here, "../eval/results/ui-parity");
const shots = join(out, "build");
mkdirSync(shots, { recursive: true });

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
test.describe.configure({ mode: "serial" });

const DEMO =
  "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do";
/** Full-page shot with the fixed top bar / dock pinned to the page edges (as in the Stitch exports), not mid-page. */
async function snap(page: Page, name: string) {
  const css = await page.addStyleTag({
    content:
      "html,body,#root{height:auto !important;min-height:0 !important} #root .fixed{position:relative !important}",
  });
  await page.screenshot({ path: join(shots, `${name}.png`), fullPage: true });
  await css.evaluate((el) => el.remove());
}
const nav = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Main" }).getByRole("button", { name, exact: true }).click();
async function type(page: Page, text: string) {
  const box = await textBox(page, "Likhein ya Wispr Flow se boliye...");
  await box.fill(text);
  await box.press("Enter");
}
/** Fake browser speech recognition: "listen" keeps an interim transcript open; "blocked" denies the mic. */
const fakeMic = (page: Page, mode: "listen" | "blocked") =>
  page.addInitScript((m) => {
    class FakeRec {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          if (m === "blocked") this.onerror?.({ error: "not-allowed" });
          else
            this.onresult?.({
              results: {
                length: 1,
                0: {
                  isFinal: false,
                  length: 1,
                  0: {
                    transcript: "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire",
                    confidence: 0,
                  },
                },
              },
            });
        }, 100);
      }
      stop() {}
      abort() {}
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRec;
    // Keep the "listening" state on screen: never fire the silence timer's final result.
    if (m === "listen") {
      const orig = window.setTimeout.bind(window);
      (window as unknown as { setTimeout: unknown }).setTimeout = ((fn: () => void, ms?: number) =>
        orig(fn, ms === 1500 ? 1e9 : ms)) as typeof setTimeout;
    }
  }, mode);

test("S1a–c onboarding", async ({ page }) => {
  await page.goto("/app/");
  await snap(page, "onboarding_1_aapka_naam");
  await page.getByLabel("Aapka / Dukaan ka naam").fill("Ramesh Electricals");
  await page.getByRole("button", { name: "Aage badhein →" }).click();
  await page.getByLabel("UPI ID").fill("ramesh@okaxis");
  await snap(page, "onboarding_2_upi_id_setup");
  await page.getByRole("button", { name: "Aage →" }).click();
  await snap(page, "onboarding_3_rate_card_setup");
});

test("Home, S2 listening", async ({ page }) => {
  await fakeMic(page, "listen");
  await onboard(page);
  await snap(page, "kaambill_bol_ke_bill_banaiye");
  await page.getByRole("button", { name: /Bolne ke liye dabaiye/ }).click();
  await page.waitForTimeout(600);
  await snap(page, "kaambill_sun_raha_hoon_listening_state");
});

test("S10a mic blocked", async ({ page }) => {
  await fakeMic(page, "blocked");
  await onboard(page);
  await page.getByRole("button", { name: /Bolne ke liye dabaiye/ }).click();
  await page.waitForTimeout(600);
  await snap(page, "kaambill_mic_blocked_fallback");
});

test("S3/S5 live bill + confirm, S6 read-back, S7 share", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "canShare", { value: () => false }),
  );
  await mockExtract(page);
  await onboard(page);
  await type(page, DEMO);
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235");
  await snap(page, "kaambill_live_bill_assembling");
  await snap(page, "kaambill_low_confidence_confirmation");
  await page.getByRole("button", { name: "Haan, sahi hai" }).click();
  await expect(page.getByTestId("readback")).toBeVisible();
  await snap(page, "kaambill_read_back_aur_approval");
  await page.getByRole("button", { name: "Haan, bhejo" }).click();
  // Payment steps (no Stitch design; captured for review only)
  await expect(page.getByRole("heading", { name: "Payment details" })).toBeVisible();
  await snap(page, "payment_details");
  await page.getByRole("button", { name: "Aage →" }).click();
  await expect(page.getByTestId("pay-qr")).toBeVisible();
  await snap(page, "payment_upi_qr");
  await page.getByRole("button", { name: "Baad mein lenge" }).click(); // due: the QR stays on the bill
  await expect(page.getByText("Bill taiyaar hai!")).toBeVisible();
  await page.waitForTimeout(800); // QR
  await snap(page, "kaambill_share_preview");
  await page
    .getByRole("button", { name: "WhatsApp par bhejein" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(500);
  await page
    .getByRole("button", { name: /Ho gaya|Naya bill|Done/ })
    .first()
    .click()
    .catch(() => {});
  await nav(page, "Bills");
  await page.waitForTimeout(500);
  await snap(page, "kaambill_bill_history");
});

test("S4 question", async ({ page }) => {
  await mockExtract(page);
  await onboard(page);
  await type(page, "Verma ji ke liye Finolex 2.5mm wire 20 meter aur 500 labour");
  await expect(page.getByRole("dialog", { name: "Sawaal" })).toBeVisible();
  await snap(page, "kaambill_sawaal_clarifying_question");
});

test("S8 rate card", async ({ page }) => {
  await onboard(page);
  await nav(page, "Rates");
  await page.waitForTimeout(400);
  await snap(page, "kaambill_mera_rate_card");
});

test("S10c not understood", async ({ page }) => {
  await mockExtract(page);
  await onboard(page);
  await type(page, "asdf qwer zxcv");
  await page.waitForTimeout(600);
  await snap(page, "kaambill_error_samajh_nahi_aaya");
});

test("S10b offline", async ({ page, context }) => {
  await onboard(page);
  await page.waitForTimeout(1500); // service worker installed
  await context.setOffline(true);
  await type(page, DEMO);
  await page.waitForTimeout(800);
  await snap(page, "kaambill_offline_queue_mode");
  await context.setOffline(false);
});

test("compose side-by-side images", async ({ page }) => {
  test.setTimeout(120_000);
  const names = [
    "onboarding_1_aapka_naam",
    "onboarding_2_upi_id_setup",
    "onboarding_3_rate_card_setup",
    "kaambill_bol_ke_bill_banaiye",
    "kaambill_sun_raha_hoon_listening_state",
    "kaambill_live_bill_assembling",
    "kaambill_low_confidence_confirmation",
    "kaambill_sawaal_clarifying_question",
    "kaambill_read_back_aur_approval",
    "kaambill_share_preview",
    "kaambill_mera_rate_card",
    "kaambill_bill_history",
    "kaambill_error_samajh_nahi_aaya",
    "kaambill_offline_queue_mode",
    "kaambill_mic_blocked_fallback",
  ];
  await page.setViewportSize({ width: 820, height: 900 });
  for (const n of names) {
    const img = (p: string) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
    await page.setContent(`<body style="margin:0;background:#ddd;font:14px sans-serif;display:flex;gap:20px;padding:10px;align-items:flex-start">
      <figure style="margin:0;width:390px"><figcaption>Stitch: ${n}</figcaption><img style="width:390px" src="${img(join(design, n, "screen.png"))}"></figure>
      <figure style="margin:0;width:390px"><figcaption>Build</figcaption><img style="width:390px" src="${img(join(shots, `${n}.png`))}"></figure></body>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(out, `${n}.png`), fullPage: true });
  }
});
