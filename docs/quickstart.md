# Quickstart

Start on Calibration testnet. Mainnet should be an explicit decision.

## MCP — Claude Desktop

```json
{
  "mcpServers": {
    "fetcher": {
      "command": "npx",
      "args": ["@fetcher-fil/mcp"],
      "env": {
        "FILECOIN_PRIVATE_KEY": "0x...",
        "FILECOIN_NETWORK": "calibration",
        "FILECOIN_AGENT_ALLOW_PAID": "true"
      }
    }
  }
}
```

## LangChain

```ts
import { createFetcherTools } from "@fetcher-fil/langchain";
import { createSynapseBackend } from "@fetcher-fil/core";

const tools = createFetcherTools({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true }
});
```

## LlamaIndex

```ts
import { createFetcherTools } from "@fetcher-fil/llamaindex";
import { createSynapseBackend } from "@fetcher-fil/core";

const tools = createFetcherTools({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true }
});
```

## SDK Direct

```ts
import { Fetcher } from "@fetcher-fil/sdk";
import { createSynapseBackend } from "@fetcher-fil/core";

const f = new Fetcher({
  backend: await createSynapseBackend({ privateKey: "0x..." }),
  spendingPolicy: { allowPaidOperations: true }
});

const { cid } = await f.store({ content: "Hello Filecoin", filename: "hello.txt" });
await f.memory.store({ agentId: "my-agent", memoryKey: "prefs", data: { theme: "dark" } });
```
