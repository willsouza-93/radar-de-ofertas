'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/server/supabase/server';

const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const noteSchema = z.object({
  queueId: uuidSchema,
  body: z.string().trim().min(1).max(2000)
}).strict();

const approveSchema = z.object({
  queueId: uuidSchema,
  note: z.string().trim().max(2000).optional()
}).strict();

const rejectSchema = z.object({
  queueId: uuidSchema,
  reason: z.string().trim().min(3).max(2000)
}).strict();

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
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
  const parsed = noteSchema.parse({
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

  if (queueError) throw new Error(queueError.message);
  if (!queue) throw new Error('NOT_FOUND');

  const { error } = await supabase.from('review_notes').insert({
    workspace_id: queue.workspace_id,
    queue_id: parsed.queueId,
    offer_id: queue.offer_id,
    body: parsed.body,
    created_by: userData.user.id
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/curation/${parsed.queueId}`);
}

export async function approveOfferAction(formData: FormData): Promise<void> {
  const parsed = approveSchema.parse({
    queueId: formData.get('queueId'),
    note: formData.get('note') || undefined
  });
  await applyDecision(parsed.queueId, 'approved', null, parsed.note || null);
  revalidatePath(`/curation/${parsed.queueId}`);
  redirect(`/curation/${parsed.queueId}`);
}

export async function rejectOfferAction(formData: FormData): Promise<void> {
  const parsed = rejectSchema.parse({
    queueId: formData.get('queueId'),
    reason: formData.get('reason')
  });
  await applyDecision(parsed.queueId, 'rejected', parsed.reason, null);
  revalidatePath(`/curation/${parsed.queueId}`);
  redirect(`/curation/${parsed.queueId}`);
}

async function applyDecision(
  queueId: string,
  decision: 'approved' | 'rejected',
  reason: string | null,
  note: string | null
): Promise<void> {
  const supabase = await requireSupabaseForAction();
  const { error } = await supabase.rpc('apply_approval_decision', {
    target_queue_id: queueId,
    expected_status: 'pending',
    target_decision: decision,
    decision_reason: reason,
    note_body: note
  });
  if (error) throw new Error(error.message);
}

async function requireSupabaseForAction() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('UNAUTHENTICATED');
  return supabase;
}
