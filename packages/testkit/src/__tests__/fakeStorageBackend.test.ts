import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "../fakeStorageBackend.js";
import { TEST_CID } from "../fixtures.js";

describe("createFakeStorageBackend", () => {
  it("stores, downloads, and verifies bytes", async () => {
    const backend = createFakeStorageBackend({ cid: TEST_CID });
    const data = new TextEncoder().encode("fake storage works for testing the full pipeline end to end with enough bytes to pass minimum");

    const stored = await backend.upload(data);
    expect(stored.cid).toBe(TEST_CID);
    expect(stored.url).toContain("w3s.link");
    expect(stored.dealStatus).toBe("active");
    expect(stored.provider).toBe("synapse");

    const downloaded = await backend.download({ cid: stored.cid });
    expect(new TextDecoder().decode(downloaded)).toContain("fake storage works");

    const verified = await backend.verify({ cid: stored.cid });
    expect(verified).toMatchObject({ verified: true, status: "stored", copies: 2 });

    const balance = await backend.getBalance();
    expect(balance.balanceUsdfc).toBe("100");
    expect(balance.availableUsdfc).toBe("95");
  });
});
