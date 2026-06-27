import { randomUUID } from 'node:crypto';
import { z, ZodError } from 'zod';

import {
  MANUAL_CONNECTOR_ID,
  MANUAL_CONNECTOR_VERSION,
  MANUAL_SOURCE_KEY,
  ManualConnector
} from '@/server/connectors/manual';
import type { ManualImportRecord } from '@/server/connectors/manual';
import { AppError, validationError } from '@/server/offers/errors';
import { assertAdmin, resolveActiveWorkspaceForUser, type MembershipRepository } from '@/server/offers/workspace';

import { EditorialCooldownPolicy, type EditorialCooldownDecision, type ExistingOfferEditorialState } from './deduplication';
import type { StructuredLog } from './observability';
import { createCapturePipeline } from './pipeline';
import { DEFAULT_EDITORIAL_COOLDOWN_HOURS, type CaptureContext, type PipelineItemFailure, type ScoredOffer } from './types';

export const manualImportPayloadSchema = z.object({
  records: z.array(z.object({
    title: z.string(),
    sourceUrl: z.string(),
    currentPrice: z.union([z.string(), z.number()]),
    externalId: z.string().nullish(),
    affiliateUrl: z.string().nullish(),
    previousPrice: z.union([z.string(), z.number()]).nullish(),
    currency: z.string().nullish(),
    imageUrl: z.string().nullish(),
    couponCode: z.string().nullish(),
    freeShipping: z.union([z.boolean(), z.string(), z.number()]).nullish(),
    commissionPercent: z.union([z.string(), z.number()]).nullish(),
    sellerId: z.string().nullish(),
    sellerName: z.string().nullish(),
    availability: z.string().nullish(),
    capturedAt: z.string().nullish(),
    rawPayloadRef: z.string().nullish(),
    sourceMetadata: z.record(z.string(), z.unknown()).optional()
  })).min(1).max(100)
}).strict();

export type ManualImportPayload = z.infer<typeof manualImportPayloadSchema>;

export interface PersistedCaptureOffer extends ExistingOfferEditorialState {
  id: string;
  affiliateUrl: string;
  lastSeenAt: string;
}

export interface CapturePersistenceResult {
  offerId: string;
  created: boolean;
  updated: boolean;
  snapshotCreated: boolean;
  queueState: 'created' | 'already_pending' | 'reentered' | 'not_reentered' | 'unavailable';
  editorialDecision: EditorialCooldownDecision;
  warning?: string;
}

export type CaptureReviewSubmissionReason =
  | EditorialCooldownDecision['reason']
  | 'already_pending';

export interface CapturePersistenceRepository extends MembershipRepository {
  findOfferByDedupeKey(workspaceId: string, dedupeKey: string): Promise<PersistedCaptureOffer | null>;
  upsertOffer(input: {
    workspaceId: string;
    actorUserId: string;
    scoredOffer: ScoredOffer;
    existing: PersistedCaptureOffer | null;
    observedAt: string;
  }): Promise<PersistedCaptureOffer>;
  createPriceSnapshot(input: {
    workspaceId: string;
    offerId: string;
    scoredOffer: ScoredOffer;
    observedAt: string;
  }): Promise<boolean>;
  getApprovalQueueState(workspaceId: string, offerId: string): Promise<{
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    lastReviewedAt: string | null;
  } | null>;
  createApprovalQueue(input: {
    workspaceId: string;
    offerId: string;
    priorityScore: number;
    reentryReason: CaptureReviewSubmissionReason;
    captureRunId: string;
    correlationId: string;
  }): Promise<{ id: string }>;
  reopenApprovalQueue(input: {
    workspaceId: string;
    offerId: string;
    priorityScore: number;
    reentryReason: CaptureReviewSubmissionReason;
    captureRunId: string;
    correlationId: string;
  }): Promise<{ id: string }>;
}

export interface ManualImportContext {
  actorUserId: string | null;
  repository: CapturePersistenceRepository;
  now?: () => Date;
  createId?: () => string;
  logger?: {
    info(event: string, metadata?: Record<string, unknown>): void;
    warn(event: string, metadata?: Record<string, unknown>): void;
  };
}

export interface ManualImportResult {
  correlationId: string;
  captureRunId: string;
  received: number;
  processed: number;
  invalid: number;
  persisted: number;
  createdOffers: number;
  updatedOffers: number;
  snapshotsCreated: number;
  queueCreated: number;
  queueReentered: number;
  queueSkipped: number;
  failures: Array<{
    rawIndex: number;
    code: string;
    message: string;
  }>;
  logs: StructuredLog[];
}

export async function importManualOffers(
  input: unknown,
  context: ManualImportContext
): Promise<ManualImportResult> {
  const payload = parsePayload(input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertAdmin(membership);

  const capturedAt = context.now?.().toISOString() ?? new Date().toISOString();
  const correlationId = context.createId?.() ?? randomUUID();
  const captureRunId = context.createId?.() ?? randomUUID();
  const connector = new ManualConnector(payload.records as ManualImportRecord[]);
  const connectorResult = await connector.fetch({
    workspaceId: membership.workspaceId,
    connectorId: MANUAL_CONNECTOR_ID,
    connectorVersion: MANUAL_CONNECTOR_VERSION,
    correlationId,
    captureRunId,
    since: capturedAt
  });
  const captureContext: CaptureContext = {
    workspaceId: membership.workspaceId,
    sourceKey: MANUAL_SOURCE_KEY,
    connectorId: MANUAL_CONNECTOR_ID,
    connectorVersion: MANUAL_CONNECTOR_VERSION,
    correlationId,
    captureRunId,
    capturedAt
  };
  const pipelineRun = createCapturePipeline().process(connectorResult.items, captureContext);
  const result: ManualImportResult = {
    correlationId,
    captureRunId,
    received: pipelineRun.result.received,
    processed: pipelineRun.result.processed,
    invalid: pipelineRun.result.invalid,
    persisted: 0,
    createdOffers: 0,
    updatedOffers: 0,
    snapshotsCreated: 0,
    queueCreated: 0,
    queueReentered: 0,
    queueSkipped: 0,
    failures: pipelineRun.result.items
      .filter((item): item is PipelineItemFailure => item.status === 'invalid')
      .map((item) => ({
        rawIndex: item.rawIndex,
        code: item.errorCode,
        message: item.safeMessage
      })),
    logs: pipelineRun.logs
  };

  for (const item of pipelineRun.result.items) {
    if (item.status !== 'processed') continue;
    const persisted = await persistScoredOffer(item.scoredOffer, {
      workspaceId: membership.workspaceId,
      actorUserId: membership.userId,
      repository: context.repository,
      observedAt: item.normalizedOffer.capturedAt,
      captureRunId,
      correlationId
    }).catch((error: unknown) => {
      result.failures.push({
        rawIndex: item.rawIndex,
        code: error instanceof AppError ? error.code : 'PERSISTENCE_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao persistir oferta capturada.'
      });
      return null;
    });

    if (!persisted) continue;

    result.persisted += 1;
    if (persisted.created) result.createdOffers += 1;
    if (persisted.updated) result.updatedOffers += 1;
    if (persisted.snapshotCreated) result.snapshotsCreated += 1;
    if (persisted.queueState === 'created') result.queueCreated += 1;
    if (persisted.queueState === 'reentered') result.queueReentered += 1;
    if (
      persisted.queueState === 'already_pending' ||
      persisted.queueState === 'not_reentered' ||
      persisted.queueState === 'unavailable'
    ) {
      result.queueSkipped += 1;
    }
    if (persisted.warning) {
      result.failures.push({
        rawIndex: item.rawIndex,
        code: persisted.queueState === 'unavailable'
          ? 'APPROVAL_QUEUE_UNAVAILABLE'
          : 'PERSISTENCE_WARNING',
        message: persisted.warning
      });
    }
  }

  context.logger?.info('capture.manual_import.completed', {
    workspaceId: membership.workspaceId,
    captureRunId,
    correlationId,
    received: result.received,
    persisted: result.persisted,
    invalid: result.invalid
  });

  return result;
}

async function persistScoredOffer(
  scoredOffer: ScoredOffer,
  args: {
    workspaceId: string;
    actorUserId: string;
    repository: CapturePersistenceRepository;
    observedAt: string;
    captureRunId: string;
    correlationId: string;
  }
): Promise<CapturePersistenceResult> {
  const existing = await args.repository.findOfferByDedupeKey(
    args.workspaceId,
    scoredOffer.normalizedOffer.dedupeKey
  );

  if (!scoredOffer.normalizedOffer.affiliateUrl && !existing?.affiliateUrl) {
    throw new AppError(
      'VALIDATION_ERROR',
      'A oferta foi capturada, mas o schema atual exige affiliateUrl para persistir em offers.',
      422
    );
  }

  const queue = existing
    ? await args.repository.getApprovalQueueState(args.workspaceId, existing.id)
    : null;
  const existingState = existing
    ? { ...existing, lastEditorialReviewAt: queue?.lastReviewedAt ?? existing.lastEditorialReviewAt ?? null }
    : null;
  const editorialDecision = new EditorialCooldownPolicy().evaluate({
    offer: scoredOffer.normalizedOffer,
    existing: existingState,
    observedAt: args.observedAt
  });
  const offer = await args.repository.upsertOffer({
    workspaceId: args.workspaceId,
    actorUserId: args.actorUserId,
    scoredOffer,
    existing,
    observedAt: args.observedAt
  });
  const snapshotCreated = shouldCreateSnapshot(scoredOffer, existing)
    ? await args.repository.createPriceSnapshot({
        workspaceId: args.workspaceId,
        offerId: offer.id,
        scoredOffer,
        observedAt: args.observedAt
      })
    : false;
  const currentQueue = queue ?? await args.repository.getApprovalQueueState(args.workspaceId, offer.id);
  const submissionReason = resolveReviewSubmissionReason(
    editorialDecision,
    existingState,
    args.observedAt
  );
  const shouldSubmitForReview =
    !currentQueue ||
    currentQueue.status === 'pending' ||
    submissionReason === 'material_change' ||
    submissionReason === 'cooldown_elapsed';

  if (!shouldSubmitForReview) {
    return {
      offerId: offer.id,
      created: !existing,
      updated: Boolean(existing),
      snapshotCreated,
      queueState: 'not_reentered',
      editorialDecision
    };
  }

  try {
    const reentryReason: CaptureReviewSubmissionReason =
      currentQueue?.status === 'pending' ? 'already_pending' : submissionReason;
    const queueInput = {
      workspaceId: args.workspaceId,
      offerId: offer.id,
      priorityScore: scoredOffer.score,
      reentryReason,
      captureRunId: args.captureRunId,
      correlationId: args.correlationId
    };
    if (!currentQueue || currentQueue.status === 'pending') {
      await args.repository.createApprovalQueue(queueInput);
      return {
        offerId: offer.id,
        created: !existing,
        updated: Boolean(existing),
        snapshotCreated,
        queueState: currentQueue?.status === 'pending' ? 'already_pending' : 'created',
        editorialDecision
      };
    }

    await args.repository.reopenApprovalQueue(queueInput);
    return {
      offerId: offer.id,
      created: !existing,
      updated: Boolean(existing),
      snapshotCreated,
      queueState: 'reentered',
      editorialDecision
    };
  } catch (error) {
    return {
      offerId: offer.id,
      created: !existing,
      updated: Boolean(existing),
      snapshotCreated,
      queueState: 'unavailable',
      editorialDecision,
      warning: error instanceof Error
        ? error.message
        : 'Fila de curadoria indisponivel para a captura atual.'
    };
  }
}

function resolveReviewSubmissionReason(
  editorialDecision: EditorialCooldownDecision,
  existing: ExistingOfferEditorialState | null,
  observedAt: string
): EditorialCooldownDecision['reason'] {
  if (editorialDecision.reason !== 'material_change') return editorialDecision.reason;
  if (hasPersistedMaterialChange(editorialDecision)) return 'material_change';
  return hasCooldownElapsed(existing?.lastEditorialReviewAt ?? null, observedAt)
    ? 'cooldown_elapsed'
    : 'cooldown_not_elapsed';
}

function hasPersistedMaterialChange(editorialDecision: EditorialCooldownDecision): boolean {
  return editorialDecision.materialChanges.some((change) =>
    change === 'price' ||
    change === 'discount' ||
    change === 'coupon' ||
    change === 'shipping'
  );
}

function hasCooldownElapsed(lastReview: string | null, observedAt: string): boolean {
  if (!lastReview) return true;
  const observedTime = new Date(observedAt).getTime();
  const lastReviewTime = new Date(lastReview).getTime();
  if (Number.isNaN(observedTime) || Number.isNaN(lastReviewTime)) return false;
  return observedTime - lastReviewTime >= DEFAULT_EDITORIAL_COOLDOWN_HOURS * 60 * 60 * 1000;
}

function shouldCreateSnapshot(scoredOffer: ScoredOffer, existing: PersistedCaptureOffer | null): boolean {
  if (!existing) return true;
  const offer = scoredOffer.normalizedOffer;
  if (offer.currentPrice !== existing.currentPrice) return true;
  if ((offer.discountPercent ?? null) !== (existing.discountPercent ?? null)) return true;
  if ((offer.couponCode ?? null) !== (existing.couponCode ?? null)) return true;
  if (offer.freeShipping !== null && offer.freeShipping !== undefined) {
    return offer.freeShipping !== (existing.freeShipping ?? false);
  }
  return false;
}

function parsePayload(input: unknown): ManualImportPayload {
  try {
    if (typeof input === 'string') {
      return manualImportPayloadSchema.parse(JSON.parse(input));
    }
    return manualImportPayloadSchema.parse(input);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw validationError('JSON invalido no import manual.', { payload: ['Informe um JSON valido.'] });
    }
    if (error instanceof ZodError) {
      throw validationError('Payload de import manual invalido.', error.flatten().fieldErrors);
    }
    throw error;
  }
}
