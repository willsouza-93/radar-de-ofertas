'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/server/supabase/server';
import {
  approveActionSchema,
  loginActionSchema,
  noteActionSchema,
  rejectActionSchema
} from '@/server/ui/action-schemas';

type ActionErrorCode =
  | 'VERSION_CONFLICT'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
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
  return 'ACTION_FAILED';
}

function redirectWithActionError(queueId: string, code: ActionErrorCode): never {
  redirect(`/curation/${queueId}?actionError=${code}`);
}
