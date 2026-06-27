import { describe, expect, it } from 'vitest';

import { ManualConnector, MANUAL_CONNECTOR_ID, MANUAL_CONNECTOR_VERSION } from './connector';

describe('ManualConnector', () => {
  it('maps manual records to RawOffer without domain rules', async () => {
    const connector = new ManualConnector([
      {
        title: 'Notebook Pro 14',
        sourceUrl: 'https://example.com/notebook',
        affiliateUrl: 'https://example.com/aff/notebook',
        currentPrice: '3999.90',
        previousPrice: '',
        freeShipping: ''
      }
    ]);

    const result = await connector.fetch({
      workspaceId: 'workspace-a',
      connectorId: MANUAL_CONNECTOR_ID,
      connectorVersion: MANUAL_CONNECTOR_VERSION,
      correlationId: 'corr-1',
      captureRunId: 'run-1',
      since: '2026-06-26T10:00:00.000Z'
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      contractVersion: 'capture-v1',
      connectorId: MANUAL_CONNECTOR_ID,
      connectorVersion: MANUAL_CONNECTOR_VERSION,
      capturedAt: '2026-06-26T10:00:00.000Z',
      title: 'Notebook Pro 14',
      sourceUrl: 'https://example.com/notebook',
      affiliateUrl: 'https://example.com/aff/notebook',
      currentPrice: '3999.90',
      previousPrice: '',
      freeShipping: ''
    });
  });
});
