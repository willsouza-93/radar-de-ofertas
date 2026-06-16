# Modelo de identidade da Fase 1

## Principios

- Supabase Auth gerencia credenciais, sessoes e recuperacao de senha.
- Autorizacao nao usa `user_metadata`.
- `workspace_members` e a fonte de role/status.
- Roles internas: `admin` e `editor`.
- Public Visitor e anonimo e nao possui usuario, perfil ou membership.
- O MVP opera um workspace inicial, mantendo `workspace_id` para isolamento.

## Entidades

### `auth.users`

Responsabilidade:

- identidade autenticavel gerenciada pelo Supabase Auth;
- email, credenciais, confirmacao/invite e sessoes;
- recuperacao de senha.

Regras:

- somente Admin e Editor sao provisionados;
- nao existe signup publico;
- Public Visitor nao gera registro;
- exclusao nao e o mecanismo de suspensao;
- role nao e armazenada como fonte de verdade em metadata.

Lifecycle esperado:

```text
Provisionado/convidado
  -> auth.users criado
  -> profiles criado
  -> workspace_members criado
  -> usuario autentica
  -> membership ativa permite acesso
```

### `profiles`

Responsabilidade:

- dados de apresentacao do usuario interno;
- relacao 1:1 com `auth.users`.

Campos aprovados:

- `id`: mesmo UUID de `auth.users`;
- `display_name`;
- `avatar_url`;
- `created_at`;
- `updated_at`.

Regras:

- criado automaticamente quando o usuario Auth e criado;
- somente dados nao autorizativos;
- usuario pode ler/editar o proprio perfil conforme policy;
- Admin pode ler perfis de membros do proprio workspace;
- exclusao acompanha o lifecycle do usuario Auth.

### `workspaces`

Responsabilidade:

- fronteira de isolamento dos dados internos;
- configuracao basica do tenant.

Campos aprovados:

- `id`;
- `name`;
- `slug`;
- `timezone`;
- timestamps.

Regras:

- um workspace inicial no MVP;
- estrutura suporta segundo workspace para testes de isolamento;
- nenhum Public Visitor pertence ao workspace;
- clientes autenticados nao criam/editam/excluem workspace diretamente.

### `workspace_members`

Responsabilidade:

- associar usuario interno ao workspace;
- armazenar role e status autorizativos.

Campos aprovados:

- `workspace_id`;
- `user_id`;
- `role`: `admin` ou `editor`;
- `status`: `active`, `suspended` ou `invited`;
- `invited_by`;
- timestamps.

Regras:

- chave composta `(workspace_id, user_id)`;
- role e status obrigatorios;
- membership ativa e necessaria para acessar dados do workspace;
- suspensao preserva historico e bloqueia acesso;
- mutacoes de membership nao ficam expostas diretamente ao cliente;
- ultimo Admin ativo nao pode ser suspenso/rebaixado.

### Roles

#### Admin

- acesso completo ao backoffice do proprio workspace;
- pode provisionar/convidar, alterar papel e suspender membros;
- pode configurar integracoes/canais e consultar logs completos.

#### Editor

- acesso operacional ao backoffice do proprio workspace;
- pode ler ofertas/relatorios, editar, aprovar e agendar;
- nao gerencia membros, integracoes ou configuracoes exclusivas de Admin.

#### Public Visitor

- ator externo, nao uma role;
- nao autentica;
- nao pertence a workspace;
- nao acessa tabelas internas;
- no MVP, acessa apenas ofertas em canais externos e `/r/{shortCode}`.

## Relacionamentos

```text
auth.users
  1
  |
  | id = profiles.id
  |
  1
profiles
  1
  |
  | user_id
  |
  N
workspace_members
  N
  |
  | workspace_id
  |
  1
workspaces
```

## Diagrama de atores

```text
Public Visitor (anon)
  -> sem auth.users
  -> sem profiles
  -> sem workspace_members
  -> sem workspace
  -> somente /r/{shortCode}

Admin / Editor
  -> auth.users
  -> profiles
  -> workspace_members(role, status)
  -> workspace
  -> dados internos protegidos por RLS
```

## Fluxos de identidade

### Bootstrap do Admin inicial

```text
Operador autorizado
  -> cria usuario Auth interno
  -> sincronizacao cria profile
  -> cria workspace inicial
  -> cria membership admin active
  -> valida login e RLS
```

Nao usar seed de producao com senha fixa.

### Provisionamento de Editor

```text
Admin
  -> inicia convite/provisionamento
  -> auth.users criado/convidado
  -> profile criado
  -> membership editor criada
  -> Editor autentica
  -> acesso limitado por RLS
```

### Suspensao

```text
Admin suspende membership
  -> workspace_members.status = suspended
  -> RLS bloqueia acesso ao workspace
  -> auth.users e profile permanecem
```

Sessoes existentes nao devem conceder acesso porque policies consultam a
membership atual.

## Invariantes

1. Todo `profiles.id` referencia um `auth.users.id`.
2. Toda membership referencia profile e workspace existentes.
3. Nenhuma membership aceita role diferente de Admin/Editor.
4. Nenhum Public Visitor possui membership.
5. Usuario sem membership ativa nao acessa dados do workspace.
6. Role/status nao sao decididos por metadata controlavel pelo usuario.
7. Um workspace nunca fica sem Admin ativo por acao administrativa.

## Decisoes pendentes

- Identidades iniciais por ambiente.
- Semantica exata de ativacao de membership `invited`.
- Slug definitivo do workspace inicial.
