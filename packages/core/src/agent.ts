import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_SPENDING_POLICY, FILECOIN_MIN_BYTES, getMimeType } from "./defaults.js";
import { FetcherError } from "./errors.js";
import { FileIndexBackend } from "./backends/fileIndexBackend.js";
import type { IndexedMemory, IndexBackend } from "./indexBackend.js";
import {
  prepareStorageInputSchema,
  retrieveInputSchema,
  storeFileInputSchema,
  verifyInputSchema,
  listFilesInputSchema,
  deleteFileInputSchema,
  storeMemoryInputSchema,
  retrieveMemoryInputSchema,
  updateMemoryInputSchema,
  listMemoriesInputSchema,
  deleteMemoryInputSchema,
  estimateCostInputSchema,
  getProofInputSchema
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
  const index: IndexBackend = config.indexBackend ?? new FileIndexBackend(config.indexDir);

  return {
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
      const timestamp = new Date().toISOString();

      await index.addFile({
        cid: result.cid,
        filename: parsed.filename,
        size: result.size,
        tags: parsed.tags ?? [],
        timestamp
      });

      return {
        cid: result.cid,
        url: `https://w3s.link/ipfs/${result.cid}`,
        size: result.size,
        timestamp,
        complete: result.complete,
        filename: parsed.filename,
        dealStatus: result.complete ? "active" : "pending",
        provider: "synapse",
        copies: result.copies,
        failedAttempts: result.failedAttempts
      };
    },

    async retrieve(input) {
      const parsed = retrieveInputSchema.parse(input);
      const bytes = await backend.download({ cid: parsed.cid, withCDN: parsed.withCDN });

      const mimeType = "application/octet-stream";

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

    async checkDeal(input) {
      const parsed = verifyInputSchema.parse(input);
      const result = await backend.verify(parsed);
      return {
        dealActive: result.verified,
        providers: result.evidence.map((e) => e.detail).filter(Boolean),
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        redundancy: result.copies,
        lastProofTimestamp: result.checkedAt,
        nextProofDue: new Date(Date.now() + 3600000).toISOString()
      };
    },

    async prepareStorage(input: PrepareStorageInput) {
      const parsed = prepareStorageInputSchema.parse(input);
      assertPaidOperationAllowed(policy, parsed.bytes, parsed.confirmPaidOperation);
      const result = await backend.prepareStorage(parsed);
      const balance = await backend.getBalance();
      const costEstimate = (parsed.bytes / (1024 * 1024 * 1024)) * 0.02;
      const allowanceSet = result.ready;

      return {
        ready: result.ready,
        costUsdfc: costEstimate.toFixed(6),
        balanceBefore: balance.availableUsdfc ?? "0",
        allowanceSet,
        message: allowanceSet ? "Storage account prepared." : "Storage account needs preparation.",
        ...(allowanceSet ? {} : {
          shortfall: costEstimate.toFixed(6),
          actionNeeded: "Deposit USDFC using Filecoin Pay or faucet, then retry."
        }),
        transactionHash: result.transactionHash
      };
    },

    async getBalance() {
      const balance = await backend.getBalance();
      const usdfc = balance.balanceUsdfc ?? "0";
      return {
        balanceUsdfc: usdfc,
        balanceFil: "0",
        pendingPayments: "0",
        availableUsdfc: usdfc
      };
    },

    async listFiles(input) {
      const parsed = listFilesInputSchema.parse(input);
      const result = await index.listFiles({ tag: parsed.tag, limit: parsed.limit, before: parsed.before });
      return {
        files: result.files.map((f) => ({
          ...f,
          dealStatus: "active",
          url: `https://w3s.link/ipfs/${f.cid}`
        })),
        total: result.total,
        hasMore: result.hasMore
      };
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
        ttlDays: parsed.ttlDays,
        version: 0
      };

      const existing = await index.retrieveMemory(parsed.agentId, parsed.memoryKey);
      if (existing && parsed.overwrite === false) {
        return {
          cid: existing.cid,
          memoryKey: parsed.memoryKey,
          agentId: parsed.agentId,
          timestamp: existing.timestamp,
          version: existing.version
        };
      }

      const { previousCid, version } = await index.storeMemory(memory);
      return {
        cid: result.cid,
        memoryKey: parsed.memoryKey,
        agentId: parsed.agentId,
        timestamp,
        previousCid,
        version
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
        version: memory.version,
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
    },

    async listMemories(input) {
      const parsed = listMemoriesInputSchema.parse(input);
      return index.listMemories(parsed.agentId, parsed.limit);
    },

    async deleteMemory(input) {
      const parsed = deleteMemoryInputSchema.parse(input);
      const deleted = await index.deleteMemory(parsed.agentId, parsed.memoryKey);
      return { deleted, agentId: parsed.agentId, memoryKey: parsed.memoryKey };
    },

    async getStorageStats(input) {
      const stats = await index.getStats(input?.agentId);
      return {
        ...stats,
        activeDeals: stats.totalFiles,
        expiredDeals: 0,
        totalCostUsdfc: "0"
      };
    },

    async estimateCost(input) {
      const parsed = estimateCostInputSchema.parse(input);
      const copies = parsed.copies ?? 2;
      const days = parsed.durationDays ?? 365;
      const gb = parsed.sizeBytes / (1024 * 1024 * 1024);
      const costPerGbMonth = 0.02;
      const months = days / 30;
      const storageCost = gb * costPerGbMonth * months * copies;
      const retrievalCost = storageCost * 0.1;
      const providerFee = storageCost * 0.05;
      const estimated = storageCost + retrievalCost + providerFee;
      const balance = await backend.getBalance();
      const currentBalance = balance.availableUsdfc ?? "0";

      return {
        estimatedCostUsdfc: estimated.toFixed(6),
        costPerGbMonth: costPerGbMonth.toString(),
        currentBalance,
        canAfford: parseFloat(currentBalance) >= estimated,
        breakdown: {
          storageCost: storageCost.toFixed(6),
          retrievalCost: retrievalCost.toFixed(6),
          providerFee: providerFee.toFixed(6)
        }
      };
    },

    async listDeals() {
      const files = await index.listFiles({ limit: 100 });
      const deals = files.files.map((f) => ({
        cid: f.cid,
        filename: f.filename,
        providers: ["synapse"],
        expiry: new Date(Date.now() + 365 * 86400000).toISOString(),
        costUsdfc: "0",
        status: "active"
      }));
      return { deals, total: deals.length };
    },

    async getProof(input) {
      const parsed = getProofInputSchema.parse(input);
      if (backend.getProof) {
        return backend.getProof(parsed);
      }
      return {
        proof: "unavailable",
        proofType: "PDP",
        verifiedAt: new Date().toISOString(),
        provider: "synapse"
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
