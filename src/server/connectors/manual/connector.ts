import {
  CAPTURE_CONTRACT_VERSION,
  type Connector,
  type ConnectorContext,
  type ConnectorResult,
  type RawOffer
} from '@/server/capture/types';

import type { ManualImportRecord } from './types';

export const MANUAL_CONNECTOR_ID = 'manual-import' as const;
export const MANUAL_CONNECTOR_VERSION = 'manual-v1' as const;
export const MANUAL_SOURCE_KEY = 'manual' as const;

export class ManualConnector implements Connector {
  readonly id = MANUAL_CONNECTOR_ID;
  readonly version = MANUAL_CONNECTOR_VERSION;
  readonly displayName = 'Importador manual';
  readonly capabilities: Connector['capabilities'] = [
    'external_identity',
    'current_price',
    'previous_price',
    'images',
    'affiliate_link',
    'coupon',
    'free_shipping',
    'commission',
    'seller'
  ];

  constructor(private readonly records: ManualImportRecord[]) {}

  async fetch(context: ConnectorContext): Promise<ConnectorResult> {
    return {
      items: this.records.map((record) => toRawOffer(record, context))
    };
  }
}

function toRawOffer(record: ManualImportRecord, context: ConnectorContext): RawOffer {
  return {
    contractVersion: CAPTURE_CONTRACT_VERSION,
    connectorId: MANUAL_CONNECTOR_ID,
    connectorVersion: MANUAL_CONNECTOR_VERSION,
    capturedAt: record.capturedAt ?? context.since ?? new Date().toISOString(),
    title: record.title,
    sourceUrl: record.sourceUrl,
    currentPrice: record.currentPrice,
    ...(record.externalId !== undefined ? { externalId: record.externalId } : {}),
    ...(record.affiliateUrl !== undefined ? { affiliateUrl: record.affiliateUrl } : {}),
    ...(record.previousPrice !== undefined ? { previousPrice: record.previousPrice } : {}),
    ...(record.currency !== undefined ? { currency: record.currency } : {}),
    ...(record.imageUrl !== undefined ? { imageUrl: record.imageUrl } : {}),
    ...(record.couponCode !== undefined ? { couponCode: record.couponCode } : {}),
    ...(record.freeShipping !== undefined ? { freeShipping: record.freeShipping } : {}),
    ...(record.commissionPercent !== undefined ? { commissionPercent: record.commissionPercent } : {}),
    ...(record.sellerId !== undefined ? { sellerId: record.sellerId } : {}),
    ...(record.sellerName !== undefined ? { sellerName: record.sellerName } : {}),
    ...(record.availability !== undefined ? { availability: record.availability } : {}),
    ...(record.rawPayloadRef !== undefined ? { rawPayloadRef: record.rawPayloadRef } : {}),
    ...(record.sourceMetadata !== undefined ? { sourceMetadata: record.sourceMetadata } : {})
  };
}
