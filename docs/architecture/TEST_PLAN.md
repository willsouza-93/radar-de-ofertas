# Plano de testes MVP

## Objetivo

Provar que o fluxo principal funciona, que papeis nao ultrapassam permissoes e
que falhas de integracao/jobs nao geram duplicidade ou perda silenciosa.

## Piramide e ferramentas

| Camada | Ferramenta | Foco |
|---|---|---|
| Unitario | Vitest | score, validadores, normalizacao, transicoes |
| Componente | React Testing Library | estados e permissoes visiveis |
| Banco/RLS | Supabase local + testes SQL/integracao | isolamento e policies |
| Server Actions/API | Vitest/integracao | contratos, auth, erros e auditoria |
| E2E | Playwright | fluxos criticos por papel |
| Job/integracao | doubles HTTP + banco local | retry, idempotencia e falhas |

## Ambientes e dados

- Testes de banco e integracao usam Supabase local recriado por migrations.
- Seed de teste determinista cria dois workspaces para provar isolamento.
- Usuarios: Admin A, Editor A, Admin B e usuario suspenso A.
- Public Visitor e representado por contexto `anon`, sem usuario ou membership.
- Fixtures incluem oferta capturada, em review, aprovada, agendada, publicada e
  rejeitada; canal Telegram conectado/pausado; falhas recuperavel/terminal.
- Telegram real somente em smoke test controlado de staging, nunca na suite CI.
- Segredos reais nao entram em fixtures, snapshots ou output.

## Testes unitarios essenciais

### Score MVP v1

- Calcula score entre 0 e 100.
- Lida com fator ausente sem gerar valor invalido.
- Produz cada faixa/rotulo aprovado.
- Gera highlights corretos.
- "Menor preco" considera snapshots elegiveis.
- Formula e versao sao deterministas.

### Normalizacao

- Dinheiro usa decimal e moeda BRL.
- Marketplace/external ID geram chave natural estavel.
- URL invalida ou protocolo proibido falha.
- Payload ausente/extra e tratado conforme schema.
- Dados externos nao controlam `workspace_id`, status ou score.

### Maquina de estados

- Transicoes validas:
  `captured -> review -> approved -> scheduled -> published`.
- Rejeicao exige motivo.
- Nao agenda draft nao aprovado.
- Nao cancela publicacao publicada.
- Nao reprocessa falha terminal sem correcao.

### Permissoes

- Mapeamento Admin/Editor coincide com documento aprovado.
- Acoes indisponiveis retornam `FORBIDDEN`.

## Testes de Server Actions e APIs

Para cada contrato:

- Caso feliz.
- Sessao ausente `401`.
- Papel insuficiente `403`.
- Recurso de outro workspace `404/403` sem vazamento.
- Body/query invalido `422`.
- Estado concorrente/invalido `409`.
- Audit log criado em acao sensivel.
- Erro externo sanitizado.

Casos prioritarios:

1. `captureOfferManual` faz upsert e snapshot sem duplicar.
2. `sendOfferToReview` cria draft Telegram.
3. `savePostDraft` detecta conflito de versao.
4. `approveAndSchedule` e atomico.
5. `rejectOffer` exige motivo.
6. `publishNow` enfileira, nao publica inline.
7. `configure/test/pause channel` exige Admin.
8. `reprocessPublication` exige Admin e falha recuperavel.
9. Redirect registra clique e redireciona mesmo se analytics falhar.
10. Jobs internos rejeitam segredo ausente/invalido.

## Testes RLS obrigatorios

Executar matriz por tabela para `anon`/Public Visitor, Editor, Admin, Admin de outro
workspace e suspenso.

### Casos criticos

- Public Visitor nao le nem altera tabelas ou APIs internas.
- Public Visitor acessa somente `/r/{shortCode}`.
- Editor edita/aprova/agenda, mas nao gerencia canal, membros ou categorias.
- Editor ve somente logs ligados a publicacoes e sem detalhes tecnicos completos.
- Admin gerencia dados do proprio workspace, nunca outro workspace.
- Suspenso nao le nem escreve dados do workspace.
- `workspace_id` nao pode ser trocado por update.
- Clientes nao inserem/alteram audit logs, automation logs, click events ou jobs.
- Dados de canal nao expÃµem segredo.
- Update possui Select policy correspondente.

Gate: nenhuma migration de RLS entra no branch principal sem matriz passando.

## Testes de jobs e integracoes

### Captura

- Lote misto processa validos e registra invalidos.
- Execucao repetida com mesma idempotency key nao duplica.
- Preco igual nao cria snapshot desnecessario.
- Preco diferente cria snapshot e recalcula score.
- Rate limit agenda retry; credencial invalida nao entra em loop.

### Publicacao

- Dois workers concorrentes nao publicam o mesmo item.
- Job publica apenas draft aprovado e canal conectado.
- Sucesso persiste external message ID e estados.
- Timeout/5xx segue backoff.
- Credencial invalida marca falha terminal/canal warning.
- Maximo de tentativas encerra retry.
- Publicacao cancelada antes do claim nao e enviada.
- Timeout ambiguo nao causa reenvio cego.

### Adapters

- Testes de contrato contra fixtures do payload oficial validado no spike.
- Mudanca de formato falha de modo observavel.
- Nenhuma chamada externa real na suite padrao.

## Testes de componentes

Sem revalidar pixel-perfect nesta fase, cobrir:

- Estados default, loading, empty, error e disabled dos fluxos MVP.
- Public Visitor nao recebe nem renderiza o backoffice.
- Editor nao recebe configuracoes administrativas.
- Admin recebe acoes administrativas.
- Labels acessiveis, foco, dialogos e alerts.
- Tabela/lista responsiva preserva score, preco e status.

## E2E criticos

### Fluxo 1: Admin prepara operacao

`Login -> Configura/Testa Telegram -> Captura oferta manual -> Ver detalhe`

Aceite: canal conectado, oferta normalizada, snapshot e audit/log visiveis.

### Fluxo 2: Editor publica

`Login -> Dashboard -> Fila -> Editar post -> Aprovar e agendar -> Job -> Log`

Aceite: no maximo tres passos apos abrir a fila para aprovar/agendar; publicacao
simulada conclui uma unica vez.

### Fluxo 3: Falha e recuperacao

`Publicacao falha -> Requer sua atencao -> Logs -> Admin reprocessa`

Aceite: mensagem humana, detalhe mascarado e reprocessamento sem duplicidade.

### Fluxo 4: Public Visitor

`Oferta publicada no Telegram -> /r/{shortCode} -> Link afiliado`

Aceite: redirect funciona sem autenticacao; acesso direto ao backoffice/API
interna exige login ou e negado; nenhuma tabela interna e exposta a `anon`.

### Fluxo 5: Responsivo

Repetir revisao/edicao/agendamento em mobile.

Aceite: CTA acessivel, preview em pagina inteira e fluxo concluido.

## Acessibilidade

- Axe ou equivalente nos fluxos principais.
- Navegacao integral por teclado.
- Focus trap e retorno de foco em modal/drawer.
- Mensagens dinamicas anunciadas.
- Score e estados compreensiveis sem cor.
- Alvo de toque e labels acessiveis.

## CI minima

Em pull requests:

1. Typecheck/lint.
2. Unitarios e componentes.
3. Recriar Supabase local, aplicar migrations e seed.
4. Testes RLS e Server Actions/API.
5. E2E criticos em ambiente local/preview quando viavel.

Em deploy de staging:

- Smoke do Telegram em canal de teste mediante acionamento controlado.
- Smoke de Auth, captura manual, agendamento e redirect.

## Criterios de qualidade para release

- Zero falha em testes RLS e E2E criticos.
- Zero segredo em logs/snapshots.
- Sem publicacao duplicada nos testes concorrentes.
- Cobertura alta nos modulos de score, autorizacao, transicoes e jobs; percentual
  global nao substitui cobertura de risco.
- Riscos conhecidos documentados no backlog antes do go-live.
