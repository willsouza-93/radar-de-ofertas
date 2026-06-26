import { ScoreError } from './errors';
import type { CaptureContext, NormalizedOffer, ScoreBreakdown, ScoreFactor, ScoreResult } from './types';

export const CAPTURE_SCORE_VERSION = 'capture-structure-v1' as const;
const ALLOWED_HIGHLIGHTS = new Set([
  'lowest_price',
  'coupon',
  'free_shipping',
  'high_commission'
]);

export interface ScoreCalculationContext {
  captureContext: CaptureContext;
}

export interface ScoreCalculator {
  calculate(offer: NormalizedOffer, context: ScoreCalculationContext): ScoreResult;
}

export class StructuralScoreCalculator implements ScoreCalculator {
  calculate(offer: NormalizedOffer, _context?: ScoreCalculationContext): ScoreResult {
    const factors: ScoreFactor[] = [
      {
        key: 'placeholder',
        points: 0,
        max: 100,
        reason: 'Estrutura de score preparada; algoritmo definitivo fica em fase futura.'
      }
    ];

    const breakdown: ScoreBreakdown = {
      version: CAPTURE_SCORE_VERSION,
      factors
    };

    return {
      score: clampScore(sumFactors(factors)),
      scoreVersion: CAPTURE_SCORE_VERSION,
      scoreFactors: breakdown,
      highlights: deriveStructuralHighlights(offer),
      warnings: [
        {
          code: 'SCORE_ALGORITHM_NOT_FINAL',
          safeMessage: 'Score estrutural calculado sem algoritmo definitivo.'
        }
      ]
    };
  }
}

export function assertValidScoreResult(result: ScoreResult): void {
  if (!Number.isInteger(result.score) || result.score < 0 || result.score > 100) {
    throw new ScoreError('Invalid score result.', {
      code: 'INVALID_SCORE_RESULT',
      safeMessage: 'Resultado de score invalido.',
      details: { score: result.score }
    });
  }

  for (const factor of result.scoreFactors.factors) {
    if (
      !Number.isFinite(factor.points) ||
      !Number.isFinite(factor.max) ||
      factor.points < 0 ||
      factor.max < 0 ||
      factor.points > factor.max
    ) {
      throw new ScoreError('Invalid score factor.', {
        code: 'INVALID_SCORE_FACTOR',
        safeMessage: 'Fator de score invalido.',
        details: { factor }
      });
    }
  }

  for (const highlight of result.highlights) {
    if (!ALLOWED_HIGHLIGHTS.has(highlight)) {
      throw new ScoreError('Invalid score highlight.', {
        code: 'INVALID_SCORE_HIGHLIGHT',
        safeMessage: 'Highlight de score invalido.',
        details: { highlight }
      });
    }
  }
}

export function toScoredOffer(offer: NormalizedOffer, scoreResult: ScoreResult) {
  assertValidScoreResult(scoreResult);
  return {
    normalizedOffer: offer,
    score: scoreResult.score,
    scoreVersion: scoreResult.scoreVersion,
    scoreFactors: scoreResult.scoreFactors,
    highlights: scoreResult.highlights,
    ...(scoreResult.warnings ? { scoreWarnings: scoreResult.warnings } : {})
  };
}

function deriveStructuralHighlights(offer: NormalizedOffer): string[] {
  const highlights: string[] = [];
  if (offer.couponCode) highlights.push('coupon');
  if (offer.freeShipping) highlights.push('free_shipping');
  if (offer.commissionPercent !== null && offer.commissionPercent !== undefined && offer.commissionPercent >= 8) {
    highlights.push('high_commission');
  }
  return highlights;
}

function sumFactors(factors: ScoreFactor[]): number {
  return clampScore(Math.round(factors.reduce((total, factor) => total + factor.points, 0)));
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}
