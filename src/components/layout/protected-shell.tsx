import { redirect } from 'next/navigation';

import { AccessLimitedState } from '@/components/feedback/access-limited-state';
import { AppShell } from '@/components/layout/app-shell';
import { listApprovalQueueData } from '@/server/ui/data';
import { getCurrentUserSession, type AuthenticatedBackofficeSession } from '@/server/ui/session';

type AuthenticatedContext = {
  kind: 'authenticated';
  session: AuthenticatedBackofficeSession;
  pendingCount: number;
};

export async function ProtectedShell({
  currentPath,
  children
}: {
  currentPath: string;
  children: (context: AuthenticatedContext) => Promise<React.ReactNode> | React.ReactNode;
}) {
  const context = await getAuthenticatedContext();

  if (context.kind === 'redirect') redirect('/login');
  if (context.kind === 'limited') {
    return (
      <AccessLimitedState
        title={context.title}
        description={context.description}
      />
    );
  }

  const content = await children(context);

  return (
    <AppShell session={context.session} currentPath={currentPath} pendingCount={context.pendingCount}>
      {content}
    </AppShell>
  );
}

async function getAuthenticatedContext(): Promise<
  | AuthenticatedContext
  | { kind: 'redirect' }
  | { kind: 'limited'; title: string; description: string }
> {
  const session = await getCurrentUserSession();

  if (session.state === 'unauthenticated') return { kind: 'redirect' as const };
  if (session.state === 'multiple_workspaces') {
    return {
      kind: 'limited' as const,
      title: 'Sua conta esta vinculada a mais de um workspace.',
      description:
        'A selecao de workspace ainda nao faz parte do MVP. Peca ao administrador para manter apenas uma membership ativa enquanto a selecao nao estiver disponivel.'
    };
  }
  if (session.state === 'access_limited') {
    return {
      kind: 'limited' as const,
      title: 'Seu acesso ao workspace nao esta ativo.',
      description: 'Se voce acredita que isso e um engano, fale com o administrador do workspace.'
    };
  }

  const pending = await listApprovalQueueData(session, { status: 'pending', limit: 1 });
  return { kind: 'authenticated' as const, session, pendingCount: pending.items.length };
}
