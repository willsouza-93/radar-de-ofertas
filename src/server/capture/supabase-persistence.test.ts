import { describe, expect, it } from 'vitest';

import { SupabaseCapturePersistenceRepository } from './supabase-persistence';
import type { PersistedCaptureOffer } from './manual-import';
import type { ScoredOffer } from './types';

describe('SupabaseCapturePersistenceRepository', () => {
  it('materializes approval queue through submit_capture_for_review RPC', async () => {
    const calls: unknown[] = [];
    const repository = new SupabaseCapturePersistenceRepository({
      rpc: async (name: string, args: unknown) => {
        calls.push({ name, args });
        return {
          data: [{ queue_id: 'queue-a', action: 'created' }],
          error: null
        };
      }
    } as never);

    await expect(repository.createApprovalQueue({
      workspaceId: 'workspace-a',
      offerId: 'offer-a',
      priorityScore: 80,
      reentryReason: 'new_offer',
      captureRunId: 'capture-run-a',
      correlationId: 'correlation-a'
    })).resolves.toEqual({ id: 'queue-a' });

    expect(calls).toEqual([
      {
        name: 'submit_capture_for_review',
        args: {
          target_offer_id: 'offer-a',
          target_priority_score: 80,
          target_reentry_reason: 'new_offer',
          target_capture_run_id: 'capture-run-a',
          target_correlation_id: 'correlation-a'
        }
      }
    ]);
  });

  it('reopens approval queue through submit_capture_for_review RPC', async () => {
    const calls: unknown[] = [];
    const repository = new SupabaseCapturePersistenceRepository({
      rpc: async (name: string, args: unknown) => {
        calls.push({ name, args });
        return {
          data: [{ queue_id: 'queue-a', action: 'reopened' }],
          error: null
        };
      }
    } as never);

    await expect(repository.reopenApprovalQueue({
      workspaceId: 'workspace-a',
      offerId: 'offer-a',
      priorityScore: 80,
      reentryReason: 'material_change',
      captureRunId: 'capture-run-a',
      correlationId: 'correlation-a'
    })).resolves.toEqual({ id: 'queue-a' });

    expect(calls).toEqual([
      {
        name: 'submit_capture_for_review',
        args: {
          target_offer_id: 'offer-a',
          target_priority_score: 80,
          target_reentry_reason: 'material_change',
          target_capture_run_id: 'capture-run-a',
          target_correlation_id: 'correlation-a'
        }
      }
    ]);
  });

  it('preserves existing category, dedupe key and commission on offer recapture updates', async () => {
    const calls: Array<{ method: string; args: unknown[] }> = [];
    const repository = new SupabaseCapturePersistenceRepository({
      from: (table: string) => createOffersUpdateBuilder(table, calls)
    } as never);

    await repository.upsertOffer({
      workspaceId: 'workspace-a',
      actorUserId: 'admin-a',
      scoredOffer: createScoredOffer({
        dedupeKey: 'manual:external:new-id',
        commissionPercent: null
      }),
      existing: createPersistedOffer({
        id: 'offer-a',
        dedupeKey: 'manual:url:stable-url',
        commissionPercent: 9.5
      }),
      observedAt: '2026-06-26T11:00:00.000Z'
    });

    const updateCall = calls.find((call) => call.method === 'update');
    expect(updateCall?.args[0]).toMatchObject({
      dedupe_key: 'manual:url:stable-url',
      commission_percent: 9.5
    });
    expect(updateCall?.args[0]).not.toHaveProperty('category_id');
  });
});

function createOffersUpdateBuilder(
  table: string,
  calls: Array<{ method: string; args: unknown[] }>
) {
  expect(table).toBe('offers');
  const builder = {
    update(...args: unknown[]) {
      calls.push({ method: 'update', args });
      return builder;
    },
    eq(...args: unknown[]) {
      calls.push({ method: 'eq', args });
      return builder;
    },
    select(...args: unknown[]) {
      calls.push({ method: 'select', args });
      return builder;
    },
    async single() {
      calls.push({ method: 'single', args: [] });
      return {
        data: {
          id: 'offer-a',
          dedupe_key: 'manual:url:stable-url',
          affiliate_url: 'https://affiliate.example.test/a',
          current_price: 100,
          discount_percent: null,
          coupon_code: null,
          free_shipping: true,
          commission_percent: 9.5,
          last_seen_at: '2026-06-26T11:00:00.000Z'
        },
        error: null
      };
    }
  };
  return builder;
}

function createPersistedOffer(overrides: Partial<PersistedCaptureOffer> = {}): PersistedCaptureOffer {
  return {
    id: 'offer-a',
    dedupeKey: 'manual:external:old-id',
    affiliateUrl: 'https://affiliate.example.test/a',
    currentPrice: 100,
    discountPercent: null,
    couponCode: null,
    freeShipping: true,
    commissionPercent: 9.5,
    lastSeenAt: '2026-06-26T10:00:00.000Z',
    lastEditorialReviewAt: null,
    ...overrides
  };
}

function createScoredOffer(
  overrides: Partial<ScoredOffer['normalizedOffer']> = {}
): ScoredOffer {
  return {
    normalizedOffer: {
      contractVersion: 'capture-v1',
      workspaceId: 'workspace-a',
      sourceKey: 'manual',
      externalId: 'new-id',
      dedupeKey: 'manual:external:new-id',
      canonicalSourceUrl: 'https://example.test/a',
      sourceUrl: 'https://example.test/a',
      affiliateUrl: 'https://affiliate.example.test/a',
      title: 'Oferta teste',
      currentPrice: 100,
      currency: 'BRL',
      capturedAt: '2026-06-26T11:00:00.000Z',
      previousPrice: null,
      discountPercent: null,
      couponCode: null,
      freeShipping: true,
      commissionPercent: 9.5,
      ...overrides
    },
    score: 80,
    scoreVersion: 'capture-structure-v1',
    scoreFactors: {
      version: 'capture-structure-v1',
      factors: []
    },
    highlights: []
  };
}
