# Finale pitch (3 minutes) + Q&A

> Draft. Rehearse ×3 with a timer. Numbers marked ⚠️ must be checked against the source before the finale.

## The 3 minutes

| Time      | Say                                                                                                                                                                                                                                                           | Show                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 0:00–0:25 | "89 in 100 Indians don't speak English (Census 2011). India's electricians and plumbers still bill on scraps of paper: no itemized bill, haggling at the door, money lost on forgotten parts."                                                                | Photo of a paper bill slip                                                             |
| 0:25–1:35 | **Live demo** (phone, real noise): one Hinglish sentence → live bill → _"15 meter wire, sahi hai?"_ → _"haan"_ → read-back ₹1,235 in Hindi words → _"bhej do"_ → WhatsApp opens → **I tap Send** → customer scans the QR, payee shows **Ramesh Electricals**. | Phone on the projector (backup: the text box with Wispr Flow, then the recorded video) |
| 1:35–2:05 | **Evidence:** on real Groq, 99% field accuracy on 30 Hinglish sentences, **every priced bill total exact** (13/13), extraction in about 1.3 s; works offline; Lighthouse 95/100/100. _(add: 105-sentence and regional results, and real-user quotes)_         | One slide with the numbers                                                             |
| 2:05–2:30 | **Market:** ≈ 7.3 crore unincorporated enterprises ⚠️(ASUSE 2023-24); ≈ 1–1.5 crore repair/install trades (our estimate); first market 10–20 lakh solo electricians/plumbers/AC techs in Hindi-speaking cities.                                               | Funnel slide                                                                           |
| 2:30–2:45 | **Money:** free for the core bill; paid tier (₹49–99/month, to test) for GST invoices, income summaries for MUDRA/PM SVANidhi applications, multi-user teams. Distribution: hardware shops and trade associations.                                            |                                                                                        |
| 2:45–3:00 | "Voice-first, never sends without you, built hands-free with Wispr Flow."                                                                                                                                                                                     | Wispr Flow montage (5 s)                                                               |

## Q&A sheet

| Question                           | Answer                                                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What if it mishears an amount?     | Three guards: uncertain items turn amber and are asked about one at a time; the total is always read back; the worker taps Send. Prices never come from the AI: only the rate card or the worker. |
| Why not just WhatsApp voice notes? | A voice note isn't an itemized bill, has no total, no UPI QR and no record. KaamBill turns the same 15 seconds of speech into all three.                                                          |
| Privacy?                           | Customer names and numbers stay on the phone. The server sees the transcript only (phone numbers masked), never stores audio. In Chrome, browser speech goes to Google.                           |
| Which languages?                   | Hinglish, Hindi and English, by design (99% on 30 Hinglish sentences; _add Hindi/English eval numbers_). One market, done well, before adding more.                                               |
| Cost per bill?                     | About 2,600 tokens per extraction on `openai/gpt-oss-120b` ($0.15/$0.60 per M tokens): well under ₹0.1 per bill. Approvals and confirmations are handled on the phone (no API call).              |
| Competition (Vyapar, Khatabook)?   | They're typing-first ledgers for shops. KaamBill is voice-first for workers in the field, with a read-back safety gate, and builds the bill + payment link in one sentence.                       |
| GST?                               | Today it's a "Bill / Estimate — not a GST tax invoice". GST invoices are the paid tier.                                                                                                           |
| Offline?                           | Rate card, bills, PDF and QR work offline; a spoken bill is queued and processed when the network returns.                                                                                        |
| How is Wispr Flow used?            | We built KaamBill hands-free with the Wispr Flow app (specs, prompts, code, test sentences), and users can dictate into the app's text box with Flow, no API key needed.                          |
| What did real users say?           | _(fill from the user tests)_                                                                                                                                                                      |

## Before going on stage

- `npm run warmup -- https://<your-app>.vercel.app` 10 minutes before (checks `/api/health` + one extraction).
- **Groq quota:** the free tier allows ~3 extractions per minute and has a **daily cap** (we hit long waits after heavy test runs). **Don't run evals on finale day**; consider Groq's Dev tier for the event (your decision).
- Open `https://kaambillapp.onrender.com/app/?demo=1` (canonical profile, bill KB-2026-0042); Khata → **Demo reset** between rehearsals.
- Backups, in order: voice → **Likh Ke** text box with Wispr Flow → recorded video.
