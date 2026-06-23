import { describe, expect, it } from 'vitest';

import { curationActionUuidSchema } from './action-schemas';
import { getActionErrorMessage } from './errors';

describe('Phase 4 curation action schemas', () => {
  it('accepts standard 8-4-4-4-12 queue UUIDs', () => {
    const parsed = curationActionUuidSchema.safeParse('11111111-2222-3333-4444-555555555555');

    expect(parsed.success).toBe(true);
  });

  it('rejects malformed queue UUIDs', () => {
    const parsed = curationActionUuidSchema.safeParse('11111111-2222-3333-555555555555');

    expect(parsed.success).toBe(false);
  });

  it('maps action errors to stable user-facing messages', () => {
    expect(getActionErrorMessage('VERSION_CONFLICT')).toContain('Recarregue');
    expect(getActionErrorMessage('FORBIDDEN')).toContain('perfil');
    expect(getActionErrorMessage('UNKNOWN')).toBeNull();
  });
});
