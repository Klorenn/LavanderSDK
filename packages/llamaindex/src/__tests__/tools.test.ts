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
      "store_file",
      "retrieve_file",
      "list_files",
      "verify_cid",
      "check_deal",
      "prepare_storage",
      "delete_file",
      "balance",
      "store_memory",
      "retrieve_memory",
      "update_memory"
    ]);
  });
});
