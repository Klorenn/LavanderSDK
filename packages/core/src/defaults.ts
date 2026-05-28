import type { SpendingPolicy } from "./types.js";

export const DEFAULT_SOURCE = "filecoin-agent-sdk";
export const DEFAULT_NETWORK = "calibration";

export const DEFAULT_SPENDING_POLICY: SpendingPolicy = {
  allowPaidOperations: false,
  maxStorageBytesPerCall: 10 * 1024 * 1024,
  requireConfirmation: true
};
