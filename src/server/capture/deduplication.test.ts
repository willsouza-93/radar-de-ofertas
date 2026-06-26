import { describe, expect, it } from 'vitest';

import {
  EditorialCooldownPolicy,
  calculateDedupeKey,
  detectMaterialChanges
} from './deduplication';
import { normalizeRawOffer } from './normalization';
import { createTestCaptureContext, createTestRawOffer, finalizeTestOffer } from './test-helpers';

describe('capture deduplication', () => {
  it('uses external identity before URL hash', () => {
    const result = calculateDedupeKey({
      sourceKey: 'official_feed',
      externalId: 'MLB123',
      canonicalSourceUrl: 'https://example.com/p/123'
    });

    expect(result).toEqual({
      externalId: 'MLB123',
      dedupeKey: 'official_feed:external:MLB123'
    });
  });

  it('normalizes manual/import external ids before keying', () => {
    expect(
      calculateDedupeKey({
        sourceKey: 'manual_import',
        externalId: ' Produto-ABC ',
        canonicalSourceUrl: 'https://example.com/p/123'
      })
    ).toEqual({
      externalId: 'produto-abc',
      dedupeKey: 'manual_import:external:produto-abc'
    });
  });

  it('falls back to canonical URL hash when external id is absent', () => {
    const result = calculateDedupeKey({
      sourceKey: 'manual',
      externalId: null,
      canonicalSourceUrl: 'https://example.com/p/123'
    });

    expect(result.externalId).toMatch(/^url:[a-f0-9]{64}$/);
    expect(result.dedupeKey).toBe(`manual:url:${result.externalId.replace('url:', '')}`);
  });

  it('detects material changes for editorial re-entry', () => {
    const offer = finalizeTestOffer(
      normalizeRawOffer(
        createTestRawOffer({
          currentPrice: 79.9,
          couponCode: 'VOLTOU',
          freeShipping: true
        }),
        createTestCaptureContext()
      )
    );

    expect(
      detectMaterialChanges(offer, {
        currentPrice: 99.9,
        couponCode: null,
        freeShipping: false,
        availability: 'out_of_stock'
      })
    ).toEqual(['price', 'discount', 'coupon', 'shipping', 'availability']);
  });

  it('does not treat unknown free-shipping as a material change', () => {
    const rawOffer = createTestRawOffer();
    delete rawOffer.freeShipping;
    const offer = finalizeTestOffer(
      normalizeRawOffer(rawOffer, createTestCaptureContext())
    );

    expect(
      detectMaterialChanges(offer, {
        currentPrice: offer.currentPrice,
        discountPercent: offer.discountPercent ?? null,
        couponCode: offer.couponCode ?? null,
        freeShipping: true,
        commissionPercent: offer.commissionPercent ?? null,
        sellerKey: offer.sellerKey ?? null,
        availability: offer.availability ?? null
      })
    ).toEqual([]);
  });

  it('allows editorial re-entry after the 24h cooldown', () => {
    const policy = new EditorialCooldownPolicy();
    const offer = finalizeTestOffer(
      normalizeRawOffer(
        createTestRawOffer({ capturedAt: '2026-06-26T12:00:00.000Z' }),
        createTestCaptureContext()
      )
    );

    expect(
      policy.evaluate({
        offer,
        existing: {
          currentPrice: offer.currentPrice,
          discountPercent: offer.discountPercent ?? null,
          couponCode: offer.couponCode ?? null,
          freeShipping: offer.freeShipping ?? false,
          commissionPercent: offer.commissionPercent ?? null,
          sellerKey: offer.sellerKey ?? null,
          lastEditorialReviewAt: '2026-06-25T11:59:59.000Z'
        },
        observedAt: '2026-06-26T12:00:00.000Z'
      })
    ).toMatchObject({ shouldReenter: true, reason: 'cooldown_elapsed', cooldownHours: 24 });
  });

  it('blocks editorial re-entry before cooldown when nothing changed', () => {
    const policy = new EditorialCooldownPolicy();
    const offer = finalizeTestOffer(
      normalizeRawOffer(
        createTestRawOffer({ capturedAt: '2026-06-26T12:00:00.000Z' }),
        createTestCaptureContext()
      )
    );

    expect(
      policy.evaluate({
        offer,
        existing: {
          currentPrice: offer.currentPrice,
          discountPercent: offer.discountPercent ?? null,
          couponCode: offer.couponCode ?? null,
          freeShipping: offer.freeShipping ?? false,
          commissionPercent: offer.commissionPercent ?? null,
          sellerKey: offer.sellerKey ?? null,
          lastEditorialReviewAt: '2026-06-26T00:00:00.000Z'
        },
        observedAt: '2026-06-26T12:00:00.000Z'
      })
    ).toMatchObject({ shouldReenter: false, reason: 'cooldown_not_elapsed' });
  });
});
