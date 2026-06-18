import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';

import { AppError, notFound, validationError } from './errors';
import {
  assertHttpUrl,
  generateDedupeKey,
  parseMoney,
  parsePercent,
  trimToNull
} from './normalization';
import { calculateScore } from './score';
import {
  captureOfferManualSchema,
  getOfferDetailSchema,
  listOffersSchema,
  updateOfferManualSchema,
  type CaptureOfferManualInput,
  type GetOfferDetailInput,
  type ListOffersInput,
  type UpdateOfferManualInput
} from './schemas';
import { assertAdmin, resolveActiveWorkspaceForUser, type MembershipRepository } from './workspace';
import type {
  CategoryRecord,
  OfferDetail,
  OfferListFilters,
  OfferListItem,
  OfferRecord,
  PriceSnapshotRecord,
  StructuredLogger,
  TagRecord
} from './types';

export interface OfferRepository extends MembershipRepository {
  getCategory(workspaceId: string, categoryId: string): Promise<CategoryRecord | null>;
  getTags(workspaceId: string, tagIds: string[]): Promise<TagRecord[]>;
  findOfferByDedupeKey(workspaceId: string, dedupeKey: string): Promise<OfferRecord | null>;
  findOfferByExternalIdentity(
    workspaceId: string,
    marketplace: OfferRecord['marketplace'],
    externalId: string
  ): Promise<OfferRecord | null>;
  getOffer(workspaceId: string, offerId: string): Promise<OfferRecord | null>;
  listPriceSnapshots(workspaceId: string, offerId: string): Promise<PriceSnapshotRecord[]>;
  createOffer(offer: OfferRecord): Promise<OfferRecord>;
  updateOffer(offerId: string, patch: OfferRecord): Promise<OfferRecord>;
  replaceOfferTags(workspaceId: string, offerId: string, tagIds: string[]): Promise<void>;
  createPriceSnapshot(snapshot: Omit<PriceSnapshotRecord, 'id'>): Promise<PriceSnapshotRecord>;
  listOffers(
    workspaceId: string,
    filters: OfferListFilters
  ): Promise<{ items: OfferListItem[]; nextCursor: string | null }>;
  getOfferDetail(workspaceId: string, offerId: string): Promise<OfferDetail | null>;
}

export interface OfferServiceContext {
  actorUserId: string | null;
  repository: OfferRepository;
  logger?: StructuredLogger;
  now?: () => Date;
  createId?: () => string;
}

type NormalizedOfferInput = {
  title: string;
  sourceUrl: string;
  affiliateUrl: string;
  imageUrl: string | null;
  categoryId: string | null;
  currentPrice: number;
  previousPrice: number | null;
  couponCode: string | null;
  freeShipping: boolean;
  commissionPercent: number | null;
};

export async function captureOfferManual(
  input: CaptureOfferManualInput,
  context: OfferServiceContext
): Promise<{
  offer: OfferRecord;
  created: boolean;
  updated: boolean;
  snapshotCreated: boolean;
}> {
  const parsed = parseInput(captureOfferManualSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertAdmin(membership);

  const normalized = await normalizeOfferInput(parsed, membership.workspaceId, context.repository);
  const dedupe = generateDedupeKey(parsed.marketplace, parsed.externalId, normalized.sourceUrl);

  const byDedupe = await context.repository.findOfferByDedupeKey(
    membership.workspaceId,
    dedupe.dedupeKey
  );
  const byExternal = await context.repository.findOfferByExternalIdentity(
    membership.workspaceId,
    parsed.marketplace,
    dedupe.externalId
  );

  if (byDedupe && byExternal && byDedupe.id !== byExternal.id) {
    throw new AppError(
      'DUPLICATE_CONFLICT',
      'A oferta conflita com registros existentes.',
      409
    );
  }

  const existing = byDedupe ?? byExternal;
  const previousSnapshots = existing
    ? await context.repository.listPriceSnapshots(membership.workspaceId, existing.id)
    : [];
  const score = calculateScore(normalized, previousSnapshots);
  const observedAt = parsed.capturedAt ?? getNow(context);
  const offerRecord = buildOfferRecord({
    id: existing?.id ?? context.createId?.() ?? randomUUID(),
    workspaceId: membership.workspaceId,
    actorUserId: membership.userId,
    marketplace: parsed.marketplace,
    externalId: dedupe.externalId,
    dedupeKey: dedupe.dedupeKey,
    normalized,
    score,
    existing,
    observedAt
  });
  const snapshotCreated = !existing || hasSnapshotRelevantChange(existing, offerRecord);
  const offer = existing
    ? await context.repository.updateOffer(existing.id, offerRecord)
    : await context.repository.createOffer(offerRecord);

  await context.repository.replaceOfferTags(membership.workspaceId, offer.id, parsed.tagIds);

  if (snapshotCreated) {
    await context.repository.createPriceSnapshot(buildSnapshot(offer, observedAt));
  }

  context.logger?.info('offer.capture_manual.completed', {
    workspaceId: membership.workspaceId,
    offerId: offer.id,
    created: !existing,
    snapshotCreated
  });

  return {
    offer,
    created: !existing,
    updated: Boolean(existing),
    snapshotCreated
  };
}

export async function updateOfferManual(
  input: UpdateOfferManualInput,
  context: OfferServiceContext
): Promise<{ offer: OfferRecord; updated: true; snapshotCreated: boolean }> {
  const parsed = parseInput(updateOfferManualSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertAdmin(membership);

  const existing = await context.repository.getOffer(membership.workspaceId, parsed.offerId);
  if (!existing) throw notFound('Oferta nao encontrada.');

  const normalized = await normalizeOfferInput(parsed, membership.workspaceId, context.repository);
  const previousSnapshots = await context.repository.listPriceSnapshots(
    membership.workspaceId,
    existing.id
  );
  const score = calculateScore(normalized, previousSnapshots);
  const observedAt = getNow(context);
  const offerRecord = buildOfferRecord({
    id: existing.id,
    workspaceId: membership.workspaceId,
    actorUserId: membership.userId,
    marketplace: existing.marketplace,
    externalId: existing.externalId,
    dedupeKey: existing.dedupeKey,
    normalized,
    score,
    existing,
    observedAt
  });
  const snapshotCreated = hasSnapshotRelevantChange(existing, offerRecord);
  const offer = await context.repository.updateOffer(existing.id, offerRecord);

  await context.repository.replaceOfferTags(membership.workspaceId, offer.id, parsed.tagIds);

  if (snapshotCreated) {
    await context.repository.createPriceSnapshot(buildSnapshot(offer, observedAt));
  }

  context.logger?.info('offer.update_manual.completed', {
    workspaceId: membership.workspaceId,
    offerId: offer.id,
    snapshotCreated
  });

  return { offer, updated: true, snapshotCreated };
}

export async function listOffers(
  input: ListOffersInput,
  context: OfferServiceContext
): Promise<{ items: OfferListItem[]; nextCursor: string | null }> {
  const parsed = parseInput(listOffersSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  return context.repository.listOffers(membership.workspaceId, parsed);
}

export async function getOfferDetail(
  input: GetOfferDetailInput,
  context: OfferServiceContext
): Promise<OfferDetail> {
  const parsed = parseInput(getOfferDetailSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  const detail = await context.repository.getOfferDetail(membership.workspaceId, parsed.offerId);
  if (!detail) throw notFound('Oferta nao encontrada.');
  return detail;
}

function parseInput<T>(schema: { parse(value: unknown): T }, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw validationError('Revise os campos informados.', error.flatten().fieldErrors);
    }
    throw error;
  }
}

async function normalizeOfferInput(
  input: {
    sourceUrl: string;
    affiliateUrl: string;
    title: string;
    imageUrl?: string | null | undefined;
    categoryId?: string | null | undefined;
    tagIds: string[];
    currentPrice: string | number;
    previousPrice?: string | number | null | undefined;
    couponCode?: string | null | undefined;
    freeShipping: boolean;
    commissionPercent?: string | number | null | undefined;
  },
  workspaceId: string,
  repository: OfferRepository
): Promise<NormalizedOfferInput> {
  const categoryId = input.categoryId ?? null;
  if (categoryId) {
    const category = await repository.getCategory(workspaceId, categoryId);
    if (!category || !category.isActive) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Categoria nao encontrada.', 404);
    }
  }

  const uniqueTagIds = Array.from(new Set(input.tagIds));
  if (uniqueTagIds.length > 0) {
    const tags = await repository.getTags(workspaceId, uniqueTagIds);
    const activeTagIds = new Set(tags.filter((tag) => tag.isActive).map((tag) => tag.id));
    const missing = uniqueTagIds.filter((tagId) => !activeTagIds.has(tagId));
    if (missing.length > 0) {
      throw new AppError('TAG_NOT_FOUND', 'Tag nao encontrada.', 404);
    }
  }

  const sourceUrl = assertHttpUrl(input.sourceUrl, 'sourceUrl');
  const affiliateUrl = assertHttpUrl(input.affiliateUrl, 'affiliateUrl');
  const imageUrl = input.imageUrl ? assertHttpUrl(input.imageUrl, 'imageUrl') : null;
  const currentPrice = parseMoney(input.currentPrice, 'currentPrice');
  const previousPrice =
    input.previousPrice === null || input.previousPrice === undefined
      ? null
      : parseMoney(input.previousPrice, 'previousPrice');

  return {
    title: input.title.trim(),
    sourceUrl,
    affiliateUrl,
    imageUrl,
    categoryId,
    currentPrice,
    previousPrice,
    couponCode: trimToNull(input.couponCode),
    freeShipping: input.freeShipping,
    commissionPercent: parsePercent(input.commissionPercent, 'commissionPercent')
  };
}

function buildOfferRecord(args: {
  id: string;
  workspaceId: string;
  actorUserId: string;
  marketplace: OfferRecord['marketplace'];
  externalId: string;
  dedupeKey: string;
  normalized: NormalizedOfferInput;
  score: ReturnType<typeof calculateScore>;
  existing: OfferRecord | null;
  observedAt: string;
}): OfferRecord {
  return {
    id: args.id,
    workspaceId: args.workspaceId,
    marketplace: args.marketplace,
    externalId: args.externalId,
    dedupeKey: args.dedupeKey,
    sourceUrl: args.normalized.sourceUrl,
    affiliateUrl: args.normalized.affiliateUrl,
    title: args.normalized.title,
    imageUrl: args.normalized.imageUrl,
    categoryId: args.normalized.categoryId,
    currentPrice: args.normalized.currentPrice,
    previousPrice: args.normalized.previousPrice,
    currency: 'BRL',
    discountPercent: args.score.discountPercent,
    couponCode: args.normalized.couponCode,
    freeShipping: args.normalized.freeShipping,
    commissionPercent: args.normalized.commissionPercent,
    score: args.score.score,
    scoreVersion: args.score.scoreVersion,
    scoreFactors: args.score.scoreFactors,
    highlights: args.score.highlights,
    status: 'captured',
    capturedAt: args.existing?.capturedAt ?? args.observedAt,
    lastSeenAt: args.observedAt,
    createdBy: args.existing?.createdBy ?? args.actorUserId,
    updatedBy: args.actorUserId,
    createdAt: args.existing?.createdAt ?? args.observedAt,
    updatedAt: args.observedAt
  };
}

function buildSnapshot(offer: OfferRecord, observedAt: string): Omit<PriceSnapshotRecord, 'id'> {
  return {
    workspaceId: offer.workspaceId,
    offerId: offer.id,
    price: offer.currentPrice,
    previousPrice: offer.previousPrice,
    discountPercent: offer.discountPercent,
    couponCode: offer.couponCode,
    freeShipping: offer.freeShipping,
    observedAt
  };
}

function hasSnapshotRelevantChange(previous: OfferRecord, next: OfferRecord): boolean {
  return (
    previous.currentPrice !== next.currentPrice ||
    previous.previousPrice !== next.previousPrice ||
    previous.couponCode !== next.couponCode ||
    previous.freeShipping !== next.freeShipping
  );
}

function getNow(context: OfferServiceContext): string {
  return context.now?.().toISOString() ?? new Date().toISOString();
}
