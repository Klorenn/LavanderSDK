import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "../fakeStorageBackend.js";

const TEST_CID = "bafkzcibcccccccccccccccccccccccccccccccccccccccccccccccccccc";

describe("createFakeStorageBackend", () => {
  it("stores, downloads, and verifies bytes", async () => {
    const backend = createFakeStorageBackend({ cid: TEST_CID });
    const data = new TextEncoder().encode("fake storage works for testing the full pipeline end to end with enough bytes to pass minimum");

    const stored = await backend.upload(data);
    const downloaded = await backend.download({ cid: stored.cid });
    const verified = await backend.verify({ cid: stored.cid });

    expect(stored.cid).toBe(TEST_CID);
    expect(new TextDecoder().decode(downloaded)).toContain("fake storage works");
    expect(verified).toMatchObject({ verified: true, status: "stored", copies: 2 });
  });
});
