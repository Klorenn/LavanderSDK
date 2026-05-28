# MCP Setup

Connect Claude Desktop or any MCP client to Filecoin in one config change.

## Requirements

- Filecoin EVM wallet with USDFC on Calibration or Mainnet
- Node.js 18+

## Claude Desktop

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

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `FILECOIN_PRIVATE_KEY` | Yes | — | EVM wallet private key (0x...) |
| `FILECOIN_NETWORK` | No | `calibration` | `mainnet` or `calibration` |
| `FILECOIN_AGENT_ALLOW_PAID` | No | `false` | Set `true` to enable storage payments |

## Available Tools

17 tools: store_file, retrieve_file, list_files, delete_file, verify_cid, check_deal, get_proof, get_balance, estimate_cost, get_storage_stats, list_deals, store_memory, retrieve_memory, update_memory, list_memories, delete_memory, prepare_storage.

## Safety

Paid operations are **blocked by default**. Set `FILECOIN_AGENT_ALLOW_PAID=true` intentionally. Start on Calibration testnet before using Mainnet.
