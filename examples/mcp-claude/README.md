# MCP Example

Add this to your Claude Desktop config:

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
