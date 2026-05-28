import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
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
  private writeQueue: Promise<void> = Promise.resolve();

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

  private persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(() => this._writeToDisk());
    return this.writeQueue;
  }

  private async _writeToDisk(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
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
    const stored = { ...memory, version };
    if (idx >= 0) { this.data.memories[idx] = stored; } else { this.data.memories.push(stored); }
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
    const now = Date.now();
    const agentMems = this.data.memories
      .filter(m => m.agentId === agentId)
      .filter(m => {
        if (!m.ttlDays) return true;
        return new Date(m.timestamp).getTime() + m.ttlDays * 86400000 > now;
      })
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
