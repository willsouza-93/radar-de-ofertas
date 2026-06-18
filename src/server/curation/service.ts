import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';

import { AppError, forbidden, notFound, validationError } from '../offers/errors';
import {
  resolveActiveWorkspaceForUser,
  type MembershipRepository
} from '../offers/workspace';
import {
  addReviewNoteSchema,
  approveOfferSchema,
  getApprovalDetailSchema,
  listApprovalQueueSchema,
  listReviewHistorySchema,
  rejectOfferSchema,
  type AddReviewNoteInput,
  type ApproveOfferInput,
  type GetApprovalDetailInput,
  type ListApprovalQueueInput,
  type ListReviewHistoryInput,
  type RejectOfferInput
} from './schemas';
import type {
  ApprovalDecisionRecord,
  ApprovalDetail,
  ApprovalQueueFilters,
  ApprovalQueueItem,
  ApprovalQueueRecord,
  CurationLogger,
  ReviewHistoryItem,
  ReviewNoteRecord
} from './types';

export interface CurationRepository extends MembershipRepository {
  getApprovalQueue(workspaceId: string, queueId: string): Promise<ApprovalQueueRecord | null>;
  getApprovalDetailByQueueId(workspaceId: string, queueId: string): Promise<ApprovalDetail | null>;
  getApprovalDetailByOfferId(workspaceId: string, offerId: string): Promise<ApprovalDetail | null>;
  listApprovalQueue(
    workspaceId: string,
    filters: ApprovalQueueFilters
  ): Promise<{ items: ApprovalQueueItem[]; nextCursor: string | null }>;
  applyApprovalDecision(input: {
    decision: ApprovalDecisionRecord;
    note: ReviewNoteRecord | null;
  }): Promise<{ queue: ApprovalQueueRecord; decision: ApprovalDecisionRecord; note: ReviewNoteRecord | null }>;
  createReviewNote(note: ReviewNoteRecord): Promise<ReviewNoteRecord>;
  listReviewHistory(
    workspaceId: string,
    queueId: string,
    options: { cursor?: string | undefined; limit: number }
  ): Promise<{ items: ReviewHistoryItem[]; nextCursor: string | null }>;
}

export interface CurationServiceContext {
  actorUserId: string | null;
  repository: CurationRepository;
  logger?: CurationLogger;
  now?: () => Date;
  createId?: () => string;
}

export async function listApprovalQueue(
  input: ListApprovalQueueInput,
  context: CurationServiceContext
): Promise<{ items: ApprovalQueueItem[]; nextCursor: string | null }> {
  const parsed = parseInput(listApprovalQueueSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertCurator(membership.role);
  return context.repository.listApprovalQueue(membership.workspaceId, parsed);
}

export async function getApprovalDetail(
  input: GetApprovalDetailInput,
  context: CurationServiceContext
): Promise<ApprovalDetail> {
  const parsed = parseInput(getApprovalDetailSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertCurator(membership.role);

  const detail = parsed.queueId
    ? await context.repository.getApprovalDetailByQueueId(membership.workspaceId, parsed.queueId)
    : await context.repository.getApprovalDetailByOfferId(membership.workspaceId, parsed.offerId as string);

  if (!detail) throw notFound('Curadoria nao encontrada.');
  return detail;
}

export async function approveOffer(
  input: ApproveOfferInput,
  context: CurationServiceContext
): Promise<{
  queueId: string;
  offerId: string;
  status: 'approved';
  decisionId: string;
  decidedAt: string;
}> {
  const parsed = parseInput(approveOfferSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertCurator(membership.role);
  const queue = await getQueueOrThrow(membership.workspaceId, parsed.queueId, context.repository);
  assertExpectedPending(queue, parsed.expectedStatus);

  const decidedAt = getNow(context);
  const decision: ApprovalDecisionRecord = {
    id: createId(context),
    workspaceId: membership.workspaceId,
    queueId: queue.id,
    offerId: queue.offerId,
    decision: 'approved',
    previousStatus: queue.status,
    nextStatus: 'approved',
    reason: null,
    decidedBy: membership.userId,
    decidedAt,
    createdAt: decidedAt
  };
  const note = parsed.note
    ? buildReviewNote(queue, membership.workspaceId, membership.userId, parsed.note, context)
    : null;
  const applied = await context.repository.applyApprovalDecision({ decision, note });

  context.logger?.info('curation.offer_approved', {
    workspaceId: membership.workspaceId,
    queueId: queue.id,
    offerId: queue.offerId,
    decisionId: applied.decision.id
  });

  return {
    queueId: applied.queue.id,
    offerId: applied.queue.offerId,
    status: 'approved',
    decisionId: applied.decision.id,
    decidedAt: applied.decision.decidedAt
  };
}

export async function rejectOffer(
  input: RejectOfferInput,
  context: CurationServiceContext
): Promise<{
  queueId: string;
  offerId: string;
  status: 'rejected';
  decisionId: string;
  decidedAt: string;
}> {
  const parsed = parseInput(rejectOfferSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertCurator(membership.role);
  const queue = await getQueueOrThrow(membership.workspaceId, parsed.queueId, context.repository);
  assertExpectedPending(queue, parsed.expectedStatus);

  const decidedAt = getNow(context);
  const decision: ApprovalDecisionRecord = {
    id: createId(context),
    workspaceId: membership.workspaceId,
    queueId: queue.id,
    offerId: queue.offerId,
    decision: 'rejected',
    previousStatus: queue.status,
    nextStatus: 'rejected',
    reason: parsed.reason.trim(),
    decidedBy: membership.userId,
    decidedAt,
    createdAt: decidedAt
  };
  const applied = await context.repository.applyApprovalDecision({ decision, note: null });

  context.logger?.info('curation.offer_rejected', {
    workspaceId: membership.workspaceId,
    queueId: queue.id,
    offerId: queue.offerId,
    decisionId: applied.decision.id
  });

  return {
    queueId: applied.queue.id,
    offerId: applied.queue.offerId,
    status: 'rejected',
    decisionId: applied.decision.id,
    decidedAt: applied.decision.decidedAt
  };
}

export async function addReviewNote(
  input: AddReviewNoteInput,
  context: CurationServiceContext
): Promise<{ note: ReviewNoteRecord; queueStatus: 'pending' }> {
  const parsed = parseInput(addReviewNoteSchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertCurator(membership.role);
  const queue = await getQueueOrThrow(membership.workspaceId, parsed.queueId, context.repository);

  if (queue.status !== 'pending') {
    throw new AppError(
      'INVALID_TRANSITION',
      'Notas so podem ser adicionadas enquanto a oferta esta pendente.',
      409
    );
  }

  const note = await context.repository.createReviewNote(
    buildReviewNote(queue, membership.workspaceId, membership.userId, parsed.body, context)
  );

  context.logger?.info('curation.review_note_added', {
    workspaceId: membership.workspaceId,
    queueId: queue.id,
    offerId: queue.offerId,
    noteId: note.id
  });

  return { note, queueStatus: 'pending' };
}

export async function listReviewHistory(
  input: ListReviewHistoryInput,
  context: CurationServiceContext
): Promise<{ items: ReviewHistoryItem[]; nextCursor: string | null }> {
  const parsed = parseInput(listReviewHistorySchema, input);
  const membership = await resolveActiveWorkspaceForUser(context.actorUserId, context.repository);
  assertCurator(membership.role);
  const queue = await context.repository.getApprovalQueue(membership.workspaceId, parsed.queueId);
  if (!queue) throw notFound('Curadoria nao encontrada.');

  return context.repository.listReviewHistory(membership.workspaceId, queue.id, {
    cursor: parsed.cursor,
    limit: parsed.limit
  });
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

function assertCurator(role: 'admin' | 'editor'): void {
  if (role !== 'admin' && role !== 'editor') {
    throw forbidden('Somente Admin ou Editor pode executar esta acao.');
  }
}

async function getQueueOrThrow(
  workspaceId: string,
  queueId: string,
  repository: CurationRepository
): Promise<ApprovalQueueRecord> {
  const queue = await repository.getApprovalQueue(workspaceId, queueId);
  if (!queue) throw notFound('Curadoria nao encontrada.');
  return queue;
}

function assertExpectedPending(queue: ApprovalQueueRecord, expectedStatus: 'pending'): void {
  if (queue.status !== expectedStatus) {
    throw new AppError(
      'VERSION_CONFLICT',
      'A oferta foi alterada por outra acao. Recarregue antes de continuar.',
      409
    );
  }
}

function buildReviewNote(
  queue: ApprovalQueueRecord,
  workspaceId: string,
  actorUserId: string,
  body: string,
  context: CurationServiceContext
): ReviewNoteRecord {
  const createdAt = getNow(context);
  return {
    id: createId(context),
    workspaceId,
    queueId: queue.id,
    offerId: queue.offerId,
    body: body.trim(),
    createdBy: actorUserId,
    createdAt
  };
}

function createId(context: CurationServiceContext): string {
  return context.createId?.() ?? randomUUID();
}

function getNow(context: CurationServiceContext): string {
  return context.now?.().toISOString() ?? new Date().toISOString();
}
