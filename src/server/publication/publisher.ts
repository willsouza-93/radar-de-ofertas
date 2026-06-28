import { PublisherError } from './errors';
import type { PublicationJob, PublicationRequest, Publisher, RenderedMessage } from './types';

export function createPublicationRequest(input: {
  job: PublicationJob;
  message: RenderedMessage;
}): PublicationRequest {
  return {
    workspaceId: input.job.workspaceId,
    publicationJobId: input.job.id,
    idempotencyKey: input.job.idempotencyKey,
    target: input.job.target,
    message: input.message,
    correlationId: input.job.correlationId,
    publicationRunId: input.job.publicationRunId
  };
}

export function assertPublisherSupportsMessage(publisher: Publisher, message: RenderedMessage): void {
  const maxTextLength = publisher.limits.maxTextLength;
  if (maxTextLength !== undefined && message.text.length > maxTextLength) {
    throw new PublisherError('Publisher text length limit exceeded.', {
      code: 'PUBLISHER_TEXT_LIMIT_EXCEEDED',
      safeMessage: 'Mensagem excede o limite declarado pelo publisher.',
      retryable: false,
      details: { publisherId: publisher.id, maxTextLength }
    });
  }
}
