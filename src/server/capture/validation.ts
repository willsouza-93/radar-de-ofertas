import { ValidationError } from './errors';
import type { CaptureContext, NormalizedOffer, RawOffer } from './types';

export interface ValidationIssue {
  field: string;
  code: string;
  safeMessage: string;
}

export function validateRawOffer(rawOffer: RawOffer, context?: CaptureContext): void {
  const issues: ValidationIssue[] = [];

  if (rawOffer.contractVersion !== 'capture-v1') {
    issues.push({
      field: 'contractVersion',
      code: 'UNSUPPORTED_CONTRACT_VERSION',
      safeMessage: 'Versao de contrato de captura nao suportada.'
    });
  }

  if (!rawOffer.connectorId.trim()) {
    issues.push({
      field: 'connectorId',
      code: 'CONNECTOR_ID_REQUIRED',
      safeMessage: 'Conector de captura obrigatorio.'
    });
  }

  if (!rawOffer.connectorVersion.trim()) {
    issues.push({
      field: 'connectorVersion',
      code: 'CONNECTOR_VERSION_REQUIRED',
      safeMessage: 'Versao do conector obrigatoria.'
    });
  }

  if (context && rawOffer.connectorId !== context.connectorId) {
    issues.push({
      field: 'connectorId',
      code: 'CONNECTOR_CONTEXT_MISMATCH',
      safeMessage: 'Conector do item nao corresponde ao contexto de captura.'
    });
  }

  if (context && rawOffer.connectorVersion !== context.connectorVersion) {
    issues.push({
      field: 'connectorVersion',
      code: 'CONNECTOR_VERSION_CONTEXT_MISMATCH',
      safeMessage: 'Versao do conector nao corresponde ao contexto de captura.'
    });
  }

  if (!rawOffer.title.trim()) {
    issues.push({
      field: 'title',
      code: 'TITLE_REQUIRED',
      safeMessage: 'Titulo da oferta obrigatorio.'
    });
  }

  if (!rawOffer.sourceUrl.trim()) {
    issues.push({
      field: 'sourceUrl',
      code: 'SOURCE_URL_REQUIRED',
      safeMessage: 'URL fonte obrigatoria.'
    });
  }

  if (issues.length > 0) throwValidationError(issues);
}

export function validateNormalizedOffer(offer: NormalizedOffer): void {
  const issues: ValidationIssue[] = [];

  if (!offer.workspaceId.trim()) {
    issues.push({
      field: 'workspaceId',
      code: 'WORKSPACE_REQUIRED',
      safeMessage: 'Workspace obrigatorio.'
    });
  }

  if (offer.title.trim().length < 3) {
    issues.push({
      field: 'title',
      code: 'TITLE_TOO_SHORT',
      safeMessage: 'Titulo deve ter pelo menos 3 caracteres.'
    });
  }

  if (offer.title.trim().length > 500) {
    issues.push({
      field: 'title',
      code: 'TITLE_TOO_LONG',
      safeMessage: 'Titulo deve ter no maximo 500 caracteres.'
    });
  }

  if (offer.currentPrice < 0) {
    issues.push({
      field: 'currentPrice',
      code: 'PRICE_NEGATIVE',
      safeMessage: 'Preco atual deve ser positivo.'
    });
  }

  if (offer.previousPrice !== null && offer.previousPrice !== undefined && offer.previousPrice < 0) {
    issues.push({
      field: 'previousPrice',
      code: 'PREVIOUS_PRICE_NEGATIVE',
      safeMessage: 'Preco anterior deve ser positivo.'
    });
  }

  if (offer.currency !== 'BRL') {
    issues.push({
      field: 'currency',
      code: 'UNSUPPORTED_CURRENCY',
      safeMessage: 'Moeda nao suportada.'
    });
  }

  if (offer.discountPercent !== null && offer.discountPercent !== undefined) {
    if (offer.discountPercent < 0 || offer.discountPercent > 100) {
      issues.push({
        field: 'discountPercent',
        code: 'DISCOUNT_OUT_OF_RANGE',
        safeMessage: 'Desconto deve estar entre 0 e 100.'
      });
    }
  }

  if (offer.couponCode && offer.couponCode.length > 80) {
    issues.push({
      field: 'couponCode',
      code: 'COUPON_CODE_TOO_LONG',
      safeMessage: 'Cupom deve ter no maximo 80 caracteres.'
    });
  }

  if (!offer.dedupeKey.trim()) {
    issues.push({
      field: 'dedupeKey',
      code: 'DEDUPE_KEY_REQUIRED',
      safeMessage: 'Chave de deduplicacao obrigatoria.'
    });
  }

  if (issues.length > 0) throwValidationError(issues);
}

function throwValidationError(issues: ValidationIssue[]): never {
  throw new ValidationError('Capture validation failed.', {
    code: 'CAPTURE_VALIDATION_FAILED',
    safeMessage: 'Dados de captura invalidos.',
    details: { issues }
  });
}
