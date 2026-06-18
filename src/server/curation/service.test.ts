import { describe, expect, it } from 'vitest';

import { AppError } from '../offers/errors';
import type { ActiveMembership, OfferRecord, PriceSnapshotRecord } from '../offers/types';
import {
  addReviewNote,
  approveOffer,
  getApprovalDetail,
  listApprovalQueue,
  listReviewHistory,
  rejectOffer,
  type CurationRepository
} from './service';
import type {
  ApprovalDecisionRecord,
  ApprovalDetail,
  ApprovalQueueFilters,
  ApprovalQueueItem,
  ApprovalQueueRecord,
  ReviewHistoryItem,
  ReviewNoteRecord
} from './types';

const workspaceA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const workspaceB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const adminA = '10000000-0000-0000-0000-000000000001';
const editorA = '10000000-0000-0000-0000-000000000002';
const suspendedA = '10000000-0000-0000-0000-000000000003';
const adminB = '10000000-0000-0000-0000-000000000004';
const noMembership = '10000000-0000-0000-0000-000000000005';
const pendingQueueA = '50000000-0000-0000-0000-000000000001';
const approvedQueueA = '50000000-0000-0000-0000-000000000002';
const rejectedQueueA = '50000000-0000-0000-0000-000000000003';
const pendingQueueB = '50000000-0000-0000-0000-000000000101';
const offerA1 = '40000000-0000-0000-0000-000000000001';
const offerA2 = '40000000-0000-0000-0000-000000000002';
const offerA3 = '40000000-0000-0000-0000-000000000003';
const offerB1 = '40000000-0000-0000-0000-000000000101';

describe('curation service contracts', () => {
  it('lists approval queue for Editor within the active workspace', async () => {
    const repo = createRepository();
    const result = await listApprovalQueue({ status: 'pending' }, context(repo, editorA));

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.queueId).toBe(pendingQueueA);
    expect(result.items[0]?.status).toBe('pending');
  });

  it('rejects workspaceId injection in public inputs', async () => {
    const repo = createRepository();

    await expect(
      listApprovalQueue({ workspaceId: workspaceB } as never, context(repo, adminA))
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('gets approval detail by queueId or offerId without leaking another workspace', async () => {
    const repo = createRepository();
    const byQueue = await getApprovalDetail({ queueId: pendingQueueA }, context(repo, adminA));
    const byOffer = await getApprovalDetail({ offerId: offerA1 }, context(repo, editorA));

    expect(byQueue.queue.id).toBe(pendingQueueA);
    expect(byOffer.queue.id).toBe(pendingQueueA);
    await expect(getApprovalDetail({ queueId: pendingQueueA }, context(repo, adminB))).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
  });

  it('approves a pending offer as Admin and records history', async () => {
    const repo = createRepository();
    const result = await approveOffer(
      {
        queueId: pendingQueueA,
        expectedStatus: 'pending',
        note: 'Oferta revisada e aprovada.'
      },
      context(repo, adminA)
    );

    const queue = await repo.getApprovalQueue(workspaceA, pendingQueueA);
    expect(result.status).toBe('approved');
    expect(queue?.status).toBe('approved');
    expect(repo.decisions).toHaveLength(3);
    expect(repo.notes.at(-1)?.body).toBe('Oferta revisada e aprovada.');
  });

  it('rejects a pending offer as Editor and requires a reason', async () => {
    const repo = createRepository();
    const result = await rejectOffer(
      {
        queueId: pendingQueueA,
        expectedStatus: 'pending',
        reason: 'Preco subiu antes da publicacao.'
      },
      context(repo, editorA)
    );

    const queue = await repo.getApprovalQueue(workspaceA, pendingQueueA);
    expect(result.status).toBe('rejected');
    expect(queue?.status).toBe('rejected');
    expect(repo.decisions.at(-1)?.reason).toBe('Preco subiu antes da publicacao.');
  });

  it('blocks approve twice and reject twice through expectedStatus conflict', async () => {
    const repo = createRepository();

    await expect(
      approveOffer({ queueId: approvedQueueA, expectedStatus: 'pending' }, context(repo, adminA))
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });

    await expect(
      rejectOffer(
        {
          queueId: rejectedQueueA,
          expectedStatus: 'pending',
          reason: 'Tentativa repetida.'
        },
        context(repo, editorA)
      )
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
  });

  it('keeps addReviewNote append-only and does not change queue status', async () => {
    const repo = createRepository();
    const result = await addReviewNote(
      { queueId: pendingQueueA, body: 'Cupom conferido manualmente.' },
      context(repo, editorA)
    );
    const queue = await repo.getApprovalQueue(workspaceA, pendingQueueA);

    expect(result.queueStatus).toBe('pending');
    expect(queue?.status).toBe('pending');
    expect(repo.notes.at(-1)?.body).toBe('Cupom conferido manualmente.');
    expect('updateReviewNote' in repo).toBe(false);
    expect('deleteReviewNote' in repo).toBe(false);
  });

  it('blocks notes on terminal queues', async () => {
    const repo = createRepository();

    await expect(
      addReviewNote({ queueId: approvedQueueA, body: 'Tentativa tardia.' }, context(repo, adminA))
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('lists review history in chronological order', async () => {
    const repo = createRepository();
    const history = await listReviewHistory({ queueId: approvedQueueA }, context(repo, adminA));

    expect(history.items.map((item) => item.type)).toEqual(['note', 'decision']);
    const first = history.items[0];
    const second = history.items[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first!.createdAt < second!.createdAt).toBe(true);
  });

  it('blocks suspended users, users without membership and other workspaces', async () => {
    const repo = createRepository();

    await expect(listApprovalQueue({}, context(repo, suspendedA))).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
    await expect(listApprovalQueue({}, context(repo, noMembership))).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
    await expect(addReviewNote({ queueId: pendingQueueA, body: 'Vazamento?' }, context(repo, adminB))).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
  });
});

function context(
  repo: InMemoryCurationRepository,
  actorUserId: string,
  now = '2026-06-18T12:00:00Z'
) {
  return {
    actorUserId,
    repository: repo,
    now: () => new Date(now),
    createId: () => repo.nextId()
  };
}

class InMemoryCurationRepository implements CurationRepository {
  private idCounter = 900;

  memberships: ActiveMembership[] = [
    { workspaceId: workspaceA, userId: adminA, role: 'admin', status: 'active' },
    { workspaceId: workspaceA, userId: editorA, role: 'editor', status: 'active' },
    { workspaceId: workspaceB, userId: adminB, role: 'admin', status: 'active' }
  ];

  offers: OfferRecord[] = [
    buildOffer(offerA1, workspaceA, 'Fone Bluetooth', 82),
    buildOffer(offerA2, workspaceA, 'Cafeteira compacta', 11),
    buildOffer(offerA3, workspaceA, 'Mouse gamer RGB', 25),
    buildOffer(offerB1, workspaceB, 'Oferta isolada Workspace B', 72)
  ];

  queues: ApprovalQueueRecord[] = [
    buildQueue(pendingQueueA, workspaceA, offerA1, 'pending', 82),
    buildQueue(approvedQueueA, workspaceA, offerA2, 'approved', 11, adminA, '2026-06-18T10:30:00Z'),
    buildQueue(rejectedQueueA, workspaceA, offerA3, 'rejected', 25, editorA, '2026-06-18T11:30:00Z'),
    buildQueue(pendingQueueB, workspaceB, offerB1, 'pending', 72)
  ];

  decisions: ApprovalDecisionRecord[] = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      workspaceId: workspaceA,
      queueId: approvedQueueA,
      offerId: offerA2,
      decision: 'approved',
      previousStatus: 'pending',
      nextStatus: 'approved',
      reason: null,
      decidedBy: adminA,
      decidedAt: '2026-06-18T10:30:00Z',
      createdAt: '2026-06-18T10:30:00Z'
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      workspaceId: workspaceA,
      queueId: rejectedQueueA,
      offerId: offerA3,
      decision: 'rejected',
      previousStatus: 'pending',
      nextStatus: 'rejected',
      reason: 'Preco subiu antes da revisao.',
      decidedBy: editorA,
      decidedAt: '2026-06-18T11:30:00Z',
      createdAt: '2026-06-18T11:30:00Z'
    }
  ];

  notes: ReviewNoteRecord[] = [
    {
      id: '70000000-0000-0000-0000-000000000002',
      workspaceId: workspaceA,
      queueId: approvedQueueA,
      offerId: offerA2,
      body: 'Aprovada como teste de historico local.',
      createdBy: adminA,
      createdAt: '2026-06-18T10:20:00Z'
    }
  ];

  nextId(): string {
    this.idCounter += 1;
    return `90000000-0000-0000-0000-${String(this.idCounter).padStart(12, '0')}`;
  }

  async listActiveMembershipsForUser(userId: string): Promise<ActiveMembership[]> {
    return this.memberships.filter((membership) => membership.userId === userId);
  }

  async getApprovalQueue(workspaceId: string, queueId: string): Promise<ApprovalQueueRecord | null> {
    return this.queues.find((queue) => queue.workspaceId === workspaceId && queue.id === queueId) ?? null;
  }

  async getApprovalDetailByQueueId(workspaceId: string, queueId: string): Promise<ApprovalDetail | null> {
    const queue = await this.getApprovalQueue(workspaceId, queueId);
    return queue ? this.buildDetail(queue) : null;
  }

  async getApprovalDetailByOfferId(workspaceId: string, offerId: string): Promise<ApprovalDetail | null> {
    const queue = this.queues.find((item) => item.workspaceId === workspaceId && item.offerId === offerId);
    return queue ? this.buildDetail(queue) : null;
  }

  async listApprovalQueue(
    workspaceId: string,
    filters: ApprovalQueueFilters
  ): Promise<{ items: ApprovalQueueItem[]; nextCursor: string | null }> {
    const items = this.queues
      .filter((queue) => queue.workspaceId === workspaceId)
      .filter((queue) => (filters.status ? queue.status === filters.status : true))
      .map((queue) => {
        const offer = this.offers.find((item) => item.id === queue.offerId);
        if (!offer) throw new AppError('NOT_FOUND', 'Oferta nao encontrada.', 404);
        return {
          queueId: queue.id,
          offerId: queue.offerId,
          status: queue.status,
          title: offer.title,
          score: offer.score,
          highlights: offer.highlights,
          currentPrice: offer.currentPrice,
          marketplace: offer.marketplace,
          updatedAt: queue.updatedAt
        };
      });

    return { items, nextCursor: null };
  }

  async applyApprovalDecision(input: {
    decision: ApprovalDecisionRecord;
    note: ReviewNoteRecord | null;
  }): Promise<{ queue: ApprovalQueueRecord; decision: ApprovalDecisionRecord; note: ReviewNoteRecord | null }> {
    const queueIndex = this.queues.findIndex(
      (queue) =>
        queue.workspaceId === input.decision.workspaceId &&
        queue.id === input.decision.queueId &&
        queue.status === input.decision.previousStatus
    );
    if (queueIndex === -1) {
      throw new AppError(
        'VERSION_CONFLICT',
        'A oferta foi alterada por outra acao. Recarregue antes de continuar.',
        409
      );
    }

    this.decisions.push(input.decision);
    if (input.note) this.notes.push(input.note);

    const current = this.queues[queueIndex]!;
    const updated: ApprovalQueueRecord = {
      ...current,
      status: input.decision.nextStatus,
      lastDecisionId: input.decision.id,
      lastReviewedBy: input.decision.decidedBy,
      lastReviewedAt: input.decision.decidedAt,
      updatedAt: input.decision.decidedAt
    };
    this.queues[queueIndex] = updated;
    return { queue: updated, decision: input.decision, note: input.note };
  }

  async createReviewNote(note: ReviewNoteRecord): Promise<ReviewNoteRecord> {
    this.notes.push(note);
    return note;
  }

  async listReviewHistory(
    workspaceId: string,
    queueId: string,
    _options: { cursor?: string | undefined; limit: number }
  ): Promise<{ items: ReviewHistoryItem[]; nextCursor: string | null }> {
    const decisions: ReviewHistoryItem[] = this.decisions
      .filter((decision) => decision.workspaceId === workspaceId && decision.queueId === queueId)
      .map((decision) => ({
        type: 'decision' as const,
        decision: decision.decision,
        reason: decision.reason,
        actor: { id: decision.decidedBy, displayName: null },
        createdAt: decision.decidedAt
      }));
    const notes: ReviewHistoryItem[] = this.notes
      .filter((note) => note.workspaceId === workspaceId && note.queueId === queueId)
      .map((note) => ({
        type: 'note' as const,
        body: note.body,
        actor: { id: note.createdBy, displayName: null },
        createdAt: note.createdAt
      }));

    return {
      items: [...decisions, ...notes].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
      nextCursor: null
    };
  }

  private buildDetail(queue: ApprovalQueueRecord): ApprovalDetail {
    const offer = this.offers.find((item) => item.workspaceId === queue.workspaceId && item.id === queue.offerId);
    if (!offer) throw new AppError('NOT_FOUND', 'Oferta nao encontrada.', 404);
    return {
      queue,
      offer,
      priceSnapshots: [] satisfies PriceSnapshotRecord[],
      notes: this.notes.filter((note) => note.workspaceId === queue.workspaceId && note.queueId === queue.id),
      decisions: this.decisions.filter(
        (decision) => decision.workspaceId === queue.workspaceId && decision.queueId === queue.id
      ),
      allowedActions: queue.status === 'pending' ? ['approve', 'reject', 'add_note'] : []
    };
  }
}

function buildQueue(
  id: string,
  workspaceId: string,
  offerId: string,
  status: ApprovalQueueRecord['status'],
  priorityScore: number,
  lastReviewedBy: string | null = null,
  lastReviewedAt: string | null = null
): ApprovalQueueRecord {
  return {
    id,
    workspaceId,
    offerId,
    status,
    priorityScore,
    lastDecisionId: null,
    lastReviewedBy,
    lastReviewedAt,
    createdAt: '2026-06-18T09:00:00Z',
    updatedAt: lastReviewedAt ?? '2026-06-18T09:00:00Z'
  };
}

function buildOffer(id: string, workspaceId: string, title: string, score: number): OfferRecord {
  return {
    id,
    workspaceId,
    marketplace: 'manual',
    externalId: id,
    dedupeKey: `manual:external:${id}`,
    sourceUrl: `https://example.test/${id}`,
    affiliateUrl: `https://affiliate.example.test/${id}`,
    title,
    imageUrl: null,
    categoryId: null,
    currentPrice: 99.9,
    previousPrice: null,
    currency: 'BRL',
    discountPercent: null,
    couponCode: null,
    freeShipping: false,
    commissionPercent: null,
    score,
    scoreVersion: 'mvp-v1',
    scoreFactors: {
      version: 'mvp-v1',
      discount: { points: 0, max: 35, reason: 'fixture' },
      priceHistory: { points: 0, max: 30, reason: 'fixture' },
      commission: { points: 0, max: 20, reason: 'fixture' },
      completeness: { points: 15, max: 15, reason: 'fixture' }
    },
    highlights: [],
    status: 'captured',
    capturedAt: '2026-06-18T09:00:00Z',
    lastSeenAt: '2026-06-18T09:00:00Z',
    createdBy: adminA,
    updatedBy: adminA,
    createdAt: '2026-06-18T09:00:00Z',
    updatedAt: '2026-06-18T09:00:00Z'
  };
}

function createRepository(): InMemoryCurationRepository {
  return new InMemoryCurationRepository();
}
