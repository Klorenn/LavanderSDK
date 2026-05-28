import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileIndexBackend } from "../backends/fileIndexBackend.js";

const FILE = { cid: "bafk1", filename: "a.txt", size: 200, tags: ["report"], timestamp: "2026-01-01T00:00:00.000Z" };
const MEMORY = { agentId: "agent-1", memoryKey: "prefs", cid: "bafk2", data: { lang: "es" }, timestamp: "2026-01-01T00:00:00.000Z", version: 0 };

describe("FileIndexBackend", () => {
  let dir: string;
  let idx: FileIndexBackend;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "fetcher-test-"));
    idx = new FileIndexBackend(dir);
  });

  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("persists files across instances", async () => {
    await idx.addFile(FILE);
    const idx2 = new FileIndexBackend(dir);
    const page = await idx2.listFiles({});
    expect(page.total).toBe(1);
    expect(page.files[0].cid).toBe("bafk1");
  });

  it("stores and retrieves memory", async () => {
    await idx.storeMemory({ ...MEMORY });
    const mem = await idx.retrieveMemory("agent-1", "prefs");
    expect(mem?.data).toEqual({ lang: "es" });
  });

  it("removes file returns true on success", async () => {
    await idx.addFile(FILE);
    expect(await idx.removeFile("bafk1")).toBe(true);
  });

  it("returns false when removing non-existent cid", async () => {
    expect(await idx.removeFile("ghost")).toBe(false);
  });

  it("returns stats", async () => {
    await idx.addFile(FILE);
    const stats = await idx.getStats();
    expect(stats.totalFiles).toBe(1);
  });

  it("lists memories for an agent, excluding other agents", async () => {
    await idx.storeMemory({ ...MEMORY });
    await idx.storeMemory({ agentId: "agent-1", memoryKey: "prefs2", cid: "bafk3", data: { x: 1 }, timestamp: "2026-01-02T00:00:00.000Z", version: 0 });
    await idx.storeMemory({ agentId: "agent-2", memoryKey: "prefs", cid: "bafk4", data: {}, timestamp: "2026-01-01T00:00:00.000Z", version: 0 });
    const page = await idx.listMemories("agent-1");
    expect(page.total).toBe(2);
    expect(page.memories.map(m => m.memoryKey).sort()).toEqual(["prefs", "prefs2"]);
  });

  it("deletes memory and subsequent retrieve returns null", async () => {
    await idx.storeMemory({ ...MEMORY });
    expect(await idx.deleteMemory("agent-1", "prefs")).toBe(true);
    expect(await idx.retrieveMemory("agent-1", "prefs")).toBeNull();
  });

  it("deleteMemory returns false for missing key", async () => {
    expect(await idx.deleteMemory("agent-1", "nonexistent")).toBe(false);
  });

  it("serializes concurrent writes without data loss", async () => {
    const writes = Array.from({ length: 5 }, (_, i) =>
      idx.addFile({ cid: `bafk${i}`, filename: `f${i}.txt`, size: 100, tags: [], timestamp: new Date().toISOString() })
    );
    await Promise.all(writes);
    const idx2 = new FileIndexBackend(dir);
    const page = await idx2.listFiles({ limit: 10 });
    expect(page.total).toBe(5);
  });
});
