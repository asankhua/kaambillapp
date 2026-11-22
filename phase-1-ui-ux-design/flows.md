# User Flows

Screens = folders in [`../stitch_kaambill_voice_invoicing_app/`](./design/) (IDs from [`../architecture.md` §7.2](../docs/architecture.md)). States = [`../architecture.md` §3](../docs/architecture.md). Data = canonical demo (§7.4).

## 1. Happy path (the demo)

```mermaid
flowchart LR
    H[Home<br/>Tap karke boliye] -->|mic tap| S2[S2 Listening<br/>Sun raha hoon...]
    S2 -->|1.5 s silence| S3[S3 Live bill<br/>Rate check kar raha hoon...]
    S3 -->|wire 15 m amber| S5[S5 15 meter wire, sahi hai?]
    S5 -->|Haan| S3b[S3 Live bill<br/>all rows OK · ₹1,235]
    S3b -->|Total dekhein aur bhejein| S6[S6 Read-back<br/>Verma ji ka total ₹1,235...]
    S6 -->|Haan, bhejo| S7[S7 Share preview<br/>PDF + UPI QR]
    S7 -->|WhatsApp par bhejein| WA[WhatsApp share sheet<br/>worker taps Send]
```

Never: S3 → S7 directly (fix **F1**). Never "bhej diya gaya" before the worker taps Send (fix **F2**).

## 2. Clarification path (unknown price)

```mermaid
flowchart LR
    S3[S3 Live bill<br/>Finolex 2.5mm · ₹ ---] --> S4[S4 Question<br/>Finolex 2.5mm wire ka rate kitna hai?]
    S4 -->|"pachees rupaye meter"<br/>or quick reply ₹25| S3a[S3 row priced<br/>rate saved to card · Naya ✨]
    S4 -->|Baad mein tay karein| S3p[S3 row Pending<br/>cannot finalize]
    S3a --> S6[S6 Read-back]
```

Only **one** question on screen at a time. Priority: unknown price → customer name → amber item → labour (setting).

## 3. Correction path

```mermaid
flowchart LR
    S6[S6 Read-back] -->|"nahi, 20 meter"| S3[S3 wire row updated<br/>highlight]
    S6 -->|Badlav karein| S3
    S3 -->|tap a row ✎| ED[Inline edit qty / price]
    ED --> S3
    S3 --> S6b[S6 Read-back again<br/>new total]
```

## 4. Failure paths

| Trigger                           | Screen                                     | What the user sees                                                                                      | Recovery                            |
| --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Mic permission denied             | **S10a** `kaambill_mic_blocked_fallback`   | "Mic band hai…", Theek karein help, text box open ("Likhein ya Wispr Flow se boliye…"), quick-add chips | Type / dictate with Wispr Flow → S3 |
| No network for `/api/extract`     | **S10b** `kaambill_offline_queue_mode`     | "Internet nahi hai — bill save ho gaya", draft tagged _Queue mein_                                      | Auto-processed when online → S3     |
| `intent: unknown` / garbled audio | **S10c** `kaambill_error_samajh_nahi_aaya` | "Samajh nahi aaya, ek baar phir boliye", noise level, 3 example phrases                                 | Phir se → S2, or tap an example     |

## 5. Other flows

- **First launch:** S1a name → S1b UPI ID (format check only) → S1c seed rate card → Home.
- **Bills tab:** S9 → Paid mark (UPI / cash) · Phir bhejein → S7 · voice: "_Verma ji ka bill paid mark kar do_".
- **Rates tab:** S8 → edit / speak a rate ("_MCB ka rate 200 kar do_", intent `rate_update`).
