import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "@filecoin-agent/testkit";
import { createFetcherTools } from "../tools.js";

describe("createFetcherTools", () => {
  it("returns named LlamaIndex tools", () => {
    const tools = createFetcherTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(tools.map((tool) => tool.metadata.name)).toEqual([
      "store_file", "retrieve_file", "list_files", "verify_cid", "check_deal",
      "get_proof", "prepare_storage", "delete_file", "get_balance", "estimate_cost",
      "get_storage_stats", "list_deals", "store_memory", "retrieve_memory",
      "update_memory", "list_memories", "delete_memory"
    ]);
  });
});
