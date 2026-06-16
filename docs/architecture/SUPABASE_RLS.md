# Supabase Auth, RBAC e RLS

## Principios obrigatorios

1. RLS habilitado em todas as tabelas do schema exposto `public`.
2. Permissao de UI nunca substitui validacao no servidor ou no banco.
3. `service_role`/secret key nunca chega ao browser.
4. Papel vem de `workspace_members`, nao de metadata editavel pelo usuario.
5. Funcoes `security definer` ficam em `app_private`, schema nao exposto.
6. Views expostas devem respeitar RLS; preferir consultas diretas no MVP.
7. Toda policy filtra pelo workspace ativo e membership `active`.
8. `UPDATE` recebe policies de `SELECT` e `UPDATE`.
9. Tabelas append-only nao permitem update/delete por clientes autenticados.

## Modelo de Auth

### Admin e Editor

- Criados/convidados por Admin.
- Admin atribui papel em `workspace_members`.
- Mudanca de papel gera audit log.
- Usuario suspenso continua existindo no Auth, mas RLS bloqueia o workspace.

### Public Visitor

- Nao autentica e nao possui `auth.users`, perfil ou membership.
- Nao recebe acesso direto a tabelas internas.
- Acessa somente o Route Handler publico `/r/{shortCode}`, que resolve o
  redirect e registra clique de forma server-side.

### Sessao

- Next.js SSR usa cookies de sessao.
- Server Components e Server Actions validam usuario atual.
- Acoes sensiveis consultam membership no momento da operacao.
- Proxy/redirect de rota serve apenas para UX; nao e fronteira de seguranca.

## Funcoes auxiliares privadas

Assinaturas conceituais, a serem implementadas e testadas em migrations:

```sql
app_private.is_active_member(target_workspace_id uuid) returns boolean
app_private.has_role(target_workspace_id uuid, allowed_roles app_role[]) returns boolean
app_private.current_role(target_workspace_id uuid) returns app_role
app_private.assert_role(target_workspace_id uuid, allowed_roles app_role[]) returns void
app_private.claim_due_publications(worker_id text, batch_size int) returns setof publications
```

Regras:

- Fixar `search_path` explicitamente.
- Revogar execucao de funcoes privilegiadas de `anon`/`authenticated`, exceto
  helpers seguros usados por policies quando estritamente necessario.
- Helpers de policy nunca recebem `user_id` do cliente; usam `auth.uid()`.
- Funcoes de claim/jobs so podem ser chamadas por contexto server-only.

## Matriz RBAC

| Capacidade | Admin | Editor |
|---|---:|---:|
| Ler workspace, ofertas, snapshots, categorias, cupons, relatorios | Sim | Sim |
| Criar/alterar oferta via UI | Sim | Nao |
| Enviar oferta para revisao | Sim | Sim |
| Editar/aprovar/rejeitar post | Sim | Sim |
| Agendar/publicar/cancelar | Sim | Sim |
| Ler canais | Sim | Sim |
| Configurar/testar canais | Sim | Nao |
| Gerenciar categorias/cupons | Sim | Nao |
| Gerenciar membros | Sim | Nao |
| Ler logs de publicacoes relacionadas | Sim | Sim |
| Ler logs tecnicos completos/reprocessar | Sim | Nao |
| Ler audit logs | Sim | Nao |

## Policies por tabela

`WS_MEMBER` significa membership ativa no `workspace_id`. Todas as policies
incluem essa condicao.

### `workspaces`

- `SELECT`: Admin e Editor membros ativos do proprio workspace.
- `INSERT/UPDATE/DELETE`: negado ao cliente no MVP.
- Alteracoes administrativas futuras passam por server-only.

### `profiles`

- `SELECT own`: usuario le proprio perfil.
- `SELECT workspace`: Admin le perfis de membros do proprio workspace; Editor
  nao precisa listar perfis no MVP.
- `UPDATE own`: usuario altera somente `display_name` e `avatar_url`, com colunas
  permitidas validadas no servidor.
- `INSERT/DELETE`: negado; lifecycle por Auth/rotina privilegiada.

### `workspace_members`

- `SELECT`: Admin le todos do workspace; qualquer usuario le a propria membership.
- `INSERT/UPDATE`: negado pelo Data API; Server Action Admin usa operacao
  privilegiada apos verificar papel e gera auditoria.
- `DELETE`: negado; usar suspensao para preservar auditoria.
- Protecao: ultimo Admin ativo nao pode ser suspenso/rebaixado.

### `categories`

- `SELECT`: WS_MEMBER.
- `INSERT/UPDATE`: Admin.
- `DELETE`: negado no MVP; desativar com `is_active`.

### `tags` e `offer_tags`

- `SELECT`: WS_MEMBER.
- `INSERT/UPDATE`: Admin.
- Editor usa tags existentes em fluxos de edicao, mas nao as gerencia.
- `DELETE`: negar exclusao fisica de tags; desativar. Vinculos podem ser
  alterados por Admin/Editor por Server Action validada.

### `offers`

- `SELECT`: WS_MEMBER.
- `INSERT`: Admin quando entrada manual via cliente autenticado; preferencia e
  Server Action com validacao. Jobs usam contexto privilegiado.
- `UPDATE`: Admin para dados completos; Editor somente transicoes editoriais
  autorizadas via Server Action/RPC controlada, nao update generico.
- `DELETE`: negado.

### `price_snapshots`

- `SELECT`: WS_MEMBER.
- `INSERT`: somente jobs/server-only.
- `UPDATE/DELETE`: negado, append-only.

### `coupons`

- `SELECT`: WS_MEMBER.
- `INSERT/UPDATE`: Admin, embora gerenciamento completo seja pÃ³s-MVP.
- `DELETE`: negado; desativar.

### `integration_sources`

- `SELECT`: Admin.
- `INSERT/UPDATE`: somente Admin via Server Action ou job server-only.
- Editor sem policy.
- Nenhum segredo pode existir em `public_config`.
- `DELETE`: negado; desconectar/desativar preserva historico.

### `post_drafts`

- `SELECT`: WS_MEMBER.
- `INSERT/UPDATE`: Admin e Editor.
- Restringir transicoes de status e campos sensiveis a Server Actions:
  - Editor/Admin: editar draft, aprovar e rejeitar.
  - `approved_by` deve ser `auth.uid()` e `approved_at` server-generated.
- `DELETE`: negado; preservar historico.

### `publication_channels`

- `SELECT`: Admin e Editor.
- `INSERT/UPDATE`: somente Admin via Server Action.
- Nao possui colunas de segredo no schema `public`.
- `DELETE`: negado; usar paused/disconnected.

### `publications`

- `SELECT`: WS_MEMBER para sustentar agenda e relatorios aprovados.
- `INSERT`: Admin e Editor via Server Action, somente para post aprovado.
- `UPDATE`: Admin/Editor apenas para reagendar/cancelar/publicar agora via Server
  Action; campos de execucao (`locked_at`, attempts, external id, erro) somente
  jobs server-only.
- `DELETE`: negado.

### `redirect_links`

- `SELECT`: WS_MEMBER.
- `INSERT/UPDATE`: server-only ao criar/cancelar publicacao.
- `DELETE`: negado.
- Resolucao publica de `short_code` acontece por Route Handler privilegiado,
  sem policy anonima de leitura ampla.

### `click_events`

- `SELECT`: WS_MEMBER para relatorios.
- `INSERT`: somente Route Handler server-only.
- `UPDATE/DELETE`: negado, append-only.

### `job_runs`

- `SELECT`: Admin; Editor le somente jobs ligados a publicacoes por contrato de
  API filtrado, sem acesso generico pelo Data API.
- `INSERT/UPDATE`: jobs server-only.
- `DELETE`: negado.

### `automation_logs`

- `SELECT Admin`: todos do workspace.
- `SELECT Editor`: somente linhas com `publication_id` nao nulo e publicacao
  pertencente ao workspace.
- `INSERT`: jobs/server-only.
- `UPDATE/DELETE`: negado.
- Detalhes tecnicos devem estar mascarados antes da insercao.

### `audit_logs`

- `SELECT`: Admin do workspace.
- `INSERT`: somente funcoes/Server Actions privilegiadas.
- `UPDATE/DELETE`: negado para todos os clientes, inclusive Admin.
- A aba "Atividade" da oferta recebe por API server-side somente um subconjunto
  editorial sanitizado.

## Tabelas expostas e grants

- Conceder a `authenticated` apenas operacoes exigidas pela aplicacao.
- `anon` acessa somente o Route Handler publico de redirect; nao recebe acesso
  direto a tabelas de negocio.
- RLS e grants sao camadas complementares.
- Verificar configuracao do Data API em cada ambiente antes do deploy.

## Uso da chave privilegiada

Permitido somente em processos server-only:

- Lifecycle de convite/membership que exige Auth Admin API.
- Jobs de captura, snapshots e publicacao.
- Redirect de clique.
- Escrita de audit/automation logs.

Regras:

- Nunca importar cliente privilegiado em modulo compartilhado com browser.
- Inicializar sob demanda dentro de funcoes server-only.
- Nunca logar a chave, headers de autorizacao ou token Telegram.
- Jobs exigem segredo interno, validacao de origem quando disponivel e rate limit.
- Operacao privilegiada ainda deve verificar workspace e invariantes.

## Validacao de permissao no servidor

Cada Server Action sensivel segue:

1. Obter usuario autenticado pelo Supabase server client.
2. Resolver `workspace_id` permitido, nunca confiar apenas no body.
3. Consultar membership ativa.
4. Verificar papel/capacidade exigida.
5. Validar input com Zod.
6. Executar mutacao com transacao/RPC quando houver multiplos registros.
7. Gravar audit log na mesma transacao quando possivel.
8. Retornar erro estavel sem expor SQL, token ou payload sensivel.

## Testes RLS obrigatorios

- Cada tabela: anon/Public Visitor, Editor, Admin e usuario de outro workspace.
- Leitura, insercao, update e delete conforme matriz.
- Public Visitor tentando acessar qualquer tabela/API interna.
- Editor tentando configurar canal, gerenciar membro e ver log completo.
- Admin de workspace A tentando acessar workspace B.
- Usuario suspenso tentando ler e escrever.
- Update sem SELECT policy e tentativas de alterar `workspace_id`.
- Cliente tentando inserir audit/click/job log diretamente.
