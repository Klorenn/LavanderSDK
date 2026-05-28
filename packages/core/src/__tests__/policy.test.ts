import { describe, expect, it } from "vitest";
import { createFilecoinAgent } from "../agent.js";
import { FilecoinAgentError } from "../errors.js";
import type { StorageBackend } from "../types.js";

const backend: StorageBackend = {
  async upload() {
    throw new Error("backend should not be called");
  },
  async download() {
    return new Uint8Array();
  },
  async verify(input) {
    return { ...input, verified: false, status: "missing", copies: 0, checkedAt: new Date(0).toISOString(), evidence: [] };
  },
  async prepareStorage() {
    return { ready: true, message: "ready" };
  },
  async getBalance() {
    return {};
  }
};

describe("spending policy", () => {
  it("blocks paid store operations by default", async () => {
    const agent = createFilecoinAgent({ backend });

    await expect(agent.storeText({ text: "blocked" })).rejects.toMatchObject({
      code: "SPENDING_POLICY_BLOCKED"
    });
  });

  it("requires explicit confirmation when configured", async () => {
    const agent = createFilecoinAgent({
      backend,
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
    });

    await expect(agent.storeText({ text: "blocked" })).rejects.toBeInstanceOf(FilecoinAgentError);
  });
});
