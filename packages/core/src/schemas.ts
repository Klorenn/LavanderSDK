import { z } from "zod";

const pieceCidSchema = z
  .string()
  .regex(/^bafkzcib[a-z2-7]{50,70}$/i, "Expected a Filecoin PieceCID beginning with bafkzcib");

const metadataSchema = z
  .record(z.string().min(1).max(32), z.string().max(128))
  .refine((value) => Object.keys(value).length <= 5, "Piece metadata supports at most 5 keys")
  .optional();

export const storeTextInputSchema = z.object({
  text: z.string().min(1),
  metadata: metadataSchema,
  copies: z.number().int().min(1).max(10).optional(),
  confirmPaidOperation: z.boolean().optional()
});

export const storeFileInputSchema = z.object({
  path: z.string().min(1),
  metadata: metadataSchema,
  copies: z.number().int().min(1).max(10).optional(),
  confirmPaidOperation: z.boolean().optional()
});

export const retrieveInputSchema = z.object({
  pieceCid: pieceCidSchema,
  outputPath: z.string().min(1).optional(),
  withCDN: z.boolean().optional()
});

export const verifyInputSchema = z.object({
  pieceCid: pieceCidSchema
});

export const prepareStorageInputSchema = z.object({
  bytes: z.number().int().positive(),
  months: z.number().int().min(1).max(60).optional(),
  confirmPaidOperation: z.boolean().optional()
});
