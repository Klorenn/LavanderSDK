# Fetcher — Filecoin Agent SDK Architecture

Fetcher is a thin agent-native layer over Filecoin Onchain Cloud via Synapse SDK.

## Decision

Adapters depend on `@fetcher-fil/core`. Only core knows about Synapse.

```txt
MCP tools ───────┐
LangChain tools ─┼──> @fetcher-fil/core ──> Synapse SDK ──> Filecoin Onchain Cloud
LlamaIndex tools ┘
SDK direct ──────┘
```

## Why this boundary exists

- Agent frameworks change faster than storage semantics.
- Filecoin/Synapse details should not leak into every adapter.
- Spending policy must be enforced once.
- Tests should run without wallet credentials.

## Core contract

The SDK exposes 17 operations across 5 groups: Storage (4), Verification (3), Observability (4), Agent Memory (5), Payments (1).
All adapters — MCP, LangChain, LlamaIndex, SDK — expose identical semantics.
