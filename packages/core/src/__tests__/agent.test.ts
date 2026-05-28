import { describe, expect, it } from "vitest";
import { createFetcherAgent } from "../agent.js";
import { createFakeStorageBackend, TEST_CID } from "@filecoin-agent/testkit";

const CONTENT = "This is test content that must be at least 127 bytes long to pass the Filecoin minimum size check enforced by the SDK. Extra padding.";

describe("createFetcherAgent — store/retrieve/verify", () => {
  it("stores content and returns a CID with filename", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
      indexDir: "/tmp/fetcher-test-agent"
    });

    const result = await agent.storeFile({ content: CONTENT, filename: "hello.txt" });

    expect(result.cid).toBe(TEST_CID);
    expect(result.filename).toBe("hello.txt");
    expect(result.complete).toBe(true);
  });

  it("retrieves bytes by CID", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
      indexDir: "/tmp/fetcher-test-agent"
    });

    await agent.storeFile({ content: CONTENT, filename: "test.txt" });
    const result = await agent.retrieve({ cid: TEST_CID });

    expect(new TextDecoder().decode(result.bytes)).toContain("test content");
  });

  it("verifies stored data", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
      indexDir: "/tmp/fetcher-test-agent"
    });

    await agent.storeFile({ content: CONTENT, filename: "verify.txt" });
    const result = await agent.verify({ cid: TEST_CID });

    expect(result.verified).toBe(true);
  });
});
