import { describe, expect, it } from "vitest";
import { FetcherError } from "../errors.js";
import { createSynapseBackend } from "../synapseBackend.js";

describe("createSynapseBackend", () => {
  it("requires a private key", async () => {
    await expect(createSynapseBackend({ network: "calibration" })).rejects.toBeInstanceOf(FetcherError);
  });

  it("accepts a 0x private key-shaped value without logging it", async () => {
    const backendPromise = createSynapseBackend({
      network: "calibration",
      privateKey: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    });
    await expect(backendPromise).resolves.toBeTruthy();
  });
});
