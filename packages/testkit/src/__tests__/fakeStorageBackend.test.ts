import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "../fakeStorageBackend.js";

const pieceCid = "bafkzcibcccccccccccccccccccccccccccccccccccccccccccccccccccc";

describe("createFakeStorageBackend", () => {
  it("stores, downloads, and verifies bytes", async () => {
    const backend = createFakeStorageBackend({ pieceCid });
    const data = new TextEncoder().encode("fake storage works");

    const stored = await backend.upload(data);
    const downloaded = await backend.download({ pieceCid: stored.pieceCid });
    const verified = await backend.verify({ pieceCid: stored.pieceCid });

    expect(stored.pieceCid).toBe(pieceCid);
    expect(new TextDecoder().decode(downloaded)).toBe("fake storage works");
    expect(verified).toMatchObject({ verified: true, status: "stored", copies: 2 });
  });
});
