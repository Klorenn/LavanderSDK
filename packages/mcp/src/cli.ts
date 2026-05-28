#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/server";
import { createFetcherMcpServer } from "./server.js";

const privateKey = process.env.FILECOIN_PRIVATE_KEY as `0x${string}` | undefined;
const network = process.env.FILECOIN_NETWORK === "mainnet" ? "mainnet" : "calibration";

if (!privateKey) {
  throw new Error("FILECOIN_PRIVATE_KEY is required for the MCP server");
}

const { createSynapseBackend } = await import("@fetcher-fil/core");

const server = createFetcherMcpServer({
  privateKey,
  network,
  backend: await createSynapseBackend({ privateKey, network }),
  spendingPolicy: {
    allowPaidOperations: process.env.FILECOIN_AGENT_ALLOW_PAID === "true",
    requireConfirmation: true
  }
});

await server.connect(new StdioServerTransport());
