import { z } from "zod";

const cidSchema = z.string().min(1, "CID is required");

const metadataSchema = z
  .record(z.string().min(1).max(32), z.string().max(128))
  .refine((value) => Object.keys(value).length <= 5, "Piece metadata supports at most 5 keys")
  .optional();

export const storeFileInputSchema = z.object({
  content: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  tags: z.array(z.string().min(1).max(32)).max(10).optional(),
  copies: z.number().int().min(1).max(10).optional(),
  confirmPaidOperation: z.boolean().optional()
});

export const retrieveInputSchema = z.object({
  cid: cidSchema,
  outputPath: z.string().min(1).optional(),
  withCDN: z.boolean().optional(),
  encoding: z.enum(["text", "base64", "json"]).optional()
});

export const verifyInputSchema = z.object({
  cid: cidSchema,
  checkGateways: z.boolean().optional()
});

export const prepareStorageInputSchema = z.object({
  bytes: z.number().int().positive(),
  months: z.number().int().min(1).max(60).optional(),
  confirmPaidOperation: z.boolean().optional()
});

export const listFilesInputSchema = z.object({
  tag: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  before: z.string().optional()
});

export const deleteFileInputSchema = z.object({
  cid: cidSchema,
  confirm: z.literal(true)
});

export const storeMemoryInputSchema = z.object({
  agentId: z.string().min(1).max(64),
  memoryKey: z.string().min(1).max(128),
  data: z.record(z.string(), z.unknown()),
  ttlDays: z.number().int().positive().max(365).optional(),
  overwrite: z.boolean().optional(),
  confirmPaidOperation: z.boolean().optional()
});

export const retrieveMemoryInputSchema = z.object({
  agentId: z.string().min(1).max(64),
  memoryKey: z.string().min(1).max(128),
  fallback: z.record(z.string(), z.unknown()).optional()
});

export const updateMemoryInputSchema = z.object({
  agentId: z.string().min(1).max(64),
  memoryKey: z.string().min(1).max(128),
  patch: z.record(z.string(), z.unknown()),
  confirmPaidOperation: z.boolean().optional()
});
