import { calculateDedupeKey } from './deduplication';
import { toCaptureError } from './errors';
import { normalizeRawOffer, type NormalizedOfferDraft } from './normalization';
import { createStructuredLog, type StructuredLog } from './observability';
import { StructuralScoreCalculator, toScoredOffer, type ScoreCalculator } from './score';
import {
  type CaptureContext,
  type CaptureResult,
  type NormalizedOffer,
  type PipelineItemFailure,
  type PipelineItemResult,
  type PipelineItemSuccess,
  type RawOffer
} from './types';
import { validateNormalizedOffer, validateRawOffer } from './validation';

export interface CapturePipelineOptions {
  scoreCalculator?: ScoreCalculator;
}

export interface CapturePipelineRunResult {
  result: CaptureResult;
  logs: StructuredLog[];
}

export class CapturePipeline {
  private readonly scoreCalculator: ScoreCalculator;

  constructor(options: CapturePipelineOptions = {}) {
    this.scoreCalculator = options.scoreCalculator ?? new StructuralScoreCalculator();
  }

  process(rawOffers: RawOffer[], context: CaptureContext): CapturePipelineRunResult {
    const logs: StructuredLog[] = [
      createStructuredLog(context, 'capture.started', { received: rawOffers.length })
    ];
    const items: PipelineItemResult[] = rawOffers.map((rawOffer, rawIndex) => {
      const itemResult = this.processItem(rawOffer, rawIndex, context);
      logs.push(
        createStructuredLog(
          context,
          itemResult.status === 'processed' ? 'capture.item.processed' : 'capture.item.invalid',
          { rawIndex, status: itemResult.status }
        )
      );
      return itemResult;
    });
    const processed = items.filter((item) => item.status === 'processed').length;
    const invalid = items.length - processed;

    logs.push(createStructuredLog(context, 'capture.completed', { processed, invalid }));

    return {
      logs,
      result: {
        connectorId: context.connectorId,
        connectorVersion: context.connectorVersion,
        correlationId: context.correlationId,
        captureRunId: context.captureRunId,
        received: rawOffers.length,
        processed,
        invalid,
        items
      }
    };
  }

  private processItem(
    rawOffer: RawOffer,
    rawIndex: number,
    context: CaptureContext
  ): PipelineItemResult {
    try {
      validateRawOffer(rawOffer);
      const draft = normalizeRawOffer(rawOffer, context);
      const normalizedOffer = finalizeNormalizedOffer(draft);
      validateNormalizedOffer(normalizedOffer);
      const scoreResult = this.scoreCalculator.calculate(normalizedOffer, {
        captureContext: context
      });
      const scoredOffer = toScoredOffer(normalizedOffer, scoreResult);

      return {
        status: 'processed',
        rawIndex,
        rawOffer,
        normalizedOffer,
        scoredOffer
      } satisfies PipelineItemSuccess;
    } catch (error) {
      const captureError = toCaptureError(error);
      return {
        status: 'invalid',
        rawIndex,
        rawOffer,
        errorCode: captureError.code,
        safeMessage: captureError.safeMessage,
        ...(captureError.details ? { details: captureError.details } : {})
      } satisfies PipelineItemFailure;
    }
  }
}

export function createCapturePipeline(options?: CapturePipelineOptions): CapturePipeline {
  return new CapturePipeline(options);
}

function finalizeNormalizedOffer(draft: NormalizedOfferDraft): NormalizedOffer {
  const dedupe = calculateDedupeKey({
    sourceKey: draft.sourceKey,
    externalId: draft.rawExternalId,
    canonicalSourceUrl: draft.canonicalSourceUrl
  });

  return {
    contractVersion: draft.contractVersion,
    workspaceId: draft.workspaceId,
    sourceKey: draft.sourceKey,
    externalId: dedupe.externalId,
    dedupeKey: dedupe.dedupeKey,
    canonicalSourceUrl: draft.canonicalSourceUrl,
    sourceUrl: draft.sourceUrl,
    affiliateUrl: draft.affiliateUrl,
    title: draft.title,
    currentPrice: draft.currentPrice,
    currency: draft.currency,
    capturedAt: draft.capturedAt,
    imageUrl: draft.imageUrl,
    previousPrice: draft.previousPrice,
    discountPercent: draft.discountPercent,
    couponCode: draft.couponCode,
    freeShipping: draft.freeShipping,
    commissionPercent: draft.commissionPercent,
    sellerKey: draft.sellerKey
  };
}
