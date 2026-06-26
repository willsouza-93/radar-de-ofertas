import { calculateDedupeKey } from './deduplication';
import type { CaptureContext, NormalizedOffer, RawOffer } from './types';
import type { NormalizedOfferDraft } from './normalization';

export function createTestCaptureContext(overrides: Partial<CaptureContext> = {}): CaptureContext {
  return {
    workspaceId: 'workspace-1',
    sourceKey: 'manual_import',
    connectorId: 'manual-import',
    connectorVersion: '0.1.0',
    correlationId: 'corr-test',
    captureRunId: 'capture-test',
    capturedAt: '2026-06-26T12:00:00.000Z',
    ...overrides
  };
}

export function createTestRawOffer(overrides: Partial<RawOffer> = {}): RawOffer {
  return {
    contractVersion: 'capture-v1',
    connectorId: 'manual-import',
    connectorVersion: '0.1.0',
    capturedAt: '2026-06-26T12:00:00.000Z',
    title: 'Notebook Acer Aspire 5',
    sourceUrl: 'https://www.example.com/produto/notebook?utm_source=ads&sku=123',
    affiliateUrl: 'https://afiliados.example.com/produto/notebook?tag=willian',
    currentPrice: 2999.9,
    previousPrice: 3499.9,
    externalId: 'offer-123',
    currency: 'BRL',
    imageUrl: 'https://cdn.example.com/notebook.jpg',
    couponCode: null,
    freeShipping: false,
    commissionPercent: null,
    ...overrides
  };
}

export function finalizeTestOffer(draft: NormalizedOfferDraft): NormalizedOffer {
  const dedupe = calculateDedupeKey({
    sourceKey: draft.sourceKey,
    externalId: draft.rawExternalId,
    canonicalSourceUrl: draft.canonicalSourceUrl
  });

  return {
    contractVersion: draft.contractVersion,
    workspaceId: draft.workspaceId,
    sourceKey: draft.sourceKey,
    externalId: dedupe.externalId,
    dedupeKey: dedupe.dedupeKey,
    canonicalSourceUrl: draft.canonicalSourceUrl,
    sourceUrl: draft.sourceUrl,
    affiliateUrl: draft.affiliateUrl,
    title: draft.title,
    currentPrice: draft.currentPrice,
    currency: draft.currency,
    capturedAt: draft.capturedAt,
    imageUrl: draft.imageUrl,
    previousPrice: draft.previousPrice,
    discountPercent: draft.discountPercent,
    couponCode: draft.couponCode,
    freeShipping: draft.freeShipping,
    commissionPercent: draft.commissionPercent,
    sellerKey: draft.sellerKey,
    availability: draft.availability
  };
}
