import { expect, test, type Page } from "@playwright/test";
import { mockExtract, onboard, textBox } from "../../phase-0-setup/testing/fixtures";

async function type(page: Page, text: string) {
  const box = await textBox(page, "Likhein ya Wispr Flow se boliye...");
  await box.fill(text);
  await box.press("Enter");
}
/** The text box is always above the mic on the Boliye screen (no separate tab). */
async function openTextTab(_page: Page) {}

test("canonical demo: S3 amber wire → S5 confirm → S6 read-back ₹1,235 → approve → locked bill", async ({
  page,
}) => {
  const calls = await mockExtract(page);
  await onboard(page);
  await openTextTab(page);
  await type(
    page,
    "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
  );

  // S5: exactly one question, about the amber wire; the S3 CTA is hidden while asking
  await expect(page.getByRole("dialog", { name: "Confirm" })).toContainText(
    "15 meter Finolex wire, sahi hai?",
  );
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235");
  await expect(page.locator('[data-status="amber"]')).toHaveCount(1);
  await expect(page.getByTestId("to-check")).toHaveText("? 1 item check karein");
  await expect(page.getByRole("button", { name: /Total dekhein aur bhejein/ })).toHaveCount(0);
  await page.screenshot({
    path: "phase-4-billing-domain/e2e/screenshots/s3-s5-live-bill.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Haan, sahi hai" }).click();
  // S6 read-back (fix F2 wording)
  await expect(page.getByTestId("readback")).toHaveText(
    "“Verma ji ka total ₹1,235 bana hai, 3 items ke saath. WhatsApp par bhej doon?”",
  );
  await expect(page.getByText(/Aap Send dabayenge tabhi Verma ji ko jayega/)).toBeVisible();
  await expect(page.locator('[data-status="amber"]')).toHaveCount(0);
  await page.screenshot({
    path: "phase-4-billing-domain/e2e/screenshots/s6-readback.png",
    fullPage: true,
  });

  await expect(page.getByTestId("journey-steps")).toHaveAttribute("data-step", "2"); // Jaanch

  await page.getByRole("button", { name: "Haan, bhejo" }).click();
  // Step 3 (payment details) shows the locked total; "Baad mein" goes straight to the invoice
  await expect(page.getByTestId("pay-amount")).toHaveText("₹1,235");
  await page.getByRole("radio", { name: /^Baad mein/ }).check();
  await page.getByRole("button", { name: "Aage →" }).click();
  await expect(page.getByText("Bill taiyaar hai!")).toBeVisible();
  await expect(page.getByTestId("final-total")).toHaveText("₹1,235");
  await expect(page.getByText(/not a GST tax invoice/)).toBeVisible();
  expect(calls).toHaveLength(1); // "haan" confirmations never hit the API
});

test("unknown price: S4 asks once, the spoken price is applied, then read-back", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await openTextTab(page);
  await type(page, "Verma ji ke liye Finolex 2.5mm wire 20 meter aur 500 labour");
  await expect(page.getByRole("dialog", { name: "Sawaal" })).toContainText(
    "Finolex wire 2.5mm ka rate kitna hai?",
  );
  await expect(page.locator('[data-status="pending"]')).toHaveCount(1);
  await page.screenshot({
    path: "phase-4-billing-domain/e2e/screenshots/s4-question.png",
    fullPage: true,
  });
  await type(page, "pachees rupaye meter");
  await expect(page.getByTestId("readback")).toContainText("₹1,000 bana hai, 2 items");
});

test("tap-to-fix during read-back forces a new read-back with the new total", async ({ page }) => {
  await mockExtract(page);
  await onboard(page);
  await openTextTab(page);
  await type(
    page,
    "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
  );
  await page.getByRole("button", { name: "Haan, sahi hai" }).click();
  await expect(page.getByTestId("readback")).toContainText("₹1,235");
  await page.getByRole("button", { name: /Labour \/ Mazdoori/ }).click();
  await page.getByLabel("Labour / Mazdoori (₹)").fill("700");
  await page.getByRole("button", { name: "Theek" }).click();
  await expect(page.getByTestId("readback")).toContainText("₹1,435");
});

test("rate card (S8): 15 seed items, search and edit a price", async ({ page }) => {
  await onboard(page);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Rates", exact: true })
    .click();
  await expect(page.getByText("15 items")).toBeVisible();
  await page.getByPlaceholder("Item dhoondhein").fill("mcb");
  await expect(page.getByText("Havells MCB 16A Single Pole")).toBeVisible();
  await page.getByRole("button", { name: "Havells MCB 16A Single Pole ka rate badlein" }).click();
  await page.getByLabel("Naya rate").fill("200");
  await page.getByRole("button", { name: "Theek" }).click();
  await expect(
    page.getByRole("button", { name: "Havells MCB 16A Single Pole ka rate badlein" }),
  ).toContainText("₹200");
  await page.screenshot({
    path: "phase-4-billing-domain/e2e/screenshots/s8-rate-card.png",
    fullPage: true,
  });
});
