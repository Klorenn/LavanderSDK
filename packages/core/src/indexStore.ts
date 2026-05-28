import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

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

type IndexData = {
  version: number;
  files: IndexedFile[];
  memories: IndexedMemory[];
};

export class FetcherIndex {
  private data: IndexData;
  private filePath: string;
  private loaded = false;

  constructor(indexDir?: string) {
    const dir = indexDir ?? join(homedir(), ".fetcher");
    this.filePath = join(dir, "index.json");
    this.data = { version: 1, files: [], memories: [] };
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      this.data = {
        version: parsed.version ?? 1,
        files: Array.isArray(parsed.files) ? parsed.files : [],
        memories: Array.isArray(parsed.memories) ? parsed.memories : []
      };
    } catch {
      this.data = { version: 1, files: [], memories: [] };
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await mkdir(this.filePath.split("/").slice(0, -1).join("/") || "/", { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  async addFile(file: IndexedFile): Promise<void> {
    await this.ensureLoaded();
    const existing = this.data.files.findIndex((f) => f.cid === file.cid);
    if (existing >= 0) {
      this.data.files[existing] = file;
    } else {
      this.data.files.unshift(file);
    }
    await this.persist();
  }

  async listFiles(options: { tag?: string; limit?: number; before?: string } = {}): Promise<{
    files: IndexedFile[];
    total: number;
  }> {
    await this.ensureLoaded();
    let files = [...this.data.files];

    if (options.tag) {
      files = files.filter((f) => f.tags.includes(options.tag!));
    }

    if (options.before) {
      const pivot = new Date(options.before).getTime();
      files = files.filter((f) => new Date(f.timestamp).getTime() < pivot);
    }

    files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const total = files.length;
    const limit = options.limit ?? 20;
    files = files.slice(0, limit);

    return { files, total };
  }

  async removeFile(cid: string): Promise<boolean> {
    await this.ensureLoaded();
    const idx = this.data.files.findIndex((f) => f.cid === cid);
    if (idx < 0) return false;
    this.data.files.splice(idx, 1);
    await this.persist();
    return true;
  }

  async storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }> {
    await this.ensureLoaded();
    const idx = this.data.memories.findIndex(
      (m) => m.agentId === memory.agentId && m.memoryKey === memory.memoryKey
    );
    const previousCid = idx >= 0 ? this.data.memories[idx].cid : undefined;
    const version = idx >= 0 ? (this.data.memories[idx].version + 1) : 1;
    memory.version = version;
    if (idx >= 0) {
      this.data.memories[idx] = memory;
    } else {
      this.data.memories.push(memory);
    }
    await this.persist();
    return { previousCid, version };
  }

  async retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null> {
    await this.ensureLoaded();
    const memory = this.data.memories.find(
      (m) => m.agentId === agentId && m.memoryKey === memoryKey
    );
    if (!memory) return null;
    if (memory.ttlDays) {
      const expiresAt = new Date(memory.timestamp).getTime() + memory.ttlDays * 86400000;
      if (Date.now() > expiresAt) {
        this.data.memories = this.data.memories.filter(
          (m) => !(m.agentId === agentId && m.memoryKey === memoryKey)
        );
        await this.persist();
        return null;
      }
    }
    return memory;
  }

  async updateMemory(
    agentId: string,
    memoryKey: string,
    patch: Record<string, unknown>
  ): Promise<{ previousCid: string; updatedFields: string[] } | null> {
    const existing = await this.retrieveMemory(agentId, memoryKey);
    if (!existing) return null;

    const updatedFields: string[] = [];
    for (const [key, value] of Object.entries(patch)) {
      existing.data[key] = value;
      updatedFields.push(key);
    }

    existing.timestamp = new Date().toISOString();
    const { previousCid } = await this.storeMemory(existing);
    return { previousCid: previousCid ?? existing.cid, updatedFields };
  }

  async listMemories(agentId: string, limit = 50): Promise<{
    memories: Array<{ memoryKey: string; cid: string; timestamp: string; size: number }>;
    total: number;
  }> {
    await this.ensureLoaded();
    const agentMemories = this.data.memories
      .filter((m) => m.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = agentMemories.length;
    const sliced = agentMemories.slice(0, limit);

    return {
      memories: sliced.map((m) => ({
        memoryKey: m.memoryKey,
        cid: m.cid,
        timestamp: m.timestamp,
        size: JSON.stringify(m.data).length
      })),
      total
    };
  }

  async deleteMemory(agentId: string, memoryKey: string): Promise<boolean> {
    await this.ensureLoaded();
    const idx = this.data.memories.findIndex(
      (m) => m.agentId === agentId && m.memoryKey === memoryKey
    );
    if (idx < 0) return false;
    this.data.memories.splice(idx, 1);
    await this.persist();
    return true;
  }

  async getStats(agentId?: string): Promise<{
    totalFiles: number;
    totalSizeBytes: number;
    totalMemories: number;
    oldestFile?: string;
    newestFile?: string;
  }> {
    await this.ensureLoaded();
    const files = agentId ? this.data.files : this.data.files;
    const memories = agentId ? this.data.memories.filter((m) => m.agentId === agentId) : this.data.memories;

    let totalSizeBytes = 0;
    let oldestFile: string | undefined;
    let newestFile: string | undefined;

    if (files.length > 0) {
      const sorted = [...files].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      oldestFile = sorted[0].timestamp;
      newestFile = sorted[sorted.length - 1].timestamp;
      totalSizeBytes = files.reduce((s, f) => s + f.size, 0);
    }

    return {
      totalFiles: files.length,
      totalSizeBytes,
      totalMemories: memories.length,
      oldestFile,
      newestFile
    };
  }
}
