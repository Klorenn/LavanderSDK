import { describe, expect, it } from "vitest";
import { createFakeStorageBackend, TEST_PIECE_CID } from "@filecoin-agent/testkit";
import { createFilecoinTools } from "../tools.js";

describe("createFilecoinTools", () => {
  it("returns named LangChain tools", () => {
    const tools = createFilecoinTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      "filecoin_store_text",
      "filecoin_store_file",
      "filecoin_retrieve",
      "filecoin_verify",
      "filecoin_prepare_storage",
      "filecoin_balance"
    ]);
  });

  it("stores text and returns JSON", async () => {
    const [storeText] = createFilecoinTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    const result = await storeText.invoke({ text: "langchain text" });
    expect(JSON.parse(String(result))).toMatchObject({ pieceCid: TEST_PIECE_CID, complete: true });
  });
});
