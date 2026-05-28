# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Fetcher** — a Filecoin Agent SDK monorepo. Exposes 17 tools for AI agents to store/retrieve/verify files and persist memory on Filecoin Onchain Cloud via `@filoz/synapse-sdk`.

Stack layer: `AI Agents → Fetcher SDK → Synapse SDK → Filecoin Onchain Cloud`

## Commands

```bash
# Root (all workspaces)
npm run build       # tsc build all packages
npm test            # vitest run all packages
npm run dev         # start landing app (Vite dev server)
npm run preview     # preview built landing

# Single workspace
npm --workspace packages/core run test
npm --workspace packages/core run test:watch
npm --workspace apps/landing run dev

# E2E validation (requires real wallet + Calibration testnet)
npm run validate    # scripts/e2e-validate.ts
```

## Workspace Structure

```
packages/
  core/       — FetcherAgent, StorageBackend interface, schemas (Zod), SpendingPolicy, FetcherIndex
  mcp/        — MCP stdio server wrapping core; bin: filecoin-agent-mcp
  langchain/  — LangChain DynamicStructuredTools adapter
  llamaindex/ — LlamaIndex FunctionTools adapter
  sdk/        — Fetcher class (programmatic API)
  testkit/    — FakeStorageBackend + fixtures for unit tests

apps/
  landing/    — React + Vite + Tailwind marketing site

examples/
  mcp-claude/         — Claude Desktop MCP config example
  langchain-agent/    — LangChain agent wiring example
  llamaindex-agent/   — LlamaIndex agent wiring example
```

## Core Architecture

**`packages/core`** is the dependency root — all adapters depend on it, nothing else does.

- `agent.ts` — `createFetcherAgent(config)` returns `FetcherStorage`; all 17 tool implementations live here
- `synapseBackend.ts` — `createSynapseBackend(config)` wraps `@filoz/synapse-sdk`; requires `FILECOIN_PRIVATE_KEY`
- `types.ts` — shared types (`FetcherConfig`, `StorageBackend`, `SpendingPolicy`)
- `schemas.ts` — Zod schemas for all 17 tool inputs
- `indexStore.ts` — local file index (`~/.fetcher/`) tracking CIDs and memories
- `errors.ts` — `FetcherError` with typed error codes

**Spending policy** (`SpendingPolicy`): paid operations are blocked by default (`allowPaidOperations: false`). All adapters must forward this to `createFetcherAgent`.

**Network**: defaults to `calibration`. Mainnet requires explicit opt-in.

## Testing

Tests use `vitest`. Each package has its own `vitest` run. Use `@filecoin-agent/testkit`'s `FakeStorageBackend` for unit tests — no real wallet or network needed.

```bash
# Run one test file
npm --workspace packages/core run test -- agent.test.ts
```

## TypeScript

Base config at `tsconfig.base.json` — `NodeNext` module resolution, `ES2022` target, strict mode. Each package extends it. All packages are ESM (`"type": "module"`).

## Landing App

React + Vite + Tailwind + Framer Motion. Routing is hash-based (`window.location.hash`) — no router library. The `#docs` hash renders the documentation section inside `App.tsx`. No component library beyond a local `Button` in `components/ui/`.
