# Demo and evidence pack (Phase 6)

Everything here is for **you to record**; the app side is ready. Plan: [`../../implementationPlan.md` → Phase 6](../../docs/implementationPlan.md) · [`../../phase-6-quality-demo/`](../).

## 1. 90-second demo video: script

Record on a **real Android phone** (deployed HTTPS URL, installed as an app), near real noise (fan on). Screen recording plus a second camera on the worker's hands if you can.

| Time      | On screen                                                   | Voice-over / action                                                                              |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 0:00–0:10 | Title card → paper bill slip                                | "89 in 100 Indians don't speak English. Tradespeople still bill on paper."                       |
| 0:10–0:15 | KaamBill Home ("Bol ke bill banaiye")                       | Tap the mic.                                                                                     |
| 0:15–0:25 | S2 listening → S3 live bill fills in                        | Speak: _"Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do"_ |
| 0:25–0:35 | S5 amber wire + "15 meter Finolex wire, sahi hai?"          | Say _"haan"_. Point out: only the doubtful item is asked, one question at a time.                |
| 0:35–0:45 | S6 read-back "₹1,235 … WhatsApp par bhej doon?" (on screen) | Say _"haan bhej do"_.                                                                            |
| 0:45–0:60 | S7 share preview → WhatsApp opens → **you tap Send**        | "The app never sends by itself." Show the PDF arriving.                                          |
| 0:60–0:70 | Customer phone scans the QR in GPay/PhonePe                 | Payee shows **Ramesh Electricals**, ₹1,235 pre-filled.                                           |
| 0:70–0:80 | Bills tab → "Verma ji ka bill paid mark kar do" (voice)     | Paid ✓, weekly total.                                                                            |
| 0:80–0:90 | Wispr Flow montage (clips below)                            | "Built hands-free with Wispr Flow."                                                              |

**Backup take:** if the hall is noisy, do the same flow through **Likh Ke** with Wispr Flow dictation (no API key needed).

## 2. Before recording: checklist

- [ ] Deployed to Vercel with `GROQ_API_KEY`, `ALLOWED_ORIGINS` (your Vercel URL), `RATE_LIMIT_PER_MIN`
- [ ] `/api/health` shows `ok: true`
- [ ] Phone: app installed from the URL, mic permission granted, volume up, Do Not Disturb on
- [ ] Onboarded as **Ramesh Electricals**, UPI ID a real one you control (so the QR scan works on camera)
- [ ] Warm up: make 1 throwaway bill first (Groq free tier ≈ 3 requests/min; don't record right after a burst)
- [ ] A second phone with GPay/PhonePe for the QR scan; a WhatsApp contact for "Verma ji"

## 3. Wispr Flow evidence (montage)

One 30–60 s screen clip per phase, showing dictation into a real tool and the result changing:

| Phase | Clip idea                                                                                          | Done |
| ----- | -------------------------------------------------------------------------------------------------- | ---- |
| 0     | Dictating the seed rate card / shared types into the editor                                        | ⬜   |
| 1     | Dictating a Stitch fix prompt (F1–F9) into Google Stitch                                           | ⬜   |
| 2     | Dictating a change request to Claude Code ("add Stop and Cancel to the listening dock")            | ⬜   |
| 3     | Dictating Hinglish few-shot examples into `phase-3-understanding/server/prompts/extract.system.ts` | ⬜   |
| 4     | Dictating matcher test cases ("Phenolex, Hevells, em see bee")                                     | ⬜   |
| 5     | Dictating the WhatsApp message template                                                            | ⬜   |
| 6     | **In the app:** dictating a bill into the Likh Ke box with Flow on the phone                       | ⬜   |

Also capture 2–3 before/after examples of Flow removing filler words ("umm, toh, 2 MCB…" → "2 MCB…").

## 4. Numbers to quote (from the evals)

See [`../eval/results/`](../eval/results/): `phase6.md` (105 sentences, real Groq), `ui-parity.md`, and Lighthouse (mobile): **performance 95, accessibility 100, best practices 100**.
