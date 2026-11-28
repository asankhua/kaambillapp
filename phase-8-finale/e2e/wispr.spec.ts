import { expect, test } from "@playwright/test";
import { mockExtract, onboard } from "../../phase-0-setup/testing/fixtures";

// Wispr Flow is the default voice input: the app opens with its typing box focused, and Wispr Flow (a
// dictation app that types into the focused field) dictates straight into it. No API is involved.
// The browser mic is the optional alternative (?box=mic), covered in webspeech.spec.ts.

const PLACEHOLDER = "Likhein ya Wispr Flow se boliye...";
const SENTENCE =
  "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire aur 500 labour ka bill bana do";

for (const url of ["/app/", "/app/?box=text"]) {
  test(`${url} opens the typing box focused, and dictated text becomes a bill`, async ({
    page,
  }) => {
    await mockExtract(page);
    await onboard(page);
    await page.goto(url);
    const box = page.getByPlaceholder(PLACEHOLDER);
    await expect(box).toBeVisible();
    await expect(box).toBeFocused();
    // Dictation tools insert the whole phrase in one go (one input event, no key presses).
    await page.keyboard.insertText(SENTENCE);
    await page.getByRole("button", { name: "Bhejein" }).click();
    await expect(page.getByTestId("bill-total")).toHaveText("₹1,235");
  });
}

test("the optional browser mic (?box=mic) keeps the typing box closed until the worker asks for it", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await page.goto("/app/?box=mic");
  await expect(page.getByRole("button", { name: /Bolne ke liye dabaiye/ })).toBeVisible();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeHidden();
});

test("without a parameter the app follows the landing page's saved choice", async ({ page }) => {
  await mockExtract(page);
  await onboard(page);
  await page.evaluate(() => localStorage.setItem("kb.stt", "webspeech"));
  await page.goto("/app/");
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeHidden();
  await page.evaluate(() => localStorage.setItem("kb.stt", "wispr"));
  await page.goto("/app/");
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeFocused();
});

test("landing page: Wispr Flow is selected by default and the browser mic is optional", async ({
  page,
}) => {
  await page.goto("/");
  const select = page.locator("#stt-select");
  await expect(select).toHaveValue("wispr");
  await expect(select.locator("option")).toHaveText([
    "Wispr Flow (default)",
    "Browser mic (optional)",
  ]);
  await expect(page.locator(".phone-screen")).toHaveAttribute("src", "/app/?box=text");
  await expect(page.locator("#open-full")).toHaveAttribute("href", "/app/?box=text");
  await select.selectOption("webspeech");
  await expect(page.locator(".phone-screen")).toHaveAttribute("src", "/app/?box=mic");
  await expect(page.locator("#open-full")).toHaveAttribute("href", "/app/?box=mic");
  // An old stored choice ("sarvam") falls back to the default, Wispr Flow
  await page.evaluate(() => localStorage.setItem("kb.stt", "sarvam"));
  await page.reload();
  await expect(select).toHaveValue("wispr");
});
