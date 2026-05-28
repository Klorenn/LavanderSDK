# Fetcher — Filecoin Agent SDK

> **The first unified SDK for Filecoin Onchain Cloud built for AI agent frameworks.**
> MCP · LangChain · LlamaIndex · SDK Direct · 17 tools · MIT License

---

## What is Fetcher?

Fetcher is an **open-source TypeScript SDK** that gives AI agents — Claude, GPT-4o, Gemini, LangChain agents, LlamaIndex agents — the ability to store, retrieve, verify, and remember data on **Filecoin Onchain Cloud**, the world's largest decentralized storage network.

One `npm install`. One config line. Your agent has 17 powerful tools.

### The problem Fetcher solves

AI agents today have no persistent, verifiable storage. They lose everything between sessions. They can't prove data integrity. They can't remember context across conversations. They have no way to monitor their own storage costs or deal status.

Fetcher solves all five gaps in a single package:

| Gap | Before Fetcher | With Fetcher |
|---|---|---|
| **No Filecoin MCP Server** | Developers had to build their own Synapse integration from scratch | Add one JSON block to Claude Desktop config — 17 tools appear automatically |
| **No LangChain Toolkit for Filecoin** | No `BaseToolkit` existed for Filecoin Onchain Cloud | `createFetcherTools()` returns 17 native DynamicStructuredTools |
| **No LlamaIndex Tools for Filecoin** | No `FunctionTool` existed for Filecoin | `createFetcherTools()` returns 17 native FunctionTools with JSON Schema |
| **No persistent agent memory** | Agents forget everything between sessions | Structured, versioned, TTL-aware memory on Filecoin — the differentiator |
| **No storage observability** | Agents have no dashboard of their own storage | `get_storage_stats`, `estimate_cost`, `list_deals`, `get_balance` |

---

## Why Filecoin Onchain Cloud?

Filecoin is not just "decentralized storage." With **Synapse SDK** and **Filecoin Onchain Cloud**, it becomes a production-grade backend for applications:

- **PDP (Proof of Data Possession)**: Every file is cryptographically verified **every hour** on-chain. Your agent can call `verify_cid` and get mathematical proof the data exists and hasn't been altered.
- **Filecoin Pay**: Programmable on-chain payments in USDFC. Your agent can check balances and estimate costs before spending.
- **Permanent addressing**: Every file gets a permanent CID (Content Identifier). No broken links. No server migrations. The CID is the file.

Fetcher wraps all of this complexity behind 17 simple tools. Your agent doesn't need to know what a PieceCID is, how PDP works, or how to sign a Filecoin transaction. It just calls `store_file({ content: "report", filename: "q4.txt" })`.

---

## What Fetcher is NOT

Fetcher does not replace Synapse SDK, `foc-cli`, or the Filecoin protocol. It is a **thin agent-native layer** that gives AI frameworks a safe, consistent contract for storage.

| Fetcher does | Fetcher does NOT do |
|---|---|
| Expose 17 tools for AI agents | Replace Synapse SDK or Filecoin protocol |
| Enforce spending policy (blocked by default) | Manage wallets or private keys |
| Provide three IndexBackend implementations | Delete data from Filecoin (impossible by design) |
| Work with any MCP-compatible client | Encrypt data (responsibility of the developer or Grimoire) |
| Run tests without a wallet (via testkit) | Provide a Python or Go SDK (on the roadmap) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     AI Agent (Claude, GPT, etc.)              │
└──────────┬──────────┬──────────┬──────────┬──────────────────┘
           │ MCP      │ LangChain│ LlamaIdx │ SDK Direct
           ▼          ▼          ▼          ▼
┌──────────────────────────────────────────────────────────────┐
│                    @fetcher-fil/core                          │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ Schemas │ │ Spending │ │  Agent    │ │ IndexBackend   │  │
│  │ (Zod)   │ │ Policy   │ │  Facade   │ │ (File/Mem/FIL) │  │
│  └─────────┘ └──────────┘ └───────────┘ └────────────────┘  │
│                              │                                │
│                    StorageBackend (interface)                 │
└──────────────────────────────┼───────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Synapse SDK       │
                    │ (@filoz/synapse)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Filecoin Onchain     │
                    │ Cloud (PDP + Pay)    │
                    └─────────────────────┘
```

**Key design decisions:**

1. **Adapters depend on core, never on Synapse directly.** LangChain, LlamaIndex, and MCP packages import from `@fetcher-fil/core`. Only core knows about the Synapse SDK. This means Synapse can evolve independently without breaking adapters.

2. **StorageBackend is a pluggable interface.** Production uses `createSynapseBackend()`. Tests use `createFakeStorageBackend()` from `@fetcher-fil/testkit`. No wallet needed for development.

3. **IndexBackend is a pluggable interface.** Three implementations: `FileIndexBackend` (local JSON), `MemoryIndexBackend` (in-memory, for tests), `FilecoinIndexBackend` (index stored on Filecoin itself — portable across environments).

4. **Spending policy is enforced once, in core.** Every paid operation passes through `assertPaidOperationAllowed()`. Paid ops are blocked by default. Confirmation is required. Max bytes per call is capped.

---

## The 17 Tools — Five Groups

### Storage (4)
| Tool | Input | Output |
|---|---|---|
| `store_file` | content\|data, filename, tags?, copies? | `{ cid, url, size, dealStatus, provider }` |
| `retrieve_file` | cid, outputPath?, encoding? | `{ content, mimeType, size, cid }` |
| `list_files` | tag?, limit?, before? | `{ files[], total, hasMore }` |
| `delete_file` | cid, confirm | `{ removedFromIndex, cid, note }` |

### Verification (3)
| Tool | Input | Output |
|---|---|---|
| `verify_cid` | cid, checkGateways? | `{ verified, accessible, integrity, copies }` |
| `check_deal` | cid | `{ dealActive, providers[], redundancy, lastProof }` |
| `get_proof` | cid | `{ proof, proofType, verifiedAt, provider }` |

### Observability (4)
| Tool | Input | Output |
|---|---|---|
| `get_balance` | — | `{ balanceUsdfc, balanceFil, availableUsdfc }` |
| `estimate_cost` | sizeBytes, copies?, days? | `{ estimatedCostUsdfc, breakdown, priceSource }` |
| `get_storage_stats` | agentId? | `{ totalFiles, totalSizeGb, tagsUsed[] }` |
| `list_deals` | status?, limit? | `{ deals[], total }` |

### Agent Memory (5) — The differentiator
| Tool | Input | Output |
|---|---|---|
| `store_memory` | agentId, memoryKey, data, ttlDays? | `{ cid, version, timestamp }` |
| `retrieve_memory` | agentId, memoryKey, fallback? | `{ data, version, found, ageDays }` |
| `update_memory` | agentId, memoryKey, patch | `{ cid, previousCid, updatedFields[] }` |
| `list_memories` | agentId, limit? | `{ memories[], total }` |
| `delete_memory` | agentId, memoryKey, confirm | `{ deleted, agentId, memoryKey }` |

### Payments (1)
| Tool | Input | Output |
|---|---|---|
| `prepare_storage` | bytes, months? | `{ ready, costUsdfc, allowanceSet, shortfall? }` |

---

## Packages

| Package | Purpose | Dependencies |
|---|---|---|
| `@fetcher-fil/core` | Core API, types, schemas, Synapse backend, IndexBackend | `@filoz/synapse-sdk`, `viem`, `zod` |
| `@fetcher-fil/mcp` | MCP stdio server — `npx @fetcher-fil/mcp` | `@modelcontextprotocol/server`, `@fetcher-fil/core` |
| `@fetcher-fil/langchain` | 17 LangChain DynamicStructuredTools | `@langchain/core`, `@fetcher-fil/core` |
| `@fetcher-fil/llamaindex` | 17 LlamaIndex FunctionTools | `llamaindex`, `@fetcher-fil/core` |
| `@fetcher-fil/sdk` | Direct programmatic API — `Fetcher` class | `@fetcher-fil/core` |
| `@fetcher-fil/testkit` | Fake backend + MemoryIndexBackend for testing | `@fetcher-fil/core` |
| `@fetcher-fil/landing` | Documentation site (React + Vite + Tailwind) | — |

---

## Safety by Default

AI agents are useful but should not have unlimited spending power. Fetcher ships with aggressive safety defaults:

| Setting | Default | Override |
|---|---|---|
| Network | Calibration (testnet) | Set `FILECOIN_NETWORK=mainnet` |
| Paid operations | Blocked | Set `allowPaidOperations: true` |
| Confirmation | Required per call | Pass `confirmPaidOperation: true` |
| Max per call | 10 MiB | Configure `maxStorageBytesPerCall` |
| Min data size | 127 bytes | Enforced by Synapse |

---

## License

MIT — Free for personal and commercial use.

## Links

- GitHub: [github.com/Klorenn/LavanderSDK](https://github.com/Klorenn/LavanderSDK)
- X: [@kl0ren](https://x.com/kl0ren)
- Filecoin ProPGF Batch 3
