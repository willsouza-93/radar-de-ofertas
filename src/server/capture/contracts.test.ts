import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  CAPTURE_CONTRACT_VERSION,
  type CaptureContext,
  type Connector,
  type ConnectorContext,
  type ConnectorResult,
  type NormalizedOffer,
  type PipelineResult,
  type RawOffer,
  type ScoredOffer
} from './types';
import { createTestCaptureContext, createTestRawOffer, finalizeTestOffer } from './test-helpers';
import { normalizeRawOffer } from './normalization';
import { StructuralScoreCalculator, toScoredOffer } from './score';

describe('capture contracts', () => {
  it('keeps contract version stable', () => {
    expect(CAPTURE_CONTRACT_VERSION).toBe('capture-v1');
  });

  it('exposes connector contract without implementing marketplace connector', async () => {
    const connector: Connector = {
      id: 'manual-import',
      version: '0.1.0',
      displayName: 'Manual Import',
      capabilities: ['current_price', 'affiliate_link'],
      fetch: async (_context: ConnectorContext): Promise<ConnectorResult> => ({
        items: [createTestRawOffer({ connectorId: 'manual-import' })],
        nextPageToken: null
      })
    };

    const result = await connector.fetch({
      workspaceId: 'workspace-1',
      connectorId: connector.id,
      connectorVersion: connector.version,
      correlationId: 'corr-test',
      captureRunId: 'run-test'
    });

    expect(result.items).toHaveLength(1);
  });

  it('types the expected data flow contracts', () => {
    const context = createTestCaptureContext();
    const rawOffer: RawOffer = createTestRawOffer();
    const normalizedOffer: NormalizedOffer = finalizeTestOffer(normalizeRawOffer(rawOffer, context));
    const score = new StructuralScoreCalculator().calculate(normalizedOffer, {
      captureContext: context
    });
    const scoredOffer: ScoredOffer = toScoredOffer(normalizedOffer, score);
    const pipelineResult: PipelineResult = {
      correlationId: context.correlationId,
      captureRunId: context.captureRunId,
      received: 1,
      processed: 1,
      invalid: 0,
      items: [
        {
          status: 'processed',
          rawIndex: 0,
          rawOffer,
          normalizedOffer,
          scoredOffer
        }
      ]
    };

    expectTypeOf(context).toMatchTypeOf<CaptureContext>();
    expect(pipelineResult.items[0]?.status).toBe('processed');
  });

  it('models affiliateUrl as optional enrichment, not offer identity', () => {
    const context = createTestCaptureContext();
    const normalizedOffer: NormalizedOffer = finalizeTestOffer(
      normalizeRawOffer(createTestRawOffer({ affiliateUrl: null }), context)
    );

    expect(normalizedOffer.affiliateUrl).toBeNull();
    expect(normalizedOffer.dedupeKey).toBe('manual_import:external:offer-123');
  });
});
