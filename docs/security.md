# Filecoin Agent SDK Security

Agents are useful, but they are not financially responsible adults. The SDK therefore blocks paid operations by default.

## Defaults

| Setting | Default |
|---|---|
| Network | Calibration |
| Paid operations | Disabled |
| Confirmation | Required |
| Max bytes per paid call | 10 MiB |

## Rules

- Never commit private keys.
- Use Calibration before mainnet.
- Use `confirmPaidOperation: true` only when the user or application policy approved the spend.
- Prefer `outputPath` for retrievals that may be large.
- Enable mainnet only in controlled deployments.
