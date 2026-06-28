import type { PublicationFailureCategory } from './types';

export interface PublicationErrorOptions {
  code: string;
  safeMessage: string;
  category: PublicationFailureCategory;
  retryable?: boolean;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class PublicationError extends Error {
  readonly code: string;
  readonly safeMessage: string;
  readonly category: PublicationFailureCategory;
  readonly retryable: boolean;
  readonly details: Record<string, unknown> | undefined;
  override readonly cause?: unknown;

  constructor(message: string, options: PublicationErrorOptions) {
    super(message);
    this.name = 'PublicationError';
    this.code = options.code;
    this.safeMessage = options.safeMessage;
    this.category = options.category;
    this.retryable = options.retryable ?? false;
    this.details = sanitizeErrorDetails(options.details);
    this.cause = options.cause;
  }
}

export class PolicyError extends PublicationError {
  constructor(message: string, options: Omit<PublicationErrorOptions, 'category'>) {
    super(message, { ...options, category: 'policy' });
    this.name = 'PolicyError';
  }
}

export class TemplateError extends PublicationError {
  constructor(message: string, options: Omit<PublicationErrorOptions, 'category'>) {
    super(message, { ...options, category: 'template' });
    this.name = 'TemplateError';
  }
}

export class PublisherError extends PublicationError {
  constructor(message: string, options: Omit<PublicationErrorOptions, 'category'> & { category?: PublicationFailureCategory }) {
    super(message, { ...options, category: options.category ?? 'publisher' });
    this.name = 'PublisherError';
  }
}

export class RetryError extends PublicationError {
  constructor(message: string, options: Omit<PublicationErrorOptions, 'category'>) {
    super(message, { ...options, category: 'retry' });
    this.name = 'RetryError';
  }
}

export function toPublicationError(error: unknown): PublicationError {
  if (error instanceof PublicationError) return error;

  return new PublicationError('Unexpected publication failure.', {
    code: 'PUBLICATION_UNEXPECTED_ERROR',
    safeMessage: 'Falha inesperada no dominio de publicacao.',
    category: 'permanent',
    retryable: false,
    details: { errorType: error instanceof Error ? error.name : typeof error },
    cause: error
  });
}

function sanitizeErrorDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[redacted]';
      continue;
    }
    sanitized[key] = sanitizeErrorValue(value);
  }

  return sanitized;
}

function sanitizeErrorValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeErrorValue(item));

  if (value && typeof value === 'object') {
    return sanitizeErrorDetails(value as Record<string, unknown>);
  }

  return value;
}

function isSensitiveKey(key: string): boolean {
  return /token|secret|password|authorization|cookie|api[-_]?key/i.test(key);
}
