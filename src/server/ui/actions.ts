'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/server/supabase/server';
import { importManualOffers } from '@/server/capture/manual-import';
import { SupabaseCapturePersistenceRepository } from '@/server/capture/supabase-persistence';
import { AppError } from '@/server/offers/errors';
import { executeTelegramPublicationWorkflow } from '@/server/publication/telegram-workflow';
import {
  approveActionSchema,
  loginActionSchema,
  manualImportActionSchema,
  noteActionSchema,
  rejectActionSchema,
  telegramPublicationActionSchema
} from '@/server/ui/action-schemas';

type ActionErrorCode =
  | 'VERSION_CONFLICT'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'PUBLICATION_BLOCKED'
  | 'ACTION_FAILED';

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = loginActionSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) redirect('/login?error=invalid');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login?error=config');

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect('/login?error=invalid');

  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect('/login');
}

export async function importManualOffersAction(formData: FormData): Promise<void> {
  const parsed = manualImportActionSchema.safeParse({
    payload: formData.get('payload')
  });
  if (!parsed.success) redirect('/capture/manual?error=VALIDATION_ERROR');

  const supabase = await requireSupabaseForAction();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect('/login');

  let redirectUrl: string;
  try {
    const result = await importManualOffers(parsed.data.payload, {
      actorUserId: userData.user.id,
      repository: new SupabaseCapturePersistenceRepository(supabase),
      logger: console
    });
    const params = new URLSearchParams({
      imported: '1',
      received: String(result.received),
      persisted: String(result.persisted),
      invalid: String(result.invalid),
      queueCreated: String(result.queueCreated),
      queueReentered: String(result.queueReentered),
      queueSkipped: String(result.queueSkipped),
      warnings: String(result.failures.length),
      run: result.captureRunId
    });

    revalidatePath('/dashboard');
    revalidatePath('/offers');
    revalidatePath('/curation');
    revalidatePath('/capture/manual');
    redirectUrl = `/capture/manual?${params.toString()}`;
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'ACTION_FAILED';
    redirect(`/capture/manual?error=${code}`);
  }

  redirect(redirectUrl);
}

export async function addReviewNoteAction(formData: FormData): Promise<void> {
  const parsed = noteActionSchema.parse({
    queueId: formData.get('queueId'),
    body: formData.get('body')
  });
  const supabase = await requireSupabaseForAction();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('UNAUTHENTICATED');

  const { data: queue, error: queueError } = await supabase
    .from('approval_queue')
    .select('workspace_id, offer_id')
    .eq('id', parsed.queueId)
    .maybeSingle();

  if (queueError) redirectWithActionError(parsed.queueId, toActionErrorCode(queueError));
  if (!queue) redirectWithActionError(parsed.queueId, 'NOT_FOUND');

  const { error } = await supabase.from('review_notes').insert({
    workspace_id: queue.workspace_id,
    queue_id: parsed.queueId,
    offer_id: queue.offer_id,
    body: parsed.body,
    created_by: userData.user.id
  });
  if (error) redirectWithActionError(parsed.queueId, toActionErrorCode(error));

  revalidatePath(`/curation/${parsed.queueId}`);
  redirect(`/curation/${parsed.queueId}`);
}

export async function approveOfferAction(formData: FormData): Promise<void> {
  const parsed = approveActionSchema.parse({
    queueId: formData.get('queueId'),
    note: formData.get('note') || undefined
  });
  const errorCode = await applyDecision(parsed.queueId, 'approved', null, parsed.note || null);
  if (errorCode) redirectWithActionError(parsed.queueId, errorCode);
  revalidatePath(`/curation/${parsed.queueId}`);
  redirect(`/curation/${parsed.queueId}`);
}

export async function rejectOfferAction(formData: FormData): Promise<void> {
  const parsed = rejectActionSchema.parse({
    queueId: formData.get('queueId'),
    reason: formData.get('reason')
  });
  const errorCode = await applyDecision(parsed.queueId, 'rejected', parsed.reason, null);
  if (errorCode) redirectWithActionError(parsed.queueId, errorCode);
  revalidatePath(`/curation/${parsed.queueId}`);
  redirect(`/curation/${parsed.queueId}`);
}

export async function publishTelegramOfferAction(formData: FormData): Promise<void> {
  const parsed = telegramPublicationActionSchema.safeParse({
    offerId: formData.get('offerId'),
    confirm: formData.get('confirm')
  });
  if (!parsed.success) redirect('/offers?publicationError=VALIDATION_ERROR');

  const supabase = await requireSupabaseForAction();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect('/login');

  let redirectUrl: string;
  try {
    const result = await executeTelegramPublicationWorkflow({
      supabase,
      offerId: parsed.data.offerId
    });

    revalidatePath(`/offers/${parsed.data.offerId}`);
    redirectUrl = `/offers/${parsed.data.offerId}?publicationStatus=${result.status}`;
  } catch (error) {
    const code = toActionErrorCode(error as { code?: string; message?: string });
    revalidatePath(`/offers/${parsed.data.offerId}`);
    redirect(`/offers/${parsed.data.offerId}?publicationError=${code}`);
  }

  redirect(redirectUrl);
}

async function applyDecision(
  queueId: string,
  decision: 'approved' | 'rejected',
  reason: string | null,
  note: string | null
): Promise<ActionErrorCode | null> {
  const supabase = await requireSupabaseForAction();
  const { error } = await supabase.rpc('apply_approval_decision', {
    target_queue_id: queueId,
    expected_status: 'pending',
    target_decision: decision,
    decision_reason: reason,
    note_body: note
  });
  return error ? toActionErrorCode(error) : null;
}

async function requireSupabaseForAction() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('UNAUTHENTICATED');
  return supabase;
}

function toActionErrorCode(error: { code?: string; message?: string }): ActionErrorCode {
  if (error.code === '40001') return 'VERSION_CONFLICT';
  if (error.code === '42501') return 'FORBIDDEN';
  if (error.code === 'P0002') return 'NOT_FOUND';
  if (error.code === '23514' || error.code === '23503' || error.code === '22P02') {
    return 'VALIDATION_ERROR';
  }
  if (error.message === 'PUBLICATION_REQUEST_EMPTY' || error.message === 'PUBLICATION_CLAIM_EMPTY') {
    return 'PUBLICATION_BLOCKED';
  }
  return 'ACTION_FAILED';
}

function redirectWithActionError(queueId: string, code: ActionErrorCode): never {
  redirect(`/curation/${queueId}?actionError=${code}`);
}
