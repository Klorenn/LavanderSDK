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
  type FetcherConfig
} from "@filecoin-agent/core";
import { McpServer } from "@modelcontextprotocol/server";
import { toMcpJsonResult } from "./toolResult.js";

export function createFetcherMcpServer(config: FetcherConfig) {
  const storage = createFetcherAgent(config);
  const server = new McpServer({ name: "fetcher-fil", version: "0.1.0" });

  server.registerTool(
    "store_file",
    {
      title: "Store a file on Filecoin",
      description: "Store a file on Filecoin Onchain Cloud. Accepts text or binary content. This may spend storage funds when spending policy allows it.",
      inputSchema: storeFileInputSchema
    },
    async (input) => toMcpJsonResult(await storage.storeFile(input))
  );

  server.registerTool(
    "retrieve_file",
    {
      title: "Retrieve data from Filecoin",
      description: "Retrieve data by CID. Prefer outputPath for large content so the agent does not print large byte arrays.",
      inputSchema: retrieveInputSchema
    },
    async (input) => {
      const result = await storage.retrieve(input);
      return toMcpJsonResult({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
    }
  );

  server.registerTool(
    "list_files",
    {
      title: "List uploaded files",
      description: "List all files uploaded by this API key. Filter by tag.",
      inputSchema: listFilesInputSchema
    },
    async (input) => toMcpJsonResult(await storage.listFiles(input))
  );

  server.registerTool(
    "verify_cid",
    {
      title: "Verify Filecoin storage",
      description: "Verify whether a CID appears stored in Filecoin Onchain Cloud with PDP evidence.",
      inputSchema: verifyInputSchema
    },
    async (input) => toMcpJsonResult(await storage.verify(input))
  );

  server.registerTool(
    "check_deal",
    {
      title: "Check Filecoin deal status",
      description: "Check the deal status and PDP proof state for a stored CID.",
      inputSchema: verifyInputSchema
    },
    async (input) => toMcpJsonResult(await storage.verify(input))
  );

  server.registerTool(
    "prepare_storage",
    {
      title: "Prepare Filecoin storage balance",
      description: "Estimate and prepare storage balance/approval for upcoming uploads.",
      inputSchema: prepareStorageInputSchema
    },
    async (input) => toMcpJsonResult(await storage.prepareStorage(input))
  );

  server.registerTool(
    "delete_file",
    {
      title: "Remove file from local index",
      description: "Remove a file from the local index. Data remains on Filecoin permanently.",
      inputSchema: deleteFileInputSchema
    },
    async (input) => toMcpJsonResult(await storage.deleteFile(input))
  );

  server.registerTool(
    "balance",
    {
      title: "Check Filecoin storage balance",
      description: "Check FIL/USDFC balance and storage runway."
    },
    async () => toMcpJsonResult(await storage.getBalance())
  );

  server.registerTool(
    "store_memory",
    {
      title: "Store agent memory on Filecoin",
      description: "Store a structured memory object for an agent. Persists between sessions.",
      inputSchema: storeMemoryInputSchema
    },
    async (input) => toMcpJsonResult(await storage.storeMemory(input))
  );

  server.registerTool(
    "retrieve_memory",
    {
      title: "Retrieve agent memory from Filecoin",
      description: "Retrieve a memory object by agent ID and key.",
      inputSchema: retrieveMemoryInputSchema
    },
    async (input) => toMcpJsonResult(await storage.retrieveMemory(input))
  );

  server.registerTool(
    "update_memory",
    {
      title: "Update agent memory patch",
      description: "Update specific fields in an existing memory object without overwriting the whole thing.",
      inputSchema: updateMemoryInputSchema
    },
    async (input) => toMcpJsonResult(await storage.updateMemory(input))
  );

  return server;
}
