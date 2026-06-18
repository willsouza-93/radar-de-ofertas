export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CATEGORY_NOT_FOUND'
  | 'TAG_NOT_FOUND'
  | 'DUPLICATE_CONFLICT'
  | 'INVALID_TRANSITION'
  | 'VERSION_CONFLICT'
  | 'MULTIPLE_WORKSPACES_NOT_SUPPORTED';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: AppErrorCode,
    message: string,
    status: number,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    if (fieldErrors) {
      this.fieldErrors = fieldErrors;
    }
  }
}

export function forbidden(message = 'Acesso negado.'): AppError {
  return new AppError('FORBIDDEN', message, 403);
}

export function notFound(message = 'Recurso nao encontrado.'): AppError {
  return new AppError('NOT_FOUND', message, 404);
}

export function validationError(
  message: string,
  fieldErrors?: Record<string, string[]>
): AppError {
  return new AppError('VALIDATION_ERROR', message, 422, fieldErrors);
}
