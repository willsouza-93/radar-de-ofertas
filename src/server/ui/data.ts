import 'server-only';

import { notFound } from 'next/navigation';

import { createSupabaseServerClient } from '@/server/supabase/server';
import type { ApprovalStatus, ReviewHistoryItem } from '@/server/curation/types';
import type {
  OfferDetail,
  OfferHighlight,
  OfferListItem,
  OfferMarketplace,
  PriceSnapshotRecord
} from '@/server/offers/types';
import type { ListApprovalQueueInput } from '@/server/curation/schemas';
import type { ListOffersInput } from '@/server/offers/schemas';
import type { AuthenticatedBackofficeSession } from '@/server/ui/session';

type SupabaseQueryClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type OfferRow = {
  id: string;
  marketplace: OfferMarketplace;
  source_url: string;
  affiliate_url: string;
  title: string;
  image_url: string | null;
  category_id: string | null;
  current_price: number | string;
  previous_price: number | string | null;
  currency: 'BRL';
  discount_percent: number | string | null;
  coupon_code: string | null;
  free_shipping: boolean;
  commission_percent: number | string | null;
  score: number;
  score_version: string;
  score_factors: unknown;
  highlights: OfferHighlight[];
  status: 'captured';
  captured_at: string;
  last_seen_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  categories?: CategoryRow | CategoryRow[] | null;
};

type CategoryRow = { id: string; name: string; slug?: string; color: string; is_active?: boolean };
type TagRow = { id: string; name: string; slug?: string; color: string | null; is_active?: boolean };

type QueueRow = {
  id: string;
  offer_id: string;
  status: ApprovalStatus;
  priority_score: number;
  last_decision_id: string | null;
  last_reviewed_by: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  offers?: OfferRow | OfferRow[] | null;
};

type NoteRow = {
  id: string;
  queue_id: string;
  offer_id: string;
  body: string;
  created_by: string;
  created_at: string;
  profiles?: { display_name: string | null } | { display_name: string | null }[] | null;
};

type DecisionRow = {
  id: string;
  queue_id: string;
  offer_id: string;
  decision: 'approved' | 'rejected';
  previous_status: ApprovalStatus;
  next_status: ApprovalStatus;
  reason: string | null;
  decided_by: string;
  decided_at: string;
  created_at: string;
  profiles?: { display_name: string | null } | { display_name: string | null }[] | null;
};

export async function getDashboardData(session: AuthenticatedBackofficeSession) {
  const [pending, topOffers] = await Promise.all([
    listApprovalQueueData(session, { status: 'pending', limit: 5 }),
    listOffersData(session, { sort: 'score_desc', limit: 5 })
  ]);

  return { pending: pending.items, topOffers: topOffers.items };
}

export async function listOfferFilterOptions(session: AuthenticatedBackofficeSession) {
  const supabase = await requireSupabase();
  const [categoriesResult, tagsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, color')
      .eq('workspace_id', session.workspace.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('tags')
      .select('id, name, color')
      .eq('workspace_id', session.workspace.id)
      .eq('is_active', true)
      .order('name', { ascending: true })
  ]);

  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (tagsResult.error) throw new Error(tagsResult.error.message);

  return {
    categories: uniqueFilterOptionsByName(
      (categoriesResult.data ?? []) as Array<{ id: string; name: string; color: string }>
    ),
    tags: uniqueFilterOptionsByName(
      (tagsResult.data ?? []) as Array<{ id: string; name: string; color: string | null }>
    )
  };
}

export async function listOffersData(
  session: AuthenticatedBackofficeSession,
  filters: ListOffersInput
): Promise<{ items: OfferListItem[]; nextCursor: string | null }> {
  const supabase = await requireSupabase();
  const limit = filters.limit ?? 30;
  const offset = parseCursor(filters.cursor);
  const matchingCategoryIds = filters.categoryId
    ? await getCategoryIdsBySameName(supabase, session.workspace.id, filters.categoryId)
    : null;
  const matchingOfferIds = filters.tagId
    ? await getOfferIdsByTag(supabase, session.workspace.id, filters.tagId)
    : null;

  let query = supabase
    .from('offers')
    .select('id, marketplace, title, current_price, previous_price, discount_percent, score, highlights, captured_at, categories(id, name, color)')
    .eq('workspace_id', session.workspace.id);

  if (filters.q) query = query.ilike('title', `%${filters.q}%`);
  if (filters.marketplace) query = query.eq('marketplace', filters.marketplace);
  if (matchingCategoryIds) query = matchingCategoryIds.length > 0 ? query.in('category_id', matchingCategoryIds) : query.eq('category_id', '00000000-0000-0000-0000-000000000000');
  if (filters.minScore !== undefined) query = query.gte('score', filters.minScore);
  if (filters.minDiscount !== undefined) query = query.gte('discount_percent', filters.minDiscount);
  if (filters.from) query = query.gte('captured_at', filters.from);
  if (filters.to) query = query.lte('captured_at', filters.to);
  if (matchingOfferIds) query = matchingOfferIds.length > 0 ? query.in('id', matchingOfferIds) : query.eq('id', '00000000-0000-0000-0000-000000000000');

  if (filters.sort === 'captured_desc') query = query.order('captured_at', { ascending: false });
  else if (filters.sort === 'discount_desc') query = query.order('discount_percent', { ascending: false, nullsFirst: false });
  else query = query.order('score', { ascending: false }).order('captured_at', { ascending: false });

  const { data, error } = await query.range(offset, offset + limit);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as OfferRow[];
  const pageRows = rows.slice(0, limit);

  return {
    items: pageRows.map(mapOfferListItem),
    nextCursor: rows.length > limit ? String(offset + limit) : null
  };
}

export async function getOfferDetailData(
  session: AuthenticatedBackofficeSession,
  offerId: string
): Promise<OfferDetail> {
  const supabase = await requireSupabase();
  const { data: offerData, error: offerError } = await supabase
    .from('offers')
    .select('*, categories(id, name, slug, color, is_active)')
    .eq('workspace_id', session.workspace.id)
    .eq('id', offerId)
    .maybeSingle();

  if (offerError) throw new Error(offerError.message);
  if (!offerData) notFound();

  const [tagsResult, snapshotsResult] = await Promise.all([
    supabase
      .from('offer_tags')
      .select('tags(id, name, slug, color, is_active)')
      .eq('workspace_id', session.workspace.id)
      .eq('offer_id', offerId),
    supabase
      .from('price_snapshots')
      .select('id, workspace_id, offer_id, price, previous_price, discount_percent, coupon_code, free_shipping, observed_at')
      .eq('workspace_id', session.workspace.id)
      .eq('offer_id', offerId)
      .order('observed_at', { ascending: false })
  ]);

  if (tagsResult.error) throw new Error(tagsResult.error.message);
  if (snapshotsResult.error) throw new Error(snapshotsResult.error.message);

  const offer = offerData as OfferRow;
  const category = singleRelation(offer.categories);

  return {
    offer: mapOfferRecord(offer, session.workspace.id),
    category: category
      ? {
          id: category.id,
          workspaceId: session.workspace.id,
          name: category.name,
          slug: category.slug ?? category.name.toLowerCase(),
          color: category.color,
          isActive: category.is_active ?? true
        }
      : null,
    tags: ((tagsResult.data ?? []) as Array<{ tags: TagRow | TagRow[] | null }>)
      .map((row) => singleRelation(row.tags))
      .filter((tag): tag is TagRow => Boolean(tag))
      .map((tag) => ({
        id: tag.id,
        workspaceId: session.workspace.id,
        name: tag.name,
        slug: tag.slug ?? tag.name.toLowerCase(),
        color: tag.color,
        isActive: tag.is_active ?? true
      })),
    priceSnapshots: ((snapshotsResult.data ?? []) as Array<{
      id: number;
      workspace_id: string;
      offer_id: string;
      price: number | string;
      previous_price: number | string | null;
      discount_percent: number | string | null;
      coupon_code: string | null;
      free_shipping: boolean;
      observed_at: string;
    }>).map(mapSnapshot)
  };
}

export async function listApprovalQueueData(
  session: AuthenticatedBackofficeSession,
  filters: ListApprovalQueueInput
) {
  const supabase = await requireSupabase();
  const limit = filters.limit ?? 30;
  const offset = parseCursor(filters.cursor);
  const matchingCategoryIds = filters.categoryId
    ? await getCategoryIdsBySameName(supabase, session.workspace.id, filters.categoryId)
    : null;
  const hasOfferFilters =
    Boolean(filters.q) ||
    Boolean(filters.marketplace) ||
    Boolean(filters.categoryId) ||
    filters.minScore !== undefined;
  const offerRelation = hasOfferFilters ? 'offers!inner' : 'offers';

  let query = supabase
    .from('approval_queue')
    .select(`id, offer_id, status, priority_score, updated_at, ${offerRelation}(id, marketplace, title, current_price, score, highlights, category_id, captured_at)`)
    .eq('workspace_id', session.workspace.id);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.q) query = query.ilike('offers.title', `%${filters.q}%`);
  if (filters.marketplace) query = query.eq('offers.marketplace', filters.marketplace);
  if (matchingCategoryIds) query = matchingCategoryIds.length > 0 ? query.in('offers.category_id', matchingCategoryIds) : query.eq('offers.category_id', '00000000-0000-0000-0000-000000000000');
  if (filters.minScore !== undefined) query = query.gte('offers.score', filters.minScore);

  if (filters.sort === 'updated_desc') query = query.order('updated_at', { ascending: false });
  else if (filters.sort === 'captured_desc') query = query.order('created_at', { ascending: false });
  else query = query.order('priority_score', { ascending: false }).order('created_at', { ascending: false });

  const { data, error } = await query.range(offset, offset + limit);
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as QueueRow[]).filter((row) => Boolean(singleRelation(row.offers)));
  const pageRows = rows.slice(0, limit);

  return {
    items: pageRows.map((row) => {
      const offer = singleRelation(row.offers);
      if (!offer) throw new Error('Curadoria sem oferta associada.');
      return {
        queueId: row.id,
        offerId: row.offer_id,
        status: row.status,
        title: offer.title,
        score: offer.score,
        highlights: offer.highlights,
        currentPrice: toNumber(offer.current_price),
        marketplace: offer.marketplace,
        updatedAt: row.updated_at
      };
    }),
    nextCursor: rows.length > limit ? String(offset + limit) : null
  };
}

export async function countPendingApprovals(session: AuthenticatedBackofficeSession): Promise<number> {
  const supabase = await requireSupabase();
  const { count, error } = await supabase
    .from('approval_queue')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', session.workspace.id)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getApprovalDetailData(session: AuthenticatedBackofficeSession, queueId: string) {
  const supabase = await requireSupabase();
  const { data: queueData, error: queueError } = await supabase
    .from('approval_queue')
    .select('*, offers(*)')
    .eq('workspace_id', session.workspace.id)
    .eq('id', queueId)
    .maybeSingle();

  if (queueError) throw new Error(queueError.message);
  if (!queueData) notFound();

  const queue = queueData as QueueRow;
  const offer = singleRelation(queue.offers);
  if (!offer) notFound();

  const [snapshotsResult, notesResult, decisionsResult] = await Promise.all([
    supabase
      .from('price_snapshots')
      .select('id, workspace_id, offer_id, price, previous_price, discount_percent, coupon_code, free_shipping, observed_at')
      .eq('workspace_id', session.workspace.id)
      .eq('offer_id', queue.offer_id)
      .order('observed_at', { ascending: false }),
    supabase
      .from('review_notes')
      .select('id, queue_id, offer_id, body, created_by, created_at, profiles(display_name)')
      .eq('workspace_id', session.workspace.id)
      .eq('queue_id', queue.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('approval_decisions')
      .select('id, queue_id, offer_id, decision, previous_status, next_status, reason, decided_by, decided_at, created_at, profiles(display_name)')
      .eq('workspace_id', session.workspace.id)
      .eq('queue_id', queue.id)
      .order('decided_at', { ascending: true })
  ]);

  if (snapshotsResult.error) throw new Error(snapshotsResult.error.message);
  if (notesResult.error) throw new Error(notesResult.error.message);
  if (decisionsResult.error) throw new Error(decisionsResult.error.message);

  return {
    queue: {
      id: queue.id,
      workspaceId: session.workspace.id,
      offerId: queue.offer_id,
      status: queue.status,
      priorityScore: queue.priority_score,
      lastDecisionId: queue.last_decision_id,
      lastReviewedBy: queue.last_reviewed_by,
      lastReviewedAt: queue.last_reviewed_at,
      createdAt: queue.created_at,
      updatedAt: queue.updated_at
    },
    offer: mapOfferRecord(offer, session.workspace.id),
    priceSnapshots: ((snapshotsResult.data ?? []) as Array<{
      id: number;
      workspace_id: string;
      offer_id: string;
      price: number | string;
      previous_price: number | string | null;
      discount_percent: number | string | null;
      coupon_code: string | null;
      free_shipping: boolean;
      observed_at: string;
    }>).map(mapSnapshot),
    notes: ((notesResult.data ?? []) as NoteRow[]).map((note) => ({
      id: note.id,
      workspaceId: session.workspace.id,
      queueId: note.queue_id,
      offerId: note.offer_id,
      body: note.body,
      createdBy: note.created_by,
      createdAt: note.created_at
    })),
    decisions: ((decisionsResult.data ?? []) as DecisionRow[]).map((decision) => ({
      id: decision.id,
      workspaceId: session.workspace.id,
      queueId: decision.queue_id,
      offerId: decision.offer_id,
      decision: decision.decision,
      previousStatus: decision.previous_status,
      nextStatus: decision.next_status,
      reason: decision.reason,
      decidedBy: decision.decided_by,
      decidedAt: decision.decided_at,
      createdAt: decision.created_at
    })),
    history: buildReviewHistory((notesResult.data ?? []) as NoteRow[], (decisionsResult.data ?? []) as DecisionRow[]),
    allowedActions: queue.status === 'pending' ? (['approve', 'reject', 'add_note'] as const) : []
  };
}

async function requireSupabase(): Promise<SupabaseQueryClient> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase runtime config ausente.');
  return supabase;
}

async function getOfferIdsByTag(supabase: SupabaseQueryClient, workspaceId: string, tagId: string) {
  const matchingTagIds = await getTagIdsBySameName(supabase, workspaceId, tagId);
  if (matchingTagIds.length === 0) return [];

  const { data, error } = await supabase
    .from('offer_tags')
    .select('offer_id')
    .eq('workspace_id', workspaceId)
    .in('tag_id', matchingTagIds);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { offer_id: string }) => row.offer_id);
}

async function getCategoryIdsBySameName(
  supabase: SupabaseQueryClient,
  workspaceId: string,
  categoryId: string
): Promise<string[]> {
  const { data: selectedCategory, error: selectedError } = await supabase
    .from('categories')
    .select('name')
    .eq('workspace_id', workspaceId)
    .eq('id', categoryId)
    .maybeSingle();

  if (selectedError) throw new Error(selectedError.message);
  if (!selectedCategory) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .eq('name', selectedCategory.name);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { id: string }) => row.id);
}

async function getTagIdsBySameName(
  supabase: SupabaseQueryClient,
  workspaceId: string,
  tagId: string
): Promise<string[]> {
  const { data: selectedTag, error: selectedError } = await supabase
    .from('tags')
    .select('name')
    .eq('workspace_id', workspaceId)
    .eq('id', tagId)
    .maybeSingle();

  if (selectedError) throw new Error(selectedError.message);
  if (!selectedTag) return [];

  const { data, error } = await supabase
    .from('tags')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .eq('name', selectedTag.name);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { id: string }) => row.id);
}

function mapOfferListItem(row: OfferRow): OfferListItem {
  const category = singleRelation(row.categories);
  return {
    id: row.id,
    title: row.title,
    marketplace: row.marketplace,
    category: category ? { id: category.id, name: category.name, color: category.color } : null,
    currentPrice: toNumber(row.current_price),
    previousPrice: row.previous_price === null ? null : toNumber(row.previous_price),
    discountPercent: row.discount_percent === null ? null : toNumber(row.discount_percent),
    score: row.score,
    highlights: row.highlights,
    capturedAt: row.captured_at
  };
}

function mapOfferRecord(row: OfferRow, workspaceId: string) {
  return {
    id: row.id,
    workspaceId,
    marketplace: row.marketplace,
    externalId: '',
    dedupeKey: '',
    sourceUrl: row.source_url,
    affiliateUrl: row.affiliate_url,
    title: row.title,
    imageUrl: row.image_url,
    categoryId: row.category_id,
    currentPrice: toNumber(row.current_price),
    previousPrice: row.previous_price === null ? null : toNumber(row.previous_price),
    currency: row.currency,
    discountPercent: row.discount_percent === null ? null : toNumber(row.discount_percent),
    couponCode: row.coupon_code,
    freeShipping: row.free_shipping,
    commissionPercent: row.commission_percent === null ? null : toNumber(row.commission_percent),
    score: row.score,
    scoreVersion: 'mvp-v1' as const,
    scoreFactors: row.score_factors as never,
    highlights: row.highlights,
    status: row.status,
    capturedAt: row.captured_at,
    lastSeenAt: row.last_seen_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSnapshot(row: {
  id: number;
  workspace_id: string;
  offer_id: string;
  price: number | string;
  previous_price: number | string | null;
  discount_percent: number | string | null;
  coupon_code: string | null;
  free_shipping: boolean;
  observed_at: string;
}): PriceSnapshotRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    offerId: row.offer_id,
    price: toNumber(row.price),
    previousPrice: row.previous_price === null ? null : toNumber(row.previous_price),
    discountPercent: row.discount_percent === null ? null : toNumber(row.discount_percent),
    couponCode: row.coupon_code,
    freeShipping: row.free_shipping,
    observedAt: row.observed_at
  };
}

function buildReviewHistory(notes: NoteRow[], decisions: DecisionRow[]): ReviewHistoryItem[] {
  return [
    ...notes.map((note): ReviewHistoryItem => ({
      type: 'note',
      body: note.body,
      actor: { id: note.created_by, displayName: singleRelation(note.profiles)?.display_name ?? null },
      createdAt: note.created_at
    })),
    ...decisions.map((decision): ReviewHistoryItem => ({
      type: 'decision',
      decision: decision.decision,
      reason: decision.reason,
      actor: { id: decision.decided_by, displayName: singleRelation(decision.profiles)?.display_name ?? null },
      createdAt: decision.decided_at
    }))
  ].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function parseCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const value = Number(cursor);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function uniqueFilterOptionsByName<TOption extends { id: string; name: string }>(options: TOption[]): TOption[] {
  const seen = new Set<string>();
  const uniqueOptions: TOption[] = [];

  for (const option of options) {
    const key = option.name.trim().toLocaleLowerCase('pt-BR');
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueOptions.push(option);
  }

  return uniqueOptions;
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
