import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "@filecoin-agent/testkit";
import { createFilecoinTools } from "../tools.js";

describe("createFilecoinTools", () => {
  it("returns named LlamaIndex tools", () => {
    const tools = createFilecoinTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(tools.map((tool) => tool.metadata.name)).toEqual([
      "filecoin_store_text",
      "filecoin_store_file",
      "filecoin_retrieve",
      "filecoin_verify",
      "filecoin_prepare_storage",
      "filecoin_balance"
    ]);
  });
});
