import {
  blockPublicationCandidate,
  createPublicationCandidate,
  markCandidateEligible,
  queuePublicationCandidate
} from './candidate';
import { toPublicationError } from './errors';
import {
  attachRenderedMessageToJob,
  createPublicationJobShell,
  markJobFailed,
  markJobPaused,
  markJobSending,
  markJobSucceeded
} from './job';
import { createPublicationEvent } from './observability';
import { evaluatePublicationPolicy } from './policy';
import { assertPublisherSupportsMessage, createPublicationRequest } from './publisher';
import { decidePublicationRetry } from './retry';
import { renderPublicationTemplate } from './template';
import type {
  PolicyDecision,
  PublicationCandidate,
  PublicationFailure,
  PublicationEvent,
  PublicationJob,
  PublicationPipelineInput,
  PublicationPipelineOutput,
  PublicationResult
} from './types';

export async function runPublicationPipeline(input: PublicationPipelineInput): Promise<PublicationPipelineOutput> {
  const events: PublicationEvent[] = [];
  const candidate = createPublicationCandidate({
    approvedOffer: input.approvedOffer,
    target: input.target,
    candidateId: input.candidateId,
    createdBy: input.requestedBy,
    createdAt: input.now,
    mode: input.mode
  });

  events.push(
    createPublicationEvent({
      eventName: 'PublicationRequested',
      workspaceId: candidate.workspaceId,
      offerId: candidate.offerId,
      publicationCandidateId: candidate.id,
      correlationId: input.correlationId,
      idempotencyKey: candidate.idempotencyKey,
      targetId: candidate.target.id,
      status: candidate.status,
      safeMessage: 'Candidate de publicacao criado.',
      createdAt: input.now
    })
  );

  const policyDecision = evaluatePublicationPolicy(candidate, {
    ...input.policyContext,
    now: input.policyContext.now ?? input.now,
    targetEnabled: input.policyContext.targetEnabled ?? input.target.enabled
  });

  if (!policyDecision.allowed) {
    const blockedCandidate = blockPublicationCandidate(candidate, policyDecision, input.now);
    events.push(
      createPublicationEvent({
        eventName: 'PublicationSkipped',
        workspaceId: blockedCandidate.workspaceId,
        offerId: blockedCandidate.offerId,
        publicationCandidateId: blockedCandidate.id,
        correlationId: input.correlationId,
        idempotencyKey: blockedCandidate.idempotencyKey,
        targetId: blockedCandidate.target.id,
        status: blockedCandidate.status,
        safeMessage: policyDecision.safeMessage,
        createdAt: input.now,
        metadata: { reason: policyDecision.reason }
      })
    );

    return {
      candidate: blockedCandidate,
      policyDecision,
      job: null,
      result: null,
      retryDecision: null,
      events
    };
  }

  let activeCandidate = markCandidateEligible(candidate, input.now);
  activeCandidate = queuePublicationCandidate(activeCandidate, input.now);
  let job: PublicationJob | null = createPublicationJobShell({
    jobId: input.jobId,
    candidate: activeCandidate,
    correlationId: input.correlationId,
    publicationRunId: input.publicationRunId,
    now: input.now
  });

  try {
    const renderedMessage = renderPublicationTemplate(input.template, {
      workspaceId: activeCandidate.workspaceId,
      approvedOfferSnapshot: input.approvedOffer.snapshot,
      approvalDecisionId: activeCandidate.approvalDecisionId,
      target: activeCandidate.target,
      redirectLink: input.redirectLink,
      generatedAt: input.now
    });

    assertPublisherSupportsMessage(input.publisher, renderedMessage);
    job = attachRenderedMessageToJob(job, renderedMessage, input.now);
    job = markJobSending(job, input.now);
    events.push(
      createPublicationEvent({
        eventName: 'PublicationStarted',
        workspaceId: activeCandidate.workspaceId,
        offerId: activeCandidate.offerId,
        publicationCandidateId: activeCandidate.id,
        publicationJobId: job.id,
        publicationRunId: job.publicationRunId,
        publisherId: input.publisher.id,
        targetId: activeCandidate.target.id,
        correlationId: input.correlationId,
        idempotencyKey: activeCandidate.idempotencyKey,
        status: job.status,
        safeMessage: 'Tentativa de publicacao iniciada.',
        createdAt: input.now
      })
    );

    const result = await input.publisher.publish(createPublicationRequest({ job, message: renderedMessage }));
    const finishedJob = updateJobFromResult(job, result, input.now);
    const retryDecision = result.failure
      ? decidePublicationRetry({
          failure: result.failure,
          attempt: finishedJob.attempt,
          maxAttempts: input.publisher.limits.maxAttempts ?? 5,
          now: input.now,
          idempotencyKey: finishedJob.idempotencyKey
        })
      : null;

    events.push(
      createPublicationEvent({
        eventName: result.status === 'success' ? 'PublicationSucceeded' : 'PublicationFailed',
        workspaceId: activeCandidate.workspaceId,
        offerId: activeCandidate.offerId,
        publicationCandidateId: activeCandidate.id,
        publicationJobId: finishedJob.id,
        publicationRunId: finishedJob.publicationRunId,
        publisherId: input.publisher.id,
        targetId: activeCandidate.target.id,
        correlationId: input.correlationId,
        idempotencyKey: activeCandidate.idempotencyKey,
        status: result.status,
        failureCode: result.failure?.code,
        safeMessage: result.safeMessage,
        createdAt: input.now
      })
    );

    if (retryDecision?.retry) {
      events.push(
        createPublicationEvent({
          eventName: 'PublicationRetried',
          workspaceId: activeCandidate.workspaceId,
          offerId: activeCandidate.offerId,
          publicationCandidateId: activeCandidate.id,
          publicationJobId: finishedJob.id,
          publicationRunId: finishedJob.publicationRunId,
          publisherId: input.publisher.id,
          targetId: activeCandidate.target.id,
          correlationId: input.correlationId,
          idempotencyKey: activeCandidate.idempotencyKey,
          status: 'retry_scheduled',
          safeMessage: retryDecision.safeMessage,
          createdAt: input.now,
          metadata: { retryAt: retryDecision.retryAt, reason: retryDecision.reason }
        })
      );
    }

    return {
      candidate: activeCandidate,
      policyDecision,
      job: finishedJob,
      result,
      retryDecision,
      events
    };
  } catch (error) {
    const publicationError = toPublicationError(error);
    const failedJob = job ? markJobFailed(job, input.now) : null;
    const result = errorToPublicationResult(publicationError);
    events.push(
      createPublicationEvent({
        eventName: 'PublicationFailed',
        workspaceId: activeCandidate.workspaceId,
        offerId: activeCandidate.offerId,
        publicationCandidateId: activeCandidate.id,
        publicationJobId: failedJob?.id,
        publicationRunId: failedJob?.publicationRunId,
        publisherId: input.publisher.id,
        targetId: activeCandidate.target.id,
        correlationId: input.correlationId,
        idempotencyKey: activeCandidate.idempotencyKey,
        status: result.status,
        failureCode: publicationError.code,
        safeMessage: publicationError.safeMessage,
        createdAt: input.now
      })
    );

    return {
      candidate: activeCandidate,
      policyDecision,
      job: failedJob,
      result,
      retryDecision: null,
      events
    };
  }
}

function updateJobFromResult(job: PublicationJob, result: PublicationResult, now: string): PublicationJob {
  if (result.status === 'success') return markJobSucceeded(job, now);
  if (result.status === 'ambiguous') return markJobPaused(job, now);
  return markJobFailed(job, now);
}

function errorToPublicationResult(error: {
  category: PublicationFailure['category'];
  code: string;
  safeMessage: string;
  retryable: boolean;
}): PublicationResult {
  return {
    status: error.retryable ? 'transient_failure' : 'permanent_failure',
    safeMessage: error.safeMessage,
    failure: {
      category: error.category,
      code: error.code,
      safeMessage: error.safeMessage,
      retryable: error.retryable
    }
  };
}
