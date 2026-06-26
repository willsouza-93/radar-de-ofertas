export const CAPTURE_CONTRACT_VERSION = 'capture-v1' as const;
export const DEFAULT_EDITORIAL_COOLDOWN_HOURS = 24 as const;

export type CaptureContractVersion = typeof CAPTURE_CONTRACT_VERSION;
export type Currency = 'BRL';

export type ConnectorCapability =
  | 'external_identity'
  | 'current_price'
  | 'previous_price'
  | 'images'
  | 'affiliate_link'
  | 'coupon'
  | 'free_shipping'
  | 'commission'
  | 'seller'
  | 'category_hint'
  | 'pagination'
  | 'incremental_cursor';

export interface CaptureWarning {
  code: string;
  safeMessage: string;
  details?: Record<string, unknown>;
}

export interface RawOffer {
  contractVersion: CaptureContractVersion;
  connectorId: string;
  connectorVersion: string;
  capturedAt: string;
  title: string;
  sourceUrl: string;
  currentPrice: string | number;
  externalId?: string | null;
  affiliateUrl?: string | null;
  previousPrice?: string | number | null;
  currency?: string | null;
  imageUrl?: string | null;
  couponCode?: string | null;
  freeShipping?: boolean | string | number | null;
  commissionPercent?: string | number | null;
  sellerId?: string | null;
  sellerName?: string | null;
  availability?: string | null;
  categoryHint?: string | null;
  rawPayloadRef?: string | null;
  sourceMetadata?: Record<string, unknown>;
}

export interface NormalizedOffer {
  contractVersion: CaptureContractVersion;
  workspaceId: string;
  sourceKey: string;
  externalId: string;
  dedupeKey: string;
  canonicalSourceUrl: string;
  sourceUrl: string;
  affiliateUrl: string | null;
  title: string;
  currentPrice: number;
  currency: Currency;
  capturedAt: string;
  imageUrl?: string | null;
  previousPrice?: number | null;
  discountPercent?: number | null;
  couponCode?: string | null;
  freeShipping?: boolean | null;
  commissionPercent?: number | null;
  categoryId?: string | null;
  tagIds?: string[];
  sellerKey?: string | null;
  availability?: string | null;
  normalizationWarnings?: CaptureWarning[];
}

export interface ScoreFactor {
  key: string;
  points: number;
  max: number;
  reason: string;
}

export interface ScoreBreakdown {
  version: string;
  factors: ScoreFactor[];
}

export interface ScoreResult {
  score: number;
  scoreVersion: string;
  scoreFactors: ScoreBreakdown;
  highlights: string[];
  warnings?: CaptureWarning[];
}

export interface ScoredOffer {
  normalizedOffer: NormalizedOffer;
  score: number;
  scoreVersion: string;
  scoreFactors: ScoreBreakdown;
  highlights: string[];
  scoreWarnings?: CaptureWarning[];
}

export interface ApprovedOffer {
  workspaceId: string;
  offerId: string;
  queueId: string;
  decisionId: string;
  approvedBy: string;
  approvedAt: string;
  approvalReason?: string | null;
  notesSummary?: string | null;
}

export interface PublishedOffer {
  workspaceId: string;
  offerId: string;
  publicationId: string;
  channel: string;
  status: string;
  idempotencyKey: string;
  externalMessageId?: string | null;
  publishedAt?: string | null;
  failureCode?: string | null;
  retryAfter?: string | null;
}

export interface CaptureContext {
  workspaceId: string;
  sourceKey: string;
  connectorId: string;
  connectorVersion: string;
  correlationId: string;
  captureRunId: string;
  capturedAt: string;
  editorialCooldownHours?: number;
}

export interface ConnectorContext {
  workspaceId: string;
  connectorId: string;
  connectorVersion: string;
  connectorConfig?: Record<string, unknown>;
  since?: string;
  pageToken?: string;
  limit?: number;
  correlationId: string;
  captureRunId: string;
  deadline?: Date;
}

export interface ConnectorResult {
  items: RawOffer[];
  nextPageToken?: string | null;
  warnings?: CaptureWarning[];
  errors?: CaptureWarning[];
  rateLimit?: {
    limited: boolean;
    retryAfter?: string;
  };
  sourceCursor?: string | null;
}

export interface Connector {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly capabilities: ConnectorCapability[];
  fetch(context: ConnectorContext): Promise<ConnectorResult>;
}

export type PipelineItemStatus = 'processed' | 'invalid';

export interface PipelineItemSuccess {
  status: 'processed';
  rawIndex: number;
  rawOffer: RawOffer;
  normalizedOffer: NormalizedOffer;
  scoredOffer: ScoredOffer;
}

export interface PipelineItemFailure {
  status: 'invalid';
  rawIndex: number;
  rawOffer: RawOffer;
  errorCode: string;
  safeMessage: string;
  details?: Record<string, unknown>;
}

export type PipelineItemResult = PipelineItemSuccess | PipelineItemFailure;

export interface PipelineResult {
  correlationId: string;
  captureRunId: string;
  received: number;
  processed: number;
  invalid: number;
  items: PipelineItemResult[];
}

export interface CaptureResult extends PipelineResult {
  connectorId: string;
  connectorVersion: string;
}
