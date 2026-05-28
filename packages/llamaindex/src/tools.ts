import { tool } from "llamaindex";
import {
  createFetcherAgent,
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
  getProofInputSchema,
  type FetcherConfig
} from "@fetcher-fil/core";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createFetcherTools(config: FetcherConfig) {
  const storage = createFetcherAgent(config);

  return [
    tool({ name: "store_file", description: "Store a file on Filecoin Onchain Cloud.", parameters: storeFileInputSchema, execute: async (input: any) => stringify(await storage.storeFile(input)) }),
    tool({ name: "retrieve_file", description: "Retrieve data from Filecoin by CID.", parameters: retrieveInputSchema, execute: async (input: any) => { const r = await storage.retrieve(input); return stringify({ ...r, bytes: r.bytes ? `[${r.bytes.byteLength} bytes]` : undefined }); } }),
    tool({ name: "list_files", description: "List files uploaded by this API key.", parameters: listFilesInputSchema, execute: async (input: any) => stringify(await storage.listFiles(input)) }),
    tool({ name: "verify_cid", description: "Verify Filecoin storage state with PDP evidence.", parameters: verifyInputSchema, execute: async (input: any) => stringify(await storage.verify(input)) }),
    tool({ name: "check_deal", description: "Check Filecoin deal status for a CID.", parameters: verifyInputSchema, execute: async (input: any) => stringify(await storage.checkDeal(input)) }),
    tool({ name: "get_proof", description: "Retrieve cryptographic PDP proof for a CID.", parameters: getProofInputSchema, execute: async (input: any) => stringify(await storage.getProof(input)) }),
    tool({ name: "prepare_storage", description: "Prepare balance for storage uploads.", parameters: prepareStorageInputSchema, execute: async (input: any) => stringify(await storage.prepareStorage(input)) }),
    tool({ name: "delete_file", description: "Remove file from local index. Data stays on Filecoin.", parameters: deleteFileInputSchema, execute: async (input: any) => stringify(await storage.deleteFile(input)) }),
    tool({ name: "get_balance", description: "Check Filecoin storage payment balance.", parameters: undefined, execute: async () => stringify(await storage.getBalance()) }),
    tool({ name: "estimate_cost", description: "Estimate storage cost before uploading.", parameters: estimateCostInputSchema, execute: async (input: any) => stringify(await storage.estimateCost(input)) }),
    tool({ name: "get_storage_stats", description: "Dashboard of agent storage stats.", parameters: undefined, execute: async (input: any) => stringify(await storage.getStorageStats(input)) }),
    tool({ name: "list_deals", description: "List active storage deals and their status.", parameters: undefined, execute: async () => stringify(await storage.listDeals()) }),
    tool({ name: "store_memory", description: "Store memory for an agent. Persists between sessions.", parameters: storeMemoryInputSchema, execute: async (input: any) => stringify(await storage.storeMemory(input)) }),
    tool({ name: "retrieve_memory", description: "Retrieve agent memory by ID and key.", parameters: retrieveMemoryInputSchema, execute: async (input: any) => stringify(await storage.retrieveMemory(input)) }),
    tool({ name: "update_memory", description: "Update specific fields in a memory object.", parameters: updateMemoryInputSchema, execute: async (input: any) => stringify(await storage.updateMemory(input)) }),
    tool({ name: "list_memories", description: "List all memories for a specific agent.", parameters: listMemoriesInputSchema, execute: async (input: any) => stringify(await storage.listMemories(input)) }),
    tool({ name: "delete_memory", description: "Delete a memory from the agent's index.", parameters: deleteMemoryInputSchema, execute: async (input: any) => stringify(await storage.deleteMemory(input)) })
  ];
}
