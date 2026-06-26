import { randomUUID } from 'node:crypto';

import type { CaptureContext } from './types';

export type EventCode =
  | 'capture.started'
  | 'capture.completed'
  | 'capture.item.invalid'
  | 'capture.item.processed'
  | 'capture.normalization.completed'
  | 'capture.validation.completed'
  | 'capture.deduplication.completed'
  | 'capture.score.completed';

export type CorrelationId = string;
export type CaptureRunId = string;

export interface StructuredLog {
  event: EventCode;
  correlationId: CorrelationId;
  captureRunId: CaptureRunId;
  workspaceId: string;
  connectorId: string;
  connectorVersion: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export function createCorrelationId(prefix = 'corr'): CorrelationId {
  return `${prefix}_${randomUUID()}`;
}

export function createCaptureRunId(prefix = 'capture'): CaptureRunId {
  return `${prefix}_${randomUUID()}`;
}

export function createStructuredLog(
  context: CaptureContext,
  event: EventCode,
  metadata?: Record<string, unknown>
): StructuredLog {
  return {
    event,
    correlationId: context.correlationId,
    captureRunId: context.captureRunId,
    workspaceId: context.workspaceId,
    connectorId: context.connectorId,
    connectorVersion: context.connectorVersion,
    occurredAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {})
  };
}
