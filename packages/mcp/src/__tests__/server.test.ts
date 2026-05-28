import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "@fetcher-fil/testkit";
import { createFetcherMcpServer } from "../server.js";

describe("createFetcherMcpServer", () => {
  it("creates an MCP server with Fetcher identity", () => {
    const server = createFetcherMcpServer({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(server).toBeTruthy();
  });
});
