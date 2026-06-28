import type { PublicationEvent, PublicationEventName } from './types';

export function createPublicationEvent(input: {
  eventName: PublicationEventName;
  workspaceId: string;
  correlationId: string;
  status: string;
  safeMessage: string;
  createdAt: string;
  offerId?: string | undefined;
  publicationCandidateId?: string | undefined;
  publicationJobId?: string | undefined;
  publicationRunId?: string | undefined;
  publisherId?: string | undefined;
  targetId?: string | undefined;
  idempotencyKey?: string | undefined;
  failureCode?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}): PublicationEvent {
  const event: PublicationEvent = {
    eventName: input.eventName,
    workspaceId: input.workspaceId,
    correlationId: input.correlationId,
    status: input.status,
    safeMessage: input.safeMessage,
    createdAt: input.createdAt
  };

  if (input.offerId !== undefined) event.offerId = input.offerId;
  if (input.publicationCandidateId !== undefined) event.publicationCandidateId = input.publicationCandidateId;
  if (input.publicationJobId !== undefined) event.publicationJobId = input.publicationJobId;
  if (input.publicationRunId !== undefined) event.publicationRunId = input.publicationRunId;
  if (input.publisherId !== undefined) event.publisherId = input.publisherId;
  if (input.targetId !== undefined) event.targetId = input.targetId;
  if (input.idempotencyKey !== undefined) event.idempotencyKey = input.idempotencyKey;
  if (input.failureCode !== undefined) event.failureCode = input.failureCode;

  const metadata = sanitizeMetadata(input.metadata);
  if (metadata !== undefined) event.metadata = metadata;

  return event;
}

export function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[redacted]';
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

function isSensitiveKey(key: string): boolean {
  return /token|secret|password|authorization|cookie|api[-_]?key|header/i.test(key);
}
