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
