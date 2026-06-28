export const PUBLICATION_DOMAIN_VERSION = 'publication-v1' as const;

export type PublicationDomainVersion = typeof PUBLICATION_DOMAIN_VERSION;

export type PublicationChannel = string;

export type PublicationCandidateStatus = 'created' | 'eligible' | 'blocked' | 'queued' | 'cancelled' | 'expired';

export type PublicationJobStatus =
  | 'rendering'
  | 'ready'
  | 'sending'
  | 'succeeded'
  | 'failed'
  | 'paused'
  | 'cancelled';

export type RenderedMessageFormat = 'plain' | 'markdown' | 'html_restricted';

export type PublicationResultStatus = 'success' | 'transient_failure' | 'permanent_failure' | 'ambiguous';

export type PublicationFailureCategory = 'policy' | 'template' | 'publisher' | 'retry' | 'transient' | 'permanent' | 'ambiguous';

export type PublicationEventName =
  | 'PublicationRequested'
  | 'PublicationStarted'
  | 'PublicationSucceeded'
  | 'PublicationFailed'
  | 'PublicationRetried'
  | 'PublicationCancelled'
  | 'PublicationSkipped';

export type PublicationMode = 'manual' | 'automatic';

export interface ApprovedOfferSnapshot {
  id: string;
  version: string;
  title: string;
  currentPrice: number;
  currency: 'BRL';
  sourceUrl: string;
  affiliateUrl?: string | null;
  previousPrice?: number | null;
  discountPercent?: number | null;
  couponCode?: string | null;
  freeShipping?: boolean | null;
  commissionPercent?: number | null;
  highlights?: string[];
}

export interface ApprovedOfferForPublication {
  workspaceId: string;
  offerId: string;
  approvalQueueId: string;
  approvalDecisionId: string;
  currentApprovalDecisionId: string;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  approvedAt: string;
  approvedBy: string;
  snapshot: ApprovedOfferSnapshot;
}

export interface PublicationTarget {
  id: string;
  channel: PublicationChannel;
  destinationId: string;
  destinationLabel?: string;
  enabled: boolean;
  supportsManualPublication?: boolean;
  maxTextLength?: number;
  options?: Record<string, unknown>;
}

export interface PublicationCandidate {
  id: string;
  workspaceId: string;
  offerId: string;
  approvalQueueId: string;
  approvalDecisionId: string;
  snapshotId: string;
  snapshotVersion: string;
  target: PublicationTarget;
  status: PublicationCandidateStatus;
  priority: number;
  idempotencyKey: string;
  mode: PublicationMode;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  blockedReason?: string;
  blockedUntil?: string;
  safeMessage?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  action: 'allow' | 'block' | 'skip';
  reason: string;
  safeMessage: string;
  blockedUntil?: string;
  warnings: string[];
}

export interface PublicationPolicy {
  evaluate(candidate: PublicationCandidate, context: PublicationPolicyContext): PolicyDecision;
}

export interface PublicationPolicyContext {
  now: string;
  targetEnabled: boolean;
  manualPublicationEnabled: boolean;
  existingIdempotencyKeys?: ReadonlySet<string>;
  cooldownUntil?: string | null;
  targetWindow?: {
    currentCount: number;
    maxCount: number;
    resetAt?: string;
  };
}

export interface PublicationTemplate {
  id: string;
  name: string;
  format: RenderedMessageFormat;
  body: string;
  requiredVariables: string[];
  minLength?: number;
  maxLength?: number;
}

export interface PublicationContext {
  workspaceId: string;
  approvedOfferSnapshot: ApprovedOfferSnapshot;
  approvalDecisionId: string;
  target: PublicationTarget;
  redirectLink: string;
  generatedAt: string;
}

export interface RenderedMessage {
  format: RenderedMessageFormat;
  text: string;
  linkPreview: boolean;
  metadata: {
    templateId: string;
    templateName: string;
    generatedAt: string;
    snapshotId: string;
    snapshotVersion: string;
  };
}

export interface TemplateRenderer {
  render(template: PublicationTemplate, context: PublicationContext): RenderedMessage;
}

export interface PublicationJob {
  id: string;
  workspaceId: string;
  candidateId: string;
  target: PublicationTarget;
  renderedMessage: RenderedMessage | null;
  idempotencyKey: string;
  status: PublicationJobStatus;
  correlationId: string;
  publicationRunId: string;
  attempt: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationRequest {
  workspaceId: string;
  publicationJobId: string;
  idempotencyKey: string;
  target: PublicationTarget;
  message: RenderedMessage;
  correlationId: string;
  publicationRunId: string;
}

export interface PublicationFailure {
  category: PublicationFailureCategory;
  code: string;
  safeMessage: string;
  retryable: boolean;
  retryAfter?: string;
  providerRequestId?: string;
}

export interface PublicationResult {
  status: PublicationResultStatus;
  externalMessageId?: string;
  providerRequestId?: string;
  failure?: PublicationFailure;
  safeMessage: string;
  retryAfter?: string;
  rawStatus?: string;
}

export interface Publisher {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: string[];
  readonly limits: {
    maxTextLength?: number;
    maxAttempts?: number;
  };
  publish(request: PublicationRequest): Promise<PublicationResult> | PublicationResult;
}

export interface RetryDecision {
  retry: boolean;
  retryAt?: string;
  terminal: boolean;
  manualReviewRequired: boolean;
  reason: string;
  safeMessage: string;
}

export interface PublicationHistoryEntry {
  id: string;
  workspaceId: string;
  publicationJobId: string;
  status: PublicationJobStatus | PublicationResultStatus;
  safeMessage: string;
  createdAt: string;
  failureCode?: string;
}

export interface PublicationEvent {
  eventName: PublicationEventName;
  workspaceId: string;
  offerId?: string;
  publicationCandidateId?: string;
  publicationJobId?: string;
  publicationRunId?: string;
  publisherId?: string;
  targetId?: string;
  correlationId: string;
  idempotencyKey?: string;
  status: string;
  failureCode?: string;
  safeMessage: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface PublicationPipelineInput {
  approvedOffer: ApprovedOfferForPublication;
  target: PublicationTarget;
  template: PublicationTemplate;
  publisher: Publisher;
  redirectLink: string;
  requestedBy: string;
  mode: PublicationMode;
  now: string;
  correlationId: string;
  candidateId: string;
  jobId: string;
  publicationRunId: string;
  policyContext: Omit<PublicationPolicyContext, 'now' | 'targetEnabled'> & {
    now?: string;
    targetEnabled?: boolean;
  };
}

export interface PublicationPipelineOutput {
  candidate: PublicationCandidate;
  policyDecision: PolicyDecision;
  job: PublicationJob | null;
  result: PublicationResult | null;
  retryDecision: RetryDecision | null;
  events: PublicationEvent[];
}
