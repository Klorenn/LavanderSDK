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
});
