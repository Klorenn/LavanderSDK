# Agent Memory Guide

Fetcher's memory system is the differentiator — structured, versioned, TTL-aware memory for AI agents on Filecoin.

## Quick Start

```ts
import { Fetcher } from "@fetcher-fil/sdk";
import { createSynapseBackend } from "@fetcher-fil/core";

const f = new Fetcher({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true }
});

// Store memory
await f.memory.store({
  agentId: "my-assistant",
  memoryKey: "user_preferences",
  data: { language: "es", theme: "dark" },
  confirmPaidOperation: true
});

// Retrieve next session
const mem = await f.memory.retrieve({
  agentId: "my-assistant",
  memoryKey: "user_preferences",
  fallback: { language: "en" }
});
// → { found: true, data: { language: "es", theme: "dark" }, version: 1 }

// Update a single field
await f.memory.update({
  agentId: "my-assistant",
  memoryKey: "user_preferences",
  patch: { theme: "system" }
});
// → { updatedFields: ["theme"], version: 2 }
```

## Features

- **Versioned**: Every store increments the version counter
- **TTL-aware**: Set ttlDays to auto-expire entries
- **Patch updates**: update_memory merges fields without replacing the object
- **Fallback values**: retrieve_memory accepts a default on miss
