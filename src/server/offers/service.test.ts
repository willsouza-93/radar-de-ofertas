import { describe, expect, it } from 'vitest';

import { AppError } from './errors';
import {
  captureOfferManual,
  getOfferDetail,
  listOffers,
  updateOfferManual,
  type OfferRepository
} from './service';
import type {
  ActiveMembership,
  CategoryRecord,
  OfferDetail,
  OfferListFilters,
  OfferListItem,
  OfferRecord,
  PriceSnapshotRecord,
  TagRecord
} from './types';

const workspaceA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const workspaceB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const adminA = '10000000-0000-0000-0000-000000000001';
const editorA = '10000000-0000-0000-0000-000000000002';
const adminB = '10000000-0000-0000-0000-000000000004';
const noMembership = '10000000-0000-0000-0000-000000000005';
const categoryA = '20000000-0000-0000-0000-000000000003';
const tagA = '30000000-0000-0000-0000-000000000001';
const tagB = '30000000-0000-0000-0000-000000000002';

describe('offer service contracts', () => {
  it('captures a new offer as Admin and derives workspace server-side', async () => {
    const repo = createRepository();
    const result = await captureOfferManual(validCaptureInput(), context(repo, adminA));

    expect(result.created).toBe(true);
    expect(result.snapshotCreated).toBe(true);
    expect(result.offer.workspaceId).toBe(workspaceA);
    expect(result.offer.scoreVersion).toBe('mvp-v1');
    expect(repo.snapshots).toHaveLength(1);
    expect(repo.offerTags.get(result.offer.id)).toEqual(new Set([tagA, tagB]));
  });

  it('rejects workspaceId injection in public inputs', async () => {
    const repo = createRepository();

    await expect(
      captureOfferManual(
        { ...validCaptureInput(), workspaceId: workspaceB } as never,
        context(repo, adminA)
      )
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('blocks Editor from capture and update mutations', async () => {
    const repo = createRepository();

    await expect(captureOfferManual(validCaptureInput(), context(repo, editorA))).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
  });

  it('deduplicates equivalent tracked source URLs without using affiliate URL', async () => {
    const repo = createRepository();
    const first = await captureOfferManual(
      {
        ...validCaptureInput(),
        externalId: null,
        sourceUrl: 'https://www.example.com/produto?id=123&utm_source=ads',
        affiliateUrl: 'https://affiliate.example.com/a'
      },
      context(repo, adminA)
    );
    const second = await captureOfferManual(
      {
        ...validCaptureInput(),
        externalId: undefined,
        sourceUrl: 'https://example.com/produto/?id=123&fbclid=abc',
        affiliateUrl: 'https://affiliate.example.com/b'
      },
      context(repo, adminA)
    );

    expect(second.created).toBe(false);
    expect(second.updated).toBe(true);
    expect(second.offer.id).toBe(first.offer.id);
    expect(repo.offers).toHaveLength(1);
  });

  it('does not create a redundant snapshot when relevant price signals do not change', async () => {
    const repo = createRepository();
    await captureOfferManual(validCaptureInput(), context(repo, adminA));
    const second = await captureOfferManual(validCaptureInput(), context(repo, adminA));

    expect(second.snapshotCreated).toBe(false);
    expect(repo.snapshots).toHaveLength(1);
  });

  it('creates a snapshot when price changes', async () => {
    const repo = createRepository();
    await captureOfferManual(validCaptureInput(), context(repo, adminA));
    const second = await captureOfferManual(
      { ...validCaptureInput(), currentPrice: '89.90' },
      context(repo, adminA, '2026-06-17T11:00:00Z')
    );

    expect(second.snapshotCreated).toBe(true);
    expect(repo.snapshots).toHaveLength(2);
  });

  it('lists and details offers for Editor within the active workspace', async () => {
    const repo = createRepository();
    const captured = await captureOfferManual(validCaptureInput(), context(repo, adminA));

    const list = await listOffers({ minScore: 1 }, context(repo, editorA));
    const detail = await getOfferDetail({ offerId: captured.offer.id }, context(repo, editorA));

    expect(list.items).toHaveLength(1);
    expect(detail.offer.id).toBe(captured.offer.id);
  });

  it('does not leak offers across workspaces', async () => {
    const repo = createRepository();
    const captured = await captureOfferManual(validCaptureInput(), context(repo, adminA));

    await expect(getOfferDetail({ offerId: captured.offer.id }, context(repo, adminB))).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
  });

  it('updates an offer and physically replaces offer tag links', async () => {
    const repo = createRepository();
    const captured = await captureOfferManual(validCaptureInput(), context(repo, adminA));
    const updated = await updateOfferManual(
      {
        offerId: captured.offer.id,
        sourceUrl: 'https://example.com/produto?id=123',
        affiliateUrl: 'https://affiliate.example.com/produto',
        title: 'Fone Bluetooth atualizado',
        imageUrl: 'https://images.example.com/fone.jpg',
        categoryId: categoryA,
        tagIds: [tagA],
        currentPrice: '99.90',
        previousPrice: '149.90',
        couponCode: 'APP10',
        freeShipping: true,
        commissionPercent: '10'
      },
      context(repo, adminA)
    );

    expect(updated.updated).toBe(true);
    expect(repo.offerTags.get(captured.offer.id)).toEqual(new Set([tagA]));
  });

  it('blocks users without active membership', async () => {
    const repo = createRepository();

    await expect(listOffers({}, context(repo, noMembership))).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
  });
});

function validCaptureInput() {
  return {
    marketplace: 'mercado_livre' as const,
    externalId: 'MLB123',
    sourceUrl: 'https://example.com/produto?id=123&utm_source=ads',
    affiliateUrl: 'https://affiliate.example.com/produto',
    title: 'Fone Bluetooth',
    imageUrl: 'https://images.example.com/fone.jpg',
    categoryId: categoryA,
    tagIds: [tagA, tagB],
    currentPrice: '99.90',
    previousPrice: '149.90',
    couponCode: 'APP10',
    freeShipping: true,
    commissionPercent: '10',
    capturedAt: '2026-06-17T10:00:00Z'
  };
}

function context(repo: InMemoryOfferRepository, actorUserId: string, now = '2026-06-17T10:00:00Z') {
  return {
    actorUserId,
    repository: repo,
    now: () => new Date(now),
    createId: () => `40000000-0000-0000-0000-${String(repo.offers.length + 1).padStart(12, '0')}`
  };
}

class InMemoryOfferRepository implements OfferRepository {
  memberships: ActiveMembership[] = [
    { workspaceId: workspaceA, userId: adminA, role: 'admin', status: 'active' },
    { workspaceId: workspaceA, userId: editorA, role: 'editor', status: 'active' },
    { workspaceId: workspaceB, userId: adminB, role: 'admin', status: 'active' }
  ];

  categories: CategoryRecord[] = [
    {
      id: categoryA,
      workspaceId: workspaceA,
      name: 'Tecnologia',
      slug: 'tecnologia',
      color: '#2563EB',
      isActive: true
    }
  ];

  tags: TagRecord[] = [
    { id: tagA, workspaceId: workspaceA, name: 'Cupom', slug: 'cupom', color: null, isActive: true },
    {
      id: tagB,
      workspaceId: workspaceA,
      name: 'Frete gratis',
      slug: 'frete-gratis',
      color: null,
      isActive: true
    }
  ];

  offers: OfferRecord[] = [];
  snapshots: PriceSnapshotRecord[] = [];
  offerTags = new Map<string, Set<string>>();

  async listActiveMembershipsForUser(userId: string): Promise<ActiveMembership[]> {
    return this.memberships.filter((membership) => membership.userId === userId);
  }

  async getCategory(workspaceId: string, categoryId: string): Promise<CategoryRecord | null> {
    return this.categories.find((category) => category.workspaceId === workspaceId && category.id === categoryId) ?? null;
  }

  async getTags(workspaceId: string, tagIds: string[]): Promise<TagRecord[]> {
    return this.tags.filter((tag) => tag.workspaceId === workspaceId && tagIds.includes(tag.id));
  }

  async findOfferByDedupeKey(workspaceId: string, dedupeKey: string): Promise<OfferRecord | null> {
    return this.offers.find((offer) => offer.workspaceId === workspaceId && offer.dedupeKey === dedupeKey) ?? null;
  }

  async findOfferByExternalIdentity(
    workspaceId: string,
    marketplace: OfferRecord['marketplace'],
    externalId: string
  ): Promise<OfferRecord | null> {
    return (
      this.offers.find(
        (offer) =>
          offer.workspaceId === workspaceId &&
          offer.marketplace === marketplace &&
          offer.externalId === externalId
      ) ?? null
    );
  }

  async getOffer(workspaceId: string, offerId: string): Promise<OfferRecord | null> {
    return this.offers.find((offer) => offer.workspaceId === workspaceId && offer.id === offerId) ?? null;
  }

  async listPriceSnapshots(workspaceId: string, offerId: string): Promise<PriceSnapshotRecord[]> {
    return this.snapshots.filter(
      (snapshot) => snapshot.workspaceId === workspaceId && snapshot.offerId === offerId
    );
  }

  async createOffer(offer: OfferRecord): Promise<OfferRecord> {
    this.offers.push(offer);
    return offer;
  }

  async updateOffer(offerId: string, patch: OfferRecord): Promise<OfferRecord> {
    const index = this.offers.findIndex((offer) => offer.id === offerId);
    if (index === -1) throw new AppError('NOT_FOUND', 'Oferta nao encontrada.', 404);
    this.offers[index] = patch;
    return patch;
  }

  async replaceOfferTags(_workspaceId: string, offerId: string, tagIds: string[]): Promise<void> {
    this.offerTags.set(offerId, new Set(tagIds));
  }

  async createPriceSnapshot(snapshot: Omit<PriceSnapshotRecord, 'id'>): Promise<PriceSnapshotRecord> {
    const created = { ...snapshot, id: this.snapshots.length + 1 };
    this.snapshots.push(created);
    return created;
  }

  async listOffers(
    workspaceId: string,
    filters: OfferListFilters
  ): Promise<{ items: OfferListItem[]; nextCursor: string | null }> {
    const items = this.offers
      .filter((offer) => offer.workspaceId === workspaceId)
      .filter((offer) => (filters.minScore === undefined ? true : offer.score >= filters.minScore))
      .map((offer) => ({
        id: offer.id,
        title: offer.title,
        marketplace: offer.marketplace,
        category: null,
        currentPrice: offer.currentPrice,
        previousPrice: offer.previousPrice,
        discountPercent: offer.discountPercent,
        score: offer.score,
        highlights: offer.highlights,
        capturedAt: offer.capturedAt
      }));

    return { items, nextCursor: null };
  }

  async getOfferDetail(workspaceId: string, offerId: string): Promise<OfferDetail | null> {
    const offer = await this.getOffer(workspaceId, offerId);
    if (!offer) return null;

    const tagIds = this.offerTags.get(offer.id) ?? new Set<string>();
    return {
      offer,
      category: offer.categoryId ? await this.getCategory(workspaceId, offer.categoryId) : null,
      tags: this.tags.filter((tag) => tag.workspaceId === workspaceId && tagIds.has(tag.id)),
      priceSnapshots: await this.listPriceSnapshots(workspaceId, offer.id),
      publication: {
        approvalStatus: null,
        lastDecisionId: null,
        latestJob: null,
        latestAttempt: null
      }
    };
  }
}

function createRepository(): InMemoryOfferRepository {
  return new InMemoryOfferRepository();
}
