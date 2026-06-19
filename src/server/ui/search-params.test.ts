import { describe, expect, it } from 'vitest';

import { parseCurationSearchParams, parseOfferSearchParams } from './search-params';

describe('Phase 4 URL filter parsing', () => {
  it('coerces offer URL filters before services receive them', () => {
    const parsed = parseOfferSearchParams({
      q: ' notebook ',
      minScore: '80',
      minDiscount: '12.5',
      limit: '20',
      from: '2026-06-01',
      marketplace: 'manual'
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      q: 'notebook',
      minScore: 80,
      minDiscount: 12.5,
      limit: 20,
      marketplace: 'manual'
    });
    expect(parsed.value.from).toBe('2026-06-01T00:00:00.000Z');
  });

  it('rejects invalid numeric filters instead of passing raw strings', () => {
    const parsed = parseOfferSearchParams({ minScore: '101' });

    expect(parsed.ok).toBe(false);
  });

  it('strips unsupported workspaceId from offer filters', () => {
    const parsed = parseOfferSearchParams({
      workspaceId: '11111111-1111-1111-1111-111111111111',
      limit: '10'
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect('workspaceId' in parsed.value).toBe(false);
  });

  it('coerces curation filters and keeps only approved statuses', () => {
    const parsed = parseCurationSearchParams({
      status: 'pending',
      minScore: '75',
      sort: 'priority_desc',
      limit: '5'
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toMatchObject({
      status: 'pending',
      minScore: 75,
      sort: 'priority_desc',
      limit: 5
    });
  });

  it('rejects under_review because it is outside the MVP workflow', () => {
    const parsed = parseCurationSearchParams({ status: 'under_review' });

    expect(parsed.ok).toBe(false);
  });
});
