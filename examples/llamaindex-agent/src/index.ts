import { createFetcherTools } from "@fetcher-fil/llamaindex";
import { createSynapseBackend } from "@fetcher-fil/core";

const privateKey = process.env.FILECOIN_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("FILECOIN_PRIVATE_KEY is required");

const backend = await createSynapseBackend({ privateKey, network: "calibration" });
const tools = createFetcherTools({
  backend,
  spendingPolicy: { allowPaidOperations: true }
});

console.log("Tools:", tools.map((t) => t.metadata.name));
