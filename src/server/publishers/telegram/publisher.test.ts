import { describe, expect, it, vi } from 'vitest';

import { PublisherError } from '@/server/publication/errors';
import type { PublicationRequest } from '@/server/publication/types';
import { TelegramPublisher } from './publisher';

describe('TelegramPublisher', () => {
  it('publishes a plain text message with sendMessage', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true, result: { message_id: 123 } }));
    const publisher = createPublisher(fetchImpl);

    const result = await publisher.publish(createRequest());

    expect(result.status).toBe('success');
    expect(result.externalMessageId).toBe('123');
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain('/sendMessage');
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      chat_id: 'chat-1',
      text: 'Oferta pronta'
    });
  });

  it('normalizes explicit Bot API errors as permanent failures', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: false, error_code: 403, description: 'forbidden' }, 403));
    const publisher = createPublisher(fetchImpl);

    const result = await publisher.publish(createRequest());

    expect(result.status).toBe('permanent_failure');
    expect(result.failure?.code).toBe('TELEGRAM_AUTH_OR_PERMISSION_ERROR');
    expect(result.safeMessage).not.toContain('forbidden');
  });

  it('normalizes rate limit with retryAfter without scheduling automatic retry', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ ok: false, error_code: 429, parameters: { retry_after: 42 } }, 429)
    );
    const publisher = createPublisher(fetchImpl);

    const result = await publisher.publish(createRequest());

    expect(result.status).toBe('transient_failure');
    expect(result.failure?.code).toBe('TELEGRAM_RATE_LIMIT');
    expect(result.retryAfter).toBe('42');
    expect(result.failure?.retryable).toBe(false);
  });

  it('treats network errors as ambiguous results', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('socket hang up');
    });
    const publisher = createPublisher(fetchImpl);

    const result = await publisher.publish(createRequest());

    expect(result.status).toBe('ambiguous');
    expect(result.failure?.code).toBe('TELEGRAM_NETWORK_ERROR');
  });

  it('treats invalid responses as ambiguous results', async () => {
    const fetchImpl = vi.fn(async () => new Response('not-json', { status: 200 }));
    const publisher = createPublisher(fetchImpl);

    const result = await publisher.publish(createRequest());

    expect(result.status).toBe('ambiguous');
    expect(result.failure?.code).toBe('TELEGRAM_INVALID_RESPONSE');
  });

  it('rejects missing configuration before any fetch', () => {
    expect(() => new TelegramPublisher({ botToken: '', defaultChatId: 'chat-1' })).toThrow(PublisherError);
  });

  it('rejects text above Telegram limit without calling fetch', async () => {
    const fetchImpl = vi.fn();
    const publisher = createPublisher(fetchImpl);

    const result = await publisher.publish(createRequest('x'.repeat(4097)));

    expect(result.status).toBe('permanent_failure');
    expect(result.failure?.code).toBe('TELEGRAM_TEXT_LIMIT_EXCEEDED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not write token, headers or body to console logs', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true, result: { message_id: 123 } }));
    const publisher = createPublisher(fetchImpl);

    await publisher.publish(createRequest());

    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    info.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });
});

function createPublisher(fetchImpl: typeof fetch) {
  return new TelegramPublisher({
    botToken: 'secret-token',
    defaultChatId: 'chat-1',
    fetchImpl
  });
}

function createRequest(text = 'Oferta pronta'): PublicationRequest {
  return {
    workspaceId: 'workspace-1',
    publicationJobId: 'job-1',
    idempotencyKey: 'key-1',
    target: {
      id: 'telegram-default',
      channel: 'telegram',
      destinationId: 'server-configured',
      enabled: true
    },
    message: {
      format: 'plain',
      text,
      linkPreview: true,
      metadata: {
        templateId: 'telegram-mvp-v1',
        templateName: 'Telegram MVP v1',
        generatedAt: '2026-06-30T00:00:00Z',
        snapshotId: 'snapshot-1',
        snapshotVersion: 'snapshot-v1'
      }
    },
    correlationId: 'correlation-1',
    publicationRunId: 'run-1'
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  });
}
