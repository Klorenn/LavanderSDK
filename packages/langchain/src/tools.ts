import { tool } from "@langchain/core/tools";
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
    tool(async (input) => stringify(await storage.storeText(input)), {
      name: "filecoin_store_text",
      description: "Store short text on Filecoin Onchain Cloud and return a PieceCID.",
      schema: storeTextInputSchema
    }),
    tool(async (input) => stringify(await storage.storeFile(input)), {
      name: "filecoin_store_file",
      description: "Store a local file on Filecoin Onchain Cloud and return a PieceCID.",
      schema: storeFileInputSchema
    }),
    tool(async (input) => {
      const result = await storage.retrieve(input);
      return stringify({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
    }, {
      name: "filecoin_retrieve",
      description: "Retrieve Filecoin data by PieceCID. Use outputPath for large data.",
      schema: retrieveInputSchema
    }),
    tool(async (input) => stringify(await storage.verify(input)), {
      name: "filecoin_verify",
      description: "Verify Filecoin storage state for a PieceCID.",
      schema: verifyInputSchema
    }),
    tool(async (input) => stringify(await storage.prepareStorage(input)), {
      name: "filecoin_prepare_storage",
      description: "Prepare balance and approval for Filecoin storage uploads.",
      schema: prepareStorageInputSchema
    }),
    tool(async () => stringify(await storage.getBalance()), {
      name: "filecoin_balance",
      description: "Check Filecoin storage payment balance and runway.",
      schema: undefined
    })
  ];
}
