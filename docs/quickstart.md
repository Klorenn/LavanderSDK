# Filecoin Agent SDK Quickstart

Start on Calibration testnet. Mainnet should be an explicit decision.

## MCP

```json
{
  "mcpServers": {
    "filecoin-agent": {
      "command": "npx",
      "args": ["@filecoin-agent/mcp"],
      "env": {
        "FILECOIN_PRIVATE_KEY": "0x...",
        "FILECOIN_NETWORK": "calibration",
        "FILECOIN_AGENT_ALLOW_PAID": "true"
      }
    }
  }
}
```

Ask your agent:

```txt
Store this short report on Filecoin and verify it after upload.
```

## LangChain

```ts
import { createFilecoinTools } from "@filecoin-agent/langchain";
import { createSynapseBackend } from "@filecoin-agent/core";

const backend = await createSynapseBackend({ privateKey: process.env.FILECOIN_PRIVATE_KEY as `0x${string}` });
const tools = createFilecoinTools({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});
```

## LlamaIndex

```ts
import { createFilecoinTools } from "@filecoin-agent/llamaindex";
import { createSynapseBackend } from "@filecoin-agent/core";

const backend = await createSynapseBackend({ privateKey: process.env.FILECOIN_PRIVATE_KEY as `0x${string}` });
const tools = createFilecoinTools({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});
```
