import { describe, expect, it } from "vitest";
import { createFetcherAgent } from "../agent.js";
import { createFakeStorageBackend, MemoryIndexBackend, TEST_CID } from "@fetcher-fil/testkit";

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

  it("uses injected indexBackend — stored file appears in MemoryIndexBackend", async () => {
    const indexBackend = new MemoryIndexBackend();
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      indexBackend,
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    });

    await agent.storeFile({ content: CONTENT, filename: "injected.txt" });
    const page = await indexBackend.listFiles({});

    expect(page.total).toBe(1);
    expect(page.files[0].filename).toBe("injected.txt");
  });

  it("stores binary data and returns a CID", async () => {
    const agent = createFetcherAgent({
      backend: createFakeStorageBackend(),
      indexBackend: new MemoryIndexBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false },
    });

    const binaryData = new Uint8Array(200).fill(0xff);
    const result = await agent.storeFile({ data: binaryData, filename: "photo.png" });

    expect(result.cid).toBe(TEST_CID);
    expect(result.filename).toBe("photo.png");
  });
});
