import { expect, test } from "@playwright/test";
import { mockExtract, onboard, textBox } from "../../phase-0-setup/testing/fixtures";

test("offline: app opens from the service worker, a turn is queued (S10b), then processed online", async ({
  page,
  context,
}) => {
  await mockExtract(page);
  await onboard(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // now controlled by the service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Bol ke bill banaiye")).toBeVisible(); // served from the precache

  const box = await textBox(page, "Likhein ya Wispr Flow se boliye...");
  await box.fill(
    "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
  );
  await box.press("Enter");
  await expect(
    page.getByText("Internet nahi hai — bill save ho gaya, baad mein process hoga"),
  ).toBeVisible();
  await page.screenshot({ path: "phase-5-output-share/e2e/screenshots/s10b-offline.png" });

  await context.setOffline(false);
  await page.getByRole("button", { name: "Phir try karein" }).click();
  await expect(page.getByRole("dialog", { name: "Confirm" })).toContainText(
    "15 meter Finolex wire, sahi hai?",
  );
});
