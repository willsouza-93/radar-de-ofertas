import 'server-only';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/server/supabase/server';
import type { AppRole } from '@/server/offers/types';

export type AuthenticatedBackofficeSession = {
  state: 'authenticated';
  user: {
    id: string;
    email: string;
    displayName: string;
    role: AppRole;
  };
  workspace: {
    id: string;
    name: string;
  };
};

export type BackofficeSession =
  | AuthenticatedBackofficeSession
  | { state: 'unauthenticated' }
  | { state: 'access_limited'; reason: 'missing_membership' | 'suspended' }
  | { state: 'multiple_workspaces' };

type WorkspaceMemberRow = {
  workspace_id: string;
  role: AppRole;
  status: 'active' | 'suspended' | 'invited';
  workspaces: { name: string } | { name: string }[] | null;
};

export async function getCurrentUserSession(): Promise<BackofficeSession> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { state: 'unauthenticated' };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { state: 'unauthenticated' };

  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, status, workspaces(name)')
    .eq('user_id', user.id);

  if (error) {
    console.warn('ui.session.membership_lookup_failed', { userId: user.id, code: error.code });
    return { state: 'access_limited', reason: 'missing_membership' };
  }

  const rows = (data ?? []) as WorkspaceMemberRow[];
  const activeRows = rows.filter((row) => row.status === 'active');
  if (activeRows.length > 1) return { state: 'multiple_workspaces' };
  if (activeRows.length === 0) {
    const hasSuspended = rows.some((row) => row.status === 'suspended');
    return { state: 'access_limited', reason: hasSuspended ? 'suspended' : 'missing_membership' };
  }

  const membership = activeRows[0];
  if (!membership) return { state: 'access_limited', reason: 'missing_membership' };

  const workspace = Array.isArray(membership.workspaces)
    ? membership.workspaces[0]
    : membership.workspaces;

  return {
    state: 'authenticated',
    user: {
      id: user.id,
      email: user.email ?? 'sem-email',
      displayName: extractDisplayName(user.user_metadata, user.email),
      role: membership.role
    },
    workspace: {
      id: membership.workspace_id,
      name: workspace?.name ?? 'Workspace'
    }
  };
}

export async function requireBackofficeSession(): Promise<AuthenticatedBackofficeSession> {
  const session = await getCurrentUserSession();
  if (session.state === 'unauthenticated') redirect('/login');
  if (session.state !== 'authenticated') {
    throw new Error(session.state === 'multiple_workspaces'
      ? 'MULTIPLE_WORKSPACES_NOT_SUPPORTED'
      : 'ACCESS_LIMITED');
  }
  return session;
}

function extractDisplayName(metadata: unknown, email: string | undefined): string {
  if (metadata && typeof metadata === 'object' && 'display_name' in metadata) {
    const value = (metadata as { display_name?: unknown }).display_name;
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return email?.split('@')[0] ?? 'Usuario';
}
