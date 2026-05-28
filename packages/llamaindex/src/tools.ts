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
  type FetcherConfig
} from "@filecoin-agent/core";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createFetcherTools(config: FetcherConfig) {
  const storage = createFetcherAgent(config);

  return [
    tool({
      name: "store_file",
      description: "Store a file on Filecoin Onchain Cloud. Accepts text or binary content and returns a CID.",
      parameters: storeFileInputSchema,
      execute: async (input: any) => stringify(await storage.storeFile(input))
    }),
    tool({
      name: "retrieve_file",
      description: "Retrieve data from Filecoin by CID.",
      parameters: retrieveInputSchema,
      execute: async (input: any) => {
        const result = await storage.retrieve(input);
        return stringify({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
      }
    }),
    tool({
      name: "list_files",
      description: "List files uploaded by this API key. Filter by tag.",
      parameters: listFilesInputSchema,
      execute: async (input: any) => stringify(await storage.listFiles(input))
    }),
    tool({
      name: "verify_cid",
      description: "Verify Filecoin storage state for a CID with PDP evidence.",
      parameters: verifyInputSchema,
      execute: async (input: any) => stringify(await storage.verify(input))
    }),
    tool({
      name: "check_deal",
      description: "Check Filecoin deal status for a stored CID.",
      parameters: verifyInputSchema,
      execute: async (input: any) => stringify(await storage.verify(input))
    }),
    tool({
      name: "prepare_storage",
      description: "Prepare balance and approval for Filecoin storage uploads.",
      parameters: prepareStorageInputSchema,
      execute: async (input: any) => stringify(await storage.prepareStorage(input))
    }),
    tool({
      name: "delete_file",
      description: "Remove a file from the local index. Data remains on Filecoin permanently.",
      parameters: deleteFileInputSchema,
      execute: async (input: any) => stringify(await storage.deleteFile(input))
    }),
    tool({
      name: "balance",
      description: "Check Filecoin storage payment balance and runway.",
      parameters: undefined,
      execute: async () => stringify(await storage.getBalance())
    }),
    tool({
      name: "store_memory",
      description: "Store a structured memory object for an agent. Persists between sessions.",
      parameters: storeMemoryInputSchema,
      execute: async (input: any) => stringify(await storage.storeMemory(input))
    }),
    tool({
      name: "retrieve_memory",
      description: "Retrieve agent memory by agent ID and key.",
      parameters: retrieveMemoryInputSchema,
      execute: async (input: any) => stringify(await storage.retrieveMemory(input))
    }),
    tool({
      name: "update_memory",
      description: "Update specific fields in an existing memory object.",
      parameters: updateMemoryInputSchema,
      execute: async (input: any) => stringify(await storage.updateMemory(input))
    })
  ];
}
