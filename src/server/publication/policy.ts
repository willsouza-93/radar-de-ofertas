import type { PolicyDecision, PublicationCandidate, PublicationPolicyContext } from './types';

export function evaluatePublicationPolicy(
  candidate: PublicationCandidate,
  context: PublicationPolicyContext
): PolicyDecision {
  if (candidate.status !== 'created' && candidate.status !== 'eligible' && candidate.status !== 'blocked') {
    return block('INVALID_CANDIDATE_STATE', 'Candidate nao esta em estado valido para avaliacao.');
  }

  if (!context.targetEnabled || !candidate.target.enabled) {
    return block('TARGET_DISABLED', 'O destino de publicacao esta desabilitado.');
  }

  if (candidate.mode === 'manual' && !context.manualPublicationEnabled) {
    return block('MANUAL_PUBLICATION_DISABLED', 'Publicacao manual esta desabilitada para este contexto.');
  }

  if (context.existingIdempotencyKeys?.has(candidate.idempotencyKey)) {
    return skip('DUPLICATE_PUBLICATION', 'Ja existe publicacao equivalente para este ciclo editorial.');
  }

  if (context.cooldownUntil && new Date(context.cooldownUntil).getTime() > new Date(context.now).getTime()) {
    return block('COOLDOWN_ACTIVE', 'Publicacao bloqueada por cooldown operacional.', context.cooldownUntil);
  }

  if (context.targetWindow && context.targetWindow.currentCount >= context.targetWindow.maxCount) {
    return block(
      'TARGET_LIMIT_REACHED',
      'Limite conceitual do destino atingido.',
      context.targetWindow.resetAt
    );
  }

  return {
    allowed: true,
    action: 'allow',
    reason: 'ALLOWED',
    safeMessage: 'Candidate permitido para publicacao.',
    warnings: []
  };
}

function block(reason: string, safeMessage: string, blockedUntil?: string): PolicyDecision {
  const decision: PolicyDecision = {
    allowed: false,
    action: 'block',
    reason,
    safeMessage,
    warnings: []
  };

  if (blockedUntil !== undefined) decision.blockedUntil = blockedUntil;

  return decision;
}

function skip(reason: string, safeMessage: string): PolicyDecision {
  return {
    allowed: false,
    action: 'skip',
    reason,
    safeMessage,
    warnings: []
  };
}
