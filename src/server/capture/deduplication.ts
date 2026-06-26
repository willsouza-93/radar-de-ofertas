import { createHash } from 'node:crypto';

import { DeduplicationError } from './errors';
import {
  DEFAULT_EDITORIAL_COOLDOWN_HOURS,
  type NormalizedOffer,
  type CaptureWarning
} from './types';

export interface DedupeResult {
  externalId: string;
  dedupeKey: string;
}

export type MaterialChange =
  | 'price'
  | 'discount'
  | 'coupon'
  | 'shipping'
  | 'commission'
  | 'seller'
  | 'availability';

export interface ExistingOfferEditorialState {
  currentPrice: number;
  discountPercent?: number | null;
  couponCode?: string | null;
  freeShipping?: boolean;
  commissionPercent?: number | null;
  sellerKey?: string | null;
  availability?: string | null;
  lastEditorialReviewAt?: string | null;
}

export interface EditorialCooldownDecision {
  shouldReenter: boolean;
  reason:
    | 'material_change'
    | 'cooldown_elapsed'
    | 'cooldown_not_elapsed'
    | 'new_offer';
  materialChanges: MaterialChange[];
  cooldownHours: number;
  warnings?: CaptureWarning[];
}

export class EditorialCooldownPolicy {
  readonly cooldownHours: number;

  constructor(cooldownHours = DEFAULT_EDITORIAL_COOLDOWN_HOURS) {
    if (!Number.isFinite(cooldownHours) || cooldownHours <= 0) {
      throw new DeduplicationError('Invalid editorial cooldown.', {
        code: 'INVALID_EDITORIAL_COOLDOWN',
        safeMessage: 'Cooldown editorial invalido.',
        details: { cooldownHours }
      });
    }
    this.cooldownHours = cooldownHours;
  }

  evaluate(args: {
    offer: NormalizedOffer;
    existing?: ExistingOfferEditorialState | null;
    observedAt?: string;
  }): EditorialCooldownDecision {
    if (!args.existing) {
      return {
        shouldReenter: true,
        reason: 'new_offer',
        materialChanges: [],
        cooldownHours: this.cooldownHours
      };
    }

    const materialChanges = detectMaterialChanges(args.offer, args.existing);
    if (materialChanges.length > 0) {
      return {
        shouldReenter: true,
        reason: 'material_change',
        materialChanges,
        cooldownHours: this.cooldownHours
      };
    }

    const lastReview = args.existing.lastEditorialReviewAt;
    if (!lastReview) {
      return {
        shouldReenter: true,
        reason: 'cooldown_elapsed',
        materialChanges,
        cooldownHours: this.cooldownHours,
        warnings: [
          {
            code: 'EDITORIAL_REVIEW_TIMESTAMP_MISSING',
            safeMessage: 'Sem data de ultima revisao editorial.'
          }
        ]
      };
    }

    const observedAt = new Date(args.observedAt ?? args.offer.capturedAt);
    const lastReviewedAt = new Date(lastReview);
    if (Number.isNaN(observedAt.getTime()) || Number.isNaN(lastReviewedAt.getTime())) {
      throw new DeduplicationError('Invalid editorial timestamp.', {
        code: 'INVALID_EDITORIAL_TIMESTAMP',
        safeMessage: 'Data editorial invalida.',
        details: { observedAt: args.observedAt ?? args.offer.capturedAt, lastReview }
      });
    }

    const elapsedMs = observedAt.getTime() - lastReviewedAt.getTime();
    const cooldownMs = this.cooldownHours * 60 * 60 * 1000;

    return {
      shouldReenter: elapsedMs >= cooldownMs,
      reason: elapsedMs >= cooldownMs ? 'cooldown_elapsed' : 'cooldown_not_elapsed',
      materialChanges,
      cooldownHours: this.cooldownHours
    };
  }
}

export function calculateDedupeKey(args: {
  sourceKey: string;
  externalId?: string | null;
  canonicalSourceUrl: string;
}): DedupeResult {
  const sourceKey = normalizeSourceKey(args.sourceKey);
  const externalId = normalizeExternalId(sourceKey, args.externalId);

  if (externalId) {
    return {
      externalId,
      dedupeKey: `${sourceKey}:external:${externalId}`
    };
  }

  const hash = createHash('sha256').update(args.canonicalSourceUrl).digest('hex');
  return {
    externalId: `url:${hash}`,
    dedupeKey: `${sourceKey}:url:${hash}`
  };
}

export function detectMaterialChanges(
  offer: NormalizedOffer,
  existing: ExistingOfferEditorialState
): MaterialChange[] {
  const changes: MaterialChange[] = [];

  if (offer.currentPrice !== existing.currentPrice) changes.push('price');
  if ((offer.discountPercent ?? null) !== (existing.discountPercent ?? null)) {
    changes.push('discount');
  }
  if ((offer.couponCode ?? null) !== (existing.couponCode ?? null)) changes.push('coupon');
  if (offer.freeShipping !== null && offer.freeShipping !== undefined) {
    if (offer.freeShipping !== (existing.freeShipping ?? false)) changes.push('shipping');
  }
  if ((offer.commissionPercent ?? null) !== (existing.commissionPercent ?? null)) {
    changes.push('commission');
  }
  if ((offer.sellerKey ?? null) !== (existing.sellerKey ?? null)) changes.push('seller');
  if ((offer.availability ?? null) !== (existing.availability ?? null)) {
    changes.push('availability');
  }

  return changes;
}

function normalizeSourceKey(sourceKey: string): string {
  const normalized = sourceKey.trim().toLowerCase();
  if (!/^[a-z0-9_.-]+$/.test(normalized)) {
    throw new DeduplicationError('Invalid source key.', {
      code: 'INVALID_SOURCE_KEY',
      safeMessage: 'Origem de captura invalida.',
      details: { sourceKey }
    });
  }
  return normalized;
}

function normalizeExternalId(sourceKey: string, externalId: string | null | undefined): string | null {
  const trimmed = externalId?.trim();
  if (!trimmed) return null;
  return isManualOrImportSource(sourceKey) ? trimmed.toLowerCase() : trimmed;
}

function isManualOrImportSource(sourceKey: string): boolean {
  return sourceKey === 'manual' || sourceKey.includes('import');
}
