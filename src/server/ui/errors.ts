export function getHumanErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Nao foi possivel concluir a acao.';

  const messageByCode: Record<string, string> = {
    UNAUTHENTICATED: 'Entre novamente para continuar.',
    FORBIDDEN: 'Seu perfil nao tem acesso a esta acao.',
    NOT_FOUND: 'Este item nao foi encontrado ou nao pertence ao seu workspace.',
    VALIDATION_ERROR: 'Revise os campos destacados.',
    VERSION_CONFLICT: 'Esta oferta foi atualizada por outra acao. Recarregue antes de continuar.',
    INVALID_TRANSITION: 'Esta oferta ja foi decidida e nao aceita novas alteracoes.',
    MULTIPLE_WORKSPACES_NOT_SUPPORTED:
      'Sua conta esta vinculada a mais de um workspace. A selecao de workspace ainda nao faz parte do MVP.'
  };

  return messageByCode[error.message] ?? messageByCode[(error as { code?: string }).code ?? ''] ?? error.message;
}

export function getActionErrorMessage(code: string | string[] | undefined): string | null {
  const value = Array.isArray(code) ? code[0] : code;
  const messages: Record<string, string> = {
    VERSION_CONFLICT: 'Esta oferta foi atualizada por outra acao. Recarregue antes de continuar.',
    FORBIDDEN: 'Seu perfil nao tem acesso a esta acao.',
    NOT_FOUND: 'Este item nao foi encontrado ou nao pertence ao seu workspace.',
    VALIDATION_ERROR: 'Revise os campos destacados.',
    PUBLICATION_BLOCKED: 'Publicacao bloqueada por regra operacional.',
    ACTION_FAILED: 'Nao foi possivel concluir a acao. Recarregue e tente novamente.'
  };

  return value ? messages[value] ?? null : null;
}
