# IndexBackend Abstraction + Critical Defects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the local-only `FetcherIndex` with a pluggable `IndexBackend` interface (three implementations: File, Memory, Filecoin), add binary upload support, fix fabricated deal data, and eliminate silent fallbacks that deceive agents.

**Architecture:** Extract `IndexBackend` interface mirroring the existing `StorageBackend` pattern. `FileIndexBackend` wraps current behavior; `MemoryIndexBackend` lives in testkit for zero-filesystem tests; `FilecoinIndexBackend` stores the index JSON on Filecoin itself — portable across serverless, Docker, and any ephemeral environment. All defects are additive fixes with no breaking changes.

**Tech Stack:** TypeScript (NodeNext ESM), Zod, Vitest, `@filoz/synapse-sdk` (via StorageBackend), Node.js `fs/promises`

---

## File Map

**New files:**
- `packages/core/src/indexBackend.ts` — IndexBackend interface + shared types (IndexedFile, IndexedMemory, etc.)
- `packages/core/src/backends/fileIndexBackend.ts` — current FetcherIndex logic, implementing IndexBackend
- `packages/core/src/backends/filecoinIndexBackend.ts` — Filecoin-backed index
- `packages/core/src/__tests__/fileIndexBackend.test.ts` — FileIndexBackend tests
- `packages/core/src/__tests__/filecoinIndexBackend.test.ts` — FilecoinIndexBackend tests
- `packages/testkit/src/memoryIndexBackend.ts` — in-memory IndexBackend for tests
- `packages/testkit/src/__tests__/memoryIndexBackend.test.ts` — MemoryIndexBackend tests

**Modified files:**
- `packages/core/src/index.ts` — add exports for IndexBackend, FileIndexBackend, FilecoinIndexBackend; remove indexStore export
- `packages/core/src/types.ts` — add `indexBackend` to FetcherConfig; update StoreFileInput (content|data); add optional getDealExpiry/getPricing to StorageBackend; add priceSource to EstimateCostResult
- `packages/core/src/defaults.ts` — add MIME_BY_EXT table + getMimeType helper
- `packages/core/src/schemas.ts` — update storeFileInputSchema for content|data XOR
- `packages/core/src/agent.ts` — use IndexBackend; fix storeFile binary; fix checkDeal/listDeals; fix getProof; fix estimateCost
- `packages/testkit/src/index.ts` — export MemoryIndexBackend
- `packages/testkit/src/fakeStorageBackend.ts` — add getDealExpiry + getPricing stubs
- `packages/core/src/__tests__/agent.test.ts` — switch to MemoryIndexBackend, remove indexDir
- `packages/core/src/__tests__/extended.test.ts` — switch to MemoryIndexBackend, add checkDeal test
- `packages/core/src/__tests__/policy.test.ts` — switch to MemoryIndexBackend
- `packages/core/src/__tests__/schemas.test.ts` — add binary upload + XOR validation tests

**Deleted files:**
- `packages/core/src/indexStore.ts` — replaced by fileIndexBackend.ts + indexBackend.ts

---

## Task 1: IndexBackend Interface

**Files:**
- Create: `packages/core/src/indexBackend.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Create the interface file**

```typescript
// packages/core/src/indexBackend.ts

export type IndexedFile = {
  cid: string;
  filename: string;
  size: number;
  tags: string[];
  timestamp: string;
};

export type IndexedMemory = {
  agentId: string;
  memoryKey: string;
  cid: string;
  data: Record<string, unknown>;
  timestamp: string;
  ttlDays?: number;
  version: number;
};

export type ListFilesOptions = {
  tag?: string;
  limit?: number;
  before?: string;
};

export type ListFilesPage = {
  files: IndexedFile[];
  total: number;
  hasMore: boolean;
};

export type MemorySummary = {
  memoryKey: string;
  cid: string;
  timestamp: string;
  size: number;
};

export type MemoriesPage = {
  memories: MemorySummary[];
  total: number;
};

export type IndexStats = {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeGb: number;
  totalMemories: number;
  oldestFile?: string;
  newestFile?: string;
  tagsUsed: string[];
};

export interface IndexBackend {
  addFile(file: IndexedFile): Promise<void>;
  listFiles(options: ListFilesOptions): Promise<ListFilesPage>;
  removeFile(cid: string): Promise<boolean>;
  storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }>;
  retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null>;
  listMemories(agentId: string, limit?: number): Promise<MemoriesPage>;
  deleteMemory(agentId: string, memoryKey: string): Promise<boolean>;
  getStats(agentId?: string): Promise<IndexStats>;
}
```

- [ ] **Step 2: Export from core index**

Open `packages/core/src/index.ts`. Add this line (keep all existing exports for now):

```typescript
export * from "./indexBackend.js";
```

- [ ] **Step 3: Build to verify types compile**

Run: `npm --workspace packages/core run build`
Expected: exits 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/indexBackend.ts packages/core/src/index.ts
git commit -m "feat(core): add IndexBackend interface and shared index types"
```

---

## Task 2: MemoryIndexBackend

**Files:**
- Create: `packages/testkit/src/memoryIndexBackend.ts`
- Create: `packages/testkit/src/__tests__/memoryIndexBackend.test.ts`
- Modify: `packages/testkit/src/index.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/testkit/src/__tests__/memoryIndexBackend.test.ts

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
});
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm --workspace packages/testkit run test`
Expected: FAIL — `MemoryIndexBackend` not found.

- [ ] **Step 3: Implement MemoryIndexBackend**

```typescript
// packages/testkit/src/memoryIndexBackend.ts

import type {
  IndexBackend, IndexedFile, IndexedMemory,
  ListFilesOptions, ListFilesPage, MemoriesPage, IndexStats
} from "@fetcher-fil/core";

export class MemoryIndexBackend implements IndexBackend {
  private files: IndexedFile[] = [];
  private memories: IndexedMemory[] = [];

  reset(): void {
    this.files = [];
    this.memories = [];
  }

  async addFile(file: IndexedFile): Promise<void> {
    const idx = this.files.findIndex(f => f.cid === file.cid);
    if (idx >= 0) { this.files[idx] = file; } else { this.files.unshift(file); }
  }

  async listFiles(options: ListFilesOptions = {}): Promise<ListFilesPage> {
    let files = [...this.files];
    if (options.tag) files = files.filter(f => f.tags.includes(options.tag!));
    if (options.before) {
      const pivot = new Date(options.before).getTime();
      files = files.filter(f => new Date(f.timestamp).getTime() < pivot);
    }
    files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const total = files.length;
    const limit = options.limit ?? 20;
    const hasMore = files.length > limit;
    return { files: files.slice(0, limit), total, hasMore };
  }

  async removeFile(cid: string): Promise<boolean> {
    const idx = this.files.findIndex(f => f.cid === cid);
    if (idx < 0) return false;
    this.files.splice(idx, 1);
    return true;
  }

  async storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }> {
    const idx = this.memories.findIndex(m => m.agentId === memory.agentId && m.memoryKey === memory.memoryKey);
    const previousCid = idx >= 0 ? this.memories[idx].cid : undefined;
    const version = idx >= 0 ? this.memories[idx].version + 1 : 1;
    memory.version = version;
    if (idx >= 0) { this.memories[idx] = memory; } else { this.memories.push(memory); }
    return { previousCid, version };
  }

  async retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null> {
    const memory = this.memories.find(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (!memory) return null;
    if (memory.ttlDays) {
      const expiresAt = new Date(memory.timestamp).getTime() + memory.ttlDays * 86400000;
      if (Date.now() > expiresAt) {
        this.memories = this.memories.filter(m => !(m.agentId === agentId && m.memoryKey === memoryKey));
        return null;
      }
    }
    return memory;
  }

  async listMemories(agentId: string, limit = 50): Promise<MemoriesPage> {
    const agentMems = this.memories
      .filter(m => m.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      memories: agentMems.slice(0, limit).map(m => ({
        memoryKey: m.memoryKey, cid: m.cid, timestamp: m.timestamp,
        size: JSON.stringify(m.data).length,
      })),
      total: agentMems.length,
    };
  }

  async deleteMemory(agentId: string, memoryKey: string): Promise<boolean> {
    const idx = this.memories.findIndex(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (idx < 0) return false;
    this.memories.splice(idx, 1);
    return true;
  }

  async getStats(agentId?: string): Promise<IndexStats> {
    const mems = agentId ? this.memories.filter(m => m.agentId === agentId) : this.memories;
    const sorted = [...this.files].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const tagsSet = new Set<string>();
    let totalSizeBytes = 0;
    for (const f of this.files) { totalSizeBytes += f.size; for (const t of f.tags) tagsSet.add(t); }
    return {
      totalFiles: this.files.length,
      totalSizeBytes,
      totalSizeGb: +(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
      totalMemories: mems.length,
      oldestFile: sorted[0]?.timestamp,
      newestFile: sorted[sorted.length - 1]?.timestamp,
      tagsUsed: [...tagsSet],
    };
  }
}
```

- [ ] **Step 4: Export from testkit index**

In `packages/testkit/src/index.ts`, add:

```typescript
export * from "./memoryIndexBackend.js";
```

- [ ] **Step 5: Run tests to confirm they pass**

Run: `npm --workspace packages/testkit run test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add packages/testkit/src/memoryIndexBackend.ts packages/testkit/src/__tests__/memoryIndexBackend.test.ts packages/testkit/src/index.ts
git commit -m "feat(testkit): add MemoryIndexBackend for zero-filesystem unit tests"
```

---

## Task 3: FileIndexBackend

**Files:**
- Create: `packages/core/src/backends/fileIndexBackend.ts`
- Create: `packages/core/src/__tests__/fileIndexBackend.test.ts`
- Delete: `packages/core/src/indexStore.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing tests for FileIndexBackend**

```typescript
// packages/core/src/__tests__/fileIndexBackend.test.ts

import { describe, it, expect, beforeEach } from "vitest";
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
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm --workspace packages/core run test -- fileIndexBackend`
Expected: FAIL — `FileIndexBackend` not found.

- [ ] **Step 3: Create FileIndexBackend**

```typescript
// packages/core/src/backends/fileIndexBackend.ts

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type {
  IndexBackend, IndexedFile, IndexedMemory,
  ListFilesOptions, ListFilesPage, MemoriesPage, IndexStats
} from "../indexBackend.js";

type IndexData = {
  version: number;
  files: IndexedFile[];
  memories: IndexedMemory[];
};

export class FileIndexBackend implements IndexBackend {
  private data: IndexData = { version: 1, files: [], memories: [] };
  private readonly filePath: string;
  private loaded = false;

  constructor(indexDir?: string) {
    const dir = indexDir ?? join(homedir(), ".fetcher");
    this.filePath = join(dir, "index.json");
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      this.data = {
        version: parsed.version ?? 1,
        files: Array.isArray(parsed.files) ? parsed.files : [],
        memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      };
    } catch { /* first run */ }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    const dir = this.filePath.split("/").slice(0, -1).join("/");
    await mkdir(dir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  async addFile(file: IndexedFile): Promise<void> {
    await this.ensureLoaded();
    const idx = this.data.files.findIndex(f => f.cid === file.cid);
    if (idx >= 0) { this.data.files[idx] = file; } else { this.data.files.unshift(file); }
    await this.persist();
  }

  async listFiles(options: ListFilesOptions = {}): Promise<ListFilesPage> {
    await this.ensureLoaded();
    let files = [...this.data.files];
    if (options.tag) files = files.filter(f => f.tags.includes(options.tag!));
    if (options.before) {
      const pivot = new Date(options.before).getTime();
      files = files.filter(f => new Date(f.timestamp).getTime() < pivot);
    }
    files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const total = files.length;
    const limit = options.limit ?? 20;
    const hasMore = files.length > limit;
    return { files: files.slice(0, limit), total, hasMore };
  }

  async removeFile(cid: string): Promise<boolean> {
    await this.ensureLoaded();
    const idx = this.data.files.findIndex(f => f.cid === cid);
    if (idx < 0) return false;
    this.data.files.splice(idx, 1);
    await this.persist();
    return true;
  }

  async storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }> {
    await this.ensureLoaded();
    const idx = this.data.memories.findIndex(m => m.agentId === memory.agentId && m.memoryKey === memory.memoryKey);
    const previousCid = idx >= 0 ? this.data.memories[idx].cid : undefined;
    const version = idx >= 0 ? this.data.memories[idx].version + 1 : 1;
    memory.version = version;
    if (idx >= 0) { this.data.memories[idx] = memory; } else { this.data.memories.push(memory); }
    await this.persist();
    return { previousCid, version };
  }

  async retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null> {
    await this.ensureLoaded();
    const memory = this.data.memories.find(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (!memory) return null;
    if (memory.ttlDays) {
      const expiresAt = new Date(memory.timestamp).getTime() + memory.ttlDays * 86400000;
      if (Date.now() > expiresAt) {
        this.data.memories = this.data.memories.filter(m => !(m.agentId === agentId && m.memoryKey === memoryKey));
        await this.persist();
        return null;
      }
    }
    return memory;
  }

  async listMemories(agentId: string, limit = 50): Promise<MemoriesPage> {
    await this.ensureLoaded();
    const agentMems = this.data.memories
      .filter(m => m.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      memories: agentMems.slice(0, limit).map(m => ({
        memoryKey: m.memoryKey, cid: m.cid, timestamp: m.timestamp,
        size: JSON.stringify(m.data).length,
      })),
      total: agentMems.length,
    };
  }

  async deleteMemory(agentId: string, memoryKey: string): Promise<boolean> {
    await this.ensureLoaded();
    const idx = this.data.memories.findIndex(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (idx < 0) return false;
    this.data.memories.splice(idx, 1);
    await this.persist();
    return true;
  }

  async getStats(agentId?: string): Promise<IndexStats> {
    await this.ensureLoaded();
    const mems = agentId ? this.data.memories.filter(m => m.agentId === agentId) : this.data.memories;
    const sorted = [...this.data.files].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const tagsSet = new Set<string>();
    let totalSizeBytes = 0;
    for (const f of this.data.files) { totalSizeBytes += f.size; for (const t of f.tags) tagsSet.add(t); }
    return {
      totalFiles: this.data.files.length,
      totalSizeBytes,
      totalSizeGb: +(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
      totalMemories: mems.length,
      oldestFile: sorted[0]?.timestamp,
      newestFile: sorted[sorted.length - 1]?.timestamp,
      tagsUsed: [...tagsSet],
    };
  }
}
```

- [ ] **Step 4: Update core/src/index.ts — swap indexStore for new exports**

Replace the `export * from "./indexStore.js"` line with:

```typescript
export * from "./indexBackend.js";
export { FileIndexBackend } from "./backends/fileIndexBackend.js";
export { FilecoinIndexBackend } from "./backends/filecoinIndexBackend.js";
```

(Leave `FilecoinIndexBackend` export — it will exist after Task 4. The build will fail until then, so do Task 4 immediately after.)

- [ ] **Step 5: Delete indexStore.ts**

```bash
rm packages/core/src/indexStore.ts
```

- [ ] **Step 6: Run tests**

Run: `npm --workspace packages/core run test -- fileIndexBackend`
Expected: all 5 tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/backends/fileIndexBackend.ts packages/core/src/__tests__/fileIndexBackend.test.ts packages/core/src/index.ts
git rm packages/core/src/indexStore.ts
git commit -m "refactor(core): extract FileIndexBackend from indexStore, implement IndexBackend interface"
```

---

## Task 4: FilecoinIndexBackend

**Files:**
- Create: `packages/core/src/backends/filecoinIndexBackend.ts`
- Create: `packages/core/src/__tests__/filecoinIndexBackend.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/filecoinIndexBackend.test.ts

import { describe, it, expect } from "vitest";
import { FilecoinIndexBackend } from "../backends/filecoinIndexBackend.js";
import { createFakeStorageBackend } from "@fetcher-fil/testkit";

const FILE = { cid: "bafk1", filename: "a.txt", size: 200, tags: ["x"], timestamp: "2026-01-01T00:00:00.000Z" };
const MEMORY = { agentId: "a1", memoryKey: "k1", cid: "bafk2", data: { v: 1 }, timestamp: "2026-01-01T00:00:00.000Z", version: 0 };

describe("FilecoinIndexBackend", () => {
  it("adds and lists files", async () => {
    const idx = new FilecoinIndexBackend(createFakeStorageBackend(), { refPath: null });
    await idx.addFile(FILE);
    const page = await idx.listFiles({});
    expect(page.total).toBe(1);
    expect(page.files[0].cid).toBe("bafk1");
  });

  it("stores and retrieves memory", async () => {
    const idx = new FilecoinIndexBackend(createFakeStorageBackend(), { refPath: null });
    await idx.storeMemory({ ...MEMORY });
    const mem = await idx.retrieveMemory("a1", "k1");
    expect(mem?.data).toEqual({ v: 1 });
  });

  it("persists index on each write (new instance reads same data)", async () => {
    const backend = createFakeStorageBackend();
    const idx1 = new FilecoinIndexBackend(backend, { refPath: null });
    await idx1.addFile(FILE);
    const savedCid = idx1.getIndexCid();
    expect(savedCid).toBeTruthy();

    const idx2 = new FilecoinIndexBackend(backend, { refPath: null, initialCid: savedCid! });
    const page = await idx2.listFiles({});
    expect(page.total).toBe(1);
  });

  it("starts empty when no prior CID", async () => {
    const idx = new FilecoinIndexBackend(createFakeStorageBackend(), { refPath: null });
    const page = await idx.listFiles({});
    expect(page.total).toBe(0);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm --workspace packages/core run test -- filecoinIndexBackend`
Expected: FAIL — `FilecoinIndexBackend` not found.

- [ ] **Step 3: Implement FilecoinIndexBackend**

```typescript
// packages/core/src/backends/filecoinIndexBackend.ts

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { StorageBackend } from "../types.js";
import type {
  IndexBackend, IndexedFile, IndexedMemory,
  ListFilesOptions, ListFilesPage, MemoriesPage, IndexStats
} from "../indexBackend.js";

type IndexData = {
  version: number;
  files: IndexedFile[];
  memories: IndexedMemory[];
};

type FilecoinIndexBackendOptions = {
  refPath: string | null;    // null = no file persistence (test mode)
  initialCid?: string;       // pre-seed CID (for test/recovery)
};

export class FilecoinIndexBackend implements IndexBackend {
  private readonly backend: StorageBackend;
  private readonly refPath: string | null;
  private indexCid: string | null;
  private cache: IndexData | null = null;

  constructor(backend: StorageBackend, options: FilecoinIndexBackendOptions) {
    this.backend = backend;
    this.refPath = options.refPath;
    this.indexCid = options.initialCid ?? null;
  }

  getIndexCid(): string | null {
    return this.indexCid;
  }

  private async load(): Promise<IndexData> {
    if (this.cache) return this.cache;

    let cid = process.env.FETCHER_INDEX_CID ?? this.indexCid;

    if (!cid && this.refPath) {
      try {
        cid = (await readFile(this.refPath, "utf-8")).trim() || null;
      } catch { /* no ref file yet */ }
    }

    if (cid) {
      this.indexCid = cid;
      try {
        const bytes = await this.backend.download({ cid });
        const text = new TextDecoder().decode(bytes);
        const parsed = JSON.parse(text);
        this.cache = {
          version: parsed.version ?? 1,
          files: Array.isArray(parsed.files) ? parsed.files : [],
          memories: Array.isArray(parsed.memories) ? parsed.memories : [],
        };
      } catch {
        this.cache = { version: 1, files: [], memories: [] };
      }
    } else {
      this.cache = { version: 1, files: [], memories: [] };
    }

    return this.cache;
  }

  private async persist(): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(this.cache, null, 2));
    const result = await this.backend.upload(bytes, { metadata: {} });
    this.indexCid = result.cid;

    if (this.refPath) {
      await mkdir(dirname(this.refPath), { recursive: true });
      await writeFile(this.refPath, result.cid, "utf-8");
    }
  }

  async addFile(file: IndexedFile): Promise<void> {
    const data = await this.load();
    const idx = data.files.findIndex(f => f.cid === file.cid);
    if (idx >= 0) { data.files[idx] = file; } else { data.files.unshift(file); }
    await this.persist();
  }

  async listFiles(options: ListFilesOptions = {}): Promise<ListFilesPage> {
    const data = await this.load();
    let files = [...data.files];
    if (options.tag) files = files.filter(f => f.tags.includes(options.tag!));
    if (options.before) {
      const pivot = new Date(options.before).getTime();
      files = files.filter(f => new Date(f.timestamp).getTime() < pivot);
    }
    files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const total = files.length;
    const limit = options.limit ?? 20;
    const hasMore = files.length > limit;
    return { files: files.slice(0, limit), total, hasMore };
  }

  async removeFile(cid: string): Promise<boolean> {
    const data = await this.load();
    const idx = data.files.findIndex(f => f.cid === cid);
    if (idx < 0) return false;
    data.files.splice(idx, 1);
    await this.persist();
    return true;
  }

  async storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }> {
    const data = await this.load();
    const idx = data.memories.findIndex(m => m.agentId === memory.agentId && m.memoryKey === memory.memoryKey);
    const previousCid = idx >= 0 ? data.memories[idx].cid : undefined;
    const version = idx >= 0 ? data.memories[idx].version + 1 : 1;
    memory.version = version;
    if (idx >= 0) { data.memories[idx] = memory; } else { data.memories.push(memory); }
    await this.persist();
    return { previousCid, version };
  }

  async retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null> {
    const data = await this.load();
    const memory = data.memories.find(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (!memory) return null;
    if (memory.ttlDays) {
      const expiresAt = new Date(memory.timestamp).getTime() + memory.ttlDays * 86400000;
      if (Date.now() > expiresAt) {
        data.memories = data.memories.filter(m => !(m.agentId === agentId && m.memoryKey === memoryKey));
        await this.persist();
        return null;
      }
    }
    return memory;
  }

  async listMemories(agentId: string, limit = 50): Promise<MemoriesPage> {
    const data = await this.load();
    const agentMems = data.memories
      .filter(m => m.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      memories: agentMems.slice(0, limit).map(m => ({
        memoryKey: m.memoryKey, cid: m.cid, timestamp: m.timestamp,
        size: JSON.stringify(m.data).length,
      })),
      total: agentMems.length,
    };
  }

  async deleteMemory(agentId: string, memoryKey: string): Promise<boolean> {
    const data = await this.load();
    const idx = data.memories.findIndex(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (idx < 0) return false;
    data.memories.splice(idx, 1);
    await this.persist();
    return true;
  }

  async getStats(agentId?: string): Promise<IndexStats> {
    const data = await this.load();
    const mems = agentId ? data.memories.filter(m => m.agentId === agentId) : data.memories;
    const sorted = [...data.files].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const tagsSet = new Set<string>();
    let totalSizeBytes = 0;
    for (const f of data.files) { totalSizeBytes += f.size; for (const t of f.tags) tagsSet.add(t); }
    return {
      totalFiles: data.files.length,
      totalSizeBytes,
      totalSizeGb: +(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
      totalMemories: mems.length,
      oldestFile: sorted[0]?.timestamp,
      newestFile: sorted[sorted.length - 1]?.timestamp,
      tagsUsed: [...tagsSet],
    };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm --workspace packages/core run test -- filecoinIndexBackend`
Expected: all 4 tests pass.

- [ ] **Step 5: Build core to confirm exports resolve**

Run: `npm --workspace packages/core run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/backends/filecoinIndexBackend.ts packages/core/src/__tests__/filecoinIndexBackend.test.ts
git commit -m "feat(core): add FilecoinIndexBackend — portable index stored on Filecoin"
```

---

## Task 5: Wire IndexBackend into FetcherConfig

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/agent.ts`
- Modify: `packages/core/src/__tests__/agent.test.ts`
- Modify: `packages/core/src/__tests__/extended.test.ts`
- Modify: `packages/core/src/__tests__/policy.test.ts`

- [ ] **Step 1: Update FetcherConfig in types.ts**

In `packages/core/src/types.ts`, find the `FetcherConfig` type and replace it with:

```typescript
export type FetcherConfig = {
  network?: FilecoinNetwork;
  privateKey?: `0x${string}`;
  source?: string;
  spendingPolicy?: Partial<SpendingPolicy>;
  backend?: StorageBackend;
  indexBackend?: IndexBackend;  // explicit backend — takes precedence over indexDir
  indexDir?: string;             // convenience — auto-creates FileIndexBackend
};
```

Add `IndexBackend` to the imports at the top of `types.ts`:

```typescript
import type { IndexBackend } from "./indexBackend.js";
```

- [ ] **Step 2: Update agent.ts to use IndexBackend**

In `packages/core/src/agent.ts`, replace the imports from `indexStore.js`:

```typescript
// Remove this:
import { FetcherIndex } from "./indexStore.js";
import type { IndexedFile, IndexedMemory } from "./indexStore.js";

// Add these:
import type { IndexBackend, IndexedFile, IndexedMemory } from "./indexBackend.js";
import { FileIndexBackend } from "./backends/fileIndexBackend.js";
```

Then replace the index construction at the top of `createFetcherAgent`:

```typescript
// Remove:
const indexDir = config.indexDir ?? join(homedir(), ".fetcher");
const index = new FetcherIndex(indexDir);

// Add:
const index: IndexBackend = config.indexBackend ?? new FileIndexBackend(config.indexDir);
```

Also remove the `join` and `homedir` imports from `node:path` and `node:os` if they are no longer used elsewhere in agent.ts (check — `join` may still be used for `outputPath` in `retrieve`).

- [ ] **Step 3: Update agent.test.ts — switch to MemoryIndexBackend**

Replace the full content of `packages/core/src/__tests__/agent.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { createFetcherAgent } from "../agent.js";
import { createFakeStorageBackend, MemoryIndexBackend, TEST_CID } from "@fetcher-fil/testkit";

const CONTENT = "This is test content that must be at least 127 bytes long to pass the Filecoin minimum size check enforced by the SDK. Extra padding.";

describe("createFetcherAgent — store/retrieve/verify", () => {
  it("stores content and returns a CID with filename", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      indexBackend: new MemoryIndexBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    });

    const result = await agent.storeFile({ content: CONTENT, filename: "hello.txt" });

    expect(result.cid).toBe(TEST_CID);
    expect(result.filename).toBe("hello.txt");
    expect(result.complete).toBe(true);
  });

  it("retrieves bytes by CID", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      indexBackend: new MemoryIndexBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    });

    await agent.storeFile({ content: CONTENT, filename: "test.txt" });
    const result = await agent.retrieve({ cid: TEST_CID });

    expect(new TextDecoder().decode(result.bytes)).toContain("test content");
  });

  it("verifies stored data", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      indexBackend: new MemoryIndexBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    });

    await agent.storeFile({ content: CONTENT, filename: "verify.txt" });
    const result = await agent.verify({ cid: TEST_CID });

    expect(result.verified).toBe(true);
  });
});
```

- [ ] **Step 4: Update extended.test.ts — switch to MemoryIndexBackend**

Replace the `createAgent` helper and all `indexDir` usages in `packages/core/src/__tests__/extended.test.ts`:

```typescript
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
```

(Keep all existing `describe` blocks unchanged — only the `createAgent` helper changes.)

- [ ] **Step 5: Update policy.test.ts — switch to MemoryIndexBackend**

In `packages/core/src/__tests__/policy.test.ts`, replace every occurrence of `indexDir: "/tmp/fetcher-test-policy"` with `indexBackend: new MemoryIndexBackend()`.

Add import at the top:

```typescript
import { MemoryIndexBackend } from "@fetcher-fil/testkit";
```

- [ ] **Step 6: Run all core tests**

Run: `npm --workspace packages/core run test`
Expected: all tests pass, no filesystem side effects.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/agent.ts packages/core/src/__tests__/agent.test.ts packages/core/src/__tests__/extended.test.ts packages/core/src/__tests__/policy.test.ts
git commit -m "feat(core): wire IndexBackend into FetcherConfig, remove filesystem dependency from tests"
```

---

## Task 6: Binary Upload + MIME Detection

**Files:**
- Modify: `packages/core/src/defaults.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/schemas.ts`
- Modify: `packages/core/src/agent.ts`
- Modify: `packages/core/src/__tests__/schemas.test.ts`
- Modify: `packages/core/src/__tests__/agent.test.ts`

- [ ] **Step 1: Write failing tests**

Add to the end of `packages/core/src/__tests__/schemas.test.ts`:

```typescript
  it("accepts binary data input", () => {
    const parsed = storeFileInputSchema.parse({
      data: new Uint8Array([1, 2, 3]),
      filename: "image.png"
    });
    expect(parsed.filename).toBe("image.png");
    expect(parsed.data).toBeInstanceOf(Uint8Array);
  });

  it("rejects when both content and data are provided", () => {
    expect(() => storeFileInputSchema.parse({
      content: "text",
      data: new Uint8Array([1]),
      filename: "f.txt"
    })).toThrow();
  });

  it("rejects when neither content nor data is provided", () => {
    expect(() => storeFileInputSchema.parse({ filename: "f.txt" })).toThrow();
  });
```

Add to `packages/core/src/__tests__/agent.test.ts`:

```typescript
  it("stores binary data and returns a CID", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      indexBackend: new MemoryIndexBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    });

    const binaryData = new Uint8Array(200).fill(0xff);
    const result = await agent.storeFile({ data: binaryData, filename: "photo.png" });

    expect(result.cid).toBe(TEST_CID);
    expect(result.filename).toBe("photo.png");
  });
```

- [ ] **Step 2: Run to confirm failures**

Run: `npm --workspace packages/core run test`
Expected: FAIL on new schema tests and binary agent test.

- [ ] **Step 3: Add MIME_BY_EXT to defaults.ts**

Add to `packages/core/src/defaults.ts`:

```typescript
export const MIME_BY_EXT: Record<string, string> = {
  txt: "text/plain", json: "application/json", md: "text/markdown",
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg",
  jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  svg: "image/svg+xml", mp4: "video/mp4", mp3: "audio/mpeg",
  zip: "application/zip", tar: "application/x-tar",
  csv: "text/csv", html: "text/html", xml: "application/xml",
  wasm: "application/wasm", bin: "application/octet-stream",
};

export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
```

- [ ] **Step 4: Update StoreFileInput in types.ts**

In `packages/core/src/types.ts`, replace `StoreFileInput`:

```typescript
export type StoreFileInput = {
  content?: string;            // text or base64 string
  data?: Uint8Array;           // binary data (Buffer extends Uint8Array)
  filename: string;
  mimeType?: string;
  tags?: string[];
  copies?: number;
  confirmPaidOperation?: boolean;
};
```

- [ ] **Step 5: Update storeFileInputSchema in schemas.ts**

Replace the `storeFileInputSchema` definition in `packages/core/src/schemas.ts`:

```typescript
export const storeFileInputSchema = z.object({
  content: z.string().min(1).optional(),
  data: z.instanceof(Uint8Array).optional(),
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  tags: z.array(z.string().min(1).max(32)).max(10).optional(),
  copies: z.number().int().min(1).max(10).optional(),
  confirmPaidOperation: z.boolean().optional(),
}).refine(
  v => (v.content !== undefined) !== (v.data !== undefined),
  { message: "Provide either content or data, not both and not neither." }
);
```

- [ ] **Step 6: Update storeFile in agent.ts**

Add `getMimeType` to the import from `./defaults.js`:

```typescript
import { DEFAULT_SPENDING_POLICY, FILECOIN_MIN_BYTES, getMimeType } from "./defaults.js";
```

Replace the data construction at the top of the `storeFile` method:

```typescript
async storeFile(input) {
  const parsed = storeFileInputSchema.parse(input);

  let bytes: Uint8Array;
  if (parsed.content !== undefined) {
    bytes = new TextEncoder().encode(parsed.content);
  } else {
    bytes = parsed.data!;
  }

  const mimeType = parsed.mimeType ?? getMimeType(parsed.filename);

  if (bytes.byteLength < FILECOIN_MIN_BYTES) {
    throw new FetcherError(
      "SIZE_TOO_SMALL",
      `Content size ${bytes.byteLength} bytes is below Filecoin minimum of ${FILECOIN_MIN_BYTES} bytes.`
    );
  }

  assertPaidOperationAllowed(policy, bytes.byteLength, parsed.confirmPaidOperation);
  const result = await backend.upload(bytes, { metadata: {}, copies: parsed.copies });
  // ... rest of method unchanged (use `bytes` instead of `data`) ...
```

- [ ] **Step 7: Run all core tests**

Run: `npm --workspace packages/core run test`
Expected: all tests pass including the 3 new schema tests and 1 new binary agent test.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/defaults.ts packages/core/src/types.ts packages/core/src/schemas.ts packages/core/src/agent.ts packages/core/src/__tests__/schemas.test.ts packages/core/src/__tests__/agent.test.ts
git commit -m "feat(core): add binary upload support and MIME detection by file extension"
```

---

## Task 7: Real Deal Data

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/agent.ts`
- Modify: `packages/testkit/src/fakeStorageBackend.ts`
- Modify: `packages/core/src/__tests__/extended.test.ts`

- [ ] **Step 1: Write failing test**

Add to the `describe("extended agent operations")` block in `packages/core/src/__tests__/extended.test.ts`:

```typescript
  describe("checkDeal", () => {
    it("returns dealActive based on real verify call, not fake expiry", async () => {
      const agent = createAgent();
      await agent.storeFile({ content: LONG_TEXT, filename: "deal.txt" });
      const result = await agent.checkDeal({ cid: TEST_CID });

      expect(result.dealActive).toBe(true);
      expect(result.expiryDate).toBeNull();  // honest: Synapse doesn't expose expiry
    });
  });
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm --workspace packages/core run test -- extended`
Expected: FAIL — `expiryDate` is currently a fake date string, not null.

- [ ] **Step 3: Add getDealExpiry to StorageBackend in types.ts**

In `packages/core/src/types.ts`, inside `StorageBackend`, add the optional method:

```typescript
export interface StorageBackend {
  upload(data: Uint8Array, options?: BackendUploadOptions): Promise<StoreResult>;
  download(input: { cid: string; withCDN?: boolean }): Promise<Uint8Array>;
  verify(input: VerifyInput): Promise<VerifyResult>;
  prepareStorage(input: PrepareStorageInput): Promise<PrepareStorageResult>;
  getBalance(): Promise<BalanceResult>;
  getProof?(input: GetProofInput): Promise<ProofResult>;
  getDealExpiry?(cid: string): Promise<string | null>;   // ← new optional
  getPricing?(): Promise<{ costPerGbMonth: string }>;    // ← new optional (Task 8)
}
```

- [ ] **Step 4: Fix checkDeal in agent.ts**

Replace the `checkDeal` method body:

```typescript
async checkDeal(input) {
  const parsed = verifyInputSchema.parse(input);
  const result = await backend.verify(parsed);

  const expiryDate = backend.getDealExpiry
    ? await backend.getDealExpiry(parsed.cid)
    : null;

  return {
    dealActive: result.verified,
    providers: result.evidence.map(e => e.detail).filter(Boolean),
    expiryDate,
    redundancy: result.copies,
    lastProofTimestamp: result.checkedAt,
    nextProofDue: new Date(Date.now() + 3600000).toISOString(),
  };
},
```

- [ ] **Step 5: Fix listDeals in agent.ts**

Replace the `listDeals` method body:

```typescript
async listDeals(input) {
  const page = await index.listFiles({ limit: input?.limit ?? 100 });
  const VERIFY_LIMIT = 20;

  const deals = await Promise.all(
    page.files.map(async (f, i) => {
      if (i < VERIFY_LIMIT) {
        const verifyResult = await backend.verify({ cid: f.cid });
        return {
          cid: f.cid,
          filename: f.filename,
          providers: verifyResult.evidence.map(e => e.detail).filter(Boolean),
          expiry: null,
          costUsdfc: "0",
          status: verifyResult.verified ? "active" : "missing",
          verified: true,
        };
      }
      return {
        cid: f.cid,
        filename: f.filename,
        providers: [],
        expiry: null,
        costUsdfc: "0",
        status: "unverified",
        verified: false,
      };
    })
  );

  return { deals, total: deals.length };
},
```

- [ ] **Step 6: Add getDealExpiry stub to FakeStorageBackend**

In `packages/testkit/src/fakeStorageBackend.ts`, add inside the returned object after `getBalance`:

```typescript
    async getDealExpiry(_cid: string): Promise<string | null> {
      return null;
    },
```

- [ ] **Step 7: Run tests**

Run: `npm --workspace packages/core run test`
Expected: all tests pass including the new checkDeal test.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/agent.ts packages/testkit/src/fakeStorageBackend.ts packages/core/src/__tests__/extended.test.ts
git commit -m "fix(core): checkDeal and listDeals use real verify data, remove fabricated expiry dates"
```

---

## Task 8: Silent Fallback Fixes

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/agent.ts`
- Modify: `packages/testkit/src/fakeStorageBackend.ts`
- Modify: `packages/core/src/__tests__/extended.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `packages/core/src/__tests__/extended.test.ts`:

```typescript
  describe("getProof", () => {
    it("throws NOT_SUPPORTED when backend has no getProof", async () => {
      const agent = createAgent();  // createFakeStorageBackend has no getProof
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
      expect(result.estimatedCostUsdfc).toContain("0.015");
    });
  });
```

- [ ] **Step 2: Run to confirm failures**

Run: `npm --workspace packages/core run test -- extended`
Expected: FAIL — getProof returns `"unavailable"` object, estimateCost has no `priceSource`.

- [ ] **Step 3: Update EstimateCostResult in types.ts**

In `packages/core/src/types.ts`, add two fields to `EstimateCostResult`:

```typescript
export type EstimateCostResult = {
  estimatedCostUsdfc: string;
  costPerGbMonth: string;
  currentBalance: string;
  canAfford: boolean;
  priceSource: "live" | "estimated";   // ← new
  priceAsOf: string;                    // ← new ISO timestamp
  breakdown: {
    storageCost: string;
    retrievalCost: string;
    providerFee: string;
  };
};
```

- [ ] **Step 4: Fix getProof in agent.ts**

Replace the `getProof` method body:

```typescript
async getProof(input) {
  const parsed = getProofInputSchema.parse(input);
  if (!backend.getProof) {
    throw new FetcherError(
      "NOT_SUPPORTED",
      "getProof is not supported by the configured storage backend."
    );
  }
  return backend.getProof(parsed);
},
```

- [ ] **Step 5: Fix estimateCost in agent.ts**

Replace the `estimateCost` method body:

```typescript
async estimateCost(input) {
  const parsed = estimateCostInputSchema.parse(input);
  const copies = parsed.copies ?? 2;
  const days = parsed.durationDays ?? 365;
  const gb = parsed.sizeBytes / (1024 * 1024 * 1024);
  const months = days / 30;
  const priceAsOf = new Date().toISOString();

  let costPerGbMonthRaw = 0.02;
  let priceSource: "live" | "estimated" = "estimated";

  if (backend.getPricing) {
    try {
      const pricing = await backend.getPricing();
      costPerGbMonthRaw = parseFloat(pricing.costPerGbMonth);
      priceSource = "live";
    } catch {
      // fall through to estimated
    }
  }

  const storageCost = gb * costPerGbMonthRaw * months * copies;
  const retrievalCost = storageCost * 0.1;
  const providerFee = storageCost * 0.05;
  const estimated = storageCost + retrievalCost + providerFee;
  const balance = await backend.getBalance();

  return {
    estimatedCostUsdfc: estimated.toFixed(6),
    costPerGbMonth: costPerGbMonthRaw.toString(),
    currentBalance: balance.availableUsdfc ?? "0",
    canAfford: parseFloat(balance.availableUsdfc ?? "0") >= estimated,
    priceSource,
    priceAsOf,
    breakdown: {
      storageCost: storageCost.toFixed(6),
      retrievalCost: retrievalCost.toFixed(6),
      providerFee: providerFee.toFixed(6),
    },
  };
},
```

- [ ] **Step 6: Add getPricing stub to FakeStorageBackend**

In `packages/testkit/src/fakeStorageBackend.ts`, the `getPricing` method is intentionally NOT added — `FakeStorageBackend` should test the `"estimated"` path. The test that needs `getPricing` constructs its own backend inline (already shown in the test above). No changes needed here.

- [ ] **Step 7: Run all tests**

Run: `npm --workspace packages/core run test`
Expected: all tests pass including the 4 new fallback tests.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/agent.ts packages/core/src/__tests__/extended.test.ts
git commit -m "fix(core): getProof throws NOT_SUPPORTED, estimateCost reports priceSource and priceAsOf"
```

---

## Task 9: Full Build + Verification

**Files:**
- Verify: all packages

- [ ] **Step 1: Build all packages**

Run: `npm run build`
Expected: exits 0, no TypeScript errors across all workspaces.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: all tests pass across all packages.

- [ ] **Step 3: Verify no indexStore references remain**

Run: `grep -r "indexStore" packages/ --include="*.ts" -l`
Expected: no output (zero files).

- [ ] **Step 4: Verify no /tmp/fetcher-test paths remain in tests**

Run: `grep -r "/tmp/fetcher-test" packages/ --include="*.ts"`
Expected: no output.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: full build and test verification — IndexBackend refactor complete"
```

---

## Self-Review Notes

**Spec coverage:**
- ✓ IndexBackend interface — Task 1
- ✓ FileIndexBackend — Task 3
- ✓ MemoryIndexBackend — Task 2
- ✓ FilecoinIndexBackend — Task 4
- ✓ Wire into FetcherConfig — Task 5
- ✓ Binary upload + MIME — Task 6
- ✓ Real deal data (checkDeal + listDeals) — Task 7
- ✓ getProof throws NOT_SUPPORTED — Task 8
- ✓ estimateCost priceSource/priceAsOf — Task 8
- ✓ No breaking changes — all existing string/indexDir usage preserved

**Type consistency verified:**
- `IndexBackend` interface defined in Task 1, used in Tasks 2–5
- `IndexedFile`, `IndexedMemory`, `ListFilesPage`, `MemoriesPage`, `IndexStats` all from `indexBackend.ts`
- `getMimeType` defined in Task 6 Step 3, imported in Task 6 Step 6
- `getDealExpiry?` added to `StorageBackend` in Task 7 Step 3, used in Task 7 Step 4
- `getPricing?` added to `StorageBackend` in Task 7 Step 3, used in Task 8 Step 5
- `EstimateCostResult.priceSource` and `.priceAsOf` added in Task 8 Step 3, returned in Task 8 Step 5
