# Problem Statement — KaamBill

**Hackathon:** India Runs on Voice, a Scaler × Wispr Flow hackathon
**Track:** 04 · Small business
**Built with:** Wispr Flow (hands-free, by voice)

> Related documents in this folder:
>
> - [`architecture.md`](./architecture.md): how KaamBill is built to solve this problem.
> - [`implementationPlan.md`](./implementationPlan.md): the phase-by-phase build plan.

---

## Hackathon Fit

| Hackathon ask                                                           | How KaamBill answers it                                                                                                             |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| _"Tools where voice is the main way in"_                                | The whole bill is made by speaking; the screen is only for checking and fixing.                                                     |
| _"Made for how India lives and works"_                                  | Built for blue-collar workers who mix Hindi and English (Hinglish) with English brand names and Indian number words.                |
| _"Built hands-free with Wispr Flow"_                                    | Specs, prompts and code are dictated with Wispr Flow (see [`architecture.md` §12](./architecture.md)).                              |
| Small business track (example: _"voice bookkeeping for kirana stores"_) | Brings voice bookkeeping to **mobile service workers**, who have no shop counter, no fixed price list on display and no free hands. |

---

## The Problem

India's independent skilled tradespeople (electricians, plumbers, AC and appliance technicians, carpenters, painters and local repair workers) have no practical way to give customers itemized quotes and bills on the job site.

Most work alone, with no office staff. They use Android phones and UPI every day, but billing apps such as Tally, Zoho or Vyapar assume a **keyboard and English**. They need a lot of typing and spread one bill across several screens. A technician who has just finished a job with dusty, wet or greasy hands won't stop to type out line items. So they quote a lump sum out loud or write it on a scrap of paper.

**The language gap is large:** only about **10.6%** of Indians speak English as a first, second or third language (Census of India 2011). So roughly **89 in 100** are left out of English-first software.

## Who Is Affected

- **Primary users:** solo service workers and micro-contractors in India's unincorporated sector: electricians, plumbers, AC and appliance technicians, carpenters, painters and repair workers.
- **Secondary users:** households and small businesses who hire these workers and get no clear, itemized record of what they paid for.

### Market Size

| Level                            | Who                                                                                  | Size                                                             | How it's calculated                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sector**                       | All unincorporated non-farm enterprises in India                                     | **≈ 7.3 crore establishments**, employing **≈ 12 crore workers** | NSO, _Annual Survey of Unincorporated Sector Enterprises (ASUSE) 2023-24_, MoSPI                                                                   |
| **Addressable (target)**         | Enterprises in services that do repair, installation and trade work                  | **≈ 1–1.5 crore**                                                | Assumes about a third of enterprises are in services, and that repair, installation and home-service trades are roughly half of those _(estimate)_ |
| **Initial focus (first market)** | Solo electricians, plumbers and AC technicians with smartphones in Hindi-belt cities | **≈ 10–20 lakh**                                                 | First segment for the Hinglish launch _(estimate)_                                                                                                 |

**Why this matters:** most of these businesses are run by **one person with no hired staff** (own-account enterprises in the ASUSE). So there is nobody else to do the billing.

> **Source notes:**
>
> - The sector figure comes from ASUSE 2023-24 (survey period Oct 2023 – Sep 2024). The earlier ASUSE 2022-23 reported **≈ 6.5 crore** establishments. That explains why both 6.5 and 7.7 crore appear in older sources. **Use 7.3 crore (2023-24) everywhere.**
> - The "addressable" and "initial focus" rows are **our own estimates** from stated assumptions, not official figures.
> - ⚠️ _Check the exact figures and the services share against the MoSPI ASUSE 2023-24 factsheet before submitting._

## What Goes Wrong Today

| Pain point              | What happens                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **No itemized quote**   | Customers haggle over parts at the door because they can't see what each part cost.                                                   |
| **Forgotten add-ons**   | Small fittings, extra wire and visiting charges get left off the bill, and the worker loses that money.                               |
| **Slow payments**       | With no bill and no payment link, collection means days of follow-up calls, and some money is never recovered.                        |
| **No financial record** | Payments aren't recorded anywhere, so workers can't show their income when they apply for formal credit such as MUDRA or PM SVANidhi. |

## Why Existing Tools Don't Work

1. **Typing-heavy screens:** dropdowns, small text fields and entering items one at a time don't fit a worker with busy hands who is rushing to the next job.
2. **Language mismatch:** workers speak in a mix of languages, with regional grammar alongside English brand names, units and Indian number words ("dedh hazaar", "do inch CPVC elbow"). Typing in mixed scripts is slow and error-prone.
3. **Accounting jargon:** words like "SKU", "subtotal" and "ledger" mean nothing to them and put them off.
4. **Typing-based voice add-ons don't help either:** a keyboard mic still makes the user tap through every field. What's missing is software that **understands** a whole spoken job summary, not just one that transcribes it.

## Why Voice Is the Right Interface

- **Hands-free:** the worker can make a bill while packing up tools.
- **Natural language mixing:** speech captures trade shorthand and mixed-language sentences exactly as people actually say them, including switching language mid-sentence.
- **Existing habits:** these workers already run their business over phone calls and WhatsApp voice notes, so there is nothing new to learn.

## Problem Statement (One Line)

> **Solo Indian tradespeople lose money, time and credibility because creating an itemized bill and collecting payment on the job site means typing in English-first apps they can't use with busy hands. They need a way to speak a 15-second job summary in their own mix of languages and get back an accurate, shareable bill with a UPI payment link.**

## Constraints the Solution Must Respect

- **Accuracy over speed:** a misheard amount (₹1,500 heard as ₹500) is costly. Nothing reaches the customer until the worker has seen the total on screen (KaamBill never speaks) and approved it with "haan", and the worker taps **Send** themselves.
- **Noisy environments:** the app has to cope with fans, traffic, power tools and regional accents.
- **Short responses:** on-screen replies stay under two sentences, in the language the worker chose (Hinglish, Hindi or English), so they can be read at a glance.
- **Works on low-end Android phones and patchy mobile data.**
- **Voice first, but text accepted too:** the same flow must also accept dictated or typed text, e.g. from Wispr Flow, for a blocked mic, a weak network or a noisy demo hall.
- **Customer privacy:** customer names and phone numbers are stored only on the worker's device, or kept with clear consent.
- **Honest labelling:** output is a simple **Bill or Estimate**, not a GST tax invoice.

## Prototype Scope (Hackathon)

| In scope for the demo                                                                                                                                                    | Later (roadmap)                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Hinglish, Hindi or English voice (or Wispr Flow / typing) → priced bill → on-screen check → payment details → UPI QR / cash / later → bill (PAID / DUE) → WhatsApp share | Any language other than Hinglish, Hindi and English |
| Editable rate card with 15 seed items                                                                                                                                    | Payment status updated automatically from UPI       |
| One clarifying question at a time; amber chips for uncertain items                                                                                                       | GST invoice mode                                    |
| Text input path (works with Wispr Flow)                                                                                                                                  | Exportable income summary for loan applications     |

> **Reuse note:** the 27–29 Nov build sprint gives every team the same new problem statement. The reusable core (voice → structured data → one clarifying question → read-back → shareable output) is designed to carry over to whatever brief is released.

## What Success Looks Like

1. **Daily habit:** at least 60% of active users create 5 or more voice bills a week.
2. **Speed:** under 25 seconds on average from tapping the mic to the WhatsApp share.
3. **Accuracy:** more than 90% first-pass accuracy on mixed-language hardware names and spoken Indian numbers.
4. **Faster collections:** more than 50% of bills are paid through the embedded UPI link within 24 hours.
