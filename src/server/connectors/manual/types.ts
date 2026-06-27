import type { RawOffer } from '@/server/capture/types';

export interface ManualImportRecord {
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
  capturedAt?: string | null;
  rawPayloadRef?: string | null;
  sourceMetadata?: Record<string, unknown>;
}

export type ManualRawOffer = RawOffer;
