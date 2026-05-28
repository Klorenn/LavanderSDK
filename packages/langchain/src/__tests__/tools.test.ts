import { describe, expect, it } from "vitest";
import { createFakeStorageBackend, TEST_CID } from "@filecoin-agent/testkit";
import { createFetcherTools } from "../tools.js";

describe("createFetcherTools", () => {
  it("returns named LangChain tools", () => {
    const tools = createFetcherTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(tools.map((tool) => tool.name)).toEqual([
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

  it("stores content and returns JSON", async () => {
    const [storeFile] = createFetcherTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    const result = await storeFile.invoke({ content: "This is langchain test content that must be at least 127 bytes long to pass Filecoin minimum size check enforced by the SDK layer.", filename: "test.txt" });
    expect(JSON.parse(String(result))).toMatchObject({ cid: TEST_CID, complete: true });
  });
});
