import { describe, expect, it } from 'vitest';

import {
  blockPublicationCandidate,
  buildPublicationIdempotencyKey,
  cancelPublicationCandidate,
  createPublicationCandidate,
  createPublicationEvent,
  createPublicationJobShell,
  createPublicationRequest,
  decidePublicationRetry,
  evaluatePublicationPolicy,
  expirePublicationCandidate,
  markCandidateEligible,
  PolicyError,
  PublicationError,
  PublisherError,
  queuePublicationCandidate,
  renderPublicationTemplate,
  runPublicationPipeline,
  TemplateError,
  type ApprovedOfferForPublication,
  type PublicationCandidate,
  type PublicationResult,
  type PublicationTarget,
  type PublicationTemplate,
  type Publisher
} from './index';

const now = '2026-06-28T12:00:00.000Z';

describe('publication domain candidate', () => {
  it('creates a candidate only from the current approved decision', () => {
    const candidate = createPublicationCandidate({
      approvedOffer: approvedOffer(),
      target: target(),
      candidateId: 'candidate-1',
      createdBy: 'user-1',
      createdAt: now,
      mode: 'manual'
    });

    expect(candidate.status).toBe('created');
    expect(candidate.idempotencyKey).toBe(
      buildPublicationIdempotencyKey({
        workspaceId: 'workspace-1',
        offerId: 'offer-1',
        targetId: 'target-1',
        approvalDecisionId: 'decision-current',
        snapshotVersion: 'snapshot-v1',
        slotKey: 'manual'
      })
    );
  });

  it('blocks non-approved offers and stale approval decisions', () => {
    expect(() =>
      createPublicationCandidate({
        approvedOffer: approvedOffer({ approvalStatus: 'pending' }),
        target: target(),
        candidateId: 'candidate-1',
        createdBy: 'user-1',
        createdAt: now,
        mode: 'manual'
      })
    ).toThrow(PolicyError);

    expect(() =>
      createPublicationCandidate({
        approvedOffer: approvedOffer({ approvalDecisionId: 'old-decision' }),
        target: target(),
        candidateId: 'candidate-1',
        createdBy: 'user-1',
        createdAt: now,
        mode: 'manual'
      })
    ).toThrow(PolicyError);
  });

  it('supports eligible, blocked, queued, cancelled and expired transitions', () => {
    const candidate = baseCandidate();
    const eligible = markCandidateEligible(candidate, now);
    const queued = queuePublicationCandidate(eligible, now);
    const cancelled = cancelPublicationCandidate(queued, now);
    const expired = expirePublicationCandidate(markCandidateEligible(baseCandidate('candidate-2'), now), now);
    const blocked = blockPublicationCandidate(baseCandidate('candidate-3'), blockDecision(), now);
    const stillBlocked = blockPublicationCandidate(blocked, blockDecision(), now);
    const indefinitelyBlocked = blockPublicationCandidate(
      blocked,
      {
        allowed: false,
        action: 'block',
        reason: 'TARGET_DISABLED',
        safeMessage: 'Destino desabilitado.',
        warnings: []
      },
      now
    );

    expect(eligible.status).toBe('eligible');
    expect(queued.status).toBe('queued');
    expect(cancelled.status).toBe('cancelled');
    expect(expired.status).toBe('expired');
    expect(blocked.status).toBe('blocked');
    expect(blocked.blockedReason).toBe('COOLDOWN_ACTIVE');
    expect(stillBlocked.status).toBe('blocked');
    expect(indefinitelyBlocked.blockedReason).toBe('TARGET_DISABLED');
    expect(indefinitelyBlocked.blockedUntil).toBeUndefined();
  });
});

describe('publication policy', () => {
  it('allows eligible publication when target is enabled and key is unique', () => {
    const decision = evaluatePublicationPolicy(baseCandidate(), {
      now,
      targetEnabled: true,
      manualPublicationEnabled: true
    });

    expect(decision.allowed).toBe(true);
    expect(decision.action).toBe('allow');
  });

  it('blocks disabled targets, manual disabled mode, cooldown and target limits', () => {
    expect(
      evaluatePublicationPolicy(baseCandidate(), {
        now,
        targetEnabled: false,
        manualPublicationEnabled: true
      }).reason
    ).toBe('TARGET_DISABLED');

    expect(
      evaluatePublicationPolicy(baseCandidate(), {
        now,
        targetEnabled: true,
        manualPublicationEnabled: false
      }).reason
    ).toBe('MANUAL_PUBLICATION_DISABLED');

    expect(
      evaluatePublicationPolicy(baseCandidateWithTarget(target({ supportsManualPublication: false })), {
        now,
        targetEnabled: true,
        manualPublicationEnabled: true
      }).reason
    ).toBe('TARGET_DOES_NOT_SUPPORT_MANUAL_PUBLICATION');

    expect(
      evaluatePublicationPolicy(baseCandidate('candidate-auto', 'automatic'), {
        now,
        targetEnabled: true,
        manualPublicationEnabled: true
      }).reason
    ).toBe('AUTOMATIC_PUBLICATION_DISABLED');

    expect(
      evaluatePublicationPolicy(baseCandidate(), {
        now,
        targetEnabled: true,
        manualPublicationEnabled: true,
        cooldownUntil: '2026-06-28T13:00:00.000Z'
      }).reason
    ).toBe('COOLDOWN_ACTIVE');

    expect(
      evaluatePublicationPolicy(baseCandidate(), {
        now,
        targetEnabled: true,
        manualPublicationEnabled: true,
        targetWindow: { currentCount: 10, maxCount: 10, resetAt: '2026-06-28T13:00:00.000Z' }
      }).reason
    ).toBe('TARGET_LIMIT_REACHED');
  });

  it('skips duplicate publication idempotency keys', () => {
    const candidate = baseCandidate();
    const decision = evaluatePublicationPolicy(candidate, {
      now,
      targetEnabled: true,
      manualPublicationEnabled: true,
      existingIdempotencyKeys: new Set([candidate.idempotencyKey])
    });

    expect(decision.allowed).toBe(false);
    expect(decision.action).toBe('skip');
    expect(decision.reason).toBe('DUPLICATE_PUBLICATION');
  });
});

describe('publication template renderer', () => {
  it('renders from an approved snapshot with escaped markdown and required redirect link', () => {
    const message = renderPublicationTemplate(template(), publicationContext());

    expect(message.format).toBe('markdown');
    expect(message.text).toContain('Notebook \\*Pro\\*');
    expect(message.text).toContain('https://radar\\.example\\.com/r/abc123');
    expect(message.metadata.snapshotVersion).toBe('snapshot-v1');
  });

  it('rejects missing required variables, invalid redirect links and length violations', () => {
    expect(() =>
      renderPublicationTemplate({ ...template(), requiredVariables: ['couponCode'] }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate(template(), {
        ...publicationContext(),
        redirectLink: 'https://affiliate.example.com/raw'
      })
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate({ ...template(), maxLength: 10 }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate({ ...template(), maxLength: 4096 }, publicationContext({ target: target({ maxTextLength: 20 }) }))
    ).toThrow(TemplateError);
  });

  it('rejects empty, unknown and malformed placeholders', () => {
    expect(() =>
      renderPublicationTemplate({ ...template(), body: '   ' }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate({ ...template(), body: '{{unknownVariable}}' }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate({ ...template(), body: '{{sourceUrl}} {{redirectLink}}' }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate({ ...template(), body: '{{constructor}} {{redirectLink}}' }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate({ ...template(), body: '{{invalid-variable}}' }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate({ ...template(), body: '{{title}}' }, publicationContext())
    ).toThrow(TemplateError);

    expect(() =>
      renderPublicationTemplate(template(), {
        ...publicationContext(),
        redirectLink: 'https://attacker.example/r/abc123'
      })
    ).toThrow(TemplateError);
  });
});

describe('publication jobs, publisher contract, retry and observability', () => {
  it('creates job shell before attaching rendered message and building the publisher request', () => {
    const queued = queuePublicationCandidate(markCandidateEligible(baseCandidate(), now), now);
    const shell = createPublicationJobShell({
      jobId: 'job-1',
      candidate: queued,
      correlationId: 'corr-1',
      publicationRunId: 'run-1',
      now
    });
    const message = renderPublicationTemplate(template(), publicationContext());
    const request = createPublicationRequest({ job: { ...shell, renderedMessage: message }, message });

    expect(shell.status).toBe('rendering');
    expect(request.publicationJobId).toBe('job-1');
    expect(request.idempotencyKey).toBe(queued.idempotencyKey);
  });

  it('decides retries for transient, permanent and ambiguous failures', () => {
    const transient = decidePublicationRetry({
      failure: {
        category: 'transient',
        code: 'RATE_LIMIT',
        safeMessage: 'Rate limit.',
        retryable: true,
        retryAfter: '2026-06-28T12:05:00.000Z'
      },
      attempt: 1,
      maxAttempts: 5,
      now,
      idempotencyKey: 'key-1'
    });
    const permanent = decidePublicationRetry({
      failure: {
        category: 'permanent',
        code: 'INVALID_TARGET',
        safeMessage: 'Destino invalido.',
        retryable: false
      },
      attempt: 1,
      maxAttempts: 5,
      now,
      idempotencyKey: 'key-1'
    });
    const ambiguous = decidePublicationRetry({
      failure: {
        category: 'ambiguous',
        code: 'AMBIGUOUS_SEND',
        safeMessage: 'Resultado ambiguo.',
        retryable: false
      },
      attempt: 1,
      maxAttempts: 5,
      now,
      idempotencyKey: 'key-1'
    });

    expect(transient.retry).toBe(true);
    expect(transient.retryAt).toBe('2026-06-28T12:05:00.000Z');
    expect(permanent.terminal).toBe(true);
    expect(ambiguous.retry).toBe(false);
    expect(ambiguous.manualReviewRequired).toBe(true);
  });

  it('does not retry non-transient retryable failures or failures after max attempts', () => {
    const nonTransient = decidePublicationRetry({
      failure: {
        category: 'publisher',
        code: 'PUBLISHER_CONTRACT_ERROR',
        safeMessage: 'Falha de contrato do publisher.',
        retryable: true
      },
      attempt: 1,
      maxAttempts: 5,
      now,
      idempotencyKey: 'key-1'
    });
    const maxAttempts = decidePublicationRetry({
      failure: {
        category: 'transient',
        code: 'PROVIDER_TIMEOUT',
        safeMessage: 'Timeout.',
        retryable: true
      },
      attempt: 5,
      maxAttempts: 5,
      now,
      idempotencyKey: 'key-1'
    });

    expect(nonTransient.retry).toBe(false);
    expect(nonTransient.reason).toBe('NON_TRANSIENT_FAILURE');
    expect(maxAttempts.retry).toBe(false);
    expect(maxAttempts.reason).toBe('MAX_ATTEMPTS_REACHED');
  });

  it('sanitizes sensitive metadata and error details', () => {
    const cyclicMetadata: Record<string, unknown> = { token: 'secret-token' };
    cyclicMetadata.self = cyclicMetadata;
    const cyclicDetails: Record<string, unknown> = { apiKey: 'secret-key' };
    cyclicDetails.self = cyclicDetails;
    const event = createPublicationEvent({
      eventName: 'PublicationFailed',
      workspaceId: 'workspace-1',
      correlationId: 'corr-1',
      status: 'failed',
      safeMessage: 'Falha segura.',
      createdAt: now,
      metadata: { token: 'secret-token', channel: 'generic', nested: { authorization: 'Bearer secret' }, cyclicMetadata }
    });
    const error = new PublicationError('Unsafe internals.', {
      code: 'UNSAFE',
      safeMessage: 'Mensagem segura.',
      category: 'publisher',
      details: {
        apiKey: 'secret-key',
        provider: { headers: { authorization: 'Bearer secret' } },
        cyclicDetails,
        target: 'target-1'
      }
    });

    expect(event.metadata?.token).toBe('[redacted]');
    expect((event.metadata?.nested as Record<string, unknown>).authorization).toBe('[redacted]');
    expect((event.metadata?.cyclicMetadata as Record<string, unknown>).self).toBe('[circular]');
    expect(error.details?.apiKey).toBe('[redacted]');
    expect(
      (((error.details?.provider as Record<string, unknown>).headers as Record<string, unknown>).authorization)
    ).toBe('[redacted]');
    expect((error.details?.cyclicDetails as Record<string, unknown>).self).toBe('[circular]');
    expect(error.safeMessage).toBe('Mensagem segura.');
  });
});

describe('publication pipeline', () => {
  it('runs the approved-offer publication pipeline with a fake publisher', async () => {
    const output = await runPublicationPipeline(pipelineInput(fakePublisher(successResult())));

    expect(output.candidate.status).toBe('queued');
    expect(output.policyDecision.allowed).toBe(true);
    expect(output.job?.status).toBe('succeeded');
    expect(output.result?.status).toBe('success');
    expect(output.events.map((event) => event.eventName)).toEqual([
      'PublicationRequested',
      'PublicationStarted',
      'PublicationSucceeded'
    ]);
  });

  it('does not schedule retries for malformed successful results with stale failures', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'success',
          safeMessage: 'Publicado com sucesso.',
          externalMessageId: 'external-1',
          failure: {
            category: 'transient',
            code: 'STALE_FAILURE',
            safeMessage: 'Falha obsoleta.',
            retryable: true
          }
        })
      )
    );

    expect(output.job?.status).toBe('succeeded');
    expect(output.retryDecision).toBeNull();
    expect(output.events.map((event) => event.eventName)).not.toContain('PublicationRetried');
  });

  it('does not schedule retries for permanent results with retryable transient failure details', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'permanent_failure',
          safeMessage: 'Falha permanente.',
          failure: {
            category: 'transient',
            code: 'INCONSISTENT_TRANSIENT',
            safeMessage: 'Falha transitoria inconsistente.',
            retryable: true
          }
        })
      )
    );

    expect(output.job?.status).toBe('failed');
    expect(output.retryDecision).toBeNull();
    expect(output.events.map((event) => event.eventName)).not.toContain('PublicationRetried');
  });

  it('blocks target disabled before rendering or publisher calls', async () => {
    let calls = 0;
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher(successResult(), () => {
          calls += 1;
        }),
        {
          target: target({ enabled: false }),
          policyContext: { manualPublicationEnabled: true }
        }
      )
    );

    expect(output.candidate.status).toBe('blocked');
    expect(output.policyDecision.reason).toBe('TARGET_DISABLED');
    expect(output.job).toBeNull();
    expect(calls).toBe(0);
  });

  it('returns a structured failure when the approved offer is stale', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(fakePublisher(successResult()), {
        approvedOffer: approvedOffer({ approvalDecisionId: 'old-decision' })
      })
    );

    expect(output.candidate.status).toBe('blocked');
    expect(output.policyDecision.reason).toBe('STALE_APPROVAL_DECISION');
    expect(output.result?.status).toBe('permanent_failure');
    expect(output.events.map((event) => event.eventName)).toEqual(['PublicationFailed']);
  });

  it('returns permanent template failures without calling the publisher', async () => {
    let calls = 0;
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher(successResult(), () => {
          calls += 1;
        }),
        {
          redirectLink: 'https://radar.example.com/raw'
        }
      )
    );

    expect(output.result?.status).toBe('permanent_failure');
    expect(output.result?.failure?.code).toBe('REDIRECT_LINK_REQUIRED');
    expect(output.job?.status).toBe('failed');
    expect(calls).toBe(0);
  });

  it('maps transient publisher failures to retry decisions', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'transient_failure',
          safeMessage: 'Canal temporariamente indisponivel.',
          failure: {
            category: 'transient',
            code: 'PROVIDER_TIMEOUT',
            safeMessage: 'Canal temporariamente indisponivel.',
            retryable: true
          }
        })
      )
    );

    expect(output.job?.status).toBe('failed');
    expect(output.retryDecision?.retry).toBe(true);
    expect(output.events.map((event) => event.eventName)).toContain('PublicationRetried');
  });

  it('synthesizes retries for transient results without failure payloads', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'transient_failure',
          safeMessage: 'Rate limit.',
          retryAfter: '2026-06-28T12:15:00.000Z'
        })
      )
    );

    expect(output.retryDecision?.retry).toBe(true);
    expect(output.retryDecision?.retryAt).toBe('2026-06-28T12:15:00.000Z');
    expect(output.events.map((event) => event.eventName)).toContain('PublicationRetried');
  });

  it('preserves top-level retryAfter from publisher results', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'transient_failure',
          safeMessage: 'Rate limit.',
          retryAfter: '2026-06-28T12:10:00.000Z',
          failure: {
            category: 'transient',
            code: 'RATE_LIMIT',
            safeMessage: 'Rate limit.',
            retryable: true
          }
        })
      )
    );

    expect(output.retryDecision?.retryAt).toBe('2026-06-28T12:10:00.000Z');
  });

  it('maps transient publisher exceptions to retry decisions', async () => {
    const output = await runPublicationPipeline(
      pipelineInput({
        ...fakePublisher(successResult()),
        publish: () => {
          throw new PublisherError('Provider timeout.', {
            code: 'PROVIDER_TIMEOUT',
            safeMessage: 'Canal temporariamente indisponivel.',
            category: 'transient',
            retryable: true
          });
        }
      })
    );

    expect(output.result?.status).toBe('transient_failure');
    expect(output.retryDecision?.retry).toBe(true);
    expect(output.events.map((event) => event.eventName)).toContain('PublicationRetried');
  });

  it('preserves retryAfter from thrown transient publisher errors', async () => {
    const output = await runPublicationPipeline(
      pipelineInput({
        ...fakePublisher(successResult()),
        publish: () => {
          throw new PublisherError('Provider rate limit.', {
            code: 'RATE_LIMIT',
            safeMessage: 'Rate limit.',
            category: 'transient',
            retryable: true,
            retryAfter: '2026-06-28T12:20:00.000Z'
          });
        }
      })
    );

    expect(output.result?.retryAfter).toBe('2026-06-28T12:20:00.000Z');
    expect(output.retryDecision?.retryAt).toBe('2026-06-28T12:20:00.000Z');
  });

  it('does not retry ambiguous publisher results automatically', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'ambiguous',
          safeMessage: 'Resultado ambiguo.',
          failure: {
            category: 'ambiguous',
            code: 'AMBIGUOUS_SEND',
            safeMessage: 'Resultado ambiguo.',
            retryable: false
          }
        })
      )
    );

    expect(output.job?.status).toBe('paused');
    expect(output.retryDecision?.retry).toBe(false);
    expect(output.retryDecision?.manualReviewRequired).toBe(true);
  });

  it('treats every ambiguous result as manual-review only even with retryable failure details', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'ambiguous',
          safeMessage: 'Resultado ambiguo.',
          failure: {
            category: 'transient',
            code: 'PROVIDER_TIMEOUT_AFTER_SEND',
            safeMessage: 'Timeout apos envio.',
            retryable: true
          }
        })
      )
    );

    expect(output.job?.status).toBe('paused');
    expect(output.retryDecision?.retry).toBe(false);
    expect(output.retryDecision?.manualReviewRequired).toBe(true);
    expect(output.events.map((event) => event.eventName)).not.toContain('PublicationRetried');
  });

  it('requires manual review for ambiguous results without a failure payload', async () => {
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher({
          status: 'ambiguous',
          safeMessage: 'Resultado ambiguo.'
        })
      )
    );

    expect(output.job?.status).toBe('paused');
    expect(output.retryDecision?.retry).toBe(false);
    expect(output.retryDecision?.manualReviewRequired).toBe(true);
  });

  it('keeps thrown ambiguous publisher failures paused for reconciliation', async () => {
    const output = await runPublicationPipeline(
      pipelineInput({
        ...fakePublisher(successResult()),
        publish: () => {
          throw new PublisherError('Ambiguous send.', {
            code: 'AMBIGUOUS_SEND',
            safeMessage: 'Resultado ambiguo.',
            category: 'ambiguous',
            retryable: false
          });
        }
      })
    );

    expect(output.job?.status).toBe('paused');
    expect(output.result?.status).toBe('ambiguous');
    expect(output.retryDecision?.manualReviewRequired).toBe(true);
  });

  it('rejects unsupported message formats before calling the publisher', async () => {
    let calls = 0;
    const output = await runPublicationPipeline(
      pipelineInput(
        fakePublisher(successResult(), () => {
          calls += 1;
        }, ['plain']),
        {
          template: template({ format: 'markdown' })
        }
      )
    );

    expect(output.result?.failure?.code).toBe('PUBLISHER_FORMAT_NOT_SUPPORTED');
    expect(calls).toBe(0);
  });
});

function approvedOffer(overrides: Partial<ApprovedOfferForPublication> = {}): ApprovedOfferForPublication {
  return {
    workspaceId: 'workspace-1',
    offerId: 'offer-1',
    approvalQueueId: 'queue-1',
    approvalDecisionId: 'decision-current',
    currentApprovalDecisionId: 'decision-current',
    approvalStatus: 'approved',
    approvedAt: now,
    approvedBy: 'user-1',
    snapshot: {
      id: 'snapshot-1',
      version: 'snapshot-v1',
      title: 'Notebook *Pro*',
      currentPrice: 3499.9,
      currency: 'BRL',
      sourceUrl: 'https://marketplace.example.com/notebook',
      affiliateUrl: 'https://affiliate.example.com/notebook',
      previousPrice: 4299.9,
      discountPercent: 19,
      couponCode: null,
      freeShipping: true,
      commissionPercent: 8,
      highlights: ['free_shipping', 'high_commission']
    },
    ...overrides
  };
}

function target(overrides: Partial<PublicationTarget> = {}): PublicationTarget {
  return {
    id: 'target-1',
    channel: 'manual',
    destinationId: 'channel-1',
    destinationLabel: 'Ofertas VIP',
    enabled: true,
    supportsManualPublication: true,
    maxTextLength: 4096,
    ...overrides
  };
}

function template(overrides: Partial<PublicationTemplate> = {}): PublicationTemplate {
  return {
    id: 'template-1',
    name: 'Telegram Oferta',
    format: 'markdown',
    body: '{{title}}\n{{currentPrice}}\n{{freeShipping}}\nComprar: {{redirectLink}}',
    requiredVariables: ['title', 'currentPrice', 'redirectLink'],
    minLength: 10,
    maxLength: 4096,
    ...overrides
  };
}

function publicationContext(overrides: Partial<ReturnType<typeof publicationContextBase>> = {}) {
  return {
    ...publicationContextBase(),
    ...overrides
  };
}

function publicationContextBase() {
  return {
    workspaceId: 'workspace-1',
    approvedOfferSnapshot: approvedOffer().snapshot,
    approvalDecisionId: 'decision-current',
    target: target(),
    redirectLink: 'https://radar.example.com/r/abc123',
    allowedRedirectOrigins: ['https://radar.example.com'],
    generatedAt: now
  };
}

function baseCandidate(candidateId = 'candidate-1', mode: 'manual' | 'automatic' = 'manual'): PublicationCandidate {
  return createPublicationCandidate({
    approvedOffer: approvedOffer(),
    target: target(),
    candidateId,
    createdBy: 'user-1',
    createdAt: now,
    mode
  });
}

function baseCandidateWithTarget(candidateTarget: PublicationTarget): PublicationCandidate {
  return createPublicationCandidate({
    approvedOffer: approvedOffer(),
    target: candidateTarget,
    candidateId: 'candidate-target',
    createdBy: 'user-1',
    createdAt: now,
    mode: 'manual'
  });
}

function blockDecision() {
  return {
    allowed: false,
    action: 'block' as const,
    reason: 'COOLDOWN_ACTIVE',
    safeMessage: 'Bloqueado por cooldown.',
    blockedUntil: '2026-06-28T13:00:00.000Z',
    warnings: []
  };
}

function successResult(): PublicationResult {
  return {
    status: 'success',
    externalMessageId: 'external-1',
    safeMessage: 'Publicado com sucesso.'
  };
}

function fakePublisher(result: PublicationResult, onPublish?: () => void, capabilities = ['markdown']): Publisher {
  return {
    id: 'fake-publisher',
    version: '1.0.0',
    displayName: 'Fake Publisher',
    capabilities,
    limits: { maxTextLength: 4096, maxAttempts: 5 },
    publish: () => {
      onPublish?.();
      return result;
    }
  };
}

function pipelineInput(
  publisher: Publisher,
  overrides: Partial<Parameters<typeof runPublicationPipeline>[0]> = {}
): Parameters<typeof runPublicationPipeline>[0] {
  return {
    approvedOffer: approvedOffer(),
    target: target(),
    template: template(),
    publisher,
    redirectLink: 'https://radar.example.com/r/abc123',
    allowedRedirectOrigins: ['https://radar.example.com'],
    requestedBy: 'user-1',
    mode: 'manual',
    now,
    correlationId: 'corr-1',
    candidateId: 'candidate-1',
    jobId: 'job-1',
    publicationRunId: 'run-1',
    policyContext: {
      manualPublicationEnabled: true
    },
    ...overrides
  };
}
