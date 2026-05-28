# Filecoin Agent SDK Architecture

Filecoin Agent SDK is a thin agent-native layer over Filecoin Onchain Cloud. The project does not replace Synapse SDK or `foc-cli`; it gives agent frameworks one small, safe contract for storage.

## Decision

Adapters depend on `@filecoin-agent/core`. Only core knows about Synapse.

```txt
MCP tools ───────┐
LangChain tools ─┼──> @filecoin-agent/core ──> Synapse SDK ──> Filecoin Onchain Cloud
LlamaIndex tools ┘
```

## Why this boundary exists

- Agent frameworks change faster than storage semantics.
- Filecoin/Synapse details should not leak into every adapter.
- Spending policy must be enforced once.
- Tests should run without wallet credentials.

## Core contract

The MVP exposes six operations: `storeText`, `storeFile`, `retrieve`, `verify`, `prepareStorage`, and `getBalance`.
