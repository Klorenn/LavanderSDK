import { describe, expect, it } from "vitest";
import { createFetcherAgent } from "../agent.js";
import { createFakeStorageBackend, MemoryIndexBackend, TEST_CID } from "@fetcher-fil/testkit";
import { FetcherError } from "../errors.js";

const LONG_TEXT = "This is test content that needs to be at least 127 bytes long to pass the Filecoin minimum size requirement enforced at the SDK layer.";

function createAgent(overrides = {}) {
  return createFetcherAgent({
    backend: createFakeStorageBackend(),
    indexBackend: new MemoryIndexBackend(),
    spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    ...overrides
  });
}

describe("extended agent operations", () => {
  describe("listFiles", () => {
    it("returns indexed files", async () => {
      const agent = createAgent();
      await agent.storeFile({ content: LONG_TEXT, filename: "a.txt", tags: ["tag1"] });

      const result = await agent.listFiles({});
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.files[0].filename).toBe("a.txt");
    });

    it("filters by tag", async () => {
      const agent = createAgent();
      await agent.storeFile({ content: LONG_TEXT, filename: "a.txt", tags: ["tag1"] });
      await agent.storeFile({ content: LONG_TEXT, filename: "b.txt", tags: ["tag2"] });

      const result = await agent.listFiles({ tag: "tag1" });
      expect(result.files.every((f) => f.tags.includes("tag1"))).toBe(true);
    });
  });

  describe("deleteFile", () => {
    it("removes file from index", async () => {
      const agent = createAgent();
      await agent.storeFile({ content: LONG_TEXT, filename: "del.txt" });

      const result = await agent.deleteFile({ cid: TEST_CID, confirm: true });
      expect(result.removedFromIndex).toBe(true);
    });

    it("returns removedFromIndex=false for unknown CID", async () => {
      const agent = createAgent();
      const result = await agent.deleteFile({ cid: "nonexistent", confirm: true });
      expect(result.removedFromIndex).toBe(false);
    });
  });

  describe("memory operations", () => {
    it("stores and retrieves memory", async () => {
      const agent = createAgent();
      await agent.storeMemory({
        agentId: "test-agent",
        memoryKey: "prefs",
        data: { theme: "dark", lang: "es" },
        confirmPaidOperation: true
      });

      const result = await agent.retrieveMemory({ agentId: "test-agent", memoryKey: "prefs" });
      expect(result.found).toBe(true);
      expect(result.data).toEqual({ theme: "dark", lang: "es" });
    });

    it("returns fallback when memory not found", async () => {
      const agent = createAgent();
      const result = await agent.retrieveMemory({
        agentId: "ghost",
        memoryKey: "nope",
        fallback: { exists: false }
      });
      expect(result.found).toBe(false);
      expect(result.data).toEqual({ exists: false });
    });

    it("updates memory patch", async () => {
      const agent = createAgent();
      await agent.storeMemory({
        agentId: "test-agent",
        memoryKey: "config",
        data: { a: 1, b: 2 },
        confirmPaidOperation: true
      });

      const result = await agent.updateMemory({
        agentId: "test-agent",
        memoryKey: "config",
        patch: { b: 99, c: 3 },
        confirmPaidOperation: true
      });

      expect(result.updatedFields).toContain("b");
      expect(result.updatedFields).toContain("c");

      const retrieved = await agent.retrieveMemory({ agentId: "test-agent", memoryKey: "config" });
      expect(retrieved.data).toEqual({ a: 1, b: 99, c: 3 });
    });

    it("throws on update of nonexistent memory", async () => {
      const agent = createAgent();
      await expect(agent.updateMemory({
        agentId: "ghost",
        memoryKey: "nope",
        patch: { x: 1 },
        confirmPaidOperation: true
      })).rejects.toBeInstanceOf(FetcherError);
    });
  });

  describe("checkDeal", () => {
    it("returns dealActive based on real verify, not fake expiry", async () => {
      const agent = createAgent();
      await agent.storeFile({ content: LONG_TEXT, filename: "deal.txt" });
      const result = await agent.checkDeal({ cid: TEST_CID });
      expect(result.dealActive).toBe(true);
      expect(result.expiryDate).toBeNull();
    });
  });

  describe("getProof", () => {
    it("throws NOT_SUPPORTED when backend has no getProof", async () => {
      const agent = createAgent();
      await expect(agent.getProof({ cid: TEST_CID })).rejects.toMatchObject({
        code: "NOT_SUPPORTED",
      });
    });

    it("returns proof when backend supports it", async () => {
      const backendWithProof = {
        ...createFakeStorageBackend(),
        async getProof() {
          return { proof: "abc123", proofType: "PDP", verifiedAt: new Date().toISOString(), provider: "synapse" };
        },
      };
      const agent = createFetcherAgent({
        backend: backendWithProof,
        indexBackend: new MemoryIndexBackend(),
        spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
      });
      const result = await agent.getProof({ cid: TEST_CID });
      expect(result.proof).toBe("abc123");
    });
  });

  describe("estimateCost", () => {
    it("returns priceSource=estimated when backend has no getPricing", async () => {
      const agent = createAgent();
      const result = await agent.estimateCost({ sizeBytes: 1024 * 1024 });
      expect(result.priceSource).toBe("estimated");
      expect(result.priceAsOf).toBeTruthy();
    });

    it("returns priceSource=live when backend provides pricing", async () => {
      const backendWithPricing = {
        ...createFakeStorageBackend(),
        async getPricing() { return { costPerGbMonth: "0.015" }; },
      };
      const agent = createFetcherAgent({
        backend: backendWithPricing,
        indexBackend: new MemoryIndexBackend(),
        spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
      });
      const result = await agent.estimateCost({ sizeBytes: 1024 * 1024 * 1024 });
      expect(result.priceSource).toBe("live");
      expect(result.costPerGbMonth).toBe("0.015");
    });
  });
});
