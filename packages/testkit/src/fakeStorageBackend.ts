import type { StorageBackend, StoreResult, VerifyResult, BalanceResult, PrepareStorageResult } from "@filecoin-agent/core";
import { TEST_CID } from "./fixtures.js";

export type FakeStorageBackendOptions = {
  cid?: string;
  failUploads?: boolean;
  copyCount?: number;
};

export function createFakeStorageBackend(options: FakeStorageBackendOptions = {}): StorageBackend {
  const stored = new Map<string, Uint8Array>();
  const cid = options.cid ?? TEST_CID;
  const copyCount = options.copyCount ?? 2;

  return {
    async upload(data: Uint8Array): Promise<StoreResult> {
      const timestamp = new Date().toISOString();
      if (options.failUploads) {
        return {
          cid, url: `https://w3s.link/ipfs/${cid}`, size: data.byteLength, timestamp,
          complete: false, filename: "", dealStatus: "failed", provider: "synapse",
          copies: [],
          failedAttempts: [{ providerId: 1, reason: "fake upload failure" }]
        };
      }

      stored.set(cid, data);
      return {
        cid, url: `https://w3s.link/ipfs/${cid}`, size: data.byteLength, timestamp,
        complete: true, filename: "", dealStatus: "active", provider: "synapse",
        copies: Array.from({ length: copyCount }, (_, i) => ({ providerId: i + 1, status: "stored" })),
        failedAttempts: []
      };
    },

    async download(input) {
      return stored.get(input.cid) ?? new Uint8Array();
    },

    async verify(input): Promise<VerifyResult> {
      const exists = stored.has(input.cid);
      return {
        cid: input.cid,
        verified: exists,
        accessible: exists,
        status: exists ? "stored" : "missing",
        copies: exists ? copyCount : 0,
        checkedAt: "2026-05-27T00:00:00.000Z",
        evidence: exists ? [{ type: "dataset", status: "stored", detail: "fake backend has piece" }] : [],
        integrity: exists
      };
    },

    async prepareStorage(): Promise<PrepareStorageResult> {
      return { ready: true, costUsdfc: "0.000002", balanceBefore: "100", allowanceSet: true, message: "fake backend ready" };
    },

    async getBalance(): Promise<BalanceResult> {
      return { balanceUsdfc: "100", balanceFil: "1", pendingPayments: "5", availableUsdfc: "95" };
    }
  };
}
