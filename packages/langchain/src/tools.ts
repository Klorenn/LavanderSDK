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
  type FetcherConfig
} from "@filecoin-agent/core";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createFetcherTools(config: FetcherConfig): (DynamicStructuredTool | DynamicTool)[] {
  const storage = createFetcherAgent(config);

  return [
    tool(
      async (input) => stringify(await storage.storeFile(input as Parameters<typeof storage.storeFile>[0])),
      {
        name: "store_file",
        description: "Store a file on Filecoin Onchain Cloud. Accepts text or binary content and returns a CID.",
        schema: storeFileInputSchema as any
      }
    ),
    tool(
      async (input) => {
        const result = await storage.retrieve(input as Parameters<typeof storage.retrieve>[0]);
        return stringify({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
      },
      {
        name: "retrieve_file",
        description: "Retrieve data from Filecoin by CID.",
        schema: retrieveInputSchema as any
      }
    ),
    tool(
      async (input) => stringify(await storage.listFiles(input as Parameters<typeof storage.listFiles>[0])),
      {
        name: "list_files",
        description: "List files uploaded by this API key. Filter by tag.",
        schema: listFilesInputSchema as any
      }
    ),
    tool(
      async (input) => stringify(await storage.verify(input as Parameters<typeof storage.verify>[0])),
      {
        name: "verify_cid",
        description: "Verify Filecoin storage state for a CID with PDP evidence.",
        schema: verifyInputSchema as any
      }
    ),
    tool(
      async (input) => stringify(await storage.verify(input as Parameters<typeof storage.verify>[0])),
      {
        name: "check_deal",
        description: "Check Filecoin deal status for a stored CID.",
        schema: verifyInputSchema as any
      }
    ),
    tool(
      async (input) => stringify(await storage.prepareStorage(input as Parameters<typeof storage.prepareStorage>[0])),
      {
        name: "prepare_storage",
        description: "Prepare balance and approval for Filecoin storage uploads.",
        schema: prepareStorageInputSchema as any
      }
    ),
    tool(
      async (input) => stringify(await storage.deleteFile(input as Parameters<typeof storage.deleteFile>[0])),
      {
        name: "delete_file",
        description: "Remove a file from the local index. Data remains on Filecoin permanently.",
        schema: deleteFileInputSchema as any
      }
    ),
    new DynamicTool({
      name: "balance",
      description: "Check Filecoin storage payment balance and runway.",
      func: async () => stringify(await storage.getBalance())
    }),
    tool(
      async (input) => stringify(await storage.storeMemory(input as Parameters<typeof storage.storeMemory>[0])),
      {
        name: "store_memory",
        description: "Store a structured memory object for an agent. Persists between sessions.",
        schema: storeMemoryInputSchema as any
      }
    ),
    tool(
      async (input) => stringify(await storage.retrieveMemory(input as Parameters<typeof storage.retrieveMemory>[0])),
      {
        name: "retrieve_memory",
        description: "Retrieve agent memory by agent ID and key.",
        schema: retrieveMemoryInputSchema as any
      }
    ),
    tool(
      async (input) => stringify(await storage.updateMemory(input as Parameters<typeof storage.updateMemory>[0])),
      {
        name: "update_memory",
        description: "Update specific fields in an existing memory object.",
        schema: updateMemoryInputSchema as any
      }
    )
  ];
}
