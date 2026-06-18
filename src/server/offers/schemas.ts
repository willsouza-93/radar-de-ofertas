import { z } from 'zod';

export const marketplaceSchema = z.enum(['manual', 'mercado_livre', 'shopee']);

const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'UUID invalido.'
  );
const optionalStringSchema = z.string().trim().min(1).optional().nullable();
const priceSchema = z.union([z.string().trim().min(1), z.number()]);
const percentSchema = z.union([z.string().trim().min(1), z.number()]).optional().nullable();

export const captureOfferManualSchema = z
  .object({
    marketplace: marketplaceSchema,
    externalId: optionalStringSchema,
    sourceUrl: z.string().trim().min(1),
    affiliateUrl: z.string().trim().min(1),
    title: z.string().trim().min(3).max(500),
    imageUrl: optionalStringSchema,
    categoryId: uuidSchema.optional().nullable(),
    tagIds: z.array(uuidSchema).default([]),
    currentPrice: priceSchema,
    previousPrice: priceSchema.optional().nullable(),
    couponCode: optionalStringSchema,
    freeShipping: z.boolean().default(false),
    commissionPercent: percentSchema,
    capturedAt: z.iso.datetime().optional()
  })
  .strict();

export const updateOfferManualSchema = captureOfferManualSchema
  .omit({ marketplace: true, externalId: true, capturedAt: true })
  .extend({
    offerId: uuidSchema
  })
  .strict();

export const listOffersSchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    marketplace: marketplaceSchema.optional(),
    categoryId: uuidSchema.optional(),
    tagId: uuidSchema.optional(),
    minScore: z.number().int().min(0).max(100).optional(),
    minDiscount: z.number().min(0).max(100).optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
    cursor: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(100).default(30),
    sort: z.enum(['score_desc', 'captured_desc', 'discount_desc']).default('score_desc')
  })
  .strict();

export const getOfferDetailSchema = z
  .object({
    offerId: uuidSchema
  })
  .strict();

export type CaptureOfferManualInput = z.input<typeof captureOfferManualSchema>;
export type UpdateOfferManualInput = z.input<typeof updateOfferManualSchema>;
export type ListOffersInput = z.input<typeof listOffersSchema>;
export type GetOfferDetailInput = z.input<typeof getOfferDetailSchema>;
