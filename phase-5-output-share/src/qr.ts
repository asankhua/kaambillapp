import QRCode from "qrcode";

/** QR for the UPI link, generated on the device (error correction M, phase-5 §1.2). */
export const qrDataUrl = (text: string, size = 320) =>
  QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: { dark: "#141B2B", light: "#FFFFFF" },
  });
