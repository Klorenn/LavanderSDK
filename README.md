# Fetcher — Filecoin Agent SDK

Agent-native tools for Filecoin Onchain Cloud via Synapse SDK.

```txt
🤖 AI Agents  →  👻 Fetcher SDK  →  🌐 Synapse SDK  →  ⛓ Filecoin Onchain Cloud
Claude · GPT    MCP + LangChain    Filecoin official    PDP every hour
LangChain        LlamaIndex · SDK   TypeScript native    Verifiable storage
```

## Packages

| Package | Purpose | Tools |
|---|---|---|
| `@fetcher-fil/core` | Core storage API, spending policy, Synapse backend, memory system | All 17 |
| `@fetcher-fil/mcp` | MCP stdio server for Claude Desktop and MCP clients | 17 |
| `@fetcher-fil/langchain` | LangChain DynamicStructuredTools | 17 |
| `@fetcher-fil/llamaindex` | LlamaIndex FunctionTools | 17 |
| `@fetcher-fil/sdk` | Programmatic Fetcher class | 17 |
| `@fetcher-fil/testkit` | Fake backend and fixtures for tests | — |

## Quick Start — MCP (Claude Desktop)

```json
{
  "mcpServers": {
    "fetcher": {
      "command": "npx",
      "args": ["@fetcher-fil/mcp"],
      "env": {
        "FILECOIN_PRIVATE_KEY": "0x...",
        "FILECOIN_NETWORK": "calibration",
        "FILECOIN_AGENT_ALLOW_PAID": "true"
      }
    }
  }
}
```

Your agent gets 17 tools: store_file, retrieve_file, list_files, verify_cid, check_deal,
get_proof, prepare_storage, delete_file, get_balance, estimate_cost, get_storage_stats,
list_deals, store_memory, retrieve_memory, update_memory, list_memories, delete_memory.

## Quick Start — LangChain

```ts
import { createFetcherTools } from "@fetcher-fil/langchain";
import { createSynapseBackend } from "@fetcher-fil/core";

const tools = createFetcherTools({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true }
});
```

## Quick Start — LlamaIndex

```ts
import { createFetcherTools } from "@fetcher-fil/llamaindex";
import { createSynapseBackend } from "@fetcher-fil/core";

const tools = createFetcherTools({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true }
});
```

## Quick Start — SDK Direct

```ts
import { Fetcher } from "@fetcher-fil/sdk";
import { createSynapseBackend } from "@fetcher-fil/core";

const fetcher = new Fetcher({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true }
});

const { cid } = await fetcher.store({ content: "Hello Filecoin", filename: "hello.txt" });
const stats = await fetcher.stats();

await fetcher.memory.store({
  agentId: "my-agent",
  memoryKey: "preferences",
  data: { theme: "dark" }
});

const mem = await fetcher.memory.retrieve({ agentId: "my-agent", memoryKey: "preferences" });
```

## Safety

Paid operations blocked by default. Start on Calibration. Read `docs/security.md`.

## Verify

```bash
npm test
npm run build
```
