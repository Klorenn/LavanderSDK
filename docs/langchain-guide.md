# LangChain Integration

Fetcher provides 17 native DynamicStructuredTools for LangChain.

## Install

```bash
npm install @fetcher-fil/langchain @fetcher-fil/core @langchain/core
```

## Quick Start

```ts
import { createFetcherTools } from "@fetcher-fil/langchain";
import { createSynapseBackend } from "@fetcher-fil/core";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

const backend = await createSynapseBackend({ privateKey: process.env.FILECOIN_PRIVATE_KEY });
const tools = createFetcherTools({ backend, spendingPolicy: { allowPaidOperations: true } });

const executor = new AgentExecutor({
  agent: await createOpenAIFunctionsAgent({ llm: new ChatOpenAI({ model: "gpt-4o" }), tools, prompt }),
  tools
});

await executor.invoke({ input: "Store the quarterly report on Filecoin and remember the CID." });
```

## Available Tools

| Group | Tools |
|---|---|
| Storage | store_file, retrieve_file, list_files, delete_file |
| Verify | verify_cid, check_deal, get_proof |
| Observe | get_balance, estimate_cost, get_storage_stats, list_deals |
| Memory | store_memory, retrieve_memory, update_memory, list_memories, delete_memory |
| Payments | prepare_storage |

## Testing

```ts
import { createFakeStorageBackend } from "@fetcher-fil/testkit";

const tools = createFetcherTools({
  backend: createFakeStorageBackend(),
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
});
```
