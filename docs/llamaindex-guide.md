# LlamaIndex Integration

Fetcher provides 17 native FunctionTools for LlamaIndex.

## Install

```bash
npm install @fetcher-fil/llamaindex @fetcher-fil/core llamaindex
```

## Quick Start

```ts
import { createFetcherTools } from "@fetcher-fil/llamaindex";
import { createSynapseBackend } from "@fetcher-fil/core";
import { OpenAIAgent, OpenAI } from "llamaindex";

const backend = await createSynapseBackend({ privateKey: process.env.FILECOIN_PRIVATE_KEY });
const tools = createFetcherTools({ backend, spendingPolicy: { allowPaidOperations: true } });

const agent = new OpenAIAgent({ llm: new OpenAI({ model: "gpt-4o" }), tools });
await agent.chat({ message: "Store this report on Filecoin and verify it." });
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
