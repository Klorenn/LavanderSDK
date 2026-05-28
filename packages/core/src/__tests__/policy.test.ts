import { describe, expect, it } from "vitest";
import { createFetcherAgent } from "../agent.js";
import { FetcherError } from "../errors.js";
import type { StorageBackend } from "../types.js";

const backend: StorageBackend = {
  async upload() { throw new Error("backend should not be called"); },
  async download() { return new Uint8Array(); },
  async verify(input) {
    return { ...input, verified: false, status: "missing", copies: 0, checkedAt: new Date(0).toISOString(), evidence: [], integrity: false, accessible: false };
  },
  async prepareStorage() { return { ready: true, costUsdfc: "0", balanceBefore: "0", allowanceSet: true, message: "ready" }; },
  async getBalance() { return { balanceUsdfc: "0", balanceFil: "0", pendingPayments: "0", availableUsdfc: "0" }; }
};

const LONG_TEXT = "This is a test string that needs to be at least 127 bytes long to pass the Filecoin minimum size requirement enforced by the SDK layer.";

describe("spending policy", () => {
  it("blocks paid store operations by default", async () => {
    const agent = createFetcherAgent({ backend, indexDir: "/tmp/fetcher-test-policy" });
    await expect(agent.storeFile({ content: LONG_TEXT, filename: "test.txt" })).rejects.toMatchObject({ code: "SPENDING_POLICY_BLOCKED" });
  });

  it("requires explicit confirmation when configured", async () => {
    const agent = createFetcherAgent({
      backend, indexDir: "/tmp/fetcher-test-policy",
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
    });
    await expect(agent.storeFile({ content: LONG_TEXT, filename: "test.txt" })).rejects.toBeInstanceOf(FetcherError);
  });
});
