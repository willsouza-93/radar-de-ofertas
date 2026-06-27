import type { SupabaseServerClient } from '@/server/supabase/server';

import type { ActiveMembership, OfferHighlight } from '@/server/offers/types';

import type {
  CapturePersistenceRepository,
  PersistedCaptureOffer
} from './manual-import';
import type { ScoredOffer } from './types';

type MembershipRow = {
  workspace_id: string;
  user_id: string;
  role: 'admin' | 'editor';
  status: 'active' | 'suspended' | 'invited';
};

type OfferRow = {
  id: string;
  affiliate_url: string;
  current_price: number | string;
  discount_percent: number | string | null;
  coupon_code: string | null;
  free_shipping: boolean;
  commission_percent: number | string | null;
  last_seen_at: string;
};

type QueueRow = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  last_reviewed_at: string | null;
};

type SubmitCaptureForReviewRow = {
  queue_id: string;
  action: 'created' | 'already_pending' | 'reopened' | 'not_reentered';
};

export class SupabaseCapturePersistenceRepository implements CapturePersistenceRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listActiveMembershipsForUser(userId: string): Promise<ActiveMembership[]> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select('workspace_id, user_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw new Error(error.message);

    return ((data ?? []) as MembershipRow[]).map((row) => ({
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role,
      status: 'active'
    }));
  }

  async findOfferByDedupeKey(
    workspaceId: string,
    dedupeKey: string
  ): Promise<PersistedCaptureOffer | null> {
    const { data, error } = await this.supabase
      .from('offers')
      .select('id, affiliate_url, current_price, discount_percent, coupon_code, free_shipping, commission_percent, last_seen_at')
      .eq('workspace_id', workspaceId)
      .eq('dedupe_key', dedupeKey)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapPersistedOffer(data as OfferRow) : null;
  }

  async upsertOffer(input: {
    workspaceId: string;
    actorUserId: string;
    scoredOffer: ScoredOffer;
    existing: PersistedCaptureOffer | null;
    observedAt: string;
  }): Promise<PersistedCaptureOffer> {
    const offer = input.scoredOffer.normalizedOffer;
    const base = {
      workspace_id: input.workspaceId,
      marketplace: 'manual',
      external_id: offer.externalId,
      dedupe_key: offer.dedupeKey,
      source_url: offer.sourceUrl,
      affiliate_url: offer.affiliateUrl ?? input.existing?.affiliateUrl,
      title: offer.title,
      image_url: offer.imageUrl ?? null,
      category_id: null,
      current_price: offer.currentPrice,
      previous_price: offer.previousPrice ?? null,
      currency: offer.currency,
      discount_percent: offer.discountPercent ?? null,
      coupon_code: offer.couponCode ?? null,
      free_shipping: offer.freeShipping ?? input.existing?.freeShipping ?? false,
      commission_percent: offer.commissionPercent ?? null,
      score: input.scoredOffer.score,
      score_version: input.scoredOffer.scoreVersion,
      score_factors: input.scoredOffer.scoreFactors,
      highlights: input.scoredOffer.highlights as OfferHighlight[],
      status: 'captured',
      last_seen_at: input.observedAt,
      updated_by: input.actorUserId
    };

    const query = input.existing
      ? this.supabase
          .from('offers')
          .update(base)
          .eq('workspace_id', input.workspaceId)
          .eq('id', input.existing.id)
          .select('id, affiliate_url, current_price, discount_percent, coupon_code, free_shipping, commission_percent, last_seen_at')
          .single()
      : this.supabase
          .from('offers')
          .insert({
            ...base,
            captured_at: input.observedAt,
            created_by: input.actorUserId,
            created_at: input.observedAt
          })
          .select('id, affiliate_url, current_price, discount_percent, coupon_code, free_shipping, commission_percent, last_seen_at')
          .single();

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return mapPersistedOffer(data as OfferRow);
  }

  async createPriceSnapshot(input: {
    workspaceId: string;
    offerId: string;
    scoredOffer: ScoredOffer;
    observedAt: string;
  }): Promise<boolean> {
    const offer = input.scoredOffer.normalizedOffer;
    const { error } = await this.supabase.from('price_snapshots').insert({
      workspace_id: input.workspaceId,
      offer_id: input.offerId,
      price: offer.currentPrice,
      previous_price: offer.previousPrice ?? null,
      discount_percent: offer.discountPercent ?? null,
      coupon_code: offer.couponCode ?? null,
      free_shipping: offer.freeShipping ?? false,
      observed_at: input.observedAt
    });

    if (!error) return true;
    if (error.code === '23505') return false;
    throw new Error(error.message);
  }

  async getApprovalQueueState(
    workspaceId: string,
    offerId: string
  ): Promise<{ id: string; status: 'pending' | 'approved' | 'rejected'; lastReviewedAt: string | null } | null> {
    const { data, error } = await this.supabase
      .from('approval_queue')
      .select('id, status, last_reviewed_at')
      .eq('workspace_id', workspaceId)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as QueueRow;
    return { id: row.id, status: row.status, lastReviewedAt: row.last_reviewed_at };
  }

  async createApprovalQueue(input: {
    workspaceId: string;
    offerId: string;
    priorityScore: number;
    reentryReason: string;
    captureRunId: string;
    correlationId: string;
  }): Promise<{ id: string }> {
    return this.submitCaptureForReview(input);
  }

  async reopenApprovalQueue(input: {
    workspaceId: string;
    offerId: string;
    priorityScore: number;
    reentryReason: string;
    captureRunId: string;
    correlationId: string;
  }): Promise<{ id: string }> {
    return this.submitCaptureForReview(input);
  }

  private async submitCaptureForReview(input: {
    workspaceId: string;
    offerId: string;
    priorityScore: number;
    reentryReason: string;
    captureRunId: string;
    correlationId: string;
  }): Promise<{ id: string }> {
    void input.workspaceId;
    const { data, error } = await this.supabase.rpc('submit_capture_for_review', {
      target_offer_id: input.offerId,
      target_priority_score: input.priorityScore,
      target_reentry_reason: input.reentryReason,
      target_capture_run_id: input.captureRunId,
      target_correlation_id: input.correlationId
    });

    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] as SubmitCaptureForReviewRow | undefined : undefined;
    if (!row) throw new Error('RPC submit_capture_for_review nao retornou fila.');
    if (row.action === 'not_reentered') {
      throw new Error('Oferta nao atende criterios de reentrada editorial.');
    }
    return { id: row.queue_id };
  }
}

function mapPersistedOffer(row: OfferRow): PersistedCaptureOffer {
  return {
    id: row.id,
    affiliateUrl: row.affiliate_url,
    currentPrice: toNumber(row.current_price),
    discountPercent: row.discount_percent === null ? null : toNumber(row.discount_percent),
    couponCode: row.coupon_code,
    freeShipping: row.free_shipping,
    commissionPercent: row.commission_percent === null ? null : toNumber(row.commission_percent),
    lastSeenAt: row.last_seen_at,
    lastEditorialReviewAt: null
  };
}

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}
