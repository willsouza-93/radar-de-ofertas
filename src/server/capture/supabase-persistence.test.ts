import { describe, expect, it } from 'vitest';

import { SupabaseCapturePersistenceRepository } from './supabase-persistence';

describe('SupabaseCapturePersistenceRepository', () => {
  it('does not directly insert approval_queue rows', async () => {
    const repository = new SupabaseCapturePersistenceRepository({} as never);

    await expect(repository.createApprovalQueue({
      workspaceId: 'workspace-a',
      offerId: 'offer-a',
      priorityScore: 80
    })).rejects.toThrow('RPC controlada');
  });

  it('does not directly reopen terminal approval_queue rows', async () => {
    const repository = new SupabaseCapturePersistenceRepository({} as never);

    await expect(repository.reopenApprovalQueue({
      workspaceId: 'workspace-a',
      offerId: 'offer-a',
      priorityScore: 80
    })).rejects.toThrow('funcao controlada');
  });
});
