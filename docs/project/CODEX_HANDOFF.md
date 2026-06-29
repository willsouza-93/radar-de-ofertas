# Codex Handoff

Status: documento vivo. Representa sempre o estado atual da `main`, nao a fase
em que foi criado.

Este documento substitui `CODEX_HANDOFF_v0.6.md`. A decisao foi manter apenas
um handoff vivo para evitar leitura acidental de snapshot antigo; historico fica
preservado em Git, PRs e tags.

## Para o novo Codex

Se voce e um novo Codex entrando neste projeto, leia obrigatoriamente estes
documentos antes de iniciar qualquer implementacao:

1. [README.md](../../README.md)
2. [PROJECT_STATE.md](PROJECT_STATE.md)
3. [CODEX_PROJECT_CONTEXT.md](CODEX_PROJECT_CONTEXT.md)
4. [ARCHITECTURE_PRINCIPLES.md](ARCHITECTURE_PRINCIPLES.md)
5. [ENGINEERING_GUIDELINES.md](ENGINEERING_GUIDELINES.md)
6. [CODEX_HANDOFF.md](CODEX_HANDOFF.md)
7. [DECISION_INDEX.md](DECISION_INDEX.md)
8. [PROJECT_GLOSSARY.md](PROJECT_GLOSSARY.md)
9. Documentacao especifica da fase solicitada pelo usuario.

A documentacao permanente em `docs/project/` prevalece sobre historico de
conversa quando houver conflito. Se ela estiver desatualizada, corrija-a no
mesmo PR da mudanca que revelou a inconsistencia.

## Principais entregas atuais

- Produto e UX aprovados.
- Arquitetura MVP-first consolidada.
- Supabase Auth, Workspace, Membership e RLS implementados.
- Ofertas, categorias, tags, snapshots e score MVP v1 implementados.
- Curadoria, notas, aprovacoes, rejeicoes e historico implementados.
- UI navegavel com dashboard, ofertas, detalhes, curadoria e filtros.
- Demo dataset para validacao de UI.
- Capture domain e manual connector implementados.
- RPC `submit_capture_for_review` implementada para submeter ofertas a review.
- Publication domain implementado como dominio puro, sem canal real.

## Principais decisoes

- Public Visitor substitui Viewer interno no MVP.
- RBAC interno fica em `Admin` e `Editor`.
- Workspace e sempre derivado server-side.
- Capture nunca publica.
- Aprovacao humana e obrigatoria.
- Reentrada editorial reutiliza a linha de `approval_queue` atual, preservando
  historico em `approval_decisions` e `review_notes`.
- `affiliateUrl` nao identifica oferta.
- Deduplication e Editorial Cooldown sao conceitos separados.
- Publisher e contrato; Telegram sera adapter futuro.
- Resultado ambiguo de publicacao nao gera retry automatico.
- Mensagem publicavel exige redirect controlado `/r/{shortCode}`.
- Domain Events/Event Bus ainda nao foram implementados.

## Riscos conhecidos

- APIs oficiais de marketplaces podem exigir aprovacao e limites ainda nao
  confirmados.
- Scheduler sem idempotencia operacional pode duplicar captura/publicacao.
- Publisher real precisara lidar com timeouts ambiguos e reconciliacao.
- Futura publicacao precisa persistir jobs, historico e redirect links sem
  quebrar auditoria.
- Multi-workspace UI continua fora do MVP; membership multipla deve mostrar
  erro amigavel.
- IA cedo demais pode mascarar problemas do fluxo editorial.

## Limitacoes atuais

- Sem Telegram publisher real.
- Sem scheduler.
- Sem marketplace API real.
- Sem scraping.
- Sem IA.
- Sem site publico de ofertas.
- Sem publicacao automatica.
- Sem registry real de publishers/conectores.
- Sem storage/upload.

## Debitos conscientes

- `README.md` e `docs/architecture/README.md` podem ficar atrasados em relacao
  aos documentos de fases recentes; use `docs/project` como onboarding.
- Algumas validacoes de PR foram corrigidas por commits sucessivos na Fase 6B;
  consulte [CHANGELOG_FASE_6.md](../architecture/CHANGELOG_FASE_6.md).
- `supabase/config.toml` pode aparecer modificado localmente em algumas sessoes;
  nao commitar sem pedido explicito.

## Funcionalidades ainda nao implementadas

- Telegram Bot API adapter.
- Persistencia de publication candidates/jobs/history.
- Redirect links persistidos para publicacao real.
- Click analytics publico conectado a publicacao real.
- Scheduler de captura/publicacao.
- Registry/feature flags operacionais reais.
- Conectores oficiais de marketplace.
- AI enrichment.

## Decisoes adiadas propositalmente

- Modelo de banco final para publication jobs e history.
- Configuracao por workspace de publishers/conectores/cooldown.
- Segundo papel interno read-only (`Analyst`/`ReadOnly`).
- Area publica/site de promocoes.
- WhatsApp e redes sociais alem de Telegram.
- Scheduler provider final para producao real.

## Como continuar

1. Identifique a fase pedida pelo usuario.
2. Leia os documentos oficiais dessa fase e os principios do projeto.
3. Verifique branch atual e mudancas locais.
4. Nao misture escopos.
5. Implemente MVP-first.
6. Rode apenas validacoes exigidas.
7. Atualize changelog/operacoes quando houver codigo ou decisao relevante.
8. Abra PR e nao faca merge sem autorizacao.

## Estado operacional

- Supabase remoto `rzakjytqfyjwdmnxhbxz` e staging.
- Vercel Preview/Staging usa Supabase staging.
- CI de PR usa Supabase local.
- GitHub release workflow existe para tags `v*.*.*`.
- Service role key nao deve ser configurada ate existir necessidade server-side
  real.

Fontes:

- [SUPABASE_PROVISIONING.md](../operations/SUPABASE_PROVISIONING.md)
- [VERCEL_PROVISIONING.md](../operations/VERCEL_PROVISIONING.md)
- [GITHUB_PROVISIONING.md](../operations/GITHUB_PROVISIONING.md)
- [RELEASE_PROCESS.md](../operations/RELEASE_PROCESS.md)
