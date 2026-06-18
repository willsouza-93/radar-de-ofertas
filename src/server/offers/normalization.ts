import { createHash } from 'node:crypto';

import { validationError } from './errors';
import type { OfferMarketplace } from './types';

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

export interface DedupeResult {
  dedupeKey: string;
  externalId: string;
  canonicalSourceUrl: string;
}

export function trimToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function assertHttpUrl(rawUrl: string, fieldName: string): string {
  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw validationError('URL invalida.', {
      [fieldName]: ['Informe uma URL HTTP/HTTPS valida.']
    });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw validationError('URL invalida.', {
      [fieldName]: ['A URL deve usar HTTP ou HTTPS.']
    });
  }

  return trimmed;
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

export function generateDedupeKey(
  marketplace: OfferMarketplace,
  externalId: string | null | undefined,
  sourceUrl: string
): DedupeResult {
  const normalizedExternalId = normalizeExternalId(marketplace, externalId);
  const canonicalSourceUrl = canonicalizeSourceUrl(sourceUrl);

  if (normalizedExternalId) {
    return {
      dedupeKey: `${marketplace}:external:${normalizedExternalId}`,
      externalId: normalizedExternalId,
      canonicalSourceUrl
    };
  }

  const hash = createHash('sha256').update(canonicalSourceUrl).digest('hex');

  return {
    dedupeKey: `${marketplace}:url:${hash}`,
    externalId: `url:${hash}`,
    canonicalSourceUrl
  };
}

export function parseMoney(value: string | number, fieldName: string): number {
  const normalized =
    typeof value === 'number' ? value.toFixed(2) : value.trim().replace(',', '.');

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw validationError('Valor monetario invalido.', {
      [fieldName]: ['Informe um valor monetario positivo com ate duas casas.']
    });
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw validationError('Valor monetario invalido.', {
      [fieldName]: ['Informe um valor monetario positivo.']
    });
  }

  return roundCurrency(parsed);
}

export function parsePercent(
  value: string | number | null | undefined,
  fieldName: string
): number | null {
  if (value === null || value === undefined || value === '') return null;
  const normalized =
    typeof value === 'number' ? String(value) : value.trim().replace(',', '.');

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw validationError('Percentual invalido.', {
      [fieldName]: ['Informe um percentual entre 0 e 100.']
    });
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw validationError('Percentual invalido.', {
      [fieldName]: ['Informe um percentual entre 0 e 100.']
    });
  }

  return roundPercent(parsed);
}

export function deriveDiscountPercent(
  currentPrice: number,
  previousPrice: number | null
): number | null {
  if (previousPrice === null || previousPrice <= currentPrice || previousPrice === 0) {
    return null;
  }

  return roundPercent(((previousPrice - currentPrice) / previousPrice) * 100);
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeExternalId(
  marketplace: OfferMarketplace,
  externalId: string | null | undefined
): string | null {
  const trimmed = trimToNull(externalId);
  if (!trimmed) return null;
  return marketplace === 'manual' ? trimmed.toLowerCase() : trimmed;
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
