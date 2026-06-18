import type { OfferRecord, PriceSnapshotRecord, StructuredLogger } from '../offers/types';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalDecisionType = 'approved' | 'rejected';

export interface ApprovalQueueRecord {
  id: string;
  workspaceId: string;
  offerId: string;
  status: ApprovalStatus;
  priorityScore: number;
  lastDecisionId: string | null;
  lastReviewedBy: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalDecisionRecord {
  id: string;
  workspaceId: string;
  queueId: string;
  offerId: string;
  decision: ApprovalDecisionType;
  previousStatus: ApprovalStatus;
  nextStatus: ApprovalStatus;
  reason: string | null;
  decidedBy: string;
  decidedAt: string;
  createdAt: string;
}

export interface ReviewNoteRecord {
  id: string;
  workspaceId: string;
  queueId: string;
  offerId: string;
  body: string;
  createdBy: string;
  createdAt: string;
}

export interface ApprovalQueueFilters {
  status?: ApprovalStatus | undefined;
  q?: string | undefined;
  minScore?: number | undefined;
  marketplace?: OfferRecord['marketplace'] | undefined;
  categoryId?: string | undefined;
  cursor?: string | undefined;
  limit: number;
  sort: 'priority_desc' | 'updated_desc' | 'captured_desc';
}

export interface ApprovalQueueItem {
  queueId: string;
  offerId: string;
  status: ApprovalStatus;
  title: string;
  score: number;
  highlights: OfferRecord['highlights'];
  currentPrice: number;
  marketplace: OfferRecord['marketplace'];
  updatedAt: string;
}

export interface ApprovalDetail {
  queue: ApprovalQueueRecord;
  offer: OfferRecord;
  priceSnapshots: PriceSnapshotRecord[];
  notes: ReviewNoteRecord[];
  decisions: ApprovalDecisionRecord[];
  allowedActions: Array<'approve' | 'reject' | 'add_note'>;
}

export type ReviewHistoryItem =
  | {
      type: 'decision';
      decision: ApprovalDecisionType;
      reason: string | null;
      actor: { id: string; displayName: string | null };
      createdAt: string;
    }
  | {
      type: 'note';
      body: string;
      actor: { id: string; displayName: string | null };
      createdAt: string;
    };

export interface CurationLogger extends StructuredLogger {}
