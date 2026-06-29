# Engineering Guidelines

Status: guia operacional permanente para novas implementacoes e novas sessoes
Codex.

## Estrategia de branches

- Criar branch por fase ou correcao.
- Usar o nome solicitado no prompt quando existir.
- Caso nao exista nome solicitado, preferir:
  - `feature/<fase-ou-entrega>`;
  - `fix/<escopo>`;
  - `docs/<escopo>`.
- Atualizar `main` antes de criar branch quando a tarefa pedir base atual.
- Nunca trabalhar direto em `main`.
- Nunca misturar mudancas locais fora de escopo. Exemplo recorrente:
  `supabase/config.toml` pode estar modificado localmente e deve ficar fora do
  commit salvo pedido explicito.

## Estrategia de PR

- Abrir PR para `main` salvo quando o prompt indicar outro destino.
- Nao fazer merge sem aprovacao explicita.
- Descrever:
  - o que mudou;
  - o que ficou fora de escopo;
  - validacoes executadas;
  - riscos e limitacoes.
- Corrigir comentarios relevantes com o menor ajuste possivel.
- Nao responder/resolver threads no GitHub sem pedido explicito; atualizar o PR
  com commits e reportar o mapeamento.

## Merge policy

- Merge apenas apos validacao humana ou autorizacao explicita.
- Nao aplicar migrations em staging/producao automaticamente sem autorizacao
  especifica.
- Nao iniciar proxima fase enquanto PR da fase atual ainda estiver em review,
  salvo decisao do proprietario.

## Convencoes de commit

- Commits curtos e intencionais.
- Exemplos:
  - `feat: implement phase 6 publication domain`;
  - `fix: address publication domain review comments`;
  - `docs: add codex engineering handoff`.
- Evitar commits que misturem documentacao ampla, schema e UI sem motivo.

## Validacoes obrigatorias

Executar apenas as validacoes pedidas pelo prompt da fase. Quando a tarefa
envolve codigo TypeScript/UI, normalmente executar:

```bash
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
git diff --check
```

Quando a tarefa envolve Supabase/RLS/banco, normalmente executar:

```bash
npx.cmd supabase db reset
npx.cmd supabase test db
```

Quando a tarefa e exclusivamente documental, executar apenas:

```bash
git diff --check
```

Nao rodar build/test/typecheck se o prompt proibir.

## Organizacao dos documentos

- `docs/product`: UX, design system, telas, estados, handoff visual.
- `docs/architecture`: especificacoes tecnicas por fase/dominio.
- `docs/decisions`: ADRs, riscos, readiness e relatorios decisorios.
- `docs/operations`: provisionamento, validacao, release, runbooks.
- `docs/project`: onboarding permanente e indices para novas sessoes.
- `docs/spikes`: validacoes de viabilidade.
- `docs/assets`: tokens e materiais auxiliares.

Ao criar novo documento:

- apontar para fontes existentes;
- evitar duplicacao;
- atualizar indices somente quando a tarefa pedir;
- nao mover documentos sem pedido explicito.

## Como revisar codigo

Prioridade da revisao:

1. Bugs e regressao funcional.
2. Quebra de arquitetura aprovada.
3. Falhas de seguranca/RLS/secrets.
4. Idempotencia, concorrencia e duplicidade.
5. Edge cases e testes ausentes.
6. Legibilidade e manutencao.

Em reviews de PR:

- buscar threads com estado `isResolved` e `isOutdated`;
- corrigir somente threads ativos e relevantes;
- nao tratar Sonar/relatorios externos se o proprietario pedir para ignorar;
- validar apos cada ajuste relevante;
- reportar o que ficou aberto e por que.

## Pre-Commit Review Gate

Antes de commitar, executar uma revisao curta e explicita:

### Arquitetura

- A mudanca respeita os documentos aprovados?
- O dominio continua puro quando deveria?
- Ha acoplamento indevido com Next.js, Supabase, HTTP, SDK externo ou canal?
- A fronteira UI/server/domain/adapters esta preservada?
- O escopo pertence a fase atual?

### Produto

- A mudanca resolve o objetivo do prompt?
- A nomenclatura aprovada foi preservada?
- Algum fluxo, permissao ou UX foi alterado sem pedido?
- Alguma funcionalidade futura foi antecipada?

### Seguranca

- Nenhum secret aparece em arquivo, log, PR ou documentacao?
- Service role nao foi usado para contornar RLS?
- `workspaceId` nao vem de input publico?
- Public Visitor nao ganhou conta, profile ou membership?
- Erros e metadata sao seguros para log?

### QA

- Caminho feliz coberto?
- Falhas previsiveis cobertas?
- Edge cases relevantes cobertos?
- Idempotencia e duplicidade validadas?
- RLS/workspace isolation testados quando banco/RLS muda?

### Criterios para permitir commit

Commit permitido somente quando:

- escopo revisado;
- validacoes exigidas passaram;
- arquivos fora de escopo nao estao stageados;
- documentacao relevante atualizada;
- riscos e limitacoes conhecidos foram registrados.

Status esperado:

```text
PRE_COMMIT_REVIEW_STATUS: PASS
```

## Cleanup Gate

Toda execucao local deve terminar com ambiente conhecido.

Verificar:

- processos Node/Next/dev server;
- Supabase local;
- Docker containers;
- workers/previews locais;
- arquivos temporarios gerados.

Comandos uteis:

```powershell
Get-Process node -ErrorAction SilentlyContinue
docker ps --format "{{.Names}} {{.Status}}"
git status --short --branch
```

Regras:

- Se a tarefa iniciou servidor, parar ao final.
- Se a tarefa iniciou Supabase, parar se isso nao atrapalhar validacao manual
  ativa do usuario.
- Se containers ja estavam rodando antes da tarefa, nao parar sem necessidade;
  reportar como preexistentes.
- Nao remover caches/artefatos sem verificar caminho dentro do workspace.

Resposta final deve informar:

```text
CLEANUP_EXECUTED:
SIM ou NAO

SERVICES_STARTED:
listar ou NENHUM

SERVICES_STOPPED:
listar ou NENHUM

LEFTOVER_PROCESSES:
NENHUM ou listar

LEFTOVER_CONTAINERS:
NENHUM ou listar
```

## Politica de secrets

- Nunca exibir valores reais.
- Nunca commitar `.env`, tokens ou service role.
- Documentar nomes de variaveis sem valores.
- Preferir runtime env names sem sufixo na aplicacao.
- Usar sufixo por ambiente para CI/CD quando necessario.

Fonte: [SECRET_MANAGEMENT.md](../operations/SECRET_MANAGEMENT.md)

## Politica de Supabase staging

- Projeto remoto atual `rzakjytqfyjwdmnxhbxz` e staging.
- Nao aplicar migrations em staging sem autorizacao explicita.
- Nao aplicar seeds genericas em staging/producao.
- CI de PR usa Supabase local, nao staging.

Fonte: [SUPABASE_PROVISIONING.md](../operations/SUPABASE_PROVISIONING.md)
