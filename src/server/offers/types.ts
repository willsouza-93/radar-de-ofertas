export const SCORE_VERSION = 'mvp-v1' as const;

export type AppRole = 'admin' | 'editor';
export type OfferMarketplace = 'manual' | 'mercado_livre' | 'shopee';
export type OfferStatus = 'captured';
export type OfferHighlight =
  | 'lowest_price'
  | 'coupon'
  | 'free_shipping'
  | 'high_commission';

export interface ActiveMembership {
  workspaceId: string;
  userId: string;
  role: AppRole;
  status: 'active';
}

export interface ScoreFactorDetail {
  points: number;
  max: number;
  reason: string;
}

export interface ScoreFactors {
  version: typeof SCORE_VERSION;
  discount: ScoreFactorDetail;
  priceHistory: ScoreFactorDetail;
  commission: ScoreFactorDetail;
  completeness: ScoreFactorDetail;
}

export interface ScoreResult {
  score: number;
  scoreVersion: typeof SCORE_VERSION;
  scoreFactors: ScoreFactors;
  highlights: OfferHighlight[];
  discountPercent: number | null;
}

export interface CategoryRecord {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
}

export interface TagRecord {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  color: string | null;
  isActive: boolean;
}

export interface OfferRecord {
  id: string;
  workspaceId: string;
  marketplace: OfferMarketplace;
  externalId: string;
  dedupeKey: string;
  sourceUrl: string;
  affiliateUrl: string;
  title: string;
  imageUrl: string | null;
  categoryId: string | null;
  currentPrice: number;
  previousPrice: number | null;
  currency: 'BRL';
  discountPercent: number | null;
  couponCode: string | null;
  freeShipping: boolean;
  commissionPercent: number | null;
  score: number;
  scoreVersion: typeof SCORE_VERSION;
  scoreFactors: ScoreFactors;
  highlights: OfferHighlight[];
  status: OfferStatus;
  capturedAt: string;
  lastSeenAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceSnapshotRecord {
  id?: number;
  workspaceId: string;
  offerId: string;
  price: number;
  previousPrice: number | null;
  discountPercent: number | null;
  couponCode: string | null;
  freeShipping: boolean;
  observedAt: string;
}

export interface OfferListFilters {
  q?: string | undefined;
  marketplace?: OfferMarketplace | undefined;
  categoryId?: string | undefined;
  tagId?: string | undefined;
  minScore?: number | undefined;
  minDiscount?: number | undefined;
  from?: string | undefined;
  to?: string | undefined;
  cursor?: string | undefined;
  limit: number;
  sort: 'score_desc' | 'captured_desc' | 'discount_desc';
}

export interface OfferListItem {
  id: string;
  title: string;
  marketplace: OfferMarketplace;
  category: Pick<CategoryRecord, 'id' | 'name' | 'color'> | null;
  currentPrice: number;
  previousPrice: number | null;
  discountPercent: number | null;
  score: number;
  highlights: OfferHighlight[];
  capturedAt: string;
}

export interface OfferDetail {
  offer: OfferRecord;
  category: CategoryRecord | null;
  tags: TagRecord[];
  priceSnapshots: PriceSnapshotRecord[];
}

export interface StructuredLogger {
  info(event: string, metadata?: Record<string, unknown>): void;
  warn(event: string, metadata?: Record<string, unknown>): void;
}
