import { expect, test, type Page } from "@playwright/test";
import { mockExtract, onboard, textBox } from "../../phase-0-setup/testing/fixtures";

const DEMO =
  "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do";
async function type(page: Page, text: string) {
  const box = await textBox(page, "Likhein ya Wispr Flow se boliye...");
  await box.fill(text);
  await box.press("Enter");
}
/** Steps 1–2 (items → check → "Haan, bhejo"); ends on step 3, Payment details. */
async function makeDemoBill(page: Page) {
  await type(page, DEMO);
  await page.getByRole("button", { name: "Haan, sahi hai" }).click();
  await page.getByRole("button", { name: "Haan, bhejo" }).click();
  await expect(page.getByRole("heading", { name: "Payment details" })).toBeVisible();
  await expect(page.getByTestId("journey-steps")).toHaveAttribute("data-step", "3");
}
/** Step 3 → (step 4) → step 5: the invoice. "later" = Baad mein (udhaar), straight to the invoice as due. */
async function toInvoice(page: Page, how: "later" | "upi-later" | "upi-paid" | "cash") {
  await page
    .getByRole("radio", {
      name: how === "cash" ? /^Cash/ : how === "later" ? /^Baad mein \(udhaar\)/ : /^UPI \(QR\)/,
    })
    .check();
  await page.getByRole("button", { name: "Aage →" }).click();
  if (how === "upi-later") await page.getByRole("button", { name: "Baad mein lenge" }).click();
  if (how === "upi-paid") await page.getByRole("button", { name: "Paisa mil gaya ✓" }).click();
  if (how === "cash") await page.getByRole("button", { name: "Haan, cash mila ✓" }).click();
  await expect(page.getByText("Bill taiyaar hai!")).toBeVisible();
  await expect(page.getByTestId("journey-steps")).toHaveAttribute("data-step", "5");
}

test("onboarding (S1): UPI ID format is checked, no 'bank linked' claim", async ({ page }) => {
  await page.goto("/app/");
  await expect(page.getByRole("button", { name: "Aage badhein →" })).toBeDisabled();
  await page.getByLabel("Aapka / Dukaan ka naam").fill("Ramesh Electricals");
  await expect(page.getByText("Bill par yahi naam dikhai dega")).toContainText(
    "Ramesh Electricals",
  );
  await page.getByRole("button", { name: "Aage badhein →" }).click();
  await page.getByLabel("UPI ID").fill("ramesh");
  await expect(page.getByRole("button", { name: "Aage →" })).toBeDisabled();
  await page.getByLabel("UPI ID").fill("ramesh@okaxis");
  await expect(page.getByText("UPI ID ka format sahi hai ✓")).toBeVisible();
  await expect(page.getByText("Payment to Ramesh Electricals")).toBeVisible();
  await expect(page.getByText(/bank linked|verified merchant/i)).toHaveCount(0); // fix F5
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/s1b-upi.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Aage →" }).click();
  await expect(page.getByText("15 common items pehle se hain")).toBeVisible();
  await page.getByRole("button", { name: "Shuru karein" }).click();
  await expect(page.getByText("Namaste, Ramesh Electricals")).toBeVisible();
});

/** Headless Chrome claims file sharing but has no share UI; make it behave like a phone without it. */
const noShareSheet = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => false });
  });

test("S7 share sheet (Android path): the PDF file is handed to the share sheet; nothing auto-sends", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: unknown[] };
    w.__shared = [];
    Object.defineProperty(navigator, "canShare", { value: () => true });
    Object.defineProperty(navigator, "share", {
      value: async (d: { files: File[]; text: string }) => {
        w.__shared.push({
          names: d.files.map((f) => f.name),
          type: d.files[0]?.type,
          size: d.files[0]?.size,
          text: d.text,
        });
      },
    });
  });
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  await toInvoice(page, "later");
  await page.getByRole("button", { name: "WhatsApp par bhejein" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "WhatsApp khul gaya hai — bas Send dabaiye." }),
  ).toBeVisible();
  const shared = (
    await page.evaluate(
      () =>
        (
          window as unknown as {
            __shared: { names: string[]; type: string; size: number; text: string }[];
          }
        ).__shared,
    )
  )[0]!;
  expect(shared.names[0]).toMatch(/^KaamBill-KB-\d{4}-\d{4}\.pdf$/);
  expect(shared.type).toBe("application/pdf");
  expect(shared.size).toBeLessThan(200_000);
  expect(shared.text).toContain(
    "upi://pay?pa=ramesh%40okaxis&pn=Ramesh%20Electricals&am=1235.00&cu=INR",
  );
});

test("S7 share: QR pays the worker, WhatsApp opens (worker sends), PDF < 200 KB, history + paid", async ({
  page,
  context,
}) => {
  await noShareSheet(page);
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  await page.getByLabel("Grahak ka WhatsApp number (optional)").fill("98112 34567"); // step 3
  await toInvoice(page, "upi-later"); // QR shown, customer pays later → due

  // S7: payee is the worker, not KaamBill
  await expect(page.getByTestId("upi-qr")).toBeVisible();
  await expect(
    page.getByText("Scan karke pay karein · Payment to Ramesh Electricals"),
  ).toBeVisible();
  await expect(
    page.getByText("Aap Send dabayenge tabhi bill jayega", { exact: false }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Likhein ya Wispr Flow se boliye...")).toHaveCount(0); // no text box over the bill
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/s7-share.png",
    fullPage: true,
  });

  // PDF download
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /PDF/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^KaamBill-KB-\d{4}-\d{4}\.pdf$/);
  const chunks: Buffer[] = [];
  for await (const c of await download.createReadStream()) chunks.push(c as Buffer);
  const bytes = Buffer.concat(chunks);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeLessThan(200_000);

  // WhatsApp: headless Chrome can't share files → wa.me fallback opens; nothing is sent automatically
  await expect(page.getByLabel("Grahak ka WhatsApp number (optional)")).toHaveValue("98112 34567"); // kept from step 3
  const opened: string[] = [];
  await context.route("https://wa.me/**", async (route) => {
    opened.push(route.request().url());
    await route.fulfill({ body: "ok" });
  }); // never hit WhatsApp for real
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "WhatsApp par bhejein" }).click(),
  ]);
  await expect.poll(() => opened.length).toBe(1);
  const url = new URL(opened[0]!);
  expect(url.pathname).toBe("/919811234567");
  const text = url.searchParams.get("text")!;
  expect(text).toContain("Namaste Verma ji, aapka bill ₹1,235 (Ramesh Electricals)");
  expect(text).toContain(
    "upi://pay?pa=ramesh%40okaxis&pn=Ramesh%20Electricals&am=1235.00&cu=INR&tn=Bill%20KB-",
  );
  expect(text).toContain("not a GST tax invoice");
  await popup.close();
  await expect(
    page.getByRole("status").filter({ hasText: "WhatsApp khul gaya hai — bas Send dabaiye." }),
  ).toBeVisible();

  // Back home: today's earnings + recent bill
  await page.getByRole("button", { name: "Naya bill" }).click();
  await expect(page.getByTestId("today-total")).toHaveText("₹1,235");
  await expect(page.getByText("Bheja gaya")).toBeVisible();

  // S9: mark paid (cash)
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Bills", exact: true })
    .click();
  await expect(page.getByTestId("week-total")).toContainText("₹1,235");
  await page.getByRole("button", { name: "Paid mark" }).click();
  await page.getByRole("button", { name: "Cash mila" }).click();
  await expect(page.getByTestId("paid-pill")).toContainText("Cash mila");
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/s9-history.png",
    fullPage: true,
  });
});

test("voice history command: 'Verma ji ka bill paid mark kar do'", async ({ page }) => {
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  await toInvoice(page, "later");
  await page.getByRole("button", { name: "Naya bill" }).click();
  await type(page, "Verma ji ka bill paid mark kar do");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Bills", exact: true })
    .click();
  await expect(page.getByTestId("paid-pill")).toContainText("Cash mila");
});

test("Khata: edit profile; the share preview uses the new payee", async ({ page }) => {
  await onboard(page);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Khata", exact: true })
    .click();
  await page.getByLabel("Aapka / Dukaan ka naam").fill("Ramesh Electric Works");
  await page.getByRole("button", { name: "Aage badhein →" }).click();
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page.getByText("Namaste, Ramesh Electric Works")).toBeVisible();
});

test("draft survives a reload, shows under Bills → Drafts, and resumes (architecture.md §4.3)", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await type(page, DEMO);
  await expect(page.getByRole("dialog", { name: "Confirm" })).toBeVisible(); // mid-bill
  await page.reload();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Bills", exact: true })
    .click();
  await page.getByRole("button", { name: /^Drafts 1$/ }).click();
  await expect(page.getByTestId("draft-card")).toContainText("Verma ji");
  await page.getByRole("button", { name: "Poora karein" }).click();
  await expect(page.getByRole("dialog", { name: "Confirm" })).toContainText(
    "15 meter Finolex wire, sahi hai?",
  );
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235");
});

test("history: transcript + customer number are kept on the bill; search filters", async ({
  page,
  context,
}) => {
  await noShareSheet(page);
  await context.route("https://wa.me/**", (r) => r.fulfill({ body: "ok" }));
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  await page.getByLabel("Grahak ka WhatsApp number (optional)").fill("98112 34567");
  await toInvoice(page, "later");
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "WhatsApp par bhejein" }).click(),
  ]);
  await popup.close();
  await page.getByRole("button", { name: "Naya bill" }).click();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Bills", exact: true })
    .click();
  await page.getByRole("button", { name: /Suna gaya · 📱 98112 34567/ }).click();
  await expect(page.locator('[data-testid^="transcript-"]')).toContainText(
    "Verma ji ke ghar 2 Havells MCB",
  );
  await page.getByRole("button", { name: "Dhoondhein" }).click();
  await page.getByLabel("Bills dhoondhein").fill("gupta");
  await expect(page.getByText("Kuch nahi mila.")).toBeVisible();
  await page.getByLabel("Bills dhoondhein").fill("finolex");
  await expect(page.getByText("Verma ji").first()).toBeVisible();
});

test("payment (UPI): step 3 details → QR → 'Paisa mil gaya' (worker's word only) → invoice PAID · UPI, Bills shows paid", async ({
  page,
  context,
}) => {
  await noShareSheet(page);
  const opened: string[] = [];
  await context.route("https://wa.me/**", async (route) => {
    opened.push(route.request().url());
    await route.fulfill({ body: "ok" });
  });
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  // Step 3: amount, payee from the profile, UPI is the default method
  await expect(page.getByTestId("pay-amount")).toHaveText("₹1,235");
  await expect(page.getByTestId("payee-name")).toHaveText("Ramesh Electricals");
  await expect(page.getByText("UPI ID: ramesh@okaxis")).toBeVisible();
  await expect(page.getByRole("radio", { name: /^UPI \(QR\)/ })).toBeChecked();
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/p3-payment-details.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Aage →" }).click();
  // Step 4: the real UPI QR; KaamBill can't see the payment, so the worker confirms
  await expect(page.getByTestId("journey-steps")).toHaveAttribute("data-step", "4");
  await expect(page.getByTestId("pay-qr")).toBeVisible();
  await expect(page.getByText("Customer se scan karwaiye")).toBeVisible();
  await expect(page.getByTestId("paid-honesty")).toContainText(
    "KaamBill payment nahi dekh sakta — aapke confirm karne par hi paid mark hoga.",
  );
  await expect(page.getByText(/payment (received|verified)/i)).toHaveCount(0);
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/p4-payment-upi.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Paisa mil gaya ✓" }).click();
  // Step 5: PAID · UPI; the message thanks instead of asking to pay
  await expect(page.getByTestId("pay-status")).toContainText("PAID · UPI");
  await expect(page.getByText("Payment ho chuka hai — scan ki zaroorat nahi")).toBeVisible();
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/p5-invoice-paid.png",
    fullPage: true,
  });
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "WhatsApp par bhejein" }).click(),
  ]);
  await expect.poll(() => opened.length).toBe(1);
  const text = new URL(opened[0]!).searchParams.get("text")!;
  expect(text).toContain("Payment mil gaya (UPI), dhanyavaad!");
  expect(text).not.toContain("upi://pay");
  await popup.close();
  await page.getByRole("button", { name: "Naya bill" }).click();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Bills", exact: true })
    .click();
  await expect(page.getByTestId("paid-pill")).toContainText("UPI se mila");
  await expect(page.getByRole("button", { name: "Paid mark" })).toHaveCount(0);
});

test("payment later (udhaar): Baad mein skips step 4 → invoice DUE with the QR; message asks to pay by UPI", async ({
  page,
  context,
}) => {
  await noShareSheet(page);
  const opened: string[] = [];
  await context.route("https://wa.me/**", async (route) => {
    opened.push(route.request().url());
    await route.fulfill({ body: "ok" });
  });
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  await toInvoice(page, "later");
  await expect(page.getByTestId("pay-status")).toHaveAttribute("data-paid", "false");
  await expect(page.getByTestId("pay-status")).toContainText("DUE");
  await expect(page.getByTestId("pay-status")).toContainText("QR se pay kar sakte hain");
  await expect(page.getByTestId("upi-qr")).toBeVisible();
  await expect(page.getByText("Direct UPI Se Payment")).toBeVisible();
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/p5-invoice-due.png",
    fullPage: true,
  });
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "WhatsApp par bhejein" }).click(),
  ]);
  await expect.poll(() => opened.length).toBe(1);
  expect(new URL(opened[0]!).searchParams.get("text")).toContain(
    "UPI se pay karein: upi://pay?pa=ramesh%40okaxis",
  );
  await popup.close();
  await page.getByRole("button", { name: "Naya bill" }).click();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Bills", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Paid mark" })).toBeVisible(); // still due
});

test("payment (cash): '₹1,235 cash mila?' → 'Haan, cash mila' → invoice PAID · Cash; back returns to details", async ({
  page,
}) => {
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  await page.getByRole("radio", { name: /^Cash/ }).check();
  await page.getByRole("button", { name: "Aage →" }).click();
  await expect(page.getByTestId("cash-question")).toHaveText("₹1,235 cash mila?");
  await expect(page.getByTestId("paid-honesty")).toBeVisible();
  await page.screenshot({
    path: "phase-5-output-share/e2e/screenshots/p4-payment-cash.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Peeche" }).click();
  await expect(page.getByRole("heading", { name: "Payment details" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Cash/ })).toBeChecked();
  await page.getByRole("button", { name: "Aage →" }).click();
  await page.getByRole("button", { name: "Haan, cash mila ✓" }).click();
  await expect(page.getByTestId("pay-status")).toContainText("PAID · Cash");
  await page.getByRole("button", { name: "Naya bill" }).click();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Bills", exact: true })
    .click();
  await expect(page.getByTestId("paid-pill")).toContainText("Cash mila");
});

test("payment details: 'Badlein' next to the payee opens Khata", async ({ page }) => {
  await mockExtract(page);
  await onboard(page);
  await makeDemoBill(page);
  await page.getByRole("button", { name: "Badlein" }).click();
  await expect(page.getByLabel("Aapka / Dukaan ka naam")).toHaveValue("Ramesh Electricals");
});
