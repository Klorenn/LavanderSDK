import { describe, expect, it } from "vitest";
import { createFilecoinMcpServer } from "../server.js";
import { createFakeStorageBackend } from "@filecoin-agent/testkit";

const pieceCid = "bafkzcibeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

describe("createFilecoinMcpServer", () => {
  it("creates an MCP server with Filecoin identity", () => {
    const server = createFilecoinMcpServer({
      backend: createFakeStorageBackend({ pieceCid }),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(server).toBeTruthy();
  });
});
