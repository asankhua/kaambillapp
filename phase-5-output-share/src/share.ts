/**
 * Share to WhatsApp (architecture.md §5.7). The app NEVER sends: it opens the share sheet /
 * WhatsApp with the bill ready, and the worker taps Send.
 *   1. Web Share API Level 2 with the PDF file (Android Chrome)
 *   2. fallback: wa.me link with the message text (+ the PDF can be downloaded separately)
 */
export type ShareResult = "share_sheet" | "whatsapp_link" | "cancelled";

export function waMeLink(message: string, phone?: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const intl = digits.length === 10 ? `91${digits}` : digits; // Indian 10-digit → +91
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export async function shareBill(
  {
    pdf,
    fileName,
    message,
    phone,
  }: { pdf: Blob; fileName: string; message: string; phone?: string | null },
  nav: Pick<Navigator, "share" | "canShare"> | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator,
  open: (url: string) => void = (url) => window.open(url, "_blank", "noopener"),
): Promise<ShareResult> {
  const file = new File([pdf], fileName, { type: "application/pdf" });
  if (nav?.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: message, title: fileName });
      return "share_sheet";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      // fall through to WhatsApp link
    }
  }
  open(waMeLink(message, phone));
  return "whatsapp_link";
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
