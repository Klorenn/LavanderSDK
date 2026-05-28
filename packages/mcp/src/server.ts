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
import { McpServer } from "@modelcontextprotocol/server";
import { toMcpJsonResult } from "./toolResult.js";

export function createFetcherMcpServer(config: FetcherConfig) {
  const storage = createFetcherAgent(config);
  const server = new McpServer({ name: "fetcher-fil", version: "0.1.0" });

  server.registerTool("store_file", {
    title: "Store a file on Filecoin",
    description: "Store a file on Filecoin Onchain Cloud. Accepts text content and returns a CID.",
    inputSchema: storeFileInputSchema
  }, async (input) => toMcpJsonResult(await storage.storeFile(input)));

  server.registerTool("retrieve_file", {
    title: "Retrieve data from Filecoin",
    description: "Retrieve data by CID. Prefer outputPath for large content.",
    inputSchema: retrieveInputSchema
  }, async (input) => {
    const r = await storage.retrieve(input);
    return toMcpJsonResult({ ...r, bytes: r.bytes ? `[${r.bytes.byteLength} bytes]` : undefined });
  });

  server.registerTool("list_files", {
    title: "List uploaded files",
    description: "List all files uploaded by this API key. Filter by tag.",
    inputSchema: listFilesInputSchema
  }, async (input) => toMcpJsonResult(await storage.listFiles(input)));

  server.registerTool("verify_cid", {
    title: "Verify Filecoin storage",
    description: "Verify whether a CID appears stored with PDP evidence.",
    inputSchema: verifyInputSchema
  }, async (input) => toMcpJsonResult(await storage.verify(input)));

  server.registerTool("check_deal", {
    title: "Check Filecoin deal status",
    description: "Check deal status and PDP proof state for a stored CID.",
    inputSchema: verifyInputSchema
  }, async (input) => toMcpJsonResult(await storage.verify(input)));

  server.registerTool("get_proof", {
    title: "Get PDP proof for a CID",
    description: "Retrieve cryptographic PDP proof for a stored CID.",
    inputSchema: getProofInputSchema
  }, async (input) => toMcpJsonResult(await storage.getProof(input)));

  server.registerTool("prepare_storage", {
    title: "Prepare Filecoin storage balance",
    description: "Estimate and prepare storage balance for upcoming uploads.",
    inputSchema: prepareStorageInputSchema
  }, async (input) => toMcpJsonResult(await storage.prepareStorage(input)));

  server.registerTool("delete_file", {
    title: "Remove file from local index",
    description: "Remove a file from the local index. Data remains on Filecoin permanently.",
    inputSchema: deleteFileInputSchema
  }, async (input) => toMcpJsonResult(await storage.deleteFile(input)));

  server.registerTool("get_balance", {
    title: "Check Filecoin storage balance",
    description: "Check FIL/USDFC balance and storage runway."
  }, async () => toMcpJsonResult(await storage.getBalance()));

  server.registerTool("estimate_cost", {
    title: "Estimate storage cost",
    description: "Estimate the cost of storing data before uploading.",
    inputSchema: estimateCostInputSchema
  }, async (input) => toMcpJsonResult(await storage.estimateCost(input)));

  server.registerTool("get_storage_stats", {
    title: "Get storage statistics",
    description: "Dashboard of the agent's storage: total files, size, memories, deals.",
    inputSchema: undefined
  }, async () => toMcpJsonResult(await storage.getStorageStats()));

  server.registerTool("list_deals", {
    title: "List storage deals",
    description: "List all active storage deals and their status.",
    inputSchema: undefined
  }, async () => toMcpJsonResult(await storage.listDeals()));

  server.registerTool("store_memory", {
    title: "Store agent memory on Filecoin",
    description: "Store a structured memory object for an agent. Persists between sessions.",
    inputSchema: storeMemoryInputSchema
  }, async (input) => toMcpJsonResult(await storage.storeMemory(input)));

  server.registerTool("retrieve_memory", {
    title: "Retrieve agent memory from Filecoin",
    description: "Retrieve a memory object by agent ID and key.",
    inputSchema: retrieveMemoryInputSchema
  }, async (input) => toMcpJsonResult(await storage.retrieveMemory(input)));

  server.registerTool("update_memory", {
    title: "Update agent memory patch",
    description: "Update specific fields in an existing memory object.",
    inputSchema: updateMemoryInputSchema
  }, async (input) => toMcpJsonResult(await storage.updateMemory(input)));

  server.registerTool("list_memories", {
    title: "List agent memories",
    description: "List all memories for a specific agent.",
    inputSchema: listMemoriesInputSchema
  }, async (input) => toMcpJsonResult(await storage.listMemories(input)));

  server.registerTool("delete_memory", {
    title: "Delete agent memory",
    description: "Delete a memory entry from the agent's index.",
    inputSchema: deleteMemoryInputSchema
  }, async (input) => toMcpJsonResult(await storage.deleteMemory(input)));

  return server;
}
