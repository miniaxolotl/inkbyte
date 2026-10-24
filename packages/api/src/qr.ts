import QRCode from "qrcode";
import { InkbyteError } from "@lib/shared";

export type QrOptions = {
  size: number;
  margin: number;
  dark: string;
  light: string;
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function qrOptions(input: URLSearchParams): QrOptions {
  const size = Number(input.get("size") ?? 512);
  const margin = Number(input.get("margin") ?? 2);
  const dark = input.get("dark") ?? "#16161a";
  const light = input.get("light") ?? "#ffffff";

  if (!Number.isInteger(size) || size < 128 || size > 2048) {
    throw new InkbyteError("invalid_request", "size must be 128–2048", 400);
  }
  if (!Number.isInteger(margin) || margin < 0 || margin > 10) {
    throw new InkbyteError("invalid_request", "margin must be 0–10", 400);
  }
  if (!HEX.test(dark) || !HEX.test(light)) {
    throw new InkbyteError(
      "invalid_request",
      "dark and light must be hex colors",
      400,
    );
  }
  return { size, margin, dark, light };
}

/** Renders a QR code for a short URL as an SVG string. */
export async function renderQr(url: string, options: QrOptions) {
  return QRCode.toString(url, {
    type: "svg",
    width: options.size,
    margin: options.margin,
    errorCorrectionLevel: "M",
    color: { dark: options.dark, light: options.light },
  });
}
