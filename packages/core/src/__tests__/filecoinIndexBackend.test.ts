import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFakeStorageBackend } from "@fetcher-fil/testkit";
import { FilecoinIndexBackend } from "../backends/filecoinIndexBackend.js";

const FILE = { cid: "bafk1", filename: "a.txt", size: 200, tags: ["report"], timestamp: "2026-01-01T00:00:00.000Z" };
const MEM  = { agentId: "agent-1", memoryKey: "prefs", cid: "bafk2", data: { lang: "es" }, timestamp: "2026-01-01T00:00:00.000Z", version: 0 };

describe("FilecoinIndexBackend", () => {
  let dir: string;
  let idx: FilecoinIndexBackend;
  let storage: ReturnType<typeof createFakeStorageBackend>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "fetcher-fcidx-"));
    storage = createFakeStorageBackend();
    idx = new FilecoinIndexBackend(storage, { refPath: join(dir, "index-ref") });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    delete process.env.FETCHER_INDEX_CID;
  });

  it("addFile then listFiles returns the file", async () => {
    await idx.addFile(FILE);
    const page = await idx.listFiles({});
    expect(page.total).toBe(1);
    expect(page.files[0].cid).toBe("bafk1");
  });

  it("storeMemory then retrieveMemory returns data", async () => {
    await idx.storeMemory({ ...MEM });
    const mem = await idx.retrieveMemory("agent-1", "prefs");
    expect(mem?.data).toEqual({ lang: "es" });
  });

  it("removeFile returns true then file is gone", async () => {
    await idx.addFile(FILE);
    expect(await idx.removeFile("bafk1")).toBe(true);
    const page = await idx.listFiles({});
    expect(page.total).toBe(0);
  });

  it("deleteMemory returns true then memory is null", async () => {
    await idx.storeMemory({ ...MEM });
    expect(await idx.deleteMemory("agent-1", "prefs")).toBe(true);
    expect(await idx.retrieveMemory("agent-1", "prefs")).toBeNull();
  });

  it("listMemories excludes other agents", async () => {
    await idx.storeMemory({ ...MEM });
    await idx.storeMemory({ agentId: "agent-1", memoryKey: "cfg", cid: "bafk3", data: {}, timestamp: "2026-01-02T00:00:00.000Z", version: 0 });
    await idx.storeMemory({ agentId: "agent-2", memoryKey: "prefs", cid: "bafk4", data: {}, timestamp: "2026-01-01T00:00:00.000Z", version: 0 });
    const page = await idx.listMemories("agent-1");
    expect(page.total).toBe(2);
    expect(page.memories.every(m => m.memoryKey !== undefined)).toBe(true);
  });

  it("getStats totalFiles and totalMemories", async () => {
    await idx.addFile(FILE);
    await idx.addFile({ cid: "bafk5", filename: "b.txt", size: 100, tags: [], timestamp: "2026-01-02T00:00:00.000Z" });
    await idx.storeMemory({ ...MEM });
    const stats = await idx.getStats();
    expect(stats.totalFiles).toBe(2);
    expect(stats.totalMemories).toBe(1);
  });

  it("persists across instances via shared storage", async () => {
    await idx.addFile(FILE);
    const refPath = join(dir, "index-ref");
    const idx2 = new FilecoinIndexBackend(storage, { refPath });
    const page = await idx2.listFiles({});
    expect(page.total).toBe(1);
    expect(page.files[0].cid).toBe("bafk1");
  });

  it("concurrent writes do not lose data", async () => {
    const writes = Array.from({ length: 4 }, (_, i) =>
      idx.addFile({ cid: `bafkC${i}`, filename: `f${i}.txt`, size: 10, tags: [], timestamp: new Date().toISOString() })
    );
    await Promise.all(writes);
    const page = await idx.listFiles({ limit: 10 });
    expect(page.total).toBe(4);
  });
});
