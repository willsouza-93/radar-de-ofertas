import { PublisherError } from '@/server/publication/errors';
import type { PublicationRequest, PublicationResult, Publisher } from '@/server/publication/types';

export type TelegramPublisherConfig = {
  botToken: string;
  defaultChatId: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

type TelegramApiResponse =
  | {
      ok: true;
      result?: {
        message_id?: number | string;
      };
    }
  | {
      ok: false;
      error_code?: number;
      description?: string;
      parameters?: {
        retry_after?: number;
      };
    };

export class TelegramPublisher implements Publisher {
  readonly id = 'telegram';
  readonly version = 'telegram-mvp-v1';
  readonly displayName = 'Telegram';
  readonly capabilities = ['text', 'plain'];
  readonly limits = {
    maxTextLength: 4096,
    maxAttempts: 1
  };

  private readonly botToken: string;
  private readonly defaultChatId: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: TelegramPublisherConfig) {
    if (!config.botToken.trim() || !config.defaultChatId.trim()) {
      throw new PublisherError('Telegram publisher configuration is missing.', {
        code: 'TELEGRAM_CONFIG_MISSING',
        safeMessage: 'Telegram nao esta configurado para publicacao.',
        retryable: false
      });
    }

    this.botToken = config.botToken;
    this.defaultChatId = config.defaultChatId;
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async publish(request: PublicationRequest): Promise<PublicationResult> {
    if (request.message.format !== 'plain') {
      return permanentFailure('TELEGRAM_FORMAT_NOT_SUPPORTED', 'Telegram MVP aceita apenas texto simples.');
    }

    if (request.message.text.length > this.limits.maxTextLength) {
      return permanentFailure('TELEGRAM_TEXT_LIMIT_EXCEEDED', 'Mensagem excede o limite de texto do Telegram.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: this.defaultChatId,
          text: request.message.text,
          disable_web_page_preview: false
        }),
        signal: controller.signal
      });

      const parsed = await parseTelegramResponse(response);
      if (!parsed) {
        return ambiguousFailure('TELEGRAM_INVALID_RESPONSE', 'Telegram retornou uma resposta invalida.');
      }

      if (parsed.ok) {
        const messageId = parsed.result?.message_id;
        if (messageId === undefined || messageId === null || String(messageId).trim() === '') {
          return ambiguousFailure('TELEGRAM_MISSING_MESSAGE_ID', 'Telegram confirmou sem identificador de mensagem.');
        }

        return {
          status: 'success',
          externalMessageId: String(messageId),
          safeMessage: 'Publicacao enviada ao Telegram.',
          rawStatus: String(response.status)
        };
      }

      return normalizeTelegramError(response.status, parsed);
    } catch (error) {
      const code = error instanceof DOMException && error.name === 'AbortError'
        ? 'TELEGRAM_TIMEOUT'
        : 'TELEGRAM_NETWORK_ERROR';

      return ambiguousFailure(code, 'Resultado ambiguo ao chamar o Telegram. Revisao manual necessaria.');
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function parseTelegramResponse(response: Response): Promise<TelegramApiResponse | null> {
  try {
    const value = await response.json();
    if (!value || typeof value !== 'object' || typeof (value as { ok?: unknown }).ok !== 'boolean') {
      return null;
    }
    return value as TelegramApiResponse;
  } catch {
    return null;
  }
}

function normalizeTelegramError(status: number, response: Extract<TelegramApiResponse, { ok: false }>): PublicationResult {
  const retryAfter = response.parameters?.retry_after;
  if (status === 429 || response.error_code === 429) {
    const retryAfterText = retryAfter === undefined ? undefined : String(retryAfter);
    return {
      status: 'transient_failure',
      failure: {
        category: 'transient',
        code: 'TELEGRAM_RATE_LIMIT',
        safeMessage: 'Telegram limitou temporariamente a publicacao.',
        retryable: false,
        ...(retryAfterText ? { retryAfter: retryAfterText } : {})
      },
      ...(retryAfterText ? { retryAfter: retryAfterText } : {}),
      safeMessage: 'Telegram limitou temporariamente a publicacao.',
      rawStatus: String(status)
    };
  }

  if (status >= 500) {
    return {
      status: 'transient_failure',
      failure: {
        category: 'transient',
        code: 'TELEGRAM_PROVIDER_UNAVAILABLE',
        safeMessage: 'Telegram esta temporariamente indisponivel.',
        retryable: false
      },
      safeMessage: 'Telegram esta temporariamente indisponivel.',
      rawStatus: String(status)
    };
  }

  const code = status === 401 || status === 403
    ? 'TELEGRAM_AUTH_OR_PERMISSION_ERROR'
    : 'TELEGRAM_REJECTED_MESSAGE';

  return permanentFailure(code, 'Telegram rejeitou a publicacao com uma falha permanente.', String(status));
}

function permanentFailure(code: string, safeMessage: string, rawStatus?: string): PublicationResult {
  return {
    status: 'permanent_failure',
    failure: {
      category: 'permanent',
      code,
      safeMessage,
      retryable: false
    },
    safeMessage,
    ...(rawStatus ? { rawStatus } : {})
  };
}

function ambiguousFailure(code: string, safeMessage: string): PublicationResult {
  return {
    status: 'ambiguous',
    failure: {
      category: 'ambiguous',
      code,
      safeMessage,
      retryable: false
    },
    safeMessage
  };
}
