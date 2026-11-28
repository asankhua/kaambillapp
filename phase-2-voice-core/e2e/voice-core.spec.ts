import { expect, test } from "@playwright/test";
import { mockExtract, onboard, textBox } from "../../phase-0-setup/testing/fixtures";

test("home renders on a 360×800 phone with mic, nav and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onboard(page);
  await expect(page.getByText("Bol ke bill banaiye")).toBeVisible();
  await expect(page.getByRole("button", { name: /Bolne ke liye dabaiye/ })).toBeVisible();
  for (const t of ["Boliye", "Bills", "Rates", "Khata"])
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: t, exact: true }),
    ).toBeVisible();
  // Styling guard: Stitch theme classes from the phase folders must be compiled by Tailwind
  // (a broken @source glob once shipped an unstyled app that still passed every role check).
  const mic = page.getByRole("button", { name: /Bolne ke liye dabaiye/ });
  await expect(mic).toHaveCSS("border-radius", /px|%/);
  expect(await mic.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator("header .bg-primary-container").first()).toHaveCSS(
    "background-color",
    "rgb(11, 122, 75)",
  );
  await page.screenshot({ path: "phase-2-voice-core/e2e/screenshots/home.png" });
  await expect(page.getByText(/Wispr (AI|Live|Flow Active)/)).toHaveCount(0); // rule F3
  // Nothing may stay hidden under the fixed dock (text box + mic + nav): scrolled to the end,
  // the page content must end above the dock in every language.
  for (const lang of ["hinglish", "english", "hindi"]) {
    await page.evaluate((l) => localStorage.setItem("kb.lang", l), lang);
    await page.reload();
    await page.getByRole("navigation").waitFor();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const { contentBottom, dockTop } = await page.evaluate(() => ({
      contentBottom: Math.max(
        ...[...document.querySelectorAll("main *")].map((e) => e.getBoundingClientRect().bottom),
      ),
      dockTop: document.querySelector("#root .fixed.bottom-0")!.getBoundingClientRect().top,
    }));
    expect(contentBottom, lang).toBeLessThanOrEqual(dockTop);
  }
  expect(errors).toEqual([]);
});

test("PWA manifest and service worker are served", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    short_name: "KaamBill",
    display: "standalone",
    theme_color: "#0B7A4B",
  });
  expect((await request.get("/sw.js")).ok()).toBe(true);
});

test("a new deploy reaches returning visitors: the service worker activates at once and never caches the landing page", async ({
  request,
}) => {
  const sw = await (await request.get("/sw.js")).text();
  // Takes over immediately (no waiting for every tab to close, no "SKIP_WAITING" message nobody sends)
  expect(sw).toContain("clientsClaim()");
  expect(sw).toMatch(/skipWaiting\(\)/);
  expect(sw).not.toContain("SKIP_WAITING");
  // The app is precached for offline use; the landing page (/) is not, or old copies would linger
  expect(sw).toContain('url:"app/index.html"');
  expect(sw).not.toMatch(/url:"index\.html"/);
  expect(sw).not.toMatch(/url:"assets\/landing-/);
});

test("top bar fits a 360px phone even when icon fonts fail to load", async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await onboard(page);
  const box = await page.getByRole("button", { name: "Rates" }).first().boundingBox();
  expect(box && box.x + box.width).toBeLessThanOrEqual(360);
});

test("no spoken output: the whole bill flow never calls speechSynthesis (decided 21 Nov)", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __spoken: number };
    w.__spoken = 0;
    if (window.speechSynthesis)
      window.speechSynthesis.speak = () => {
        w.__spoken++;
      };
  });
  await mockExtract(page);
  await onboard(page);
  const box = await textBox(page, "Likhein ya Wispr Flow se boliye...");
  await box.fill(
    "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
  );
  await box.press("Enter");
  await page.getByRole("button", { name: "Haan, sahi hai" }).click();
  await expect(page.getByTestId("readback")).toContainText("₹1,235"); // read-back is shown on screen
  await page.getByRole("button", { name: "Haan, bhejo" }).click();
  await page.getByRole("button", { name: "Aage →" }).click(); // payment details → UPI QR
  await page.getByRole("button", { name: "Paisa mil gaya ✓" }).click();
  await expect(page.getByText("Bill taiyaar hai!")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __spoken: number }).__spoken)).toBe(0);
});

test("two different inputs: the mic = KaamBill listens; the text box above it = typing or Wispr Flow", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __recStarted: number; SpeechRecognition: unknown };
    w.__recStarted = 0;
    w.SpeechRecognition = class {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onerror = null;
      onend = null;
      start() {
        w.__recStarted++;
      }
      stop() {}
      abort() {}
    };
  });
  await onboard(page);
  // Wispr Flow is the default (typing box open from the start); the optional browser mic starts with it closed
  await expect(page.getByPlaceholder("Likhein ya Wispr Flow se boliye...")).toBeFocused();
  await page.goto("/app/?box=mic");
  // Mic: KaamBill's own speech recognition starts (a web page can't launch Wispr Flow)
  await page.getByRole("button", { name: /Bolne ke liye dabaiye/ }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __recStarted: number }).__recStarted))
    .toBe(1);
  await expect(
    page
      .getByText("Wispr", { exact: false })
      .filter({ hasNot: page.getByPlaceholder("Likhein ya Wispr Flow se boliye...") }),
  ).toHaveCount(0); // rule F3: no Wispr label on the mic
  await page.getByRole("button", { name: /Radd karein/ }).click();
  // The text box stays hidden until the worker taps "Likh ke daalein", then opens focused (typing / Wispr Flow)
  await expect(page.getByPlaceholder("Likhein ya Wispr Flow se boliye...")).toHaveCount(0);
  await page.getByRole("button", { name: "Likh ke daalein" }).click();
  await expect(page.getByPlaceholder("Likhein ya Wispr Flow se boliye...")).toBeFocused();
  // × closes it again
  await page.getByRole("button", { name: "Band karein" }).click();
  await expect(page.getByPlaceholder("Likhein ya Wispr Flow se boliye...")).toHaveCount(0);
  await expect(await textBox(page, "Likhein ya Wispr Flow se boliye...")).toBeVisible();
  // Wispr Flow is named in the placeholder (no separate hint line, to keep the dock compact)
});
