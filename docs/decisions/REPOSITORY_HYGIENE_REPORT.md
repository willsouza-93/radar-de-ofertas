# Repository Hygiene Report

## Objetivo

Identificar arquivos temporarios, gerados automaticamente, artefatos que nao
devem ser versionados e diretorios redundantes antes de consolidar a Fase 1.

Este relatorio nao altera codigo, migrations, docs existentes ou configuracoes.

## Resumo executivo

O repositorio esta majoritariamente limpo para a Fase 1. Os principais itens de
higiene sao:

- `node_modules/` deve continuar ignorado e nunca ser versionado;
- `supabase/.branches/` e `supabase/.temp/` sao runtime local da Supabase CLI e
  devem continuar ignorados;
- `supabase/snippets/` esta vazio e pode ser removido se nao houver uso manual;
- `package.json` e `package-lock.json` existem apenas para fixar a Supabase CLI
  local e precisam de decisao de estrategia;
- `.gitignore` ja cobre os principais gerados locais.

## Classificacao por item

| Item | Tipo | Classificacao | Justificativa | Acao recomendada |
|---|---|---|---|---|
| `README.md` | Documentacao raiz | Manter | Indice principal do projeto | Versionar |
| `docs/` | Documentacao aprovada | Manter | Fonte da verdade de produto, arquitetura, decisoes e spikes | Versionar |
| `docs/assets/design-tokens.json` | Asset de produto | Manter | Token aprovado para handoff | Versionar |
| `docs/assets/editorial-inteligente-concept.png` | Asset de produto | Manter | Referencia visual aprovada | Versionar |
| `docs/architecture/*.md` | Arquitetura/documentacao | Manter | Artefatos aprovados e changelog da Fase 1 | Versionar |
| `docs/decisions/*.md` | Decisoes | Manter | ADRs, checklists e registros de decisao | Versionar |
| `docs/product/*.md` | Produto/UX | Manter | Fonte aprovada de UX/design/handoff | Versionar |
| `docs/spikes/*.md` | Spikes | Manter | Evidencias e decisoes de viabilidade | Versionar |
| `supabase/config.toml` | Configuracao local Supabase | Manter | Necessario para reproduzir ambiente local | Versionar |
| `supabase/migrations/*.sql` | Migrations versionadas | Manter | Artefatos executaveis da Fase 1 | Versionar |
| `supabase/seed.sql` | Seed local/teste | Manter | Necessario para fixtures da matriz RLS | Versionar |
| `supabase/tests/database/*.sql` | Testes pgTAP | Manter | Valida isolamento e permissoes | Versionar |
| `supabase/README.md` | Documentacao local | Manter | Comandos e contas locais de fixture | Versionar |
| `supabase/ROLLBACK.md` | Procedimento operacional | Manter | Documenta estrategia de reversao | Versionar |
| `.gitignore` | Configuracao Git | Manter | Protege segredos e artefatos gerados | Versionar |
| `node_modules/` | Dependencias instaladas | Ignorar via .gitignore | Gerado por npm; pesado e reprodutivel pelo lockfile | Manter ignorado; remover localmente quando quiser limpar espaco |
| `supabase/.branches/` | Runtime Supabase CLI | Ignorar via .gitignore | Gerado pela CLI local | Manter ignorado; pode ser removido localmente |
| `supabase/.temp/` | Runtime Supabase CLI | Ignorar via .gitignore | Cache/estado local da CLI | Manter ignorado; pode ser removido localmente |
| `.env`, `.env.*` | Segredos locais | Ignorar via .gitignore | Pode conter keys/tokens | Nunca versionar |
| `.next/`, `out/`, `dist/`, `build/` | Build output futuro | Ignorar via .gitignore | Gerado por Next/build tooling | Manter ignorado |
| `coverage/` | Relatorio de testes futuro | Ignorar via .gitignore | Gerado por Vitest/coverage | Manter ignorado |
| `.turbo/` | Cache futuro | Ignorar via .gitignore | Gerado por Turborepo se usado | Manter ignorado |
| `*.log` | Logs | Ignorar via .gitignore | Pode conter dados locais e ruido | Manter ignorado |
| `.vscode/`, `.idea/` | Configuracao local de IDE | Ignorar via .gitignore | Preferencias individuais | Manter ignorado |
| `.DS_Store`, `Thumbs.db` | Sistema operacional | Ignorar via .gitignore | Ruido de SO | Manter ignorado |
| `supabase/snippets/` | Diretorio vazio gerado/local | Remover do projeto | Esta vazio e nao foi aprovado como artefato | Pode ser removido quando for feita limpeza |
| `package.json` | Manifest npm minimo | Revisar manualmente | Foi criado para instalar a Supabase CLI local; ainda nao existe app Next.js | Manter se a CLI local pinada for desejada; remover se a equipe usar CLI global |
| `package-lock.json` | Lockfile npm | Revisar manualmente | Garante reproducibilidade da CLI local, mas veio antes do app | Manter junto com `package.json` ou remover ambos |

## Arquivos temporarios encontrados

| Item | Status atual | Recomendacao |
|---|---|---|
| `supabase/.branches/_current_branch` | Ignorado pelo Git | Pode ser apagado localmente |
| `supabase/.temp/cli-latest` | Ignorado pelo Git | Pode ser apagado localmente |
| `node_modules/` | Ignorado pelo Git | Pode ser apagado localmente e recriado com `npm install` |

## Arquivos gerados automaticamente encontrados

| Item | Origem provavel | Classificacao |
|---|---|---|
| `node_modules/` | `npm install` | Ignorar via .gitignore |
| `package-lock.json` | `npm install` | Revisar manualmente |
| `supabase/.branches/` | Supabase CLI | Ignorar via .gitignore |
| `supabase/.temp/` | Supabase CLI | Ignorar via .gitignore |
| `supabase/snippets/` | Supabase CLI | Remover do projeto, pois esta vazio |

## Artefatos que nao devem ser versionados

- `node_modules/`;
- `supabase/.branches/`;
- `supabase/.temp/`;
- `.env`;
- `.env.*`, exceto `.env.example`;
- builds (`.next/`, `out/`, `dist/`, `build/`);
- logs (`*.log`);
- caches (`coverage/`, `.turbo/`);
- configuracoes locais de IDE (`.vscode/`, `.idea/`);
- arquivos de sistema (`.DS_Store`, `Thumbs.db`).

## Diretorios redundantes

| Diretorio | Motivo | Classificacao |
|---|---|---|
| `supabase/snippets/` | Vazio, sem artefato aprovado | Remover do projeto |

Nao foram encontrados outros diretorios redundantes dentro de `docs/` ou
`supabase/`.

## Avaliacao do `.gitignore`

O `.gitignore` atual cobre corretamente:

- env files;
- runtime local do Supabase;
- dependencias;
- builds;
- logs;
- arquivos de sistema;
- IDEs;
- coverage e Turbo.

Recomendacao pequena: remover duplicidade interna das regras `.env`/`.env.*`
em uma limpeza futura. A duplicidade nao quebra nada, mas deixa o arquivo menos
enxuto.

## Recomendacoes de higiene

1. Manter `node_modules/`, `supabase/.branches/` e `supabase/.temp/` fora do
   versionamento.
2. Remover localmente `supabase/snippets/` se continuar vazio.
3. Decidir se `package.json`/`package-lock.json` devem permanecer agora para
   pinagem da Supabase CLI local ou se serao substituidos pelo `package.json`
   real do app Next.js na Fase 2.
4. Antes de qualquer commit, rodar:

```powershell
git status --short --ignored
git diff --check
```

5. Quando o projeto Next.js for criado, revisar `.gitignore` novamente para
   cobrir `.vercel/`, caches de testes e artefatos do framework escolhido.
6. Nunca versionar secrets reais, chaves Supabase, tokens Telegram, cron
   secrets, dumps locais ou arquivos `.env`.
7. Separar claramente fixtures locais de dados reais; `supabase/seed.sql`
   permanece aceitavel porque contem apenas usuarios e senha de fixture.
