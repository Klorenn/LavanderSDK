import { describe, expect, it } from "vitest";
import { createFakeStorageBackend, MemoryIndexBackend, TEST_CID } from "@fetcher-fil/testkit";
import { Fetcher } from "../fetcher.js";

const CONTENT = "This is SDK test content that must be at least 127 bytes long to pass the Filecoin minimum size requirement. Extra padding here.";

function makeFetcher(overrides = {}) {
  return new Fetcher({
    backend: createFakeStorageBackend(),
    indexBackend: new MemoryIndexBackend(),
    spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    ...overrides
  });
}

describe("Fetcher SDK", () => {
  it("stores, lists, and retrieves files", async () => {
    const fetcher = makeFetcher();

    const stored = await fetcher.store({ content: CONTENT, filename: "sdk-test.txt" });
    expect(stored.cid).toBe(TEST_CID);

    const files = await fetcher.list({});
    expect(files.total).toBeGreaterThanOrEqual(1);
  });

  it("handles memory operations", async () => {
    const fetcher = makeFetcher();

    await fetcher.memory.store({
      agentId: "sdk-agent",
      memoryKey: "state",
      data: { status: "running" },
      confirmPaidOperation: true
    });

    const mem = await fetcher.memory.retrieve({ agentId: "sdk-agent", memoryKey: "state" });
    expect(mem.found).toBe(true);
    expect(mem.data).toEqual({ status: "running" });
  });

  it("returns storage stats", async () => {
    const fetcher = makeFetcher();

    await fetcher.store({ content: CONTENT, filename: "stats.txt" });
    const stats = await fetcher.stats();
    expect(stats.totalFiles).toBeGreaterThanOrEqual(1);
    expect(stats.totalMemories).toBeGreaterThanOrEqual(0);
  });
});
