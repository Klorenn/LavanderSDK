# MCP Example

This example configures an MCP-compatible host to run Filecoin Agent SDK over stdio.

```json
{
  "mcpServers": {
    "filecoin-agent": {
      "command": "node",
      "args": ["../../packages/mcp/dist/cli.js"],
      "env": {
        "FILECOIN_PRIVATE_KEY": "0x...",
        "FILECOIN_NETWORK": "calibration",
        "FILECOIN_AGENT_ALLOW_PAID": "true"
      }
    }
  }
}
```
