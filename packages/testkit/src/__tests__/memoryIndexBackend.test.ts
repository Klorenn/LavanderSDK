import { describe, it, expect, beforeEach } from "vitest";
import { MemoryIndexBackend } from "../memoryIndexBackend.js";

const FILE = { cid: "bafk1", filename: "a.txt", size: 200, tags: ["report"], timestamp: "2026-01-01T00:00:00.000Z" };
const MEMORY = { agentId: "agent-1", memoryKey: "prefs", cid: "bafk2", data: { lang: "es" }, timestamp: "2026-01-01T00:00:00.000Z", version: 0 };

describe("MemoryIndexBackend", () => {
  let idx: MemoryIndexBackend;
  beforeEach(() => { idx = new MemoryIndexBackend(); });

  it("stores and lists files", async () => {
    await idx.addFile(FILE);
    const page = await idx.listFiles({});
    expect(page.total).toBe(1);
    expect(page.files[0].cid).toBe("bafk1");
  });

  it("filters files by tag", async () => {
    await idx.addFile(FILE);
    await idx.addFile({ ...FILE, cid: "bafk9", tags: ["other"] });
    const page = await idx.listFiles({ tag: "report" });
    expect(page.files).toHaveLength(1);
  });

  it("removes a file by cid", async () => {
    await idx.addFile(FILE);
    const removed = await idx.removeFile("bafk1");
    expect(removed).toBe(true);
    expect((await idx.listFiles({})).total).toBe(0);
  });

  it("returns false when removing non-existent cid", async () => {
    expect(await idx.removeFile("nope")).toBe(false);
  });

  it("stores and retrieves memory with versioning", async () => {
    const { version } = await idx.storeMemory({ ...MEMORY });
    expect(version).toBe(1);
    const mem = await idx.retrieveMemory("agent-1", "prefs");
    expect(mem?.data).toEqual({ lang: "es" });
  });

  it("increments version on second store", async () => {
    await idx.storeMemory({ ...MEMORY });
    const { version, previousCid } = await idx.storeMemory({ ...MEMORY, cid: "bafk3", data: { lang: "en" } });
    expect(version).toBe(2);
    expect(previousCid).toBe("bafk2");
  });

  it("returns null for missing memory", async () => {
    expect(await idx.retrieveMemory("ghost", "key")).toBeNull();
  });

  it("respects TTL expiry", async () => {
    const expired = {
      ...MEMORY,
      ttlDays: 1,
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
    };
    await idx.storeMemory(expired);
    expect(await idx.retrieveMemory("agent-1", "prefs")).toBeNull();
  });

  it("deletes memory", async () => {
    await idx.storeMemory({ ...MEMORY });
    expect(await idx.deleteMemory("agent-1", "prefs")).toBe(true);
    expect(await idx.retrieveMemory("agent-1", "prefs")).toBeNull();
  });

  it("returns stats", async () => {
    await idx.addFile(FILE);
    await idx.storeMemory({ ...MEMORY });
    const stats = await idx.getStats();
    expect(stats.totalFiles).toBe(1);
    expect(stats.totalMemories).toBe(1);
    expect(stats.tagsUsed).toContain("report");
  });

  it("does not mutate caller object in storeMemory", async () => {
    const mem = { ...MEMORY };
    const originalVersion = mem.version;
    await idx.storeMemory(mem);
    expect(mem.version).toBe(originalVersion); // caller's copy must not be mutated
  });

  it("getStats filters by agentId", async () => {
    await idx.storeMemory({ ...MEMORY, agentId: "agent-1" });
    await idx.storeMemory({ ...MEMORY, agentId: "agent-2", memoryKey: "other" });
    const stats = await idx.getStats("agent-1");
    expect(stats.totalMemories).toBe(1);
  });

  it("listFiles respects before cursor", async () => {
    await idx.addFile({ ...FILE, cid: "old", timestamp: "2026-01-01T00:00:00.000Z" });
    await idx.addFile({ ...FILE, cid: "new", timestamp: "2026-06-01T00:00:00.000Z" });
    const page = await idx.listFiles({ before: "2026-03-01T00:00:00.000Z" });
    expect(page.files).toHaveLength(1);
    expect(page.files[0].cid).toBe("old");
  });

  it("listFiles respects limit and sets hasMore", async () => {
    await idx.addFile({ ...FILE, cid: "a" });
    await idx.addFile({ ...FILE, cid: "b" });
    await idx.addFile({ ...FILE, cid: "c" });
    const page = await idx.listFiles({ limit: 2 });
    expect(page.files).toHaveLength(2);
    expect(page.hasMore).toBe(true);
  });

  it("listMemories excludes TTL-expired entries", async () => {
    const expired = { ...MEMORY, ttlDays: 1, timestamp: new Date(Date.now() - 2 * 86400000).toISOString() };
    await idx.storeMemory(expired);
    const result = await idx.listMemories("agent-1");
    expect(result.total).toBe(0);
    expect(result.memories).toHaveLength(0);
  });
});
