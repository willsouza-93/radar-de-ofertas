import { PolicyError } from './errors';
import type { PublicationCandidate, PublicationJob, RenderedMessage } from './types';

export function createPublicationJobShell(input: {
  jobId: string;
  candidate: PublicationCandidate;
  correlationId: string;
  publicationRunId: string;
  now: string;
}): PublicationJob {
  if (input.candidate.status !== 'queued') {
    throw new PolicyError('Candidate must be queued before creating a publication job.', {
      code: 'CANDIDATE_NOT_QUEUED',
      safeMessage: 'Candidate precisa estar enfileirado antes de criar job.',
      retryable: false,
      details: { candidateStatus: input.candidate.status }
    });
  }

  return {
    id: input.jobId,
    workspaceId: input.candidate.workspaceId,
    candidateId: input.candidate.id,
    target: input.candidate.target,
    renderedMessage: null,
    idempotencyKey: input.candidate.idempotencyKey,
    status: 'rendering',
    correlationId: input.correlationId,
    publicationRunId: input.publicationRunId,
    attempt: 0,
    createdAt: input.now,
    updatedAt: input.now
  };
}

export function attachRenderedMessageToJob(
  job: PublicationJob,
  renderedMessage: RenderedMessage,
  now: string
): PublicationJob {
  if (job.status !== 'rendering') {
    throw new PolicyError('Publication job is not ready for rendered message.', {
      code: 'JOB_NOT_RENDERING',
      safeMessage: 'Job nao esta pronto para receber mensagem renderizada.',
      retryable: false,
      details: { jobStatus: job.status }
    });
  }

  return {
    ...job,
    renderedMessage,
    status: 'ready',
    updatedAt: now
  };
}

export function markJobSending(job: PublicationJob, now: string): PublicationJob {
  if (job.status !== 'ready') {
    throw new PolicyError('Publication job is not ready to send.', {
      code: 'JOB_NOT_READY',
      safeMessage: 'Job nao esta pronto para envio.',
      retryable: false,
      details: { jobStatus: job.status }
    });
  }

  return {
    ...job,
    status: 'sending',
    attempt: job.attempt + 1,
    updatedAt: now
  };
}

export function markJobSucceeded(job: PublicationJob, now: string): PublicationJob {
  return {
    ...job,
    status: 'succeeded',
    updatedAt: now
  };
}

export function markJobFailed(job: PublicationJob, now: string): PublicationJob {
  return {
    ...job,
    status: 'failed',
    updatedAt: now
  };
}

export function markJobPaused(job: PublicationJob, now: string): PublicationJob {
  return {
    ...job,
    status: 'paused',
    updatedAt: now
  };
}
