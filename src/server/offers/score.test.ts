import { describe, expect, it } from 'vitest';

import { calculateScore } from './score';
import type { PriceSnapshotRecord } from './types';

const previousSnapshot: PriceSnapshotRecord = {
  workspaceId: 'workspace-a',
  offerId: 'offer-a',
  price: 109.9,
  previousPrice: 149.9,
  discountPercent: 26.68,
  couponCode: null,
  freeShipping: true,
  observedAt: '2026-06-16T10:00:00Z'
};

describe('score mvp-v1', () => {
  it('calculates a deterministic strong offer score with all factors', () => {
    const result = calculateScore(
      {
        title: 'Fone Bluetooth',
        sourceUrl: 'https://example.com/fone',
        affiliateUrl: 'https://affiliate.example.com/fone',
        imageUrl: 'https://images.example.com/fone.jpg',
        categoryId: 'category-a',
        currentPrice: 99.9,
        previousPrice: 149.9,
        couponCode: 'APP10',
        freeShipping: true,
        commissionPercent: 10
      },
      [previousSnapshot]
    );

    expect(result.scoreVersion).toBe('mvp-v1');
    expect(result.score).toBe(82);
    expect(result.scoreFactors.discount.points).toBe(23);
    expect(result.scoreFactors.priceHistory.points).toBe(30);
    expect(result.scoreFactors.commission.points).toBe(14);
    expect(result.scoreFactors.completeness.points).toBe(15);
    expect(result.highlights).toEqual([
      'lowest_price',
      'coupon',
      'free_shipping',
      'high_commission'
    ]);
  });

  it('does not reweight missing factors', () => {
    const result = calculateScore(
      {
        title: 'Cafeteira',
        sourceUrl: 'https://example.com/cafeteira',
        affiliateUrl: 'https://affiliate.example.com/cafeteira',
        imageUrl: null,
        categoryId: 'category-a',
        currentPrice: 79.9,
        previousPrice: null,
        couponCode: null,
        freeShipping: false,
        commissionPercent: null
      },
      []
    );

    expect(result.score).toBe(11);
    expect(result.scoreFactors.discount.points).toBe(0);
    expect(result.scoreFactors.priceHistory.points).toBe(0);
    expect(result.scoreFactors.commission.points).toBe(0);
    expect(result.highlights).toEqual([]);
  });

  it('awards partial history points when price is near the lowest previous price', () => {
    const result = calculateScore(
      {
        title: 'Mouse Gamer',
        sourceUrl: 'https://example.com/mouse',
        affiliateUrl: 'https://affiliate.example.com/mouse',
        imageUrl: null,
        categoryId: null,
        currentPrice: 105,
        previousPrice: null,
        couponCode: null,
        freeShipping: false,
        commissionPercent: 3
      },
      [{ ...previousSnapshot, price: 100 }]
    );

    expect(result.scoreFactors.priceHistory.points).toBe(20);
    expect(result.scoreFactors.commission.points).toBe(4);
    expect(result.highlights).toEqual([]);
  });
});
