# Codex Project Context

Status: documento vivo. Este documento deve refletir sempre o estado mais
recente da `main`. Ele resume o projeto e aponta para as fontes oficiais, sem
substituir os documentos de produto, arquitetura, decisoes e operacoes.

Politica: [LIVING_DOCUMENTATION_POLICY.md](LIVING_DOCUMENTATION_POLICY.md)

## Visao geral

Radar de Ofertas e uma plataforma SaaS para captura, curadoria, aprovacao e
publicacao controlada de ofertas de afiliados.

O objetivo do MVP e validar o fluxo principal com baixo custo operacional:

```text
Captura -> Curadoria -> Aprovacao -> Publicacao controlada
```

Publico alvo:

- administradores do backoffice;
- editores/aprovadores de ofertas;
- consumidores finais apenas como `Public Visitor`, sem conta, via canais
  publicados e futuramente redirect/public site.

Escopo MVP:

- Auth interno com Supabase;
- workspace unico operacional;
- RBAC interno com `Admin` e `Editor`;
- captura manual/import controlado;
- ofertas, score deterministico, snapshots de preco;
- curadoria, notas e decisoes;
- dominio interno de publicacao desacoplado de canais.

Escopo futuro:

- Telegram como primeiro publisher real;
- registry de publishers/conectores;
- conectores oficiais de marketplace quando viaveis;
- scheduler apos idempotencia provada;
- IA apenas como apoio editorial, nunca como aprovacao automatica.

## Estado atual

Fases concluidas:

- Fase 0: descoberta tecnica, spikes e decisoes iniciais.
- Fase 1: Auth, Workspace, Membership e RLS.
- Fase 2: ofertas, categorias, tags, snapshots e score MVP v1.
- Fase 3: curadoria, aprovacao, rejeicao, notas e historico.
- Fase 4: UI navegavel, UX polish e dataset de demo.
- Fase 5: capture domain, manual connector e RPC de submissao para review.
- Fase 6A: arquitetura de publicacao.
- Fase 6B: dominio interno de publicacao.

Versao/tag mais recente conhecida:

- `v0.3.0` foi usada para Fase 3B.
- A Fase 6B ja foi mergeada na `main` antes deste kit documental.

Branches recentes/relevantes:

- `main`: base principal.
- `feature/phase-6b-publication-domain`: branch da Fase 6B, ja integrada.
- `feature/engineering-codex-handoff`: branch deste kit documental.

## Arquitetura

### Auth

Responsavel por autenticacao interna via Supabase Auth, profiles e memberships.
Consumidor final nao cria conta no MVP.

Fontes:

- [IDENTITY_MODEL.md](../architecture/IDENTITY_MODEL.md)
- [RLS_STRATEGY.md](../architecture/RLS_STRATEGY.md)
- [ADR_VIEWER_VS_PUBLIC_VISITOR.md](../decisions/ADR_VIEWER_VS_PUBLIC_VISITOR.md)

### Workspace

Fronteira de isolamento de dados. Toda entidade interna sensivel pertence a um
workspace. `workspaceId` nunca deve vir de input publico do cliente; deve ser
derivado server-side.

Fontes:

- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md)
- [SUPABASE_RLS.md](../architecture/SUPABASE_RLS.md)

### Capture

Responsavel por transformar entradas brutas em ofertas normalizadas, dedupe,
score e snapshots. Captura nunca publica.

Fontes:

- [PHASE_5_CAPTURE_ARCHITECTURE.md](../architecture/PHASE_5_CAPTURE_ARCHITECTURE.md)
- [CAPTURE_DATA_CONTRACTS.md](../architecture/CAPTURE_DATA_CONTRACTS.md)
- [DEDUPLICATION_STRATEGY.md](../architecture/DEDUPLICATION_STRATEGY.md)

### Review

Responsavel por fila editorial, notas append-only, aprovacao, rejeicao e
historico. Aprovacao humana e obrigatoria antes de publicacao.

Fontes:

- [CURATION_DOMAIN_MODEL.md](../architecture/CURATION_DOMAIN_MODEL.md)
- [APPROVAL_WORKFLOW.md](../architecture/APPROVAL_WORKFLOW.md)
- [CHANGELOG_FASE_3.md](../architecture/CHANGELOG_FASE_3.md)

### Publication

Responsavel por transformar oferta aprovada em candidate, policy decision,
mensagem renderizada, job conceitual, publisher contract e result. O core nao
conhece Telegram, WhatsApp ou qualquer canal concreto.

Fontes:

- [PHASE_6_PUBLICATION_ARCHITECTURE.md](../architecture/PHASE_6_PUBLICATION_ARCHITECTURE.md)
- [PUBLISHER_ARCHITECTURE.md](../architecture/PUBLISHER_ARCHITECTURE.md)
- [PUBLICATION_RETRY_STRATEGY.md](../architecture/PUBLICATION_RETRY_STRATEGY.md)
- [CHANGELOG_FASE_6.md](../architecture/CHANGELOG_FASE_6.md)

## Tecnologias

- Next.js App Router: monolito modular, rotas server-side e UI integrada.
- React + TypeScript: tipagem forte e componentes reutilizaveis.
- Tailwind CSS: velocidade de UI e consistencia visual.
- Supabase Auth/Postgres/RLS: auth, banco relacional e seguranca por policy.
- pgTAP/Supabase tests: validacao de RLS e banco.
- Vitest: testes unitarios e contratos de dominio.
- Playwright: previsto para fluxos E2E quando necessario.
- Vercel: deploy barato e preview por PR.
- GitHub Actions: validacao automatizada.

## Organizacao do projeto

```text
docs/
  product/        UX, design system, telas e handoff visual
  architecture/   especificacoes tecnicas por fase e dominio
  decisions/      ADRs, riscos e readiness checklists
  operations/     provisionamento, validacoes, release e runbooks
  project/        onboarding permanente para Codex/desenvolvedores
  spikes/         validacoes de viabilidade
  assets/         tokens, imagens e materiais auxiliares

src/
  app/            rotas Next.js e UI
  components/     componentes React
  server/         servicos server-side e dominios internos
    capture/      capture domain
    connectors/   conectores/adapters
    curation/     servicos de curadoria
    offers/       ofertas e score
    publication/  dominio puro de publicacao
    supabase/     fronteira de cliente Supabase server-side
    ui/           dados e actions da UI

supabase/
  migrations/     SQL versionado
  tests/          testes pgTAP/RLS
  seed.sql        seed principal local
```

## Fluxo completo

```text
Entrada manual/import
  -> RawOffer
  -> Capture Pipeline
  -> NormalizedOffer
  -> Score
  -> Offer + PriceSnapshot
  -> submit_capture_for_review
  -> Approval Queue
  -> Review Notes
  -> Approval Decision
  -> Publication Candidate
  -> Publication Policy
  -> Template Renderer
  -> Publication Job
  -> Publisher Contract
  -> Channel Adapter futuro
```

## Roadmap resumido

Proximas fases recomendadas:

- 6C: Telegram Publisher como primeiro adapter real.
- 6D: registry/feature flags operacionais para publishers e conectores.
- 6E: conector de marketplace oficial ou import estruturado aprovado.
- 6F: scheduler apenas depois de idempotencia e publisher real estaveis.
- 7A: AI enrichment como assistente editorial, sem aprovacao automatica.

Fontes:

- [PHASE_6_ROADMAP.md](../architecture/PHASE_6_ROADMAP.md)
- [PHASE_5_ROADMAP.md](../architecture/PHASE_5_ROADMAP.md)
