import { createFilecoinTools } from "@filecoin-agent/langchain";
import { createSynapseBackend } from "@filecoin-agent/core";

const privateKey = process.env.FILECOIN_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("FILECOIN_PRIVATE_KEY is required");

const backend = await createSynapseBackend({ privateKey, network: "calibration" });
const tools = createFilecoinTools({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});

console.log(tools.map((tool) => tool.name));
