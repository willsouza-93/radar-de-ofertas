# ADR - Viewer interno vs Public Visitor

## Status

**Aprovado e aplicado em 15 de junho de 2026.**

Este ADR registra a correcao de premissa aplicada aos documentos de Produto,
Arquitetura e Decisoes.

## 1. Contexto

### Premissa anterior

A documentacao atual assumiu que `Viewer` seria um usuario interno autenticado,
associado a um workspace e autorizado a acessar o backoffice em modo somente
leitura. Esse papel recebeu acesso a dashboard, ofertas, historico de precos,
agenda e relatorios, sem permissoes de edicao, aprovacao ou publicacao.

A premissa tambem introduziu:

- cadastro publico de Viewer;
- perfil e membership de Viewer no workspace;
- policies RLS de leitura para Viewer;
- telas e testes especificos para Viewer autenticado;
- bloqueadores e riscos relacionados ao cadastro publico no workspace.

### Definicao correta

Os papeis internos autenticados do MVP sao:

- `Admin`: acesso completo ao backoffice.
- `Editor`: acesso operacional para curadoria, edicao, aprovacao e agendamento.

O consumidor final e um `Public Visitor`:

- nao autenticado;
- nao pertence a workspace;
- nao acessa dashboard, relatorios, agenda, logs ou backoffice;
- nao precisa criar conta;
- visualiza ofertas publicadas em canais como Telegram;
- pode acessar futuramente uma area publica/site de promocoes;
- interage obrigatoriamente com o redirect publico `/r/{shortCode}`.

### Motivo da correcao

`Viewer` misturava dois conceitos diferentes:

1. acesso interno somente leitura ao backoffice;
2. consumidor final das promocoes publicadas.

Essa mistura aumentava escopo, superficie de ataque, complexidade de Auth/RLS e
risco de associar consumidores ao workspace interno. A correcao preserva o foco
MVP no fluxo operacional:

`Captura -> Curadoria -> Aprovacao -> Agendamento -> Publicacao`.

## 2. Decisao

Decisao aprovada:

1. Remover o papel interno `Viewer` do MVP.
2. Manter RBAC interno somente com `Admin` e `Editor`.
3. Tratar o consumidor final como `Public Visitor`, sem autenticacao e sem
   membership de workspace.
4. Manter `/r/{shortCode}` como superficie publica obrigatoria do MVP.
5. Manter a area publica/site de ofertas como pÃ³s-MVP, salvo decisao futura
   explicita em contrario.
6. Nao substituir `Viewer` por `Public Visitor` dentro do backoffice. O papel
   interno e removido; o visitante publico e um ator externo diferente.

## 3. Impactos em Produto/UX

- Remover cadastro publico Viewer do MVP.
- Remover acesso Viewer ao dashboard, ofertas, detalhe, historico, agenda,
  relatorios, categorias e demais areas internas.
- Remover estados, textos, faixas e bloqueios especificos de Viewer autenticado.
- Atualizar matrizes de permissao para conter apenas Admin e Editor.
- Manter login e recuperacao de senha somente para usuarios internos convidados
  ou provisionados.
- Manter foco do backoffice em Admin e Editor.
- Manter o consumo de promocoes nos canais de publicacao.
- Manter `/r/{shortCode}` publico.
- Nao adicionar site publico de promocoes ao MVP por efeito deste ADR.

## 4. Impactos em Arquitetura

### Roles e RBAC

- Alterar `app_role` de `admin | editor | viewer` para `admin | editor`.
- Remover defaults, contratos e validacoes que atribuem `viewer`.
- Remover Viewer das matrizes de permissoes e testes RBAC.

### Auth

- Remover cadastro publico e confirmacao de email para Viewer do escopo MVP.
- Manter login e recuperacao de senha para Admin e Editor.
- Provisionar usuarios internos por convite/fluxo administrativo.
- Public Visitor nao possui registro em `auth.users` por consumir promocoes.

### Workspace e memberships

- Remover associacao automatica de cadastro publico ao workspace.
- `workspace_members` passa a representar somente Admin e Editor.
- Public Visitor nunca recebe `workspace_id` ou membership.

### RLS e acesso publico

- Remover policies de leitura de Viewer nas tabelas internas.
- Manter tabelas de negocio protegidas para membros internos ativos.
- Manter `anon` sem acesso direto a tabelas internas.
- Manter `/r/{shortCode}` como Route Handler publico server-side, com acesso
  privilegiado controlado para resolver redirect e registrar clique.
- Um futuro site publico exigira contratos/public views/endpoints proprios e uma
  nova decisao de seguranca; nao deve reutilizar policies internas.

### APIs e contratos

- Remover respostas e comportamentos especificos para Viewer autenticado.
- Remover `viewer` de contratos de convite e alteracao de papel.
- Manter endpoints internos autenticados para Admin/Editor.
- Manter redirect publico sem autenticacao.

### Testes

- Remover fixtures e cenarios de Viewer autenticado.
- Manter testes de Admin, Editor, usuario suspenso, outro workspace e `anon`.
- Expandir testes de `anon` para provar que somente `/r/{shortCode}` e publico.
- Testar que Public Visitor nao acessa APIs/tabelas/backoffice.

### Backlog e Fase 1

- Remover cadastro Viewer, perfil publico e associacao automatica ao workspace.
- Remover o risco/bloqueador "cadastro publico concede workspace indevido".
- Simplificar Auth, seed, RLS e testes da Fase 1.
- Manter qualquer area publica de ofertas fora do MVP.

## 5. Itens revisados apos aprovacao

As revisoes abaixo foram aplicadas em 15 de junho de 2026.

### `docs/product`

- `docs/product/01-product-ux.md`
  - remover Viewer da navegacao por papel e dos fluxos internos;
  - manter navegacao interna apenas para Admin e Editor.
- `docs/product/03-screens.md`
  - remover cadastro de visualizador;
  - remover acoes/estados Viewer nas telas internas;
  - ajustar login para usuarios internos;
  - nao adicionar site publico.
- `docs/product/04-states-permissions-content.md`
  - remover Viewer da matriz e regras de interface;
  - manter estados de permissao entre Admin e Editor.
- `docs/product/05-development-handoff.md`
  - remover role `viewer`, rota de cadastro e criterios/testes Viewer.

`docs/product/02-design-system.md` nao possui impacto direto identificado.

### `docs/architecture`

- `docs/architecture/TECHNICAL_SPEC.md`
  - remover cadastro/Auth Viewer, acesso de leitura e gate de saida Viewer;
  - declarar Public Visitor como ator externo sem backoffice.
- `docs/architecture/DATABASE_SCHEMA.md`
  - remover `viewer` de `app_role` e default de membership.
- `docs/architecture/SUPABASE_RLS.md`
  - remover cadastro Viewer, policies e matriz Viewer;
  - manter `anon` limitado ao redirect publico controlado.
- `docs/architecture/API_CONTRACTS.md`
  - remover comportamentos Viewer e `viewer` dos contratos administrativos.
- `docs/architecture/TEST_PLAN.md`
  - remover testes Viewer autenticado e adicionar testes Public Visitor/anon.
- `docs/architecture/MVP_BACKLOG.md`
  - simplificar Fase 1 e remover entregas/aceites Viewer.

`docs/architecture/INTEGRATIONS.md`, `JOBS_AND_AUTOMATIONS.md` e o indice
`docs/architecture/README.md` nao possuem impacto direto identificado.

### `docs/decisions`

- `docs/decisions/PHASE_0_DECISIONS.md`
  - remover decisao pendente e bloqueador sobre cadastro publico Viewer;
  - registrar que o modelo correto foi decidido por este ADR.
- `docs/decisions/MVP_RISK_REGISTER.md`
  - remover risco e bloqueador de cadastro publico no workspace;
  - manter risco de acesso anonimo indevido Ã s superficies internas.

### `docs/spikes`

Nenhum documento atual em `docs/spikes` possui referencia direta a Viewer ou
cadastro publico. Nenhuma revisao foi necessaria nesta pasta.

## 6. Riscos

| Risco | Impacto | Mitigacao |
|---|---|---|
| Perder acesso interno somente leitura | Usuarios internos sem perfil de consulta dedicado | Admin/Editor cobrem o MVP; reavaliar com necessidade real |
| Necessidade futura de papel Analyst/ReadOnly | Nova revisao de RBAC, RLS e UX | Criar papel interno explicito em ADR futuro |
| Site publico pÃ³s-MVP exigir novo escopo | Novos endpoints, cache, SEO, moderacao e seguranca | Tratar como iniciativa separada |
| Expor dados internos ao tentar criar area publica | Vazamento de workspace, rascunhos ou logs | Nunca reutilizar policies internas para publico |
| Confundir `Public Visitor` com role de banco | Reintroducao da premissa incorreta | Documentar Public Visitor como ator nao autenticado, nao enum de role |

## 7. Decisao futura

Se surgir necessidade comprovada de acesso interno somente leitura, criar um
papel interno explicito chamado `Analyst` ou `ReadOnly`.

Esse papel devera possuir definicao propria de UX, RBAC, RLS, testes e criterios
de aceite. `Viewer` nao deve ser reutilizado para representar consumidor final.

Da mesma forma, uma area publica/site de promocoes deve ser aprovada como novo
escopo e nao deve conceder acesso ao backoffice ou membership de workspace.

## 8. Resultado arquitetural aplicado

```text
Public Visitor (anonimo)
  -> ofertas publicadas em canais externos
  -> GET /r/{shortCode}
  -> futuramente, site publico separado

Admin / Editor (autenticados)
  -> backoffice Next.js
  -> Supabase Auth
  -> workspace_members
  -> RLS em dados internos
```

## Mudancas aplicadas

1. Documentos de Produto/UX atualizados sem cadastro ou experiencia Viewer.
2. Matrizes internas atualizadas para Admin e Editor.
3. `viewer` removido do enum, defaults e contratos de membership.
4. Cadastro publico e associacao automatica ao workspace removidos.
5. RLS revisada para membros Admin/Editor, mantendo `anon` sem acesso a tabelas.
6. Contratos de API e convites limitados a Admin/Editor.
7. Testes Viewer substituidos por Public Visitor/anon e isolamento interno.
8. Fase 1, seeds e backlog simplificados.
9. Bloqueador e risco de cadastro publico Viewer removidos.
10. Site publico mantido fora do MVP e `/r/{shortCode}` mantido como unica
    superficie publica obrigatoria.
