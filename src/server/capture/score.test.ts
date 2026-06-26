import { describe, expect, it } from 'vitest';

import { ScoreError } from './errors';
import { normalizeRawOffer } from './normalization';
import { StructuralScoreCalculator, assertValidScoreResult } from './score';
import { createTestCaptureContext, createTestRawOffer, finalizeTestOffer } from './test-helpers';

describe('capture score structure', () => {
  it('returns deterministic structural score without final algorithm', () => {
    const context = createTestCaptureContext();
    const offer = finalizeTestOffer(
      normalizeRawOffer(
        createTestRawOffer({
          couponCode: 'APP10',
          freeShipping: true,
          commissionPercent: 10
        }),
        context
      )
    );
    const result = new StructuralScoreCalculator().calculate(offer, { captureContext: context });

    expect(result.score).toBe(0);
    expect(result.scoreVersion).toBe('capture-structure-v1');
    expect(result.highlights).toEqual(['coupon', 'free_shipping', 'high_commission']);
    expect(result.warnings?.[0]?.code).toBe('SCORE_ALGORITHM_NOT_FINAL');
  });

  it('rejects invalid score results', () => {
    expect(() =>
      assertValidScoreResult({
        score: 101,
        scoreVersion: 'bad',
        scoreFactors: { version: 'bad', factors: [] },
        highlights: []
      })
    ).toThrow(ScoreError);
  });
});
