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
  if (!supportsMessageFormat(publisher.capabilities, message.format)) {
    throw new PublisherError('Publisher does not support rendered message format.', {
      code: 'PUBLISHER_FORMAT_NOT_SUPPORTED',
      safeMessage: 'Publisher nao suporta o formato da mensagem renderizada.',
      retryable: false,
      details: { publisherId: publisher.id, format: message.format }
    });
  }

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

function supportsMessageFormat(capabilities: readonly string[], format: RenderedMessage['format']): boolean {
  if (capabilities.includes(format)) return true;
  if (capabilities.includes(`format:${format}`)) return true;
  return format === 'plain' && capabilities.includes('text');
}
