import { DynamicStructuredTool, DynamicTool, tool } from "@langchain/core/tools";
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
} from "@filecoin-agent/core";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createFetcherTools(config: FetcherConfig): (DynamicStructuredTool | DynamicTool)[] {
  const storage = createFetcherAgent(config);

  return [
    tool(async (input: any) => stringify(await storage.storeFile(input)), {
      name: "store_file",
      description: "Store a file on Filecoin Onchain Cloud. Returns a permanent CID.",
      schema: storeFileInputSchema as any
    }),
    tool(async (input: any) => {
      const r = await storage.retrieve(input);
      return stringify({ ...r, bytes: r.bytes ? `[${r.bytes.byteLength} bytes]` : undefined });
    }, {
      name: "retrieve_file",
      description: "Retrieve data from Filecoin by CID.",
      schema: retrieveInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.listFiles(input)), {
      name: "list_files",
      description: "List files uploaded by this API key. Filter by tag.",
      schema: listFilesInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.verify(input)), {
      name: "verify_cid",
      description: "Verify Filecoin storage state for a CID with PDP evidence.",
      schema: verifyInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.checkDeal(input)), {
      name: "check_deal",
      description: "Check Filecoin deal status for a stored CID.",
      schema: verifyInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.getProof(input)), {
      name: "get_proof",
      description: "Retrieve cryptographic PDP proof for a stored CID.",
      schema: getProofInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.prepareStorage(input)), {
      name: "prepare_storage",
      description: "Prepare balance and approval for Filecoin storage uploads.",
      schema: prepareStorageInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.deleteFile(input)), {
      name: "delete_file",
      description: "Remove a file from the local index. Data remains on Filecoin permanently.",
      schema: deleteFileInputSchema as any
    }),
    new DynamicTool({
      name: "get_balance",
      description: "Check Filecoin storage payment balance and runway.",
      func: async () => stringify(await storage.getBalance())
    }),
    tool(async (input: any) => stringify(await storage.estimateCost(input)), {
      name: "estimate_cost",
      description: "Estimate the cost of storing data before uploading.",
      schema: estimateCostInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.getStorageStats(input)), {
      name: "get_storage_stats",
      description: "Dashboard of agent storage: total files, size, memories, deals.",
      schema: undefined as any
    }),
    new DynamicTool({
      name: "list_deals",
      description: "List all active storage deals and their status.",
      func: async () => stringify(await storage.listDeals())
    }),
    tool(async (input: any) => stringify(await storage.storeMemory(input)), {
      name: "store_memory",
      description: "Store a structured memory object for an agent. Persists between sessions.",
      schema: storeMemoryInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.retrieveMemory(input)), {
      name: "retrieve_memory",
      description: "Retrieve agent memory by agent ID and key.",
      schema: retrieveMemoryInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.updateMemory(input)), {
      name: "update_memory",
      description: "Update specific fields in an existing memory object.",
      schema: updateMemoryInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.listMemories(input)), {
      name: "list_memories",
      description: "List all memories for a specific agent.",
      schema: listMemoriesInputSchema as any
    }),
    tool(async (input: any) => stringify(await storage.deleteMemory(input)), {
      name: "delete_memory",
      description: "Delete a memory entry from the agent's index.",
      schema: deleteMemoryInputSchema as any
    })
  ];
}
