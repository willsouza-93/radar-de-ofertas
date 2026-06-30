import 'server-only';

import { createPublicationRequest } from '@/server/publication/publisher';
import { renderPublicationTemplate } from '@/server/publication/template';
import type { ApprovedOfferSnapshot, PublicationResult, RenderedMessage } from '@/server/publication/types';
import { createTelegramPublicationTarget, telegramMvpTemplate } from '@/server/publication/telegram-template';
import { getTelegramPublishingConfig, TelegramPublisher } from '@/server/publishers/telegram';
import type { SupabaseServerClient } from '@/server/supabase/server';

type RequestRow = {
  candidate_id: string;
  job_id: string;
  job_status: 'requested' | 'processing' | 'succeeded' | 'failed' | 'paused' | 'cancelled';
  action: string;
  redirect_url: string;
  snapshot_payload: Record<string, unknown>;
  approval_decision_id: string;
  idempotency_key: string;
  safe_message: string;
};

type ClaimRow = {
  job_id: string;
  job_status: 'processing';
  rendered_message_text: string;
  idempotency_key: string;
  correlation_id: string;
  publication_run_id: string;
  safe_message: string;
};

export type TelegramPublicationWorkflowResult = {
  status: 'sent' | 'existing' | 'blocked' | 'failed';
  safeMessage: string;
  jobId?: string;
};

export async function executeTelegramPublicationWorkflow(input: {
  supabase: SupabaseServerClient;
  offerId: string;
}): Promise<TelegramPublicationWorkflowResult> {
  const config = getTelegramPublishingConfig();
  if (!config.enabled) {
    return {
      status: 'blocked',
      safeMessage: config.reason === 'disabled'
        ? 'Publicacao Telegram esta desabilitada.'
        : 'Telegram nao esta configurado para publicacao.'
    };
  }

  const requestRow = await requestPublicationJob(input.supabase, input.offerId);
  if (requestRow.job_status === 'succeeded') {
    return {
      status: 'existing',
      jobId: requestRow.job_id,
      safeMessage: 'Esta oferta ja foi publicada neste ciclo editorial.'
    };
  }

  if (requestRow.job_status !== 'requested') {
    return {
      status: 'blocked',
      jobId: requestRow.job_id,
      safeMessage: messageForExistingStatus(requestRow.job_status)
    };
  }

  const redirectUrl = normalizeRedirectUrl(requestRow.redirect_url, config.appUrl);
  const renderedMessage = renderTelegramMessage({
    requestRow,
    redirectUrl,
    appUrl: config.appUrl
  });

  const claimRow = await claimPublicationJob(input.supabase, requestRow.job_id, renderedMessage);
  const publisher = new TelegramPublisher({
    botToken: config.botToken,
    defaultChatId: config.defaultChatId,
    timeoutMs: config.timeoutMs
  });

  const publicationRequest = createPublicationRequest({
    job: {
      id: claimRow.job_id,
      workspaceId: snapshotString(requestRow.snapshot_payload.workspaceId),
      candidateId: requestRow.candidate_id,
      target: createTelegramPublicationTarget(),
      renderedMessage,
      idempotencyKey: claimRow.idempotency_key,
      status: 'sending',
      correlationId: claimRow.correlation_id,
      publicationRunId: claimRow.publication_run_id,
      attempt: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: renderedMessage
  });

  const result = await publisher.publish(publicationRequest);
  const recorded = await recordPublicationResult(input.supabase, requestRow.job_id, result);

  return {
    status: recorded.result === 'success' ? 'sent' : 'failed',
    jobId: recorded.job_id,
    safeMessage: recorded.safe_message
  };
}

function renderTelegramMessage(input: {
  requestRow: RequestRow;
  redirectUrl: string;
  appUrl: string;
}): RenderedMessage {
  const snapshot = buildApprovedOfferSnapshot(input.requestRow.snapshot_payload);
  return renderPublicationTemplate(telegramMvpTemplate, {
    workspaceId: snapshotString(input.requestRow.snapshot_payload.workspaceId),
    approvedOfferSnapshot: snapshot,
    approvalDecisionId: input.requestRow.approval_decision_id,
    target: createTelegramPublicationTarget(),
    redirectLink: input.redirectUrl,
    allowedRedirectOrigins: [new URL(input.appUrl).origin],
    generatedAt: new Date().toISOString()
  });
}

async function requestPublicationJob(supabase: SupabaseServerClient, offerId: string): Promise<RequestRow> {
  const { data, error } = await supabase.rpc('request_telegram_publication', {
    target_offer_id: offerId
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('PUBLICATION_REQUEST_EMPTY');
  return row as RequestRow;
}

async function claimPublicationJob(
  supabase: SupabaseServerClient,
  jobId: string,
  renderedMessage: RenderedMessage
): Promise<ClaimRow> {
  const { data, error } = await supabase.rpc('claim_telegram_publication_job', {
    target_job_id: jobId,
    target_rendered_message_text: renderedMessage.text,
    target_rendered_message_metadata: renderedMessage.metadata,
    target_publication_run_id: `telegram-run-${crypto.randomUUID()}`
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('PUBLICATION_CLAIM_EMPTY');
  return row as ClaimRow;
}

async function recordPublicationResult(
  supabase: SupabaseServerClient,
  jobId: string,
  result: PublicationResult
): Promise<{
  job_id: string;
  result: 'success' | 'transient_failure' | 'permanent_failure' | 'rate_limited' | 'ambiguous';
  safe_message: string;
}> {
  const normalizedResult = result.failure?.code === 'TELEGRAM_RATE_LIMIT' ? 'rate_limited' : result.status;
  const retryAfterSeconds = result.retryAfter ? Number(result.retryAfter) : null;
  const { data, error } = await supabase.rpc('record_telegram_publication_result', {
    target_job_id: jobId,
    target_result: normalizedResult,
    target_external_message_id: result.externalMessageId ?? null,
    target_provider_request_id: result.providerRequestId ?? null,
    target_failure_code: result.failure?.code ?? null,
    target_failure_category: result.failure?.category ?? null,
    target_safe_message: result.safeMessage,
    target_retry_after_seconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null,
    target_metadata: {
      rawStatus: result.rawStatus ?? null
    }
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('PUBLICATION_RECORD_EMPTY');
  return row as {
    job_id: string;
    result: 'success' | 'transient_failure' | 'permanent_failure' | 'rate_limited' | 'ambiguous';
    safe_message: string;
  };
}

function normalizeRedirectUrl(value: string, appUrl: string): string {
  const parsed = new URL(value, appUrl);
  return `${new URL(appUrl).origin}${parsed.pathname}`;
}

function buildApprovedOfferSnapshot(payload: Record<string, unknown>): ApprovedOfferSnapshot {
  return {
    id: snapshotString(payload.offerId),
    version: snapshotString(payload.snapshotVersion),
    title: snapshotString(payload.title),
    currentPrice: snapshotNumber(payload.currentPrice),
    currency: 'BRL',
    sourceUrl: snapshotString(payload.sourceUrl),
    affiliateUrl: snapshotString(payload.affiliateUrl),
    previousPrice: snapshotNullableNumber(payload.previousPrice),
    discountPercent: snapshotNullableNumber(payload.discountPercent),
    couponCode: snapshotNullableString(payload.couponCode),
    freeShipping: Boolean(payload.freeShipping),
    commissionPercent: snapshotNullableNumber(payload.commissionPercent),
    highlights: Array.isArray(payload.highlights) ? payload.highlights.map(String) : []
  };
}

function snapshotString(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : 'unknown';
}

function snapshotNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

function snapshotNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return snapshotNumber(value);
}

function snapshotNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function messageForExistingStatus(status: RequestRow['job_status']): string {
  const messages: Record<RequestRow['job_status'], string> = {
    requested: 'Publicacao solicitada.',
    processing: 'Publicacao ja esta em processamento.',
    succeeded: 'Esta oferta ja foi publicada neste ciclo editorial.',
    failed: 'Publicacao anterior falhou. Retry automatico nao esta habilitado nesta fase.',
    paused: 'Resultado ambiguo exige revisao manual antes de nova tentativa.',
    cancelled: 'Publicacao cancelada.'
  };
  return messages[status];
}
