import { z } from 'zod';

export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected']);

const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'UUID invalido.'
  );

const noteSchema = z.string().trim().min(1).max(2000);

export const listApprovalQueueSchema = z
  .object({
    status: approvalStatusSchema.optional(),
    q: z.string().trim().min(1).max(120).optional(),
    minScore: z.number().int().min(0).max(100).optional(),
    marketplace: z.enum(['manual', 'mercado_livre', 'shopee']).optional(),
    categoryId: uuidSchema.optional(),
    cursor: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(100).default(30),
    sort: z.enum(['priority_desc', 'updated_desc', 'captured_desc']).default('priority_desc')
  })
  .strict();

export const getApprovalDetailSchema = z
  .object({
    queueId: uuidSchema.optional(),
    offerId: uuidSchema.optional()
  })
  .strict()
  .refine((value) => Boolean(value.queueId) !== Boolean(value.offerId), {
    message: 'Informe queueId ou offerId.',
    path: ['queueId']
  });

export const approveOfferSchema = z
  .object({
    queueId: uuidSchema,
    expectedStatus: z.literal('pending'),
    note: noteSchema.optional().nullable()
  })
  .strict();

export const rejectOfferSchema = z
  .object({
    queueId: uuidSchema,
    expectedStatus: z.literal('pending'),
    reason: z.string().trim().min(3).max(2000)
  })
  .strict();

export const addReviewNoteSchema = z
  .object({
    queueId: uuidSchema,
    body: noteSchema
  })
  .strict();

export const listReviewHistorySchema = z
  .object({
    queueId: uuidSchema,
    cursor: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(100).default(30)
  })
  .strict();

export type ListApprovalQueueInput = z.input<typeof listApprovalQueueSchema>;
export type GetApprovalDetailInput = z.input<typeof getApprovalDetailSchema>;
export type ApproveOfferInput = z.input<typeof approveOfferSchema>;
export type RejectOfferInput = z.input<typeof rejectOfferSchema>;
export type AddReviewNoteInput = z.input<typeof addReviewNoteSchema>;
export type ListReviewHistoryInput = z.input<typeof listReviewHistorySchema>;
