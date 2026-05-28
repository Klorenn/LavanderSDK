# LangChain Integration Guide

Fetcher provides the first native LangChain toolkit for Filecoin Onchain Cloud. 17 DynamicStructuredTools available in one import.

## Install

```bash
npm install @filecoin-agent/langchain @filecoin-agent/core @langchain/core
```

## Quick Start

```ts
import { createFetcherTools } from "@filecoin-agent/langchain";
import { createSynapseBackend } from "@filecoin-agent/core";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

const backend = await createSynapseBackend({
  privateKey: process.env.FILECOIN_PRIVATE_KEY as `0x${string}`
});

const tools = createFetcherTools({
  backend,
  spendingPolicy: { allowPaidOperations: true }
});

const agent = await createOpenAIFunctionsAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools,
  prompt
});

const executor = new AgentExecutor({ agent, tools });

const result = await executor.invoke({
  input: "Store the quarterly report on Filecoin, verify it, and save the CID in memory for next session."
});
```

## Available Tools

All 17 tools are available as LangChain DynamicStructuredTools:

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

const [storeFile] = tools;
const result = await storeFile.invoke({
  content: "test content that is at least 127 bytes long for the Filecoin minimum size requirement",
  filename: "test.txt"
});
```
