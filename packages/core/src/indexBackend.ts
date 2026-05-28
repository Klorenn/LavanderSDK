// IndexedFile and IndexedMemory are defined in indexStore.ts — imported for local use and re-exported.
import type { IndexedFile, IndexedMemory } from "./indexStore.js";
export type { IndexedFile, IndexedMemory };

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
