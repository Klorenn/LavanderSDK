import type { SpendingPolicy } from "./types.js";

export const DEFAULT_SOURCE = "fetcher-fil";
export const DEFAULT_NETWORK = "calibration";

export const DEFAULT_SPENDING_POLICY: SpendingPolicy = {
  allowPaidOperations: false,
  maxStorageBytesPerCall: 10 * 1024 * 1024,
  requireConfirmation: true
};

export const DEFAULT_MIME_TYPE = "text/plain";
export const FILECOIN_MIN_BYTES = 127;

export const MIME_BY_EXT: Record<string, string> = {
  txt: "text/plain", json: "application/json", md: "text/markdown",
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg",
  jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  svg: "image/svg+xml", mp4: "video/mp4", mp3: "audio/mpeg",
  zip: "application/zip", tar: "application/x-tar",
  csv: "text/csv", html: "text/html", xml: "application/xml",
  wasm: "application/wasm", bin: "application/octet-stream",
};

export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
