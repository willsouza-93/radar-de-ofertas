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

  it('treats blank optional previous price as missing', () => {
    const draft = normalizeRawOffer(
      createTestRawOffer({
        previousPrice: '   '
      }),
      createTestCaptureContext()
    );

    expect(draft.previousPrice).toBeNull();
    expect(draft.discountPercent).toBeNull();
  });

  it('preserves missing free-shipping as unknown', () => {
    const rawOffer = createTestRawOffer();
    delete rawOffer.freeShipping;
    const draft = normalizeRawOffer(rawOffer, createTestCaptureContext());

    expect(draft.freeShipping).toBeNull();
  });

  it('falls back to sellerName when sellerId is blank', () => {
    const draft = normalizeRawOffer(
      createTestRawOffer({
        sellerId: '   ',
        sellerName: ' Loja Principal '
      }),
      createTestCaptureContext()
    );

    expect(draft.sellerKey).toBe('loja principal');
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

  it('rejects numeric prices with more than two decimal places', () => {
    expect(() => parseMoney(19.999, 'currentPrice')).toThrow('Invalid money precision');
  });

  it('accepts large valid two-decimal numeric prices', () => {
    expect(parseMoney(1234567890.12, 'currentPrice')).toBe(1234567890.12);
  });

  it('rejects prices outside numeric(12,2)', () => {
    expect(() => parseMoney(10000000000, 'currentPrice')).toThrow('Money value exceeds');
  });

  it('rejects invalid numeric shipping flags', () => {
    expect(() => parseShippingFlag(2)).toThrow('Invalid shipping flag');
  });

  it('rejects non-ISO or calendar-invalid capture timestamps', () => {
    expect(() =>
      normalizeRawOffer(createTestRawOffer({ capturedAt: '0' }), createTestCaptureContext())
    ).toThrow('Invalid ISO date');

    expect(() =>
      normalizeRawOffer(
        createTestRawOffer({ capturedAt: '2026-02-30T12:00:00Z' }),
        createTestCaptureContext()
      )
    ).toThrow('Invalid ISO date');
  });
});
