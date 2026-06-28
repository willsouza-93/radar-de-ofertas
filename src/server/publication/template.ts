import { TemplateError } from './errors';
import type { PublicationContext, PublicationTemplate, RenderedMessage } from './types';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export function renderPublicationTemplate(
  template: PublicationTemplate,
  context: PublicationContext
): RenderedMessage {
  validateRedirectLink(context.redirectLink);

  const variables = buildTemplateVariables(context);
  for (const required of template.requiredVariables) {
    const value = variables[required];
    if (value === undefined || value === null || value === '') {
      throw new TemplateError('Missing required template variable.', {
        code: 'TEMPLATE_VARIABLE_MISSING',
        safeMessage: 'Template possui variavel obrigatoria ausente.',
        retryable: false,
        details: { variable: required }
      });
    }
  }

  const text = template.body.replace(VARIABLE_PATTERN, (_match, variableName: string) => {
    const value = variables[variableName];
    return escapeForFormat(String(value ?? fallbackForVariable(variableName)), template.format);
  });

  const minLength = template.minLength ?? 1;
  const maxLength = template.maxLength ?? context.target.maxTextLength ?? 4096;

  if (text.trim().length < minLength) {
    throw new TemplateError('Rendered message is too short.', {
      code: 'RENDERED_MESSAGE_TOO_SHORT',
      safeMessage: 'Mensagem renderizada ficou curta demais.',
      retryable: false,
      details: { minLength }
    });
  }

  if (text.length > maxLength) {
    throw new TemplateError('Rendered message is too long.', {
      code: 'RENDERED_MESSAGE_TOO_LONG',
      safeMessage: 'Mensagem renderizada excede o limite do destino.',
      retryable: false,
      details: { maxLength }
    });
  }

  return {
    format: template.format,
    text,
    linkPreview: true,
    metadata: {
      templateId: template.id,
      templateName: template.name,
      generatedAt: context.generatedAt,
      snapshotId: context.approvedOfferSnapshot.id,
      snapshotVersion: context.approvedOfferSnapshot.version
    }
  };
}

export function buildPublicationContext(input: PublicationContext): PublicationContext {
  validateRedirectLink(input.redirectLink);
  return input;
}

function buildTemplateVariables(context: PublicationContext): Record<string, string | number | boolean | null> {
  const snapshot = context.approvedOfferSnapshot;

  return {
    title: snapshot.title,
    currentPrice: formatMoney(snapshot.currentPrice),
    previousPrice: snapshot.previousPrice === null || snapshot.previousPrice === undefined ? null : formatMoney(snapshot.previousPrice),
    discountPercent:
      snapshot.discountPercent === null || snapshot.discountPercent === undefined ? null : `${snapshot.discountPercent}%`,
    couponCode: snapshot.couponCode ?? null,
    freeShipping: snapshot.freeShipping ? 'Frete gratis' : 'Frete nao confirmado',
    commissionPercent:
      snapshot.commissionPercent === null || snapshot.commissionPercent === undefined
        ? null
        : `${snapshot.commissionPercent}%`,
    highlights: snapshot.highlights?.join(', ') ?? null,
    sourceUrl: snapshot.sourceUrl,
    redirectLink: context.redirectLink,
    targetLabel: context.target.destinationLabel ?? context.target.destinationId
  };
}

function fallbackForVariable(variableName: string): string {
  if (variableName === 'couponCode') return 'sem cupom informado';
  if (variableName === 'discountPercent') return 'desconto nao informado';
  if (variableName === 'previousPrice') return 'preco anterior nao informado';
  return '';
}

function formatMoney(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function escapeForFormat(value: string, format: PublicationTemplate['format']): string {
  if (format === 'plain') return value;
  if (format === 'html_restricted') {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  return value.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

function validateRedirectLink(link: string): void {
  let parsed: URL;
  try {
    parsed = new URL(link);
  } catch {
    throw new TemplateError('Invalid redirect link.', {
      code: 'INVALID_REDIRECT_LINK',
      safeMessage: 'Link de redirecionamento invalido.',
      retryable: false
    });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TemplateError('Redirect link must use HTTP or HTTPS.', {
      code: 'INVALID_REDIRECT_LINK_PROTOCOL',
      safeMessage: 'Link de redirecionamento deve usar HTTP ou HTTPS.',
      retryable: false
    });
  }

  if (!/^\/r\/[A-Za-z0-9_-]+$/.test(parsed.pathname)) {
    throw new TemplateError('Redirect link must point to /r/{shortCode}.', {
      code: 'REDIRECT_LINK_REQUIRED',
      safeMessage: 'Publicacao exige link publico de redirecionamento /r/{shortCode}.',
      retryable: false
    });
  }
}
