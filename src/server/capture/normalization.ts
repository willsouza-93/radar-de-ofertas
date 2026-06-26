import { NormalizationError } from './errors';
import { CAPTURE_CONTRACT_VERSION, type CaptureContext, type Currency, type RawOffer } from './types';

const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'yclid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'ref',
  'ref_',
  'spm',
  'campaign',
  'campaign_id',
  'ad_id',
  'adset_id',
  'creative',
  'click_id',
  'clickid',
  'aff_id',
  'affiliate_id',
  'tag',
  'ascsubtag'
]);

export interface NormalizedOfferDraft {
  contractVersion: typeof CAPTURE_CONTRACT_VERSION;
  workspaceId: string;
  sourceKey: string;
  rawExternalId: string | null;
  canonicalSourceUrl: string;
  sourceUrl: string;
  affiliateUrl: string | null;
  title: string;
  currentPrice: number;
  currency: Currency;
  capturedAt: string;
  imageUrl: string | null;
  previousPrice: number | null;
  discountPercent: number | null;
  couponCode: string | null;
  freeShipping: boolean | null;
  commissionPercent: number | null;
  sellerKey: string | null;
  availability: string | null;
}

export function normalizeRawOffer(rawOffer: RawOffer, context: CaptureContext): NormalizedOfferDraft {
  const sourceUrl = assertHttpUrl(rawOffer.sourceUrl, 'sourceUrl');
  const rawAffiliateUrl = trimToNull(rawOffer.affiliateUrl);
  const affiliateUrl = rawAffiliateUrl ? assertHttpUrl(rawAffiliateUrl, 'affiliateUrl') : null;
  const imageUrl = rawOffer.imageUrl ? assertHttpUrl(rawOffer.imageUrl, 'imageUrl') : null;
  const currentPrice = parseMoney(rawOffer.currentPrice, 'currentPrice');
  const normalizedPreviousPrice = normalizeOptionalScalar(rawOffer.previousPrice);
  const previousPrice =
    normalizedPreviousPrice === null ? null : parseMoney(normalizedPreviousPrice, 'previousPrice');
  const discountPercent = deriveDiscountPercent(currentPrice, previousPrice);

  return {
    contractVersion: CAPTURE_CONTRACT_VERSION,
    workspaceId: context.workspaceId,
    sourceKey: normalizeSourceKey(context.sourceKey),
    rawExternalId: trimToNull(rawOffer.externalId),
    canonicalSourceUrl: canonicalizeSourceUrl(sourceUrl),
    sourceUrl,
    affiliateUrl,
    title: normalizeTitle(rawOffer.title),
    currentPrice,
    currency: normalizeCurrency(rawOffer.currency),
    capturedAt: normalizeIsoDate(rawOffer.capturedAt, 'capturedAt'),
    imageUrl,
    previousPrice,
    discountPercent,
    couponCode: trimToNull(rawOffer.couponCode),
    freeShipping: parseShippingFlag(rawOffer.freeShipping),
    commissionPercent: parsePercent(rawOffer.commissionPercent, 'commissionPercent'),
    sellerKey: normalizeSellerKey(trimToNull(rawOffer.sellerId) ?? trimToNull(rawOffer.sellerName)),
    availability: normalizeAvailability(rawOffer.availability)
  };
}

export function canonicalizeSourceUrl(rawUrl: string): string {
  const checked = assertHttpUrl(rawUrl, 'sourceUrl');
  const parsed = new URL(checked);

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = normalizeHost(parsed.hostname);

  if (
    (parsed.protocol === 'http:' && parsed.port === '80') ||
    (parsed.protocol === 'https:' && parsed.port === '443')
  ) {
    parsed.port = '';
  }

  parsed.hash = '';
  parsed.pathname = normalizePath(parsed.pathname);
  parsed.search = normalizeSearchParams(parsed.searchParams);

  return parsed.toString();
}

export function assertHttpUrl(rawUrl: string, fieldName: string): string {
  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new NormalizationError('Invalid URL.', {
      code: 'INVALID_URL',
      safeMessage: 'Informe uma URL HTTP/HTTPS valida.',
      details: { fieldName }
    });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new NormalizationError('Unsupported URL protocol.', {
      code: 'UNSUPPORTED_URL_PROTOCOL',
      safeMessage: 'A URL deve usar HTTP ou HTTPS.',
      details: { fieldName, protocol: parsed.protocol }
    });
  }

  return trimmed;
}

export function parseMoney(value: string | number, fieldName: string): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      throw new NormalizationError('Invalid money value.', {
        code: 'INVALID_MONEY',
        safeMessage: 'Informe um valor monetario positivo.',
        details: { fieldName }
      });
    }

    if (!hasAtMostTwoDecimalPlaces(value)) {
      throw new NormalizationError('Invalid money precision.', {
        code: 'INVALID_MONEY_PRECISION',
        safeMessage: 'Informe um valor monetario com ate duas casas decimais.',
        details: { fieldName }
      });
    }

    return assertMoneyRange(value, fieldName);
  }

  const normalized = value.trim().replace(',', '.');

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new NormalizationError('Invalid money value.', {
      code: 'INVALID_MONEY',
      safeMessage: 'Informe um valor monetario positivo com ate duas casas.',
      details: { fieldName }
    });
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new NormalizationError('Invalid money value.', {
      code: 'INVALID_MONEY',
      safeMessage: 'Informe um valor monetario positivo.',
      details: { fieldName }
    });
  }

  return assertMoneyRange(parsed, fieldName);
}

export function parsePercent(
  value: string | number | null | undefined,
  fieldName: string
): number | null {
  const optionalValue = normalizeOptionalScalar(value);
  if (optionalValue === null) return null;
  const normalized =
    typeof optionalValue === 'number' ? String(optionalValue) : optionalValue.trim().replace(',', '.');

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new NormalizationError('Invalid percent value.', {
      code: 'INVALID_PERCENT',
      safeMessage: 'Informe um percentual entre 0 e 100.',
      details: { fieldName }
    });
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new NormalizationError('Invalid percent value.', {
      code: 'INVALID_PERCENT',
      safeMessage: 'Informe um percentual entre 0 e 100.',
      details: { fieldName }
    });
  }

  return roundPercent(parsed);
}

export function deriveDiscountPercent(currentPrice: number, previousPrice: number | null): number | null {
  if (previousPrice === null || previousPrice <= currentPrice || previousPrice === 0) {
    return null;
  }

  return roundPercent(((previousPrice - currentPrice) / previousPrice) * 100);
}

export function normalizeCurrency(value: string | null | undefined): Currency {
  const normalized = trimToNull(value)?.toUpperCase() ?? 'BRL';
  if (normalized !== 'BRL') {
    throw new NormalizationError('Unsupported currency.', {
      code: 'UNSUPPORTED_CURRENCY',
      safeMessage: 'Moeda nao suportada para captura.',
      details: { currency: normalized }
    });
  }

  return 'BRL';
}

export function parseShippingFlag(value: boolean | string | number | null | undefined): boolean | null {
  const optionalValue = normalizeOptionalScalar(value);
  if (optionalValue === null) return null;
  if (typeof optionalValue === 'boolean') return optionalValue;
  if (typeof optionalValue === 'number') {
    if (optionalValue === 1) return true;
    if (optionalValue === 0) return false;
    throw new NormalizationError('Invalid shipping flag.', {
      code: 'INVALID_SHIPPING_FLAG',
      safeMessage: 'Informe um valor valido para frete gratis.',
      details: { value: optionalValue }
    });
  }

  const normalized = optionalValue.trim().toLowerCase();
  if (['true', '1', 'yes', 'sim', 'gratis', 'free'].includes(normalized)) return true;
  if (['false', '0', 'no', 'nao'].includes(normalized)) return false;

  throw new NormalizationError('Invalid shipping flag.', {
    code: 'INVALID_SHIPPING_FLAG',
    safeMessage: 'Informe um valor valido para frete gratis.',
    details: { value }
  });
}

export function trimToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ');
}

function normalizeIsoDate(value: string, fieldName: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) {
    throw new NormalizationError('Invalid ISO date.', {
      code: 'INVALID_ISO_DATE',
      safeMessage: 'Informe uma data ISO valida em UTC.',
      details: { fieldName }
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new NormalizationError('Invalid date.', {
      code: 'INVALID_DATE',
      safeMessage: 'Informe uma data valida.',
      details: { fieldName }
    });
  }

  const milliseconds = (match[3] ?? '0').padEnd(3, '0');
  const canonical = `${match[1]}T${match[2]}.${milliseconds}Z`;
  if (date.toISOString() !== canonical) {
    throw new NormalizationError('Invalid ISO date.', {
      code: 'INVALID_ISO_DATE',
      safeMessage: 'Informe uma data ISO valida em UTC.',
      details: { fieldName }
    });
  }

  return date.toISOString();
}

function normalizeSourceKey(sourceKey: string): string {
  const normalized = sourceKey.trim().toLowerCase();
  if (!/^[a-z0-9_.-]+$/.test(normalized)) {
    throw new NormalizationError('Invalid source key.', {
      code: 'INVALID_SOURCE_KEY',
      safeMessage: 'Origem de captura invalida.',
      details: { sourceKey }
    });
  }
  return normalized;
}

function normalizeSellerKey(value: string | null | undefined): string | null {
  const trimmed = trimToNull(value);
  return trimmed ? trimmed.toLowerCase() : null;
}

function normalizeAvailability(value: string | null | undefined): string | null {
  const trimmed = trimToNull(value);
  return trimmed ? trimmed.toLowerCase() : null;
}

function normalizeHost(hostname: string): string {
  const lower = hostname.toLowerCase();
  return lower.startsWith('www.') ? lower.slice(4) : lower;
}

function normalizePath(pathname: string): string {
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function normalizeSearchParams(params: URLSearchParams): string {
  const retained: Array<[string, string]> = [];

  for (const [name, value] of params.entries()) {
    const key = name.trim();
    const trimmedValue = value.trim();
    const lowerKey = key.toLowerCase();

    if (!key || !trimmedValue) continue;
    if (lowerKey.startsWith('utm_')) continue;
    if (lowerKey.startsWith('ref_')) continue;
    if (TRACKING_PARAMS.has(lowerKey)) continue;

    retained.push([key, trimmedValue]);
  }

  retained.sort(([aName, aValue], [bName, bValue]) => {
    const byName = aName.localeCompare(bName);
    return byName !== 0 ? byName : aValue.localeCompare(bValue);
  });

  const normalized = new URLSearchParams();
  for (const [name, value] of retained) normalized.append(name, value);
  const serialized = normalized.toString();
  return serialized ? `?${serialized}` : '';
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.abs(value - Number(value.toFixed(2))) < 1e-9;
}

function assertMoneyRange(value: number, fieldName: string): number {
  const maxNumeric12_2 = 9999999999.99;
  if (value > maxNumeric12_2) {
    throw new NormalizationError('Money value exceeds numeric(12,2).', {
      code: 'MONEY_OUT_OF_RANGE',
      safeMessage: 'Valor monetario excede o limite suportado.',
      details: { fieldName }
    });
  }

  return roundCurrency(value);
}

function normalizeOptionalScalar<T extends string | number | boolean>(
  value: T | null | undefined
): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim().length === 0) return null;
  return value;
}
