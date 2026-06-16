# Rollback da Fase 1

## Regra geral

- Local/teste: usar `supabase db reset` e reaplicar toda a cadeia.
- Staging/producao: preferir migration corretiva para frente.
- Nunca editar ou remover migration ja aplicada em ambiente compartilhado.
- Nunca remover registros de `auth.users` automaticamente como rollback.

## Dependencias para reversao controlada

Se uma reversao destrutiva for excepcionalmente aprovada, executar na ordem
inversa:

1. revogar grants;
2. remover policies e desabilitar RLS somente dentro da janela controlada;
3. remover helpers privados;
4. remover trigger de provisionamento;
5. remover triggers e tabelas de identidade;
6. remover enums e schema privado.

Antes de qualquer reversao destrutiva:

- confirmar backup restauravel;
- bloquear alteracoes concorrentes;
- registrar aprovacao de Willian Cesar;
- preservar identidades Auth e evidencias operacionais.
