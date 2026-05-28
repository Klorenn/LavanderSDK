import { describe, expect, it } from "vitest";
import { storeFileInputSchema, verifyInputSchema, listFilesInputSchema, deleteFileInputSchema, storeMemoryInputSchema, retrieveMemoryInputSchema, updateMemoryInputSchema } from "../schemas.js";

const LONG_TEXT = "This is test content that must be at least 127 bytes long to pass the Filecoin minimum size check enforced by the SDK layer. Extra padding.";

describe("core schemas", () => {
  it("accepts a safe storeFile input with string content", () => {
    const parsed = storeFileInputSchema.parse({ content: LONG_TEXT, filename: "test.txt", tags: ["report"], copies: 2, confirmPaidOperation: true });
    expect(parsed.copies).toBe(2);
    expect(parsed.tags).toEqual(["report"]);
  });

  it("rejects empty content", () => {
    expect(() => storeFileInputSchema.parse({ content: "", filename: "test.txt" })).toThrow();
  });

  it("accepts verify with any CID", () => {
    expect(verifyInputSchema.parse({ cid: "bafkzcibnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn" }).cid).toBe("bafkzcibnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn");
  });

  it("accepts listFiles input", () => {
    expect(listFilesInputSchema.parse({ tag: "report", limit: 10 }).tag).toBe("report");
  });

  it("accepts deleteFile with confirm=true", () => {
    expect(deleteFileInputSchema.parse({ cid: "bafkzcibnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn", confirm: true }).confirm).toBe(true);
  });

  it("rejects deleteFile without confirm", () => {
    expect(() => deleteFileInputSchema.parse({ cid: "bafkzcibnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn", confirm: false })).toThrow();
  });

  it("accepts memory schemas", () => {
    expect(storeMemoryInputSchema.parse({ agentId: "my-agent", memoryKey: "prefs", data: { lang: "es" } }).agentId).toBe("my-agent");
    expect(retrieveMemoryInputSchema.parse({ agentId: "my-agent", memoryKey: "prefs" }).memoryKey).toBe("prefs");
    expect(updateMemoryInputSchema.parse({ agentId: "my-agent", memoryKey: "prefs", patch: { lang: "en" } }).patch.lang).toBe("en");
  });

  it("accepts binary data input", () => {
    const parsed = storeFileInputSchema.parse({ data: new Uint8Array([1, 2, 3]), filename: "image.png" });
    expect(parsed.filename).toBe("image.png");
    expect(parsed.data).toBeInstanceOf(Uint8Array);
  });

  it("rejects when both content and data are provided", () => {
    expect(() => storeFileInputSchema.parse({ content: "text", data: new Uint8Array([1]), filename: "f.txt" })).toThrow();
  });

  it("rejects when neither content nor data is provided", () => {
    expect(() => storeFileInputSchema.parse({ filename: "f.txt" })).toThrow();
  });
});
