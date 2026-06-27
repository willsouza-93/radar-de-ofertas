import { describe, expect, it } from 'vitest';

import { SupabaseCapturePersistenceRepository } from './supabase-persistence';

describe('SupabaseCapturePersistenceRepository', () => {
  it('materializes approval queue through submit_capture_for_review RPC', async () => {
    const calls: unknown[] = [];
    const repository = new SupabaseCapturePersistenceRepository({
      rpc: async (name: string, args: unknown) => {
        calls.push({ name, args });
        return {
          data: [{ queue_id: 'queue-a', action: 'created' }],
          error: null
        };
      }
    } as never);

    await expect(repository.createApprovalQueue({
      workspaceId: 'workspace-a',
      offerId: 'offer-a',
      priorityScore: 80,
      reentryReason: 'new_offer',
      captureRunId: 'capture-run-a',
      correlationId: 'correlation-a'
    })).resolves.toEqual({ id: 'queue-a' });

    expect(calls).toEqual([
      {
        name: 'submit_capture_for_review',
        args: {
          target_offer_id: 'offer-a',
          target_priority_score: 80,
          target_reentry_reason: 'new_offer',
          target_capture_run_id: 'capture-run-a',
          target_correlation_id: 'correlation-a'
        }
      }
    ]);
  });

  it('reopens approval queue through submit_capture_for_review RPC', async () => {
    const calls: unknown[] = [];
    const repository = new SupabaseCapturePersistenceRepository({
      rpc: async (name: string, args: unknown) => {
        calls.push({ name, args });
        return {
          data: [{ queue_id: 'queue-a', action: 'reopened' }],
          error: null
        };
      }
    } as never);

    await expect(repository.reopenApprovalQueue({
      workspaceId: 'workspace-a',
      offerId: 'offer-a',
      priorityScore: 80,
      reentryReason: 'material_change',
      captureRunId: 'capture-run-a',
      correlationId: 'correlation-a'
    })).resolves.toEqual({ id: 'queue-a' });

    expect(calls).toEqual([
      {
        name: 'submit_capture_for_review',
        args: {
          target_offer_id: 'offer-a',
          target_priority_score: 80,
          target_reentry_reason: 'material_change',
          target_capture_run_id: 'capture-run-a',
          target_correlation_id: 'correlation-a'
        }
      }
    ]);
  });
});
