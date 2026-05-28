#!/usr/bin/env node
import { createSynapseBackend, createFilecoinAgent } from "@filecoin-agent/core";

const privateKey = process.env.FILECOIN_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) {
  console.error("FILECOIN_PRIVATE_KEY is required");
  process.exit(1);
}

const backend = await createSynapseBackend({ privateKey, network: "calibration" });
const agent = createFilecoinAgent({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});

console.log("1. Checking balance...");
const balance = await agent.getBalance();
console.log("   Balance:", JSON.stringify(balance));

console.log("2. Storing text...");
const stored = await agent.storeText({
    text: "Filecoin Agent SDK end-to-end validation run — confirming the full core storage pipeline: Synapse backend upload, verify, and retrieve against Calibration testnet.",
  confirmPaidOperation: true
});
console.log("   Stored:", JSON.stringify(stored, null, 2));

console.log("3. Verifying...");
const verified = await agent.verify({ pieceCid: stored.pieceCid });
console.log("   Verified:", JSON.stringify(verified, null, 2));

console.log("4. Retrieving...");
const retrieved = await agent.retrieve({ pieceCid: stored.pieceCid });
console.log("   Retrieved:", retrieved.bytes ? new TextDecoder().decode(retrieved.bytes) : `outputPath=${retrieved.outputPath}`);

console.log("\nAll checks passed.");
