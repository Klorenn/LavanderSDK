import { describe, expect, it } from "vitest";
import { storeTextInputSchema, verifyInputSchema } from "../schemas.js";

const validPieceCid = "bafkzcibaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("core schemas", () => {
  it("accepts a safe storeText input", () => {
    const parsed = storeTextInputSchema.parse({
      text: "A report long enough to pass the SDK layer. Filecoin upload minimums are enforced by the backend.",
      metadata: { app: "agent" },
      copies: 2,
      confirmPaidOperation: true
    });

    expect(parsed.copies).toBe(2);
  });

  it("rejects empty text", () => {
    expect(() => storeTextInputSchema.parse({ text: "" })).toThrow();
  });

  it("rejects non PieceCID-shaped values", () => {
    expect(() => verifyInputSchema.parse({ pieceCid: "not-a-piece-cid" })).toThrow();
  });

  it("accepts PieceCID-shaped values", () => {
    expect(verifyInputSchema.parse({ pieceCid: validPieceCid }).pieceCid).toBe(validPieceCid);
  });
});
