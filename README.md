# Filecoin Agent SDK

Agent-native tools for Filecoin Onchain Cloud.

## Packages

| Package | Purpose |
|---|---|
| `@filecoin-agent/core` | Core storage API, spending policy, Synapse backend seam. |
| `@filecoin-agent/mcp` | MCP stdio server exposing Filecoin storage tools. |
| `@filecoin-agent/langchain` | LangChain JS tools. |
| `@filecoin-agent/llamaindex` | LlamaIndex TS tools. |
| `@filecoin-agent/testkit` | Fake backend and fixtures for tests. |

## Verify locally

```bash
npm test
npm run build
```

## Safety

Paid operations are blocked by default. Start on Calibration and read `docs/security.md` before enabling mainnet.
