import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { StorageBackend } from "../types.js";
import type {
  IndexBackend,
  IndexedFile,
  IndexedMemory,
  IndexStats,
  ListFilesOptions,
  ListFilesPage,
  MemoriesPage,
  MemorySummary,
} from "../indexBackend.js";

type IndexData = {
  version: number;
  files: IndexedFile[];
  memories: IndexedMemory[];
};

export class FilecoinIndexBackend implements IndexBackend {
  private readonly backend: StorageBackend;
  private readonly refPath: string;
  private indexCid: string | null = null;
  private cache: IndexData | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private loadPromise: Promise<void> | null = null;

  constructor(backend: StorageBackend, options?: { refPath?: string }) {
    this.backend = backend;
    this.refPath = options?.refPath ?? join(homedir(), ".fetcher", "index-ref");
  }

  private ensureLoaded(): Promise<void> {
    if (this.cache !== null) return Promise.resolve();
    if (!this.loadPromise) this.loadPromise = this._doLoad();
    return this.loadPromise;
  }

  private async _doLoad(): Promise<void> {
    let cid: string | null = process.env.FETCHER_INDEX_CID?.trim() || null;

    if (!cid) {
      try {
        const raw = await readFile(this.refPath, "utf-8");
        cid = raw.trim() || null;
      } catch { /* first run */ }
    }

    if (cid) {
      this.indexCid = cid;
      const bytes = await this.backend.download({ cid });
      this.cache = JSON.parse(new TextDecoder().decode(bytes)) as IndexData;
    } else {
      this.cache = { version: 1, files: [], memories: [] };
    }
  }

  private async _persist(): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(this.cache));
    const result = await this.backend.upload(bytes, { metadata: {}, copies: 1 });
    this.indexCid = result.cid;
    await mkdir(dirname(this.refPath), { recursive: true });
    await writeFile(this.refPath, this.indexCid, "utf-8");
  }

  private persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(() => this._persist());
    return this.writeQueue;
  }

  async addFile(file: IndexedFile): Promise<void> {
    await this.ensureLoaded();
    const idx = this.cache!.files.findIndex(f => f.cid === file.cid);
    if (idx >= 0) { this.cache!.files[idx] = file; } else { this.cache!.files.unshift(file); }
    await this.persist();
  }

  async listFiles(options: ListFilesOptions = {}): Promise<ListFilesPage> {
    await this.ensureLoaded();
    let files = [...this.cache!.files];
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
    const idx = this.cache!.files.findIndex(f => f.cid === cid);
    if (idx < 0) return false;
    this.cache!.files.splice(idx, 1);
    await this.persist();
    return true;
  }

  async storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }> {
    await this.ensureLoaded();
    const idx = this.cache!.memories.findIndex(m => m.agentId === memory.agentId && m.memoryKey === memory.memoryKey);
    const previousCid = idx >= 0 ? this.cache!.memories[idx].cid : undefined;
    const version = idx >= 0 ? this.cache!.memories[idx].version + 1 : 1;
    const stored = { ...memory, version };
    if (idx >= 0) { this.cache!.memories[idx] = stored; } else { this.cache!.memories.push(stored); }
    await this.persist();
    return { previousCid, version };
  }

  async retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null> {
    await this.ensureLoaded();
    const memory = this.cache!.memories.find(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (!memory) return null;
    if (memory.ttlDays) {
      const expiresAt = new Date(memory.timestamp).getTime() + memory.ttlDays * 86400000;
      if (Date.now() > expiresAt) {
        this.cache!.memories = this.cache!.memories.filter(m => !(m.agentId === agentId && m.memoryKey === memoryKey));
        await this.persist();
        return null;
      }
    }
    return memory;
  }

  async listMemories(agentId: string, limit = 50): Promise<MemoriesPage> {
    await this.ensureLoaded();
    const now = Date.now();
    const agentMems = this.cache!.memories
      .filter(m => m.agentId === agentId)
      .filter(m => {
        if (!m.ttlDays) return true;
        return new Date(m.timestamp).getTime() + m.ttlDays * 86400000 > now;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const summaries: MemorySummary[] = agentMems.slice(0, limit).map(m => ({
      memoryKey: m.memoryKey,
      cid: m.cid,
      timestamp: m.timestamp,
      size: JSON.stringify(m.data).length,
    }));
    return { memories: summaries, total: agentMems.length };
  }

  async deleteMemory(agentId: string, memoryKey: string): Promise<boolean> {
    await this.ensureLoaded();
    const idx = this.cache!.memories.findIndex(m => m.agentId === agentId && m.memoryKey === memoryKey);
    if (idx < 0) return false;
    this.cache!.memories.splice(idx, 1);
    await this.persist();
    return true;
  }

  async getStats(agentId?: string): Promise<IndexStats> {
    await this.ensureLoaded();
    const mems = agentId
      ? this.cache!.memories.filter(m => m.agentId === agentId)
      : this.cache!.memories;
    const sorted = [...this.cache!.files].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const tagsSet = new Set<string>();
    let totalSizeBytes = 0;
    for (const f of this.cache!.files) {
      totalSizeBytes += f.size;
      for (const t of f.tags) tagsSet.add(t);
    }
    return {
      totalFiles: this.cache!.files.length,
      totalSizeBytes,
      totalSizeGb: +(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
      totalMemories: mems.length,
      oldestFile: sorted[0]?.timestamp,
      newestFile: sorted[sorted.length - 1]?.timestamp,
      tagsUsed: [...tagsSet],
    };
  }
}
