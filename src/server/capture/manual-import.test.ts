import { describe, expect, it } from 'vitest';

import type { ActiveMembership } from '@/server/offers/types';

import {
  importManualOffers,
  type CapturePersistenceRepository,
  type PersistedCaptureOffer
} from './manual-import';
import type { ScoredOffer } from './types';

const adminMembership: ActiveMembership = {
  workspaceId: 'workspace-a',
  userId: 'admin-a',
  role: 'admin',
  status: 'active'
};

describe('importManualOffers', () => {
  it('captures, persists and creates a pending curation queue for new offers', async () => {
    const repository = new InMemoryCaptureRepository();

    const result = await importManualOffers(buildPayload(), buildContext(repository));

    expect(result.received).toBe(1);
    expect(result.processed).toBe(1);
    expect(result.persisted).toBe(1);
    expect(result.createdOffers).toBe(1);
    expect(result.snapshotsCreated).toBe(1);
    expect(result.queueCreated).toBe(1);
    expect(repository.queues).toHaveLength(1);
    expect(repository.queues[0]?.status).toBe('pending');
  });

  it('does not create a new editorial opportunity for same offer and same price while pending', async () => {
    const repository = new InMemoryCaptureRepository();
    await importManualOffers(buildPayload(), buildContext(repository));

    const result = await importManualOffers(buildPayload(), buildContext(repository));

    expect(result.persisted).toBe(1);
    expect(result.updatedOffers).toBe(1);
    expect(result.snapshotsCreated).toBe(0);
    expect(result.queueCreated).toBe(0);
    expect(result.queueSkipped).toBe(1);
    expect(repository.queues).toHaveLength(1);
  });

  it('allows editorial re-entry after the 24 hour cooldown', async () => {
    const repository = new InMemoryCaptureRepository();
    await importManualOffers(buildPayload(), buildContext(repository, '2026-06-26T10:00:00.000Z'));
    repository.queues[0] = {
      ...repository.queues[0]!,
      status: 'approved',
      lastReviewedAt: '2026-06-26T10:00:00.000Z'
    };

    const result = await importManualOffers(
      buildPayload(),
      buildContext(repository, '2026-06-27T10:01:00.000Z')
    );

    expect(result.queueReentered).toBe(1);
    expect(repository.queues[0]?.status).toBe('pending');
  });

  it('allows editorial re-entry on material price change before cooldown elapses', async () => {
    const repository = new InMemoryCaptureRepository();
    await importManualOffers(buildPayload(), buildContext(repository, '2026-06-26T10:00:00.000Z'));
    repository.queues[0] = {
      ...repository.queues[0]!,
      status: 'rejected',
      lastReviewedAt: '2026-06-26T10:00:00.000Z'
    };

    const result = await importManualOffers(
      buildPayload({ currentPrice: '3499.90' }),
      buildContext(repository, '2026-06-26T12:00:00.000Z')
    );

    expect(result.queueReentered).toBe(1);
    expect(result.snapshotsCreated).toBe(1);
  });

  it('keeps affiliate-less captures valid in the pipeline but blocks new offer persistence on current schema', async () => {
    const repository = new InMemoryCaptureRepository();

    const result = await importManualOffers(
      buildPayload({ affiliateUrl: null }),
      buildContext(repository)
    );

    expect(result.processed).toBe(1);
    expect(result.persisted).toBe(0);
    expect(result.failures).toEqual([
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('affiliateUrl')
      })
    ]);
  });
});

function buildPayload(overrides: Record<string, unknown> = {}) {
  return {
    records: [
      {
        title: 'Notebook Pro 14 16GB',
        sourceUrl: 'https://example.com/notebook-pro-14?utm_source=test',
        affiliateUrl: 'https://example.com/aff/notebook-pro-14',
        externalId: 'Notebook-Pro-14',
        currentPrice: '3999.90',
        previousPrice: '4599.90',
        freeShipping: true,
        commissionPercent: '8.5',
        sellerName: 'Loja Oficial',
        availability: 'in_stock',
        ...overrides
      }
    ]
  };
}

function buildContext(
  repository: InMemoryCaptureRepository,
  now = '2026-06-26T10:00:00.000Z'
) {
  return {
    actorUserId: adminMembership.userId,
    repository,
    now: () => new Date(now),
    createId: createIncrementalId()
  };
}

function createIncrementalId() {
  let index = 0;
  return () => {
    index += 1;
    return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  };
}

class InMemoryCaptureRepository implements CapturePersistenceRepository {
  offers: PersistedCaptureOffer[] = [];
  queues: Array<{
    id: string;
    offerId: string;
    status: 'pending' | 'approved' | 'rejected';
    lastReviewedAt: string | null;
  }> = [];
  snapshots: Array<{ offerId: string; observedAt: string }> = [];

  async listActiveMembershipsForUser(userId: string): Promise<ActiveMembership[]> {
    return userId === adminMembership.userId ? [adminMembership] : [];
  }

  async findOfferByDedupeKey(_workspaceId: string, dedupeKey: string) {
    return this.offers.find((offer) => offer.id === dedupeKey) ?? null;
  }

  async upsertOffer(input: {
    workspaceId: string;
    actorUserId: string;
    scoredOffer: ScoredOffer;
    existing: PersistedCaptureOffer | null;
    observedAt: string;
  }) {
    const normalized = input.scoredOffer.normalizedOffer;
    const offer: PersistedCaptureOffer = {
      id: normalized.dedupeKey,
      affiliateUrl: normalized.affiliateUrl ?? input.existing?.affiliateUrl ?? '',
      currentPrice: normalized.currentPrice,
      discountPercent: normalized.discountPercent ?? null,
      couponCode: normalized.couponCode ?? null,
      freeShipping: normalized.freeShipping ?? input.existing?.freeShipping ?? false,
      commissionPercent: normalized.commissionPercent ?? null,
      lastSeenAt: input.observedAt,
      lastEditorialReviewAt: null
    };

    const index = this.offers.findIndex((item) => item.id === offer.id);
    if (index >= 0) this.offers[index] = offer;
    else this.offers.push(offer);
    return offer;
  }

  async createPriceSnapshot(input: { offerId: string; observedAt: string }) {
    this.snapshots.push({ offerId: input.offerId, observedAt: input.observedAt });
    return true;
  }

  async getApprovalQueueState(_workspaceId: string, offerId: string) {
    const queue = this.queues.find((item) => item.offerId === offerId);
    return queue ? { id: queue.id, status: queue.status, lastReviewedAt: queue.lastReviewedAt } : null;
  }

  async createApprovalQueue(input: { offerId: string }) {
    const queue = {
      id: `queue-${this.queues.length + 1}`,
      offerId: input.offerId,
      status: 'pending' as const,
      lastReviewedAt: null
    };
    this.queues.push(queue);
    return { id: queue.id };
  }

  async reopenApprovalQueue(input: { offerId: string }) {
    const queue = this.queues.find((item) => item.offerId === input.offerId);
    if (!queue) throw new Error('Queue not found.');
    queue.status = 'pending';
    queue.lastReviewedAt = null;
    return { id: queue.id };
  }
}
