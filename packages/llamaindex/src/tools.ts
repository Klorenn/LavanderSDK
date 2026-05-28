import { tool } from "llamaindex";
import {
  createFilecoinAgent,
  prepareStorageInputSchema,
  retrieveInputSchema,
  storeFileInputSchema,
  storeTextInputSchema,
  verifyInputSchema,
  type FilecoinAgentConfig
} from "@filecoin-agent/core";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createFilecoinTools(config: FilecoinAgentConfig) {
  const storage = createFilecoinAgent(config);

  return [
    tool({
      name: "filecoin_store_text",
      description: "Store short text on Filecoin Onchain Cloud and return a PieceCID.",
      parameters: storeTextInputSchema,
      execute: async (input) => stringify(await storage.storeText(input))
    }),
    tool({
      name: "filecoin_store_file",
      description: "Store a local file on Filecoin Onchain Cloud and return a PieceCID.",
      parameters: storeFileInputSchema,
      execute: async (input) => stringify(await storage.storeFile(input))
    }),
    tool({
      name: "filecoin_retrieve",
      description: "Retrieve Filecoin data by PieceCID. Use outputPath for large data.",
      parameters: retrieveInputSchema,
      execute: async (input) => {
        const result = await storage.retrieve(input);
        return stringify({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
      }
    }),
    tool({
      name: "filecoin_verify",
      description: "Verify Filecoin storage state for a PieceCID.",
      parameters: verifyInputSchema,
      execute: async (input) => stringify(await storage.verify(input))
    }),
    tool({
      name: "filecoin_prepare_storage",
      description: "Prepare balance and approval for Filecoin storage uploads.",
      parameters: prepareStorageInputSchema,
      execute: async (input) => stringify(await storage.prepareStorage(input))
    }),
    tool({
      name: "filecoin_balance",
      description: "Check Filecoin storage payment balance and runway.",
      parameters: undefined,
      execute: async () => stringify(await storage.getBalance())
    })
  ];
}
