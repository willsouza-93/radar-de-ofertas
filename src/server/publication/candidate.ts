import { PolicyError } from './errors';
import type {
  ApprovedOfferForPublication,
  PolicyDecision,
  PublicationCandidate,
  PublicationMode,
  PublicationTarget
} from './types';

export interface CreatePublicationCandidateInput {
  approvedOffer: ApprovedOfferForPublication;
  target: PublicationTarget;
  candidateId: string;
  createdBy: string;
  createdAt: string;
  mode: PublicationMode;
  priority?: number;
  slotKey?: string;
}

export function createPublicationCandidate(input: CreatePublicationCandidateInput): PublicationCandidate {
  assertCurrentApprovedOffer(input.approvedOffer);

  const idempotencyKey = buildPublicationIdempotencyKey({
    workspaceId: input.approvedOffer.workspaceId,
    offerId: input.approvedOffer.offerId,
    targetId: input.target.id,
    approvalDecisionId: input.approvedOffer.approvalDecisionId,
    snapshotVersion: input.approvedOffer.snapshot.version,
    slotKey: input.slotKey ?? 'manual'
  });

  return {
    id: input.candidateId,
    workspaceId: input.approvedOffer.workspaceId,
    offerId: input.approvedOffer.offerId,
    approvalQueueId: input.approvedOffer.approvalQueueId,
    approvalDecisionId: input.approvedOffer.approvalDecisionId,
    snapshotId: input.approvedOffer.snapshot.id,
    snapshotVersion: input.approvedOffer.snapshot.version,
    target: input.target,
    status: 'created',
    priority: input.priority ?? 0,
    idempotencyKey,
    mode: input.mode,
    createdBy: input.createdBy,
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

export function markCandidateEligible(candidate: PublicationCandidate, now: string): PublicationCandidate {
  ensureCandidateCanTransition(candidate.status, 'eligible');
  const { blockedReason: _blockedReason, blockedUntil: _blockedUntil, ...candidateWithoutBlock } = candidate;
  return {
    ...candidateWithoutBlock,
    status: 'eligible',
    safeMessage: 'Candidate elegivel para publicacao.',
    updatedAt: now
  };
}

export function blockPublicationCandidate(
  candidate: PublicationCandidate,
  decision: PolicyDecision,
  now: string
): PublicationCandidate {
  ensureCandidateCanTransition(candidate.status, 'blocked');
  const blockedCandidate: PublicationCandidate = {
    ...candidate,
    status: 'blocked',
    blockedReason: decision.reason,
    safeMessage: decision.safeMessage,
    updatedAt: now
  };

  if (decision.blockedUntil !== undefined) blockedCandidate.blockedUntil = decision.blockedUntil;

  return blockedCandidate;
}

export function queuePublicationCandidate(candidate: PublicationCandidate, now: string): PublicationCandidate {
  ensureCandidateCanTransition(candidate.status, 'queued');
  return {
    ...candidate,
    status: 'queued',
    safeMessage: 'Candidate enfileirado conceitualmente para publicacao.',
    updatedAt: now
  };
}

export function cancelPublicationCandidate(
  candidate: PublicationCandidate,
  now: string,
  safeMessage = 'Candidate cancelado.'
): PublicationCandidate {
  ensureCandidateCanTransition(candidate.status, 'cancelled');
  return {
    ...candidate,
    status: 'cancelled',
    safeMessage,
    updatedAt: now
  };
}

export function expirePublicationCandidate(candidate: PublicationCandidate, now: string): PublicationCandidate {
  ensureCandidateCanTransition(candidate.status, 'expired');
  return {
    ...candidate,
    status: 'expired',
    safeMessage: 'Candidate expirado antes da publicacao.',
    updatedAt: now
  };
}

export function isCandidateEligible(candidate: PublicationCandidate): boolean {
  return candidate.status === 'eligible';
}

export function buildPublicationIdempotencyKey(input: {
  workspaceId: string;
  offerId: string;
  targetId: string;
  approvalDecisionId: string;
  snapshotVersion: string;
  slotKey: string;
}): string {
  return [
    'publication',
    input.workspaceId,
    input.offerId,
    input.targetId,
    input.approvalDecisionId,
    input.snapshotVersion,
    input.slotKey
  ].join(':');
}

function assertCurrentApprovedOffer(offer: ApprovedOfferForPublication): void {
  if (offer.approvalStatus !== 'approved') {
    throw new PolicyError('Offer is not approved for publication.', {
      code: 'OFFER_NOT_APPROVED',
      safeMessage: 'A oferta ainda nao esta aprovada para publicacao.',
      retryable: false,
      details: { offerId: offer.offerId, approvalStatus: offer.approvalStatus }
    });
  }

  if (offer.approvalDecisionId !== offer.currentApprovalDecisionId) {
    throw new PolicyError('Approval decision is stale.', {
      code: 'STALE_APPROVAL_DECISION',
      safeMessage: 'A decisao de aprovacao nao corresponde ao ciclo editorial atual.',
      retryable: false,
      details: { offerId: offer.offerId, approvalDecisionId: offer.approvalDecisionId }
    });
  }
}

function ensureCandidateCanTransition(from: PublicationCandidate['status'], to: PublicationCandidate['status']): void {
  const allowed: Record<PublicationCandidate['status'], PublicationCandidate['status'][]> = {
    created: ['eligible', 'blocked', 'cancelled', 'expired'],
    eligible: ['queued', 'blocked', 'cancelled', 'expired'],
    blocked: ['eligible', 'blocked', 'cancelled', 'expired'],
    queued: ['cancelled'],
    cancelled: [],
    expired: []
  };

  if (!allowed[from].includes(to)) {
    throw new PolicyError('Invalid publication candidate transition.', {
      code: 'INVALID_CANDIDATE_TRANSITION',
      safeMessage: 'Transicao invalida para o candidate de publicacao.',
      retryable: false,
      details: { from, to }
    });
  }
}
