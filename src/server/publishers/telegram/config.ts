import 'server-only';

export type TelegramPublishingConfig =
  | {
      enabled: true;
      botToken: string;
      defaultChatId: string;
      appUrl: string;
      timeoutMs: number;
    }
  | {
      enabled: false;
      reason: 'disabled' | 'missing_config';
      appUrl: string | null;
      timeoutMs: number;
    };

export function getTelegramPublishingConfig(env: NodeJS.ProcessEnv = process.env): TelegramPublishingConfig {
  const enabled = env.TELEGRAM_PUBLISHING_ENABLED === 'true';
  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  const defaultChatId = env.TELEGRAM_DEFAULT_CHAT_ID?.trim();
  const appUrl = normalizeAppUrl(env.APP_URL);
  const timeoutMs = normalizeTimeout(env.TELEGRAM_PUBLISH_TIMEOUT_MS);

  if (!enabled) {
    return {
      enabled: false,
      reason: 'disabled',
      appUrl,
      timeoutMs
    };
  }

  if (!botToken || !defaultChatId || !appUrl) {
    return {
      enabled: false,
      reason: 'missing_config',
      appUrl,
      timeoutMs
    };
  }

  return {
    enabled: true,
    botToken,
    defaultChatId,
    appUrl,
    timeoutMs
  };
}

function normalizeAppUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizeTimeout(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 1000 && parsed <= 30000) return parsed;
  return 10000;
}
