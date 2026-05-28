# LlamaIndex Integration Guide

Fetcher provides native FunctionTools for LlamaIndex — the first Filecoin Onchain Cloud integration for the LlamaIndex ecosystem.

## Install

```bash
npm install @filecoin-agent/llamaindex @filecoin-agent/core llamaindex
```

## Quick Start

```ts
import { createFetcherTools } from "@filecoin-agent/llamaindex";
import { createSynapseBackend } from "@filecoin-agent/core";
import { OpenAIAgent, OpenAI } from "llamaindex";

const backend = await createSynapseBackend({
  privateKey: process.env.FILECOIN_PRIVATE_KEY as `0x${string}`
});

const tools = createFetcherTools({
  backend,
  spendingPolicy: { allowPaidOperations: true }
});

const agent = new OpenAIAgent({
  llm: new OpenAI({ model: "gpt-4o" }),
  tools
});

const response = await agent.chat({
  message: "What files have I stored? Show my storage stats and deal status."
});
```

## Available Tools

All 17 tools as LlamaIndex FunctionTools:

| Group | Tools |
|---|---|
| Storage | `store_file`, `retrieve_file`, `list_files`, `delete_file` |
| Verify | `verify_cid`, `check_deal`, `get_proof` |
| Observe | `get_balance`, `estimate_cost`, `get_storage_stats`, `list_deals` |
| Memory | `store_memory`, `retrieve_memory`, `update_memory`, `list_memories`, `delete_memory` |
| Payments | `prepare_storage` |

## Testing without a wallet

```ts
import { createFakeStorageBackend } from "@filecoin-agent/testkit";

const tools = createFetcherTools({
  backend: createFakeStorageBackend(),
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
});

const names = tools.map((t) => t.metadata.name);
// ["store_file", "retrieve_file", "list_files", "verify_cid", ...
```
