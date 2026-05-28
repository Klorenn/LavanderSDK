import { z } from "zod";

const cidSchema = z.string().min(1, "CID is required");

export const storeFileInputSchema = z.object({
  content: z.string().min(1).optional(),
  data: z.any().optional(),
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  tags: z.array(z.string().min(1).max(32)).max(10).optional(),
  copies: z.number().int().min(1).max(10).optional(),
  confirmPaidOperation: z.boolean().optional(),
}).refine(
  (v) => (v.content !== undefined) !== (v.data !== undefined),
  { message: "Provide either content or data, not both and not neither." }
);

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

export const listMemoriesInputSchema = z.object({
  agentId: z.string().min(1).max(64),
  limit: z.number().int().min(1).max(100).optional()
});

export const deleteMemoryInputSchema = z.object({
  agentId: z.string().min(1).max(64),
  memoryKey: z.string().min(1).max(128),
  confirm: z.literal(true)
});

export const getStorageStatsInputSchema = z.object({
  agentId: z.string().min(1).max(64).optional()
}).optional();

export const estimateCostInputSchema = z.object({
  sizeBytes: z.number().int().positive(),
  copies: z.number().int().min(1).max(10).optional(),
  durationDays: z.number().int().min(1).max(3650).optional()
});

export const listDealsInputSchema = z.object({
  status: z.enum(["active", "expired", "all"]).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

export const getProofInputSchema = z.object({
  cid: cidSchema
});
