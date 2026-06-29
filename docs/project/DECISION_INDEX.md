# Decision Index

Status: documento vivo. Este indice deve apontar sempre para as decisoes
arquiteturais atuais da `main`. Nao move documentos e nao substitui
ADRs/especificacoes.

Politica: [LIVING_DOCUMENTATION_POLICY.md](LIVING_DOCUMENTATION_POLICY.md)

## Produto e papeis

| Decisao | Fonte |
| --- | --- |
| Public Visitor substitui Viewer interno no MVP | [ADR_VIEWER_VS_PUBLIC_VISITOR.md](../decisions/ADR_VIEWER_VS_PUBLIC_VISITOR.md) |
| Consumidor final nao acessa backoffice | [ADR_VIEWER_VS_PUBLIC_VISITOR.md](../decisions/ADR_VIEWER_VS_PUBLIC_VISITOR.md) |
| RBAC interno MVP: Admin e Editor | [ADR_VIEWER_VS_PUBLIC_VISITOR.md](../decisions/ADR_VIEWER_VS_PUBLIC_VISITOR.md), [SUPABASE_RLS.md](../architecture/SUPABASE_RLS.md) |
| UX principal: Editorial Inteligente + Radar Calmo | [README.md](../../README.md), [01-product-ux.md](../product/01-product-ux.md) |

## Fundacao e identidade

| Decisao | Fonte |
| --- | --- |
| Monolito modular Next.js + Supabase | [TECHNICAL_SPEC.md](../architecture/TECHNICAL_SPEC.md) |
| Workspace como fronteira de isolamento | [IDENTITY_MODEL.md](../architecture/IDENTITY_MODEL.md) |
| Workspace derivado server-side | [IDENTITY_MODEL.md](../architecture/IDENTITY_MODEL.md), [RLS_STRATEGY.md](../architecture/RLS_STRATEGY.md) |
| RLS obrigatorio para dados internos | [SUPABASE_RLS.md](../architecture/SUPABASE_RLS.md) |
| Supabase remoto atual e staging | [SUPABASE_PROVISIONING.md](../operations/SUPABASE_PROVISIONING.md) |
| Vercel Preview/Staging aponta para Supabase staging | [VERCEL_PROVISIONING.md](../operations/VERCEL_PROVISIONING.md) |
| Secrets nao devem ser expostos/commitados | [SECRET_MANAGEMENT.md](../operations/SECRET_MANAGEMENT.md) |

## Ofertas e score

| Decisao | Fonte |
| --- | --- |
| Score deterministico MVP v1 | [SCORE_V1_STRATEGY.md](../architecture/SCORE_V1_STRATEGY.md) |
| Score nao aprova e nao publica | [SCORE_V1_STRATEGY.md](../architecture/SCORE_V1_STRATEGY.md) |
| `affiliateUrl` nao identifica oferta | [DEDUPLICATION_STRATEGY.md](../architecture/DEDUPLICATION_STRATEGY.md) |
| Dedupe key prioriza external id e URL canonica | [DEDUPLICATION_STRATEGY.md](../architecture/DEDUPLICATION_STRATEGY.md), [PHASE_2A_REVIEW.md](../architecture/PHASE_2A_REVIEW.md) |
| Offer tags usam delete fisico no MVP | [PHASE_2A_REVIEW.md](../architecture/PHASE_2A_REVIEW.md) |

## Curadoria

| Decisao | Fonte |
| --- | --- |
| Aprovacao humana obrigatoria | [APPROVAL_WORKFLOW.md](../architecture/APPROVAL_WORKFLOW.md) |
| Sem estado `under_review` no MVP | [PHASE_3A_REVIEW.md](../architecture/PHASE_3A_REVIEW.md) |
| `review_notes` append-only | [PHASE_3A_REVIEW.md](../architecture/PHASE_3A_REVIEW.md) |
| Sem `assigned_to` na Fase 3B | [PHASE_3A_REVIEW.md](../architecture/PHASE_3A_REVIEW.md) |
| Uma linha `approval_queue` por workspace/offer | [CURATION_DOMAIN_MODEL.md](../architecture/CURATION_DOMAIN_MODEL.md) |
| Reentrada terminal reutiliza `approval_queue` | [PHASE_5_DECISIONS.md](../architecture/PHASE_5_DECISIONS.md), [CHANGELOG_FASE_5.md](../architecture/CHANGELOG_FASE_5.md) |
| RPC segura para submeter captura a review | [CHANGELOG_FASE_5.md](../architecture/CHANGELOG_FASE_5.md) |

## Captura e conectores

| Decisao | Fonte |
| --- | --- |
| Capture nunca publica | [PHASE_5_CAPTURE_ARCHITECTURE.md](../architecture/PHASE_5_CAPTURE_ARCHITECTURE.md) |
| Conectores desacoplados por contrato | [CONNECTOR_ARCHITECTURE.md](../architecture/CONNECTOR_ARCHITECTURE.md) |
| Manual connector valida arquitetura antes de marketplace real | [CHANGELOG_FASE_5.md](../architecture/CHANGELOG_FASE_5.md), [PHASE_5_ROADMAP.md](../architecture/PHASE_5_ROADMAP.md) |
| Editorial Cooldown = 24h no MVP | [DEDUPLICATION_STRATEGY.md](../architecture/DEDUPLICATION_STRATEGY.md) |
| Deduplication diferente de Editorial Cooldown | [DEDUPLICATION_STRATEGY.md](../architecture/DEDUPLICATION_STRATEGY.md) |
| Scraping nao e caminho preferencial | [INTEGRATIONS.md](../architecture/INTEGRATIONS.md), [MVP_RISK_REGISTER.md](../decisions/MVP_RISK_REGISTER.md) |

## Publicacao

| Decisao | Fonte |
| --- | --- |
| Publication consome apenas oferta aprovada atual | [PHASE_6_PUBLICATION_ARCHITECTURE.md](../architecture/PHASE_6_PUBLICATION_ARCHITECTURE.md) |
| `approval_queue.last_decision_id` deve apontar decisao atual | [PHASE_6_PUBLICATION_ARCHITECTURE.md](../architecture/PHASE_6_PUBLICATION_ARCHITECTURE.md) |
| Publisher e contrato generico | [PUBLISHER_ARCHITECTURE.md](../architecture/PUBLISHER_ARCHITECTURE.md) |
| Telegram sera adapter futuro, nao core | [PUBLISHER_ARCHITECTURE.md](../architecture/PUBLISHER_ARCHITECTURE.md), [PHASE_6_ROADMAP.md](../architecture/PHASE_6_ROADMAP.md) |
| Candidate nasce antes da policy bloquear/liberar | [PUBLICATION_CANDIDATE.md](../architecture/PUBLICATION_CANDIDATE.md) |
| Idempotency key inclui ciclo editorial/snapshot | [PUBLICATION_POLICY.md](../architecture/PUBLICATION_POLICY.md) |
| Renderer usa snapshot aprovado imutavel | [PUBLICATION_TEMPLATE_ARCHITECTURE.md](../architecture/PUBLICATION_TEMPLATE_ARCHITECTURE.md) |
| Redirect `/r/{shortCode}` e obrigatorio | [PUBLICATION_TEMPLATE_ARCHITECTURE.md](../architecture/PUBLICATION_TEMPLATE_ARCHITECTURE.md) |
| Resultado ambiguo nao tem retry automatico | [PUBLICATION_RETRY_STRATEGY.md](../architecture/PUBLICATION_RETRY_STRATEGY.md), [PUBLICATION_FAILURE_HANDLING.md](../architecture/PUBLICATION_FAILURE_HANDLING.md) |
| Domain Events/Event Bus ficam para evolucao futura | [DOMAIN_EVENTS_EVOLUTION.md](../architecture/DOMAIN_EVENTS_EVOLUTION.md) |

## Operacoes e release

| Decisao | Fonte |
| --- | --- |
| CI de PR usa Supabase local | [GITHUB_PROVISIONING.md](../operations/GITHUB_PROVISIONING.md) |
| Migrations remotas exigem operacao controlada | [SUPABASE_PROVISIONING.md](../operations/SUPABASE_PROVISIONING.md) |
| Seeds genericas nao devem ir para staging/producao | [SUPABASE_PROVISIONING.md](../operations/SUPABASE_PROVISIONING.md) |
| Release automatica por tags `v*.*.*` | [RELEASE_PROCESS.md](../operations/RELEASE_PROCESS.md) |
| Release notes resumidas podem usar `docs/releases/vX.Y.Z.md` | [RELEASE_PROCESS.md](../operations/RELEASE_PROCESS.md) |

## Roadmap

| Decisao | Fonte |
| --- | --- |
| Telegram antes de scheduler | [PHASE_6_ROADMAP.md](../architecture/PHASE_6_ROADMAP.md) |
| Scheduler so depois de idempotencia validada | [PHASE_5_ROADMAP.md](../architecture/PHASE_5_ROADMAP.md), [PHASE_6_ROADMAP.md](../architecture/PHASE_6_ROADMAP.md) |
| IA depois de fluxo manual/publicacao controlada | [PHASE_6_ROADMAP.md](../architecture/PHASE_6_ROADMAP.md), [AI_ENRICHMENT_ARCHITECTURE.md](../architecture/AI_ENRICHMENT_ARCHITECTURE.md) |
