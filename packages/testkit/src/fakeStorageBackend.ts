import type { StorageBackend, StoreResult, VerifyResult } from "@filecoin-agent/core";
import { TEST_PIECE_CID } from "./fixtures.js";

export type FakeStorageBackendOptions = {
  pieceCid?: string;
  failUploads?: boolean;
  copyCount?: number;
};

export function createFakeStorageBackend(options: FakeStorageBackendOptions = {}): StorageBackend {
  const stored = new Map<string, Uint8Array>();
  const pieceCid = options.pieceCid ?? TEST_PIECE_CID;
  const copyCount = options.copyCount ?? 2;

  return {
    async upload(data: Uint8Array): Promise<StoreResult> {
      if (options.failUploads) {
        return {
          pieceCid,
          size: data.byteLength,
          complete: false,
          copies: [],
          failedAttempts: [{ providerId: 1, reason: "fake upload failure" }]
        };
      }

      stored.set(pieceCid, data);
      return {
        pieceCid,
        size: data.byteLength,
        complete: true,
        copies: Array.from({ length: copyCount }, (_, index) => ({ providerId: index + 1, status: "stored" })),
        failedAttempts: []
      };
    },

    async download(input) {
      return stored.get(input.pieceCid) ?? new Uint8Array();
    },

    async verify(input): Promise<VerifyResult> {
      const exists = stored.has(input.pieceCid);
      return {
        pieceCid: input.pieceCid,
        verified: exists,
        status: exists ? "stored" : "missing",
        copies: exists ? copyCount : 0,
        checkedAt: "2026-05-27T00:00:00.000Z",
        evidence: exists ? [{ type: "dataset", status: "stored", detail: "fake backend has piece" }] : []
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
