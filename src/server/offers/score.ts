import { assertHttpUrl, deriveDiscountPercent } from './normalization';
import {
  SCORE_VERSION,
  type OfferHighlight,
  type PriceSnapshotRecord,
  type ScoreResult
} from './types';

export interface ScoreInput {
  title: string;
  sourceUrl: string;
  affiliateUrl: string;
  imageUrl: string | null;
  categoryId: string | null;
  currentPrice: number;
  previousPrice: number | null;
  couponCode: string | null;
  freeShipping: boolean;
  commissionPercent: number | null;
}

export function calculateScore(
  input: ScoreInput,
  previousSnapshots: PriceSnapshotRecord[]
): ScoreResult {
  const discountPercent = deriveDiscountPercent(input.currentPrice, input.previousPrice);
  const discountPoints = calculateDiscountPoints(discountPercent);
  const priceHistoryPoints = calculatePriceHistoryPoints(input.currentPrice, previousSnapshots);
  const commissionPoints = calculateCommissionPoints(input.commissionPercent);
  const completenessPoints = calculateCompletenessPoints(input, previousSnapshots);
  const score = clampScore(
    Math.round(discountPoints + priceHistoryPoints + commissionPoints + completenessPoints)
  );

  return {
    score,
    scoreVersion: SCORE_VERSION,
    discountPercent,
    highlights: calculateHighlights(input, previousSnapshots),
    scoreFactors: {
      version: SCORE_VERSION,
      discount: {
        points: Math.round(discountPoints),
        max: 35,
        reason:
          discountPercent === null
            ? 'Sem desconto derivavel de preco anterior'
            : `${discountPercent}% de desconto derivado`
      },
      priceHistory: {
        points: priceHistoryPoints,
        max: 30,
        reason: priceHistoryReason(input.currentPrice, previousSnapshots)
      },
      commission: {
        points: commissionPoints,
        max: 20,
        reason: commissionReason(input.commissionPercent)
      },
      completeness: {
        points: completenessPoints,
        max: 15,
        reason: 'Completude calculada por campos obrigatorios, categoria, imagem e URLs'
      }
    }
  };
}

function calculateDiscountPoints(discountPercent: number | null): number {
  if (discountPercent === null) return 0;
  return Math.min(35, (discountPercent / 50) * 35);
}

function calculatePriceHistoryPoints(
  currentPrice: number,
  previousSnapshots: PriceSnapshotRecord[]
): 0 | 10 | 20 | 30 {
  const lowest = getLowestPreviousPrice(previousSnapshots);
  if (lowest === null) return 0;
  if (currentPrice <= lowest) return 30;

  const aboveLowestPercent = ((currentPrice - lowest) / lowest) * 100;
  if (aboveLowestPercent <= 5) return 20;
  if (aboveLowestPercent <= 10) return 10;
  return 0;
}

function calculateCommissionPoints(commissionPercent: number | null): 0 | 4 | 8 | 14 | 20 {
  if (commissionPercent === null || commissionPercent <= 0) return 0;
  if (commissionPercent < 4) return 4;
  if (commissionPercent < 8) return 8;
  if (commissionPercent < 12) return 14;
  return 20;
}

function calculateCompletenessPoints(
  input: ScoreInput,
  previousSnapshots: PriceSnapshotRecord[]
): number {
  let points = 0;

  if (
    input.title.trim().length >= 3 &&
    input.sourceUrl.trim().length > 0 &&
    input.affiliateUrl.trim().length > 0 &&
    input.currentPrice >= 0
  ) {
    points += 6;
  }

  if (input.categoryId) points += 3;
  if (input.imageUrl) points += 2;
  if (input.previousPrice !== null || previousSnapshots.length > 0) points += 2;

  try {
    assertHttpUrl(input.affiliateUrl, 'affiliateUrl');
    points += 2;
  } catch {
    // Validation happens before scoring; this defensive fallback keeps scoring deterministic.
  }

  return Math.min(points, 15);
}

function calculateHighlights(
  input: ScoreInput,
  previousSnapshots: PriceSnapshotRecord[]
): OfferHighlight[] {
  const highlights: OfferHighlight[] = [];
  const lowest = getLowestPreviousPrice(previousSnapshots);

  if (lowest !== null && input.currentPrice <= lowest) highlights.push('lowest_price');
  if (input.couponCode?.trim()) highlights.push('coupon');
  if (input.freeShipping) highlights.push('free_shipping');
  if (input.commissionPercent !== null && input.commissionPercent >= 8) {
    highlights.push('high_commission');
  }

  return highlights;
}

function getLowestPreviousPrice(previousSnapshots: PriceSnapshotRecord[]): number | null {
  if (previousSnapshots.length === 0) return null;
  return previousSnapshots.reduce<number | null>((lowest, snapshot) => {
    if (lowest === null) return snapshot.price;
    return Math.min(lowest, snapshot.price);
  }, null);
}

function priceHistoryReason(
  currentPrice: number,
  previousSnapshots: PriceSnapshotRecord[]
): string {
  const lowest = getLowestPreviousPrice(previousSnapshots);
  if (lowest === null) return 'Sem historico anterior elegivel';
  if (currentPrice <= lowest) return 'Preco atual igual ou abaixo do menor preco anterior';

  const aboveLowestPercent = ((currentPrice - lowest) / lowest) * 100;
  if (aboveLowestPercent <= 5) return 'Preco atual ate 5% acima do menor preco anterior';
  if (aboveLowestPercent <= 10) return 'Preco atual ate 10% acima do menor preco anterior';
  return 'Preco atual mais de 10% acima do menor preco anterior';
}

function commissionReason(commissionPercent: number | null): string {
  if (commissionPercent === null || commissionPercent <= 0) return 'Comissao ausente';
  if (commissionPercent < 4) return 'Comissao maior que 0% e menor que 4%';
  if (commissionPercent < 8) return 'Comissao entre 4% e 7.99%';
  if (commissionPercent < 12) return 'Comissao entre 8% e 11.99%';
  return 'Comissao de 12% ou mais';
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}
