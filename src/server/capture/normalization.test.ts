import { describe, expect, it } from 'vitest';

import {
  canonicalizeSourceUrl,
  normalizeCurrency,
  normalizeRawOffer,
  parseMoney,
  parseShippingFlag
} from './normalization';
import { createTestCaptureContext, createTestRawOffer } from './test-helpers';

describe('capture normalization', () => {
  it('canonicalizes source URLs without tracking noise', () => {
    const canonical = canonicalizeSourceUrl(
      'HTTPS://www.Example.com/oferta/?utm_source=ads&b=2&a=1&fbclid=abc#section'
    );

    expect(canonical).toBe('https://example.com/oferta?a=1&b=2');
  });

  it('normalizes raw offers into connector-agnostic drafts', () => {
    const draft = normalizeRawOffer(
      createTestRawOffer({
        currentPrice: '99,90',
        previousPrice: '149.90',
        freeShipping: 'sim',
        commissionPercent: '8,5',
        couponCode: '  OFERTA10  ',
        sellerName: ' Loja Oficial '
      }),
      createTestCaptureContext()
    );

    expect(draft.currentPrice).toBe(99.9);
    expect(draft.previousPrice).toBe(149.9);
    expect(draft.discountPercent).toBe(33.36);
    expect(draft.freeShipping).toBe(true);
    expect(draft.commissionPercent).toBe(8.5);
    expect(draft.couponCode).toBe('OFERTA10');
    expect(draft.sellerKey).toBe('loja oficial');
  });

  it('allows raw offers without affiliate URL for future enrichment', () => {
    const draft = normalizeRawOffer(
      createTestRawOffer({
        affiliateUrl: null
      }),
      createTestCaptureContext()
    );

    expect(draft.affiliateUrl).toBeNull();
    expect(draft.canonicalSourceUrl).toBe('https://example.com/produto/notebook?sku=123');
  });

  it('rejects unsupported currencies', () => {
    expect(() => normalizeCurrency('USD')).toThrow('Unsupported currency');
  });

  it('parses money and shipping flags consistently', () => {
    expect(parseMoney('10,25', 'currentPrice')).toBe(10.25);
    expect(parseShippingFlag('free')).toBe(true);
    expect(parseShippingFlag('0')).toBe(false);
  });
});
