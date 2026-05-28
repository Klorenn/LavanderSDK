# MCP Setup Guide

Connect Claude Desktop or any MCP-compatible client to Filecoin in one config change.

## Requirements

- Filecoin EVM wallet with USDFC on Calibration or Mainnet
- Node.js 18+

## Setup

Add this to your MCP client config:

### Claude Desktop

```json
{
  "mcpServers": {
    "fetcher": {
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

### Claude Code (CLI)

```bash
claude mcp add fetcher -- npx @filecoin-agent/mcp
```

Then set the environment variables in your shell profile.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `FILECOIN_PRIVATE_KEY` | Yes | — | EVM wallet private key (0x...) |
| `FILECOIN_NETWORK` | No | `calibration` | `mainnet` or `calibration` |
| `FILECOIN_AGENT_ALLOW_PAID` | No | `false` | Set `true` to enable storage payments |

## Available Tools

Once connected, your agent sees 17 tools:

| Group | Tools |
|---|---|
| Storage | `store_file`, `retrieve_file`, `list_files`, `delete_file` |
| Verify | `verify_cid`, `check_deal`, `get_proof` |
| Observe | `get_balance`, `estimate_cost`, `get_storage_stats`, `list_deals` |
| Memory | `store_memory`, `retrieve_memory`, `update_memory`, `list_memories`, `delete_memory` |
| Payments | `prepare_storage` |

## Safety

Paid operations are **blocked by default**. Set `FILECOIN_AGENT_ALLOW_PAID=true` intentionally. Start on Calibration testnet before using Mainnet.
