import type { Page } from "@playwright/test";

const base = {
  docType: "Bill",
  language: "hi-Latn",
  customerName: null,
  items: [],
  laborCharge: null,
  visitingCharge: null,
  discount: null,
  intent: "new_job",
  historyAction: null,
};
const item = (
  name: string,
  qtySpoken: string | null,
  qty: number | null,
  unit: string | null,
  extra: Record<string, unknown> = {},
) => ({ raw: name, name, qtySpoken, qty, unit, spokenUnitPrice: null, confidence: 0.95, ...extra });

/** Extractions as Groq returned them in the Phase 3 eval, keyed by what the user typed. */
const RESPONSES: [RegExp, object][] = [
  [
    /^Verma ji ke ghar 2 Havells MCB/,
    {
      ...base,
      customerName: "Verma ji",
      items: [
        item("Havells MCB", "2", 2, null),
        item("Finolex wire", "15", 15, "meter", { confidence: 0.75 }),
      ],
      laborCharge: 500,
    },
  ],
  [
    /Finolex 2\.5mm/,
    {
      ...base,
      customerName: "Verma ji",
      items: [item("Finolex wire 2.5mm", "20", 20, "meter")],
      laborCharge: 500,
    },
  ],
  [
    /pachees rupaye/,
    {
      ...base,
      intent: "add_info",
      items: [item("Finolex wire 2.5mm", null, null, "meter", { spokenUnitPrice: 25 })],
    },
  ],
  [/labour 700/, { ...base, intent: "correct", laborCharge: 700 }],
  [
    /वर्मा/,
    {
      ...base,
      language: "hi",
      customerName: "Verma ji",
      items: [
        item("Havells MCB", "दो", 2, null),
        item("Finolex wire", "पंद्रह", 15, "मीटर", { confidence: 0.75 }),
      ],
      laborCharge: 500,
    },
  ],
  [
    /^Sharma ji's house/,
    {
      ...base,
      language: "en-IN",
      customerName: "Sharma ji",
      items: [
        item("Havells MCB", "two", 2, null),
        item("Finolex wire", "fifteen", 15, "meter", { confidence: 0.75 }),
      ],
      laborCharge: 500,
    },
  ],
  [
    /paid mark kar do/,
    {
      ...base,
      intent: "history",
      historyAction: { action: "mark_paid", customer: "Verma ji", when: null, paidVia: "cash" },
    },
  ],
];

export async function mockExtract(page: Page) {
  const calls: string[] = [];
  await page.route("**/api/extract", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as { turn: { text: string } };
    calls.push(body.turn.text);
    const hit = RESPONSES.find(([re]) => re.test(body.turn.text));
    await route.fulfill({
      json: {
        extraction: hit ? hit[1] : { ...base, intent: "unknown" },
        meta: { model: "mock", ms: 1 },
      },
    });
  });
  return calls;
}

/** Complete the 3-step onboarding (S1a–c) with the canonical demo profile. */
export async function onboard(page: Page) {
  await page.goto("/");
  await page.getByLabel("Aapka / Dukaan ka naam").fill("Ramesh Electricals");
  await page.getByRole("button", { name: "Aage badhein →" }).click();
  await page.getByLabel("UPI ID").fill("ramesh@okaxis");
  await page.getByRole("button", { name: "Aage →" }).click();
  await page.getByRole("button", { name: "Shuru karein" }).click();
  await page.getByText("Bol ke bill banaiye").waitFor();
}

/**
 * The text box (typing / Wispr Flow) is hidden until the worker taps "Likh ke daalein"
 * ("Type it in" / "लिख के डालें") or "Likh ke" on a question. Open it if needed and return it.
 */
export async function textBox(page: Page, placeholder = "Likhein ya Wispr Flow se boliye...") {
  const box = page.getByPlaceholder(placeholder);
  if (!(await box.isVisible())) {
    await page
      .getByRole("button", { name: /^(Likh ke daalein|Type it in|लिख के डालें|Likh ke|Type|लिख के)$/ })
      .first()
      .click();
    await box.waitFor();
  }
  return box;
}
