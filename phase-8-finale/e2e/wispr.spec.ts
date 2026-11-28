import { expect, test } from "@playwright/test";
import { mockExtract, onboard } from "../../phase-0-setup/testing/fixtures";

// Landing page "Wispr Flow" option: the live app opens with ?box=text, so Wispr Flow (a dictation app
// that types into the focused field) can dictate straight into the text box. No API is involved.

const PLACEHOLDER = "Likhein ya Wispr Flow se boliye...";

test("?box=text opens the typing box focused, and dictated text becomes a bill", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await page.goto("/app/?box=text");
  const box = page.getByPlaceholder(PLACEHOLDER);
  await expect(box).toBeVisible();
  await expect(box).toBeFocused();
  // Dictation tools insert the whole phrase in one go (one input event, no key presses).
  await page.keyboard.insertText(
    "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire aur 500 labour ka bill bana do",
  );
  await page.getByRole("button", { name: "Bhejein" }).click();
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235");
});

test("without ?box=text the typing box stays closed until the worker asks for it", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await page.goto("/app/");
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeHidden();
});
