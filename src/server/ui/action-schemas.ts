import { z } from 'zod';

export const curationActionUuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const loginActionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const noteActionSchema = z
  .object({
    queueId: curationActionUuidSchema,
    body: z.string().trim().min(1).max(2000)
  })
  .strict();

export const approveActionSchema = z
  .object({
    queueId: curationActionUuidSchema,
    note: z.string().trim().max(2000).optional()
  })
  .strict();

export const rejectActionSchema = z
  .object({
    queueId: curationActionUuidSchema,
    reason: z.string().trim().min(3).max(2000)
  })
  .strict();
