import { expect, test } from "@playwright/test";
import { mockExtract, onboard } from "../../phase-0-setup/testing/fixtures";

// Landing page "Browser mic (Web Speech)" option (the default): the mic button listens with the browser's
// SpeechRecognition, and the spoken sentence becomes a bill. Chromium's real recognizer needs a microphone
// and Google's servers, so a fake recognizer stands in for it and says the sentence when it starts.

const SENTENCE =
  "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire aur 500 labour ka bill bana do";

test("browser mic: the spoken sentence becomes a bill, without any speech-to-text request to the server", async ({
  page,
}) => {
  const sttRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/stt")) sttRequests.push(r.url());
  });
  await page.addInitScript((sentence) => {
    const w = window as unknown as { __recLang: string; SpeechRecognition: unknown };
    w.__recLang = "";
    w.SpeechRecognition = class {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror = null;
      onend = null;
      start() {
        w.__recLang = this.lang;
        const say = (text: string, isFinal: boolean) =>
          this.onresult?.({
            results: [Object.assign([{ transcript: text, confidence: 0.9 }], { isFinal })],
          });
        setTimeout(() => say(sentence.split(" ").slice(0, 4).join(" "), false), 100); // interim words first
        setTimeout(() => say(sentence, true), 300);
      }
      stop() {}
      abort() {}
    };
  }, SENTENCE);
  await mockExtract(page);
  await onboard(page);
  await page.goto("/app/");

  await page.getByRole("button", { name: /Bolne ke liye dabaiye/ }).click();
  // The turn ends by itself after the 4 s pause, then the bill is built from the heard words
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235", { timeout: 15_000 });
  expect(await page.evaluate(() => (window as unknown as { __recLang: string }).__recLang)).toMatch(
    /^(hi|en)-IN$/,
  );
  expect(sttRequests).toEqual([]);
});

test("without browser speech recognition the mic says so and the typing box still works", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.SpeechRecognition = undefined;
    w.webkitSpeechRecognition = undefined;
  });
  await mockExtract(page);
  await onboard(page);
  await page.goto("/app/?box=text");
  await expect(page.getByPlaceholder("Likhein ya Wispr Flow se boliye...")).toBeFocused();
  await page.keyboard.insertText(SENTENCE);
  await page.getByRole("button", { name: "Bhejein" }).click();
  await expect(page.getByTestId("bill-total")).toHaveText("₹1,235");
});
