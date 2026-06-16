# Estrategia RLS da Fase 1

## Objetivo

Garantir isolamento por workspace e menor privilegio para Admin e Editor,
mantendo Public Visitor/`anon` sem acesso direto a tabelas internas.

## Principios

- RLS habilitada em toda tabela exposta no schema `public`.
- Grants e RLS sao camadas complementares.
- Policies usam `auth.uid()` e membership ativa.
- Roles/status vem de `workspace_members`, nunca de `user_metadata`.
- Funcoes `security definer` ficam em schema privado, com `search_path` fixo.
- UPDATE exige policy de SELECT correspondente.
- Mutacoes administrativas sensiveis nao usam update generico pelo cliente.

## Helpers necessarios

Assinaturas conceituais, sem implementacao:

| Helper privado | Finalidade |
|---|---|
| `is_active_member(workspace_id)` | Confirma membership ativa do usuario atual |
| `current_role(workspace_id)` | Retorna role atual ou vazio |
| `has_role(workspace_id, allowed_roles)` | Verifica Admin/Editor permitidos |
| `can_view_profile(target_user_id)` | Permite proprio perfil ou Admin do workspace compartilhado |
| `assert_role(workspace_id, allowed_roles)` | Bloqueia operacoes privilegiadas/RPC futuras |

Regras dos helpers:

- nunca recebem `user_id` do chamador;
- usam somente `auth.uid()`;
- nao ficam no schema exposto;
- execucao revogada por padrao e concedida apenas quando necessaria Ã s policies;
- evitam recursao de policies em `workspace_members`.

## Politicas por tabela

### `profiles`

SELECT:

- Admin/Editor podem ler o proprio perfil.
- Admin pode ler perfis de membros do proprio workspace.
- Editor nao lista perfis de outros membros.
- `anon` nao le.

UPDATE:

- usuario autenticado pode atualizar somente o proprio perfil;
- campos autorizativos nao existem nessa tabela;
- Admin nao edita perfil de outro usuario no MVP.

INSERT/DELETE:

- negados ao cliente;
- lifecycle controlado pelo provisionamento/Auth.

### `workspaces`

SELECT:

- Admin/Editor com membership ativa podem ler o proprio workspace.
- usuario suspenso, outro workspace e `anon` nao leem.

INSERT/UPDATE/DELETE:

- negados ao cliente no MVP;
- bootstrap/provisionamento ocorre em contexto server-only controlado.

### `workspace_members`

SELECT:

- Admin pode listar memberships do proprio workspace.
- Editor pode ler somente a propria membership.
- suspenso nao lista workspace/membros; acesso minimo Ã  propria membership
  suspensa deve ser decidido antes da implementacao.
- outro workspace e `anon` nao leem.

INSERT/UPDATE/DELETE:

- negados ao cliente autenticado;
- operacoes administrativas passam por servidor privilegiado apos verificar
  Admin e invariantes;
- exclusao fisica nao e usada; suspensao preserva historico.

## Acesso publico

Public Visitor/`anon`:

- nao possui policy de SELECT/INSERT/UPDATE/DELETE em tabelas internas;
- nao recebe grants de Data API para identidade;
- acessa `/r/{shortCode}` por Route Handler server-side;
- nao consulta `redirect_links` ou `click_events` diretamente.

## Cenarios de acesso permitido

| Ator | Cenario | Resultado |
|---|---|---|
| Admin A ativo | Le workspace A | Permitido |
| Admin A ativo | Lista members/perfis do workspace A | Permitido |
| Admin A ativo | Le/atualiza proprio perfil | Permitido |
| Editor A ativo | Le workspace A | Permitido |
| Editor A ativo | Le propria membership/perfil | Permitido |
| Editor A ativo | Atualiza proprio perfil | Permitido |
| Public Visitor | Acessa `/r/{shortCode}` | Permitido via Route Handler |

## Cenarios de bloqueio

| Ator | Cenario | Resultado |
|---|---|---|
| `anon` | Le qualquer tabela interna | Bloqueado |
| `anon` | Insere profile/membership/workspace | Bloqueado |
| Editor A | Lista todos os membros/perfis | Bloqueado |
| Editor A | Altera role/status | Bloqueado |
| Admin A | Le workspace/membros B | Bloqueado |
| Suspenso A | Le workspace A | Bloqueado |
| Usuario sem membership | Le workspace | Bloqueado |
| Qualquer autenticado | Altera proprio role/workspace_id | Bloqueado |
| Qualquer cliente | Cria/exclui workspace | Bloqueado |

## Testes obrigatorios

### Por tabela

Para `profiles`, `workspaces` e `workspace_members`, testar:

- SELECT permitido;
- SELECT bloqueado;
- INSERT bloqueado;
- UPDATE permitido quando aplicavel;
- UPDATE bloqueado para colunas/linhas proibidas;
- DELETE bloqueado;
- tentativa de alterar `workspace_id`, `user_id`, `role` e `status`.

### Por ator

- Admin A;
- Editor A;
- `anon`/Public Visitor;
- usuario suspenso A;
- Admin B de outro workspace;
- usuario autenticado sem membership.

### Configuracao

- RLS habilitada em todas as tabelas;
- grants minimos;
- helpers fora do schema exposto;
- `search_path` fixo;
- ausencia de dependencia em `user_metadata`;
- nenhuma view exposta que ignore RLS;
- UPDATE acompanhado de SELECT policy.

## Gate de aceite

- Zero acesso cruzado entre workspaces.
- Zero acesso interno por `anon`.
- Editor nao executa capacidade exclusiva de Admin.
- Suspensao bloqueia dados do workspace mesmo com sessao existente.
- Matriz `PHASE_1_TEST_MATRIX.md` passa integralmente.

## Duvida pendente

Definir se usuario suspenso pode ler a propria membership com status `suspended`
para exibir mensagem especifica, ou se todo acesso de dados deve retornar
bloqueado. A recomendacao e permitir que o servidor identifique a suspensao sem
expor outras linhas do workspace.
