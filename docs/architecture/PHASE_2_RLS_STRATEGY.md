# Estrategia RLS da Fase 2

Status: especificacao para policies futuras.

## Principios

- Respeitar helpers da Fase 1 em `app_private`.
- Todas as tabelas novas ficam em `public` com RLS habilitado.
- `anon`/Public Visitor nao recebe acesso direto.
- Toda policy filtra `workspace_id`.
- Usuario suspenso perde acesso.
- Usuario de outro workspace nao ve nem altera dados.
- `DELETE` fisico fica negado no MVP.
- `price_snapshots` e append-only.

## Helpers existentes

Usar os helpers da Fase 1:

- `app_private.is_active_member(workspace_id)`
- `app_private.has_role(workspace_id, allowed_roles)`
- `app_private.current_role(workspace_id)`
- `app_private.assert_role(workspace_id, allowed_roles)`

Nao criar novos helpers se os existentes forem suficientes.

## Grants minimos

`anon`:

- Sem grants em `categories`, `tags`, `offers`, `offer_tags`,
  `price_snapshots`.

`authenticated`:

- `SELECT` nas tabelas novas, controlado por RLS.
- `INSERT/UPDATE` somente onde a Fase 2 precisa de Admin.
- Sem `DELETE`.

## Policies por tabela

### `categories`

- `SELECT`: Admin e Editor membros ativos do workspace.
- `INSERT`: Admin ativo do workspace.
- `UPDATE`: Admin ativo do workspace.
- `DELETE`: negado.

### `tags`

- `SELECT`: Admin e Editor membros ativos do workspace.
- `INSERT`: Admin ativo do workspace.
- `UPDATE`: Admin ativo do workspace.
- `DELETE`: negado.

### `offers`

- `SELECT`: Admin e Editor membros ativos do workspace.
- `INSERT`: Admin ativo do workspace.
- `UPDATE`: Admin ativo do workspace para dados manuais da Fase 2.
- `DELETE`: negado.

Observacao: Editor nao captura nem edita oferta manual na Fase 2. Editor apenas
le e usa os dados para curadoria futura.

### `offer_tags`

- `SELECT`: Admin e Editor membros ativos do workspace.
- `INSERT`: Admin ativo do workspace.
- `DELETE`: Admin ativo do workspace pode remover vinculo se necessario.
- `UPDATE`: negado; alterar tag usa delete/insert do vinculo.

Excecao: este e o unico delete permitido na Fase 2, por ser tabela de vinculo e
nao apagar oferta/tag. A implementacao pode preferir substituir vinculos em
Server Action validada.

### `price_snapshots`

- `SELECT`: Admin e Editor membros ativos do workspace.
- `INSERT`: Admin ativo do workspace durante captura manual.
- `UPDATE`: negado.
- `DELETE`: negado.

## Comportamento esperado por papel

### Admin

- Le categorias, tags, ofertas e snapshots do proprio workspace.
- Cria/edita categorias e tags.
- Captura/atualiza oferta manual.
- Vincula/desvincula tags.
- Cria snapshot durante captura quando necessario.
- Nao acessa outro workspace.
- Nao apaga oferta ou snapshot.

### Editor

- Le categorias, tags, ofertas e snapshots do proprio workspace.
- Usa filtros, listagem e detalhe.
- Nao cria/edita categorias ou tags.
- Nao captura/edita oferta manual.
- Nao cria snapshots.
- Nao acessa outro workspace.

### Usuario suspenso

- Nao le nem escreve qualquer tabela da Fase 2.
- Pode receber mensagem amigavel no servidor/UI com base na propria membership
  conforme Fase 1, mas sem acesso ao dominio de ofertas.

### Usuario de outro workspace

- Recebe resultado vazio ou `404/403` sem vazamento de existencia.
- Nao pode inferir categorias, tags, ofertas ou snapshots alheios.

### `anon` / Public Visitor

- Sem acesso direto.
- A Fase 2 nao cria site publico nem redirect.

## Cenarios de bloqueio obrigatorios

- `anon` seleciona `offers`: zero acesso.
- Editor tenta `insert offers`: bloqueado.
- Editor tenta `update categories`: bloqueado.
- Suspenso tenta `select offers`: bloqueado.
- Admin workspace A tenta selecionar oferta workspace B: bloqueado.
- Cliente tenta trocar `workspace_id` em update: bloqueado.
- Cliente tenta apagar snapshot: bloqueado.

## Testes RLS obrigatorios

Criar testes SQL para:

- Admin A, Editor A, Suspenso A, Admin B e anon.
- `SELECT/INSERT/UPDATE/DELETE` por tabela.
- Insercao com `workspace_id` divergente.
- Oferta com categoria de outro workspace.
- Tag de outro workspace em `offer_tags`.
- Snapshot de oferta de outro workspace.
- Grants diretos de `anon` ausentes.

## Auditoria de seguranca

Antes do merge da Fase 2B:

- Verificar RLS habilitado em todas as tabelas novas.
- Verificar policies por operacao.
- Verificar que `anon` nao tem grants.
- Verificar que `authenticated` nao tem delete amplo.
- Verificar que `service_role` nao foi introduzida no frontend.
