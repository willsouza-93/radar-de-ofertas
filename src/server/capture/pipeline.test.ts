import { describe, expect, it } from 'vitest';

import { createCapturePipeline } from './pipeline';
import { createTestCaptureContext, createTestRawOffer } from './test-helpers';

describe('capture pipeline', () => {
  it('processes valid raw offers into scored offers', () => {
    const context = createTestCaptureContext();
    const { result, logs } = createCapturePipeline().process([createTestRawOffer()], context);

    expect(result.received).toBe(1);
    expect(result.processed).toBe(1);
    expect(result.invalid).toBe(0);
    expect(result.items[0]?.status).toBe('processed');
    expect(logs.map((log) => log.event)).toContain('capture.completed');
  });

  it('keeps invalid items isolated from the rest of the batch', () => {
    const context = createTestCaptureContext();
    const { result } = createCapturePipeline().process(
      [createTestRawOffer({ title: '' }), createTestRawOffer({ externalId: 'item-2' })],
      context
    );

    expect(result.received).toBe(2);
    expect(result.processed).toBe(1);
    expect(result.invalid).toBe(1);
    expect(result.items.map((item) => item.status)).toEqual(['invalid', 'processed']);
  });
});
