export interface CaptureErrorOptions {
  code: string;
  safeMessage: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class CaptureError extends Error {
  readonly code: string;
  readonly safeMessage: string;
  readonly details: Record<string, unknown> | undefined;
  override readonly cause?: unknown;

  constructor(message: string, options: CaptureErrorOptions) {
    super(message);
    this.name = 'CaptureError';
    this.code = options.code;
    this.safeMessage = options.safeMessage;
    this.details = options.details;
    this.cause = options.cause;
  }
}

export class ConnectorError extends CaptureError {
  constructor(message: string, options: Omit<CaptureErrorOptions, 'code'> & { code?: string }) {
    super(message, {
      ...options,
      code: options.code ?? 'CONNECTOR_ERROR'
    });
    this.name = 'ConnectorError';
  }
}

export class ValidationError extends CaptureError {
  constructor(message: string, options: Omit<CaptureErrorOptions, 'code'> & { code?: string }) {
    super(message, {
      ...options,
      code: options.code ?? 'VALIDATION_ERROR'
    });
    this.name = 'ValidationError';
  }
}

export class NormalizationError extends CaptureError {
  constructor(message: string, options: Omit<CaptureErrorOptions, 'code'> & { code?: string }) {
    super(message, {
      ...options,
      code: options.code ?? 'NORMALIZATION_ERROR'
    });
    this.name = 'NormalizationError';
  }
}

export class DeduplicationError extends CaptureError {
  constructor(message: string, options: Omit<CaptureErrorOptions, 'code'> & { code?: string }) {
    super(message, {
      ...options,
      code: options.code ?? 'DEDUPLICATION_ERROR'
    });
    this.name = 'DeduplicationError';
  }
}

export class ScoreError extends CaptureError {
  constructor(message: string, options: Omit<CaptureErrorOptions, 'code'> & { code?: string }) {
    super(message, {
      ...options,
      code: options.code ?? 'SCORE_ERROR'
    });
    this.name = 'ScoreError';
  }
}

export class PipelineError extends CaptureError {
  constructor(message: string, options: Omit<CaptureErrorOptions, 'code'> & { code?: string }) {
    super(message, {
      ...options,
      code: options.code ?? 'PIPELINE_ERROR'
    });
    this.name = 'PipelineError';
  }
}

export function toCaptureError(error: unknown): CaptureError {
  if (error instanceof CaptureError) return error;
  return new PipelineError('Unexpected capture pipeline failure.', {
    safeMessage: 'Falha inesperada no pipeline de captura.',
    details: { errorType: error instanceof Error ? error.name : typeof error },
    cause: error
  });
}
