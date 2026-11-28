import { expect, test } from "@playwright/test";
import { onboard, textBox } from "../../phase-0-setup/testing/fixtures";

// The app must run with no secret keys. When the server has no GROQ_API_KEY, /api/extract answers
// 503 {"error":"key_not_set"} and the app shows a "key not set" message (not a vague error).

test("no Groq key on the server: the app shows a 'key not set' message", async ({ page }) => {
  await page.route("**/api/extract", (route) =>
    route.fulfill({ status: 503, json: { error: "key_not_set" } }),
  );
  await onboard(page);
  await (await textBox(page)).fill("Verma ji ke ghar 2 Havells MCB");
  await page.getByRole("button", { name: "Bhejein" }).click();
  const banner = page.getByTestId("key-not-set");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Groq key set nahi hai");
  await expect(banner).toContainText("GROQ_API_KEY");
  await expect(page.getByText("Samajh nahi aaya")).toHaveCount(0); // not the generic "didn't catch that"
});
