import { z } from 'zod';

import { marketplaceSchema } from '@/server/offers/schemas';
import { approvalStatusSchema } from '@/server/curation/schemas';
import type { ListOffersInput } from '@/server/offers/schemas';
import type { ListApprovalQueueInput } from '@/server/curation/schemas';

const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const firstString = z.preprocess((value) => {
  if (Array.isArray(value)) return value[0];
  return value;
}, z.string().trim().optional());

type RawSearchParams = Record<string, string | string[] | undefined>;

export type ParsedResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export function parseOfferSearchParams(params: RawSearchParams): ParsedResult<ListOffersInput> {
  const parsed = z
    .object({
      q: normalizedString(),
      marketplace: normalizedString().pipe(marketplaceSchema.optional()),
      categoryId: normalizedString().pipe(uuidSchema.optional()),
      tagId: normalizedString().pipe(uuidSchema.optional()),
      minScore: normalizedInteger(0, 100),
      minDiscount: normalizedNumber(0, 100),
      from: normalizedDate(),
      to: normalizedDate(),
      cursor: normalizedString(),
      limit: normalizedInteger(1, 100),
      sort: normalizedString().pipe(z.enum(['score_desc', 'captured_desc', 'discount_desc']).optional())
    })
    .safeParse(params);

  if (!parsed.success) return { ok: false, message: 'Filtros invalidos. Ajuste os campos e tente novamente.' };
  return { ok: true, value: stripUndefined(parsed.data) };
}

export function parseCurationSearchParams(
  params: RawSearchParams
): ParsedResult<ListApprovalQueueInput> {
  const parsed = z
    .object({
      status: normalizedString().pipe(approvalStatusSchema.optional()),
      q: normalizedString(),
      minScore: normalizedInteger(0, 100),
      marketplace: normalizedString().pipe(marketplaceSchema.optional()),
      categoryId: normalizedString().pipe(uuidSchema.optional()),
      cursor: normalizedString(),
      limit: normalizedInteger(1, 100),
      sort: normalizedString().pipe(z.enum(['priority_desc', 'updated_desc', 'captured_desc']).optional())
    })
    .safeParse(params);

  if (!parsed.success) return { ok: false, message: 'Filtros invalidos. Ajuste os campos e tente novamente.' };
  return { ok: true, value: stripUndefined(parsed.data) };
}

function normalizedString() {
  return firstString.transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });
}

function normalizedInteger(min: number, max: number) {
  return firstString.transform((value, ctx) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    const numeric = Number(trimmed);
    if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
      ctx.addIssue({ code: 'custom', message: `Valor deve ser inteiro entre ${min} e ${max}.` });
      return z.NEVER;
    }
    return numeric;
  });
}

function normalizedNumber(min: number, max: number) {
  return firstString.transform((value, ctx) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
      ctx.addIssue({ code: 'custom', message: `Valor deve estar entre ${min} e ${max}.` });
      return z.NEVER;
    }
    return numeric;
  });
}

function normalizedDate() {
  return firstString.transform((value, ctx) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Data invalida.' });
      return z.NEVER;
    }
    return date.toISOString();
  });
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
