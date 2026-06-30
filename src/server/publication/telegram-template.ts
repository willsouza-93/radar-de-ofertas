import type { PublicationTarget, PublicationTemplate } from './types';

export const TELEGRAM_MVP_TEMPLATE_ID = 'telegram-mvp-v1' as const;

export const telegramMvpTemplate: PublicationTemplate = {
  id: TELEGRAM_MVP_TEMPLATE_ID,
  name: 'Telegram MVP v1',
  format: 'plain',
  body: [
    'OFERTA ENCONTRADA',
    '',
    '{{title}}',
    'Preco: {{currentPrice}}',
    'Desconto: {{discountPercent}}',
    'Cupom: {{couponCode}}',
    '{{freeShipping}}',
    '',
    'Confira: {{redirectLink}}'
  ].join('\n'),
  requiredVariables: ['title', 'currentPrice', 'redirectLink'],
  minLength: 20,
  maxLength: 4096
};

export function createTelegramPublicationTarget(): PublicationTarget {
  return {
    id: 'telegram-default',
    channel: 'telegram',
    destinationId: 'server-configured',
    destinationLabel: 'Telegram padrao',
    enabled: true,
    supportsManualPublication: true,
    maxTextLength: 4096
  };
}
