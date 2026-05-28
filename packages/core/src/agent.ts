import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_SPENDING_POLICY, FILECOIN_MIN_BYTES, DEFAULT_MIME_TYPE } from "./defaults.js";
import { FetcherError } from "./errors.js";
import { FetcherIndex } from "./indexStore.js";
import type { IndexedFile, IndexedMemory } from "./indexStore.js";
import {
  prepareStorageInputSchema,
  retrieveInputSchema,
  storeFileInputSchema,
  verifyInputSchema,
  listFilesInputSchema,
  deleteFileInputSchema,
  storeMemoryInputSchema,
  retrieveMemoryInputSchema,
  updateMemoryInputSchema
} from "./schemas.js";
import type {
  FetcherConfig,
  FetcherStorage,
  PrepareStorageInput,
  SpendingPolicy,
} from "./types.js";

export function createFetcherAgent(config: FetcherConfig): FetcherStorage {
  if (!config.backend) {
    throw new FetcherError(
      "CONFIGURATION_ERROR",
      "No storage backend configured. Pass a test backend or create a Synapse backend."
    );
  }

  const backend = config.backend;
  const policy: SpendingPolicy = { ...DEFAULT_SPENDING_POLICY, ...config.spendingPolicy };
  const indexDir = config.indexDir ?? join(homedir(), ".fetcher");
  const index = new FetcherIndex(indexDir);

  return {
    async storeFile(input) {
      const parsed = storeFileInputSchema.parse(input);
      const data = new TextEncoder().encode(parsed.content);

      if (data.byteLength < FILECOIN_MIN_BYTES) {
        throw new FetcherError(
          "SIZE_TOO_SMALL",
          `Content size ${data.byteLength} bytes is below Filecoin minimum of ${FILECOIN_MIN_BYTES} bytes.`
        );
      }

      assertPaidOperationAllowed(policy, data.byteLength, parsed.confirmPaidOperation);
      const result = await backend.upload(data, { metadata: {}, copies: parsed.copies });

      await index.addFile({
        cid: result.cid,
        filename: parsed.filename,
        size: result.size,
        tags: parsed.tags ?? [],
        timestamp: new Date().toISOString()
      });

      return {
        ...result,
        filename: parsed.filename
      };
    },

    async retrieve(input) {
      const parsed = retrieveInputSchema.parse(input);
      const bytes = await backend.download({ cid: parsed.cid, withCDN: parsed.withCDN });

      const mimeType = DEFAULT_MIME_TYPE;

      if (parsed.outputPath) {
        await mkdir(dirname(parsed.outputPath), { recursive: true });
        await writeFile(parsed.outputPath, bytes);
        return { cid: parsed.cid, size: bytes.byteLength, outputPath: parsed.outputPath, mimeType };
      }

      return { cid: parsed.cid, size: bytes.byteLength, bytes, mimeType };
    },

    async verify(input) {
      const parsed = verifyInputSchema.parse(input);
      const result = await backend.verify(parsed);
      return { ...result, integrity: result.verified };
    },

    async prepareStorage(input: PrepareStorageInput) {
      const parsed = prepareStorageInputSchema.parse(input);
      assertPaidOperationAllowed(policy, parsed.bytes, parsed.confirmPaidOperation);
      return backend.prepareStorage(parsed);
    },

    async getBalance() {
      return backend.getBalance();
    },

    async listFiles(input) {
      const parsed = listFilesInputSchema.parse(input);
      return index.listFiles({ tag: parsed.tag, limit: parsed.limit, before: parsed.before });
    },

    async deleteFile(input) {
      const parsed = deleteFileInputSchema.parse(input);
      const removed = await index.removeFile(parsed.cid);
      return {
        removedFromIndex: removed,
        cid: parsed.cid,
        note: "data remains on Filecoin permanently"
      };
    },

    async storeMemory(input) {
      const parsed = storeMemoryInputSchema.parse(input);
      const serialized = new TextEncoder().encode(JSON.stringify(parsed.data));

      assertPaidOperationAllowed(policy, serialized.byteLength, parsed.confirmPaidOperation);

      const result = await backend.upload(serialized, { metadata: {} });
      const timestamp = new Date().toISOString();

      const memory: IndexedMemory = {
        agentId: parsed.agentId,
        memoryKey: parsed.memoryKey,
        cid: result.cid,
        data: parsed.data,
        timestamp,
        ttlDays: parsed.ttlDays
      };

      const existing = await index.retrieveMemory(parsed.agentId, parsed.memoryKey);
      if (existing && parsed.overwrite === false) {
        return {
          cid: existing.cid,
          memoryKey: parsed.memoryKey,
          agentId: parsed.agentId,
          timestamp: existing.timestamp
        };
      }

      const { previousCid } = await index.storeMemory(memory);
      return {
        cid: result.cid,
        memoryKey: parsed.memoryKey,
        agentId: parsed.agentId,
        timestamp,
        previousCid
      };
    },

    async retrieveMemory(input) {
      const parsed = retrieveMemoryInputSchema.parse(input);
      const memory = await index.retrieveMemory(parsed.agentId, parsed.memoryKey);

      if (!memory) {
        return {
          data: parsed.fallback ?? null,
          found: false
        };
      }

      const ageDays = Math.floor(
        (Date.now() - new Date(memory.timestamp).getTime()) / 86400000
      );

      return {
        data: memory.data,
        cid: memory.cid,
        timestamp: memory.timestamp,
        ageDays,
        found: true
      };
    },

    async updateMemory(input) {
      const parsed = updateMemoryInputSchema.parse(input);

      const existing = await index.retrieveMemory(parsed.agentId, parsed.memoryKey);
      if (!existing) {
        throw new FetcherError(
          "NOT_FOUND",
          `Memory not found for agent=${parsed.agentId} key=${parsed.memoryKey}`
        );
      }

      for (const [key, value] of Object.entries(parsed.patch)) {
        existing.data[key] = value;
      }

      const serialized = new TextEncoder().encode(JSON.stringify(existing.data));
      assertPaidOperationAllowed(policy, serialized.byteLength, parsed.confirmPaidOperation);
      const result = await backend.upload(serialized, { metadata: {} });

      existing.cid = result.cid;
      existing.timestamp = new Date().toISOString();
      const { previousCid } = await index.storeMemory(existing);

      return {
        cid: result.cid,
        previousCid: previousCid ?? existing.cid,
        memoryKey: parsed.memoryKey,
        updatedFields: Object.keys(parsed.patch)
      };
    }
  };
}

function assertPaidOperationAllowed(policy: SpendingPolicy, bytes: number, confirmed?: boolean): void {
  if (!policy.allowPaidOperations) {
    throw new FetcherError(
      "SPENDING_POLICY_BLOCKED",
      "Paid Filecoin operation blocked by spending policy. Set allowPaidOperations when you intentionally enable storage payments."
    );
  }

  if (bytes > policy.maxStorageBytesPerCall) {
    throw new FetcherError(
      "SPENDING_POLICY_BLOCKED",
      `Paid Filecoin operation blocked because ${bytes} bytes exceeds maxStorageBytesPerCall=${policy.maxStorageBytesPerCall}.`
    );
  }

  if (policy.requireConfirmation && confirmed !== true) {
    throw new FetcherError(
      "SPENDING_POLICY_BLOCKED",
      "Paid Filecoin operation requires confirmPaidOperation=true."
    );
  }
}
