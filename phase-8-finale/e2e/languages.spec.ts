import { expect, test } from "@playwright/test";
import { mockExtract, onboard, textBox } from "../../phase-0-setup/testing/fixtures";

// KaamBill supports exactly three languages: Hinglish, Hindi (Devanagari) and English.

test("language menu offers only Hinglish, Hindi and English", async ({ page }) => {
  await onboard(page);
  await page.getByRole("button", { name: "Bhasha: Hinglish" }).click();
  const items = page.getByRole("menuitemradio");
  await expect(items).toHaveCount(3);
  await expect(items).toHaveText([/^Hinglish/, /^हिंदी/, /^English/]); // the selected one also shows a check icon
});

test("Hindi: switching the language changes every screen text and the app's messages, and is remembered", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await page.getByRole("button", { name: "Bhasha: Hinglish" }).click();
  await page.getByRole("menuitemradio", { name: "हिंदी" }).click();
  // Screen text switches immediately (not just the mic language)
  await expect(page.getByText("बोल के बिल बनाइए")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "मुख्य" }).getByRole("button", { name: "बिल", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "मुख्य" }).getByRole("button")).toHaveCount(4); // no separate type tab
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await page.reload();
  await expect(page.getByRole("button", { name: "भाषा: हिंदी" })).toBeVisible(); // persisted
  await expect(page.getByText("बोल के बिल बनाइए")).toBeVisible();

  const box = await textBox(page, "लिखें या Wispr Flow से बोलें...");
  await box.fill("वर्मा जी के घर दो Havells MCB, पंद्रह मीटर Finolex wire, और 500 लेबर");
  await box.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("सही है?"); // dialog name is translated too
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235"); // Hindi number words normalized on the phone
  await page.getByRole("button", { name: "हाँ, सही है" }).click();
  await expect(page.getByTestId("readback")).toHaveText(
    "“Verma ji का टोटल ₹1,235 बना है, 3 आइटम के साथ। WhatsApp पर भेज दूँ?”",
  );
  await page.screenshot({ path: "phase-8-finale/e2e/screenshots/p8-hindi-readback.png" });
});

test("English: screen text and the app's messages switch to English, even when the speech was Hinglish", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await page.getByRole("button", { name: "Bhasha: Hinglish" }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page.getByText("Make a bill by speaking")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  const box = await textBox(page, "Type or speak with Wispr Flow...");
  // Hinglish speech (the mock says language hi-Latn): replies still follow the chosen app language
  await box.fill(
    "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
  );
  await box.press("Enter");
  await expect(page.getByRole("dialog", { name: "Confirm" })).toContainText("is that right?");
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235");
  await page.getByRole("button", { name: "Yes, correct" }).click();
  await expect(page.getByTestId("readback")).toHaveText(
    "“Verma ji's total is ₹1,235, with 3 items. Shall I send it on WhatsApp?”",
  );
  await expect(page.getByRole("button", { name: "Yes, send" })).toBeVisible();
});

test("?demo=1: no onboarding (Ramesh Electricals), demo reset in Khata", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.getByText("Namaste, Ramesh Electricals")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Khata", exact: true })
    .click();
  await page.getByRole("button", { name: "Demo reset (bills + rate card)" }).click();
  await expect(page.getByText("Bol ke bill banaiye")).toBeVisible();
});
