import type {
  IndexBackend,
  IndexedFile,
  IndexedMemory,
  ListFilesOptions,
  ListFilesPage,
  MemoriesPage,
  IndexStats,
} from "@fetcher-fil/core";

export class MemoryIndexBackend implements IndexBackend {
  private files: IndexedFile[] = [];
  private memories: IndexedMemory[] = [];

  reset(): void {
    this.files = [];
    this.memories = [];
  }

  async addFile(file: IndexedFile): Promise<void> {
    const idx = this.files.findIndex((f) => f.cid === file.cid);
    if (idx >= 0) {
      this.files[idx] = file;
    } else {
      this.files.unshift(file);
    }
  }

  async listFiles(options: ListFilesOptions = {}): Promise<ListFilesPage> {
    let files = [...this.files];
    if (options.tag) files = files.filter((f) => f.tags.includes(options.tag!));
    if (options.before) {
      const pivot = new Date(options.before).getTime();
      files = files.filter((f) => new Date(f.timestamp).getTime() < pivot);
    }
    files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const total = files.length;
    const limit = options.limit ?? 20;
    const hasMore = files.length > limit;
    return { files: files.slice(0, limit), total, hasMore };
  }

  async removeFile(cid: string): Promise<boolean> {
    const idx = this.files.findIndex((f) => f.cid === cid);
    if (idx < 0) return false;
    this.files.splice(idx, 1);
    return true;
  }

  async storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }> {
    const idx = this.memories.findIndex(
      (m) => m.agentId === memory.agentId && m.memoryKey === memory.memoryKey
    );
    const previousCid = idx >= 0 ? this.memories[idx].cid : undefined;
    const version = idx >= 0 ? this.memories[idx].version + 1 : 1;
    const stored = { ...memory, version };
    if (idx >= 0) {
      this.memories[idx] = stored;
    } else {
      this.memories.push(stored);
    }
    return { previousCid, version };
  }

  async retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null> {
    const memory = this.memories.find(
      (m) => m.agentId === agentId && m.memoryKey === memoryKey
    );
    if (!memory) return null;
    if (memory.ttlDays) {
      const expiresAt = new Date(memory.timestamp).getTime() + memory.ttlDays * 86400000;
      if (Date.now() > expiresAt) {
        this.memories = this.memories.filter(
          (m) => !(m.agentId === agentId && m.memoryKey === memoryKey)
        );
        return null;
      }
    }
    return memory;
  }

  async listMemories(agentId: string, limit = 50): Promise<MemoriesPage> {
    const now = Date.now();
    const agentMems = this.memories
      .filter((m) => m.agentId === agentId)
      .filter((m) => {
        if (!m.ttlDays) return true;
        return new Date(m.timestamp).getTime() + m.ttlDays * 86400000 > now;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      memories: agentMems.slice(0, limit).map((m) => ({
        memoryKey: m.memoryKey,
        cid: m.cid,
        timestamp: m.timestamp,
        size: JSON.stringify(m.data).length,
      })),
      total: agentMems.length,
    };
  }

  async deleteMemory(agentId: string, memoryKey: string): Promise<boolean> {
    const idx = this.memories.findIndex(
      (m) => m.agentId === agentId && m.memoryKey === memoryKey
    );
    if (idx < 0) return false;
    this.memories.splice(idx, 1);
    return true;
  }

  async getStats(agentId?: string): Promise<IndexStats> {
    const mems = agentId
      ? this.memories.filter((m) => m.agentId === agentId)
      : this.memories;
    const sorted = [...this.files].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const tagsSet = new Set<string>();
    let totalSizeBytes = 0;
    for (const f of this.files) {
      totalSizeBytes += f.size;
      for (const t of f.tags) tagsSet.add(t);
    }
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
