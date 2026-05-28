import { describe, expect, it } from "vitest";
import { createFilecoinAgent } from "../agent.js";
import type { StorageBackend, StoreResult, VerifyResult } from "../types.js";

const pieceCid = "bafkzcibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function createBackend(): StorageBackend {
  const stored = new Map<string, Uint8Array>();

  return {
    async upload(data: Uint8Array): Promise<StoreResult> {
      stored.set(pieceCid, data);
      return {
        pieceCid,
        size: data.byteLength,
        complete: true,
        copies: [{ providerId: 1, status: "stored" }, { providerId: 2, status: "stored" }],
        failedAttempts: []
      };
    },
    async download() {
      return stored.get(pieceCid) ?? new Uint8Array();
    },
    async verify(): Promise<VerifyResult> {
      return {
        pieceCid,
        verified: stored.has(pieceCid),
        status: stored.has(pieceCid) ? "stored" : "missing",
        copies: stored.has(pieceCid) ? 2 : 0,
        checkedAt: "2026-05-27T00:00:00.000Z",
        evidence: [{ type: "dataset", status: "stored", detail: "fake backend has piece" }]
      };
    },
    async prepareStorage() {
      return { ready: true, message: "fake backend ready" };
    },
    async getBalance() {
      return { fil: "1", usdfc: "1", runwayDays: 30 };
    }
  };
}

describe("createFilecoinAgent", () => {
  it("stores text through the configured backend", async () => {
    const agent = createFilecoinAgent({
      backend: createBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    const result = await agent.storeText({ text: "hello filecoin" });

    expect(result.pieceCid).toBe(pieceCid);
    expect(result.size).toBe(new TextEncoder().encode("hello filecoin").byteLength);
    expect(result.complete).toBe(true);
  });

  it("retrieves bytes by PieceCID", async () => {
    const agent = createFilecoinAgent({
      backend: createBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    await agent.storeText({ text: "retrievable" });
    const result = await agent.retrieve({ pieceCid });

    expect(new TextDecoder().decode(result.bytes)).toBe("retrievable");
  });

  it("verifies stored data", async () => {
    const agent = createFilecoinAgent({
      backend: createBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    await agent.storeText({ text: "verify me" });
    const result = await agent.verify({ pieceCid });

    expect(result.verified).toBe(true);
    expect(result.status).toBe("stored");
  });
});
