# Agent Memory Guide

Fetcher's memory system is the differentiator — nobody else gives AI agents structured, persistent memory on Filecoin Onchain Cloud.

## How it works

Each memory entry is stored as a JSON object on Filecoin, indexed locally by `agent_id` + `memory_key`. The agent can store, retrieve, update, list, and delete memories across sessions.

## Quick Start

```ts
import { Fetcher } from "@filecoin-agent/sdk";
import { createSynapseBackend } from "@filecoin-agent/core";

const fetcher = new Fetcher({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true },
  indexDir: "~/.fetcher"
});

await fetcher.memory.store({
  agentId: "my-assistant",
  memoryKey: "user_preferences",
  data: { language: "es", theme: "dark", notifications: true },
  confirmPaidOperation: true
});

const { data, version, ageDays } = await fetcher.memory.retrieve({
  agentId: "my-assistant",
  memoryKey: "user_preferences"
});
```

## Memory tools

| Tool | Description |
|---|---|
| `store_memory` | Create or overwrite a memory entry with version tracking |
| `retrieve_memory` | Fetch a memory with optional fallback |
| `update_memory` | Patch specific fields without replacing the whole object |
| `list_memories` | List all memories for an agent |
| `delete_memory` | Remove from local index (Filecoin data is permanent) |

## Versioning

Every `store_memory` increments the version counter. The agent can detect conflicts or track changes over time.

## TTL

Set `ttlDays` to auto-expire memories. After expiration, `retrieve_memory` returns `found: false`.

```ts
await fetcher.memory.store({
  agentId: "session-agent",
  memoryKey: "temp_context",
  data: { task: "in-progress" },
  ttlDays: 7
});
```
