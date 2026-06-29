# Architecture Principles

Status: constituicao arquitetural do Radar de Ofertas. Toda nova fase deve
respeitar estes principios antes de propor codigo, migrations ou integracoes.

## Principios centrais

### 1. Capture nunca publica

Captura transforma entradas em ofertas, snapshots, score e oportunidades de
review. Ela nunca envia mensagem para canal externo.

Fonte: [PHASE_5_CAPTURE_ARCHITECTURE.md](../architecture/PHASE_5_CAPTURE_ARCHITECTURE.md)

### 2. Curadoria aprova, publicacao consome

Somente uma oferta aprovada pelo ciclo editorial atual pode entrar no dominio
de publicacao. Historico antigo de aprovacao nao autoriza nova publicacao.

Fonte: [PHASE_6_PUBLICATION_ARCHITECTURE.md](../architecture/PHASE_6_PUBLICATION_ARCHITECTURE.md)

### 3. Publication nunca conhece canal concreto

O core de publicacao conhece apenas contratos genericos. Telegram, WhatsApp,
Threads, Discord ou qualquer canal ficam em adapters futuros.

Fonte: [PUBLISHER_ARCHITECTURE.md](../architecture/PUBLISHER_ARCHITECTURE.md)

### 4. Publisher e contrato

`Publisher` recebe `PublicationRequest` com mensagem pronta e retorna
`PublicationResult`. Ele nao decide policy, nao renderiza template e nao acessa
ofertas, filas ou decisoes editoriais.

### 5. Core nao conhece secrets

Tokens, headers, service role keys e credenciais de canal nunca entram no core
nem em logs. Metadata e detalhes de erro devem ser sanitizados.

Fonte: [SECRET_MANAGEMENT.md](../operations/SECRET_MANAGEMENT.md)

### 6. affiliateUrl nao identifica oferta

`affiliateUrl` pode mudar, ser enriquecido depois ou estar ausente no dominio
de captura. Identidade usa `externalId` ou URL canonica de origem.

Fonte: [DEDUPLICATION_STRATEGY.md](../architecture/DEDUPLICATION_STRATEGY.md)

### 7. Deduplication nao e Editorial Cooldown

Dedup evita processar a mesma captura tecnica. Editorial Cooldown decide se uma
oferta pode voltar para curadoria depois de uma janela editorial.

Fonte: [DEDUPLICATION_STRATEGY.md](../architecture/DEDUPLICATION_STRATEGY.md)

### 8. Workspace nunca vem do cliente

`workspaceId` deve ser derivado server-side a partir da membership ativa. Inputs
publicos nao podem injetar workspace.

Fonte: [IDENTITY_MODEL.md](../architecture/IDENTITY_MODEL.md)

### 9. Public Visitor nao e usuario interno

Consumidor final nao acessa backoffice, dashboard, relatorios, logs, agenda ou
workspace. Ele interage por canais publicados, redirect publico e futuro site.

Fonte: [ADR_VIEWER_VS_PUBLIC_VISITOR.md](../decisions/ADR_VIEWER_VS_PUBLIC_VISITOR.md)

### 10. RBAC interno do MVP e Admin/Editor

`Admin` tem acesso administrativo. `Editor` opera curadoria/aprovacao conforme
fase. `Viewer` interno foi removido do MVP.

### 11. RLS sempre prevalece

UI nunca e fronteira de seguranca. Toda regra sensivel deve existir em RLS,
RPC segura ou server-side.

Fonte: [SUPABASE_RLS.md](../architecture/SUPABASE_RLS.md)

### 12. Sem service_role para contornar arquitetura

Service role nunca deve ir para frontend e nao deve ser usado para burlar RLS,
workflow editorial ou auditoria.

### 13. Uma fila editorial ativa por offer/workspace

O schema atual usa uma linha de `approval_queue` por offer/workspace. Reentrada
terminal reutiliza a linha, preservando historico em `approval_decisions` e
`review_notes`.

Fonte: [CURATION_DOMAIN_MODEL.md](../architecture/CURATION_DOMAIN_MODEL.md)

### 14. Review notes sao append-only

Notas editoriais preservam historico. Nao editar nem excluir nota no MVP.

Fonte: [PHASE_3A_REVIEW.md](../architecture/PHASE_3A_REVIEW.md)

### 15. Transicoes editoriais precisam ser atomicas

Aprovacao/rejeicao deve manter fila, decisao e auditoria consistentes. Evitar
qualquer bypass direto de status.

Fonte: [APPROVAL_WORKFLOW.md](../architecture/APPROVAL_WORKFLOW.md)

### 16. Score e deterministico

Score explica sinais conhecidos. Nao aprova, nao publica, nao usa IA e nao
repondera dados ausentes silenciosamente.

Fonte: [SCORE_V1_STRATEGY.md](../architecture/SCORE_V1_STRATEGY.md)

### 17. Dados externos sao nao confiaveis

URLs, precos, flags, cupons, datas e payloads de conectores precisam ser
normalizados e validados antes de entrar no dominio persistido.

Fonte: [CAPTURE_DATA_CONTRACTS.md](../architecture/CAPTURE_DATA_CONTRACTS.md)

### 18. Redirect controlado e obrigatorio para publicacao

Mensagens publicaveis devem usar `/r/{shortCode}` em origem permitida. Link de
marketplace ou afiliado bruto nao deve ser publicado como segundo link.

Fonte: [PUBLICATION_TEMPLATE_ARCHITECTURE.md](../architecture/PUBLICATION_TEMPLATE_ARCHITECTURE.md)

### 19. Retry pertence ao dominio

Retry e decisao de dominio. Resultado ambiguo nunca gera retry automatico; ele
exige reconciliacao ou revisao manual para evitar duplicidade.

Fonte: [PUBLICATION_RETRY_STRATEGY.md](../architecture/PUBLICATION_RETRY_STRATEGY.md)

### 20. Idempotencia e requisito, nao detalhe

Captura, review e publicacao precisam de chaves de idempotencia para evitar
duplicidade. Na publicacao, a chave inclui ciclo editorial/snapshot.

Fonte: [IDEMPOTENCY_STRATEGY.md](../architecture/IDEMPOTENCY_STRATEGY.md)

### 21. Dominios nao dependem de infraestrutura

Dominios puros nao importam Next.js, Supabase, banco, HTTP client, SDK externo,
Telegram, WhatsApp ou IA. Infraestrutura fica em adapters.

### 22. Contracts First

Antes de implementar, definir contratos de entrada/saida, estados, erros,
permissoes e testes esperados.

### 23. Domain First

Regra de negocio nasce no dominio ou server-side. UI apenas apresenta e aciona
fluxos aprovados.

### 24. Clean Architecture

Dependencias apontam para dentro: UI/adapters dependem de dominio; dominio nao
depende de UI/adapters.

### 25. MVP-first

Nao antecipar scheduler, IA, marketplace real, dark mode, site publico ou
publicacao automatica sem fase aprovada e justificativa.

### 26. Operacoes destrutivas exigem confirmacao

Migrations destrutivas, rollback destrutivo, remocao de dados, secrets,
ownership ou billing exigem aprovacao explicita do proprietario.

### 27. Documentacao acompanha decisao

Toda mudanca relevante deve atualizar changelog/operacoes/arquitetura
relacionada, sem duplicar documentos quando um link resolver melhor.

### 28. Testes seguem risco

Quanto maior o blast radius, maior a cobertura: dominio, server actions/RPC,
RLS, isolamento de workspace, fluxo e edge cases.

### 29. PRs devem ser revisaveis

Escopo pequeno, branch por fase/correcao, commit intencional, validacoes
documentadas e sem misturar mudancas locais.

### 30. Handoff e parte do produto

Novas sessoes Codex devem ler contexto, principios, guidelines e indices antes
de iniciar implementacao.
