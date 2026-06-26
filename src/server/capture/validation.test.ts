import { describe, expect, it } from 'vitest';

import { ValidationError } from './errors';
import { calculateDedupeKey } from './deduplication';
import { normalizeRawOffer } from './normalization';
import { createTestCaptureContext, createTestRawOffer } from './test-helpers';
import { validateNormalizedOffer, validateRawOffer } from './validation';

describe('capture validation', () => {
  it('rejects raw offers missing mandatory fields', () => {
    expect(() =>
      validateRawOffer(
        createTestRawOffer({
          title: '',
          affiliateUrl: ''
        })
      )
    ).toThrow(ValidationError);
  });

  it('accepts valid normalized offers', () => {
    const context = createTestCaptureContext();
    const draft = normalizeRawOffer(createTestRawOffer(), context);
    const dedupe = calculateDedupeKey({
      sourceKey: draft.sourceKey,
      externalId: draft.rawExternalId,
      canonicalSourceUrl: draft.canonicalSourceUrl
    });

    expect(() =>
      validateNormalizedOffer({
        ...draft,
        externalId: dedupe.externalId,
        dedupeKey: dedupe.dedupeKey
      })
    ).not.toThrow();
  });

  it('rejects normalized offers with weak title or invalid price', () => {
    const context = createTestCaptureContext();
    const draft = normalizeRawOffer(createTestRawOffer({ title: 'TV' }), context);
    const dedupe = calculateDedupeKey({
      sourceKey: draft.sourceKey,
      externalId: draft.rawExternalId,
      canonicalSourceUrl: draft.canonicalSourceUrl
    });

    expect(() =>
      validateNormalizedOffer({
        ...draft,
        externalId: dedupe.externalId,
        dedupeKey: dedupe.dedupeKey,
        currentPrice: -1
      })
    ).toThrow(ValidationError);
  });
});
