import { AppError, forbidden } from './errors';
import type { ActiveMembership } from './types';

export interface MembershipRepository {
  listActiveMembershipsForUser(userId: string): Promise<ActiveMembership[]>;
}

export async function resolveActiveWorkspaceForUser(
  userId: string | null | undefined,
  repository: MembershipRepository
): Promise<ActiveMembership> {
  if (!userId) {
    throw new AppError('UNAUTHENTICATED', 'Sessao ausente ou invalida.', 401);
  }

  const memberships = await repository.listActiveMembershipsForUser(userId);

  if (memberships.length === 0) {
    throw forbidden('Usuario sem membership ativa.');
  }

  if (memberships.length > 1) {
    throw new AppError(
      'MULTIPLE_WORKSPACES_NOT_SUPPORTED',
      'Selecao de workspace ainda nao faz parte do MVP.',
      409
    );
  }

  const membership = memberships[0];
  if (!membership) {
    throw forbidden('Usuario sem membership ativa.');
  }

  return membership;
}

export function assertAdmin(membership: ActiveMembership): void {
  if (membership.role !== 'admin') {
    throw forbidden('Somente Admin pode executar esta acao.');
  }
}
