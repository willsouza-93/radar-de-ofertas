import type { PublicationFailure, RetryDecision } from './types';

const DEFAULT_BACKOFF_MINUTES = [0, 1, 5, 15] as const;

export function decidePublicationRetry(input: {
  failure: PublicationFailure;
  attempt: number;
  maxAttempts: number;
  now: string;
  idempotencyKey?: string;
}): RetryDecision {
  if (input.failure.category === 'ambiguous') {
    return {
      retry: false,
      terminal: false,
      manualReviewRequired: true,
      reason: 'AMBIGUOUS_RESULT_REQUIRES_RECONCILIATION',
      safeMessage: 'Resultado ambiguo exige reconciliacao ou revisao manual antes de qualquer novo envio.'
    };
  }

  if (!input.failure.retryable || input.failure.category === 'permanent') {
    return {
      retry: false,
      terminal: true,
      manualReviewRequired: false,
      reason: 'PERMANENT_FAILURE',
      safeMessage: input.failure.safeMessage
    };
  }

  if (!input.idempotencyKey) {
    return {
      retry: false,
      terminal: true,
      manualReviewRequired: true,
      reason: 'MISSING_IDEMPOTENCY_KEY',
      safeMessage: 'Retry bloqueado por ausencia de chave de idempotencia.'
    };
  }

  if (input.attempt >= input.maxAttempts) {
    return {
      retry: false,
      terminal: true,
      manualReviewRequired: false,
      reason: 'MAX_ATTEMPTS_REACHED',
      safeMessage: 'Limite de tentativas atingido.'
    };
  }

  return {
    retry: true,
    retryAt: input.failure.retryAfter ?? calculateRetryAt(input.now, input.attempt),
    terminal: false,
    manualReviewRequired: false,
    reason: 'TRANSIENT_FAILURE_RETRYABLE',
    safeMessage: input.failure.safeMessage
  };
}

function calculateRetryAt(now: string, attempt: number): string {
  const delayMinutes = DEFAULT_BACKOFF_MINUTES[Math.min(attempt, DEFAULT_BACKOFF_MINUTES.length - 1)] ?? 15;
  return new Date(new Date(now).getTime() + delayMinutes * 60_000).toISOString();
}
