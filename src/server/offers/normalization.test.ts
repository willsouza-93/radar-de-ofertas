import { describe, expect, it } from 'vitest';

import { AppError } from './errors';
import {
  canonicalizeSourceUrl,
  generateDedupeKey,
  parseMoney,
  parsePercent
} from './normalization';

describe('offer URL normalization and dedupe', () => {
  it('canonicalizes source URLs by removing tracking and preserving product params', () => {
    const canonical = canonicalizeSourceUrl(
      'HTTPS://www.Example.com:443/produto/ABC/?utm_source=ads&id=123&fbclid=x&sku=BLUE#section'
    );

    expect(canonical).toBe('https://example.com/produto/ABC?id=123&sku=BLUE');
  });

  it('generates external dedupe key with manual external id normalized to lowercase', () => {
    const result = generateDedupeKey(
      'manual',
      ' Produto-ABC ',
      'https://example.com/produto'
    );

    expect(result.dedupeKey).toBe('manual:external:produto-abc');
    expect(result.externalId).toBe('produto-abc');
  });

  it('generates stable URL dedupe key for equivalent tracked URLs', () => {
    const first = generateDedupeKey(
      'mercado_livre',
      null,
      'https://www.example.com/produto?id=123&utm_campaign=x'
    );
    const second = generateDedupeKey(
      'mercado_livre',
      undefined,
      'https://example.com/produto/?id=123&fbclid=abc'
    );

    expect(first.dedupeKey).toBe(second.dedupeKey);
    expect(first.externalId).toBe(second.externalId);
    expect(first.dedupeKey).toMatch(/^mercado_livre:url:[a-f0-9]{64}$/);
  });

  it('rejects non HTTP/HTTPS URLs', () => {
    expect(() => canonicalizeSourceUrl('javascript:alert(1)')).toThrow(AppError);
  });

  it('parses money and percentage values deterministically', () => {
    expect(parseMoney('129,90', 'currentPrice')).toBe(129.9);
    expect(parseMoney(10, 'currentPrice')).toBe(10);
    expect(parsePercent('8,50', 'commissionPercent')).toBe(8.5);
  });
});
