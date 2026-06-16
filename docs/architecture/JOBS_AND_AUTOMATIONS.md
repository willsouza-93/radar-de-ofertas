# Jobs e automacoes

## Principios

- Jobs executam trabalho tecnico, nunca aprovam editorialmente.
- Toda publicacao exige aprovacao humana anterior.
- Jobs sao idempotentes, limitados por lote e reexecutaveis.
- Cada execucao possui `job_run.id` como correlation ID.
- Falhas preservam dados anteriores e geram mensagem humana + detalhe mascarado.
- Scheduler chama endpoints internos autenticados; nenhuma rota de job e publica.

## Scheduler MVP

Escolha operacional: scheduler barato (Vercel Cron, GitHub Actions ou recurso
agendado Supabase) chamando Route Handlers internos.

Gate de decisao antes do setup:

- Frequencia minima necessaria.
- Limites do plano escolhido.
- Segredo/autenticacao disponivel.
- Timeout maximo.

Evitar Edge Functions no MVP, salvo se o scheduler/deploy escolhido nao atender
timeout, seguranca ou custo. Nao manter worker permanente.

## Job: captura de ofertas

### Trigger

- Manual por Admin: "Capturar agora".
- Agendado em baixa frequencia apÃ³s conector oficial aprovado.

### Etapas

1. Criar/obter `job_run` pela idempotency key.
2. Reservar execucao para impedir job concorrente da mesma fonte/workspace.
3. Ler lote limitado do conector.
4. Validar e normalizar cada item.
5. Upsert de oferta pela chave natural.
6. Inserir snapshot se necessario.
7. Recalcular score/highlights.
8. Registrar contagens e falhas parciais.

### Idempotencia

- Job: `capture:{workspace}:{source}:{window}`.
- Oferta: unique `(workspace, marketplace, external_id)`.
- Snapshot: chave baseada em oferta + observacao; evitar duplicar mesma leitura.

### Retry e rate limit

- Falha temporaria externa: ate 3 tentativas com backoff e jitter.
- Credencial/contrato invalido: sem retry automatico, canal/fonte com alerta.
- Rate limit: respeitar espera da fonte; nunca loop imediato.
- Itens invalidos nao derrubam lote; entram no resumo/log.

## Job: atualizacao de preco

### Escopo MVP

- Atualizar somente ofertas recentes ou em review/agendadas.
- Frequencia conservadora e limitada.
- Nao atualizar em tempo real.

### Etapas

1. Selecionar ofertas elegiveis por prioridade e `last_seen_at`.
2. Agrupar por marketplace/conector.
3. Buscar lote dentro do limite.
4. Atualizar preco/metadata, inserir snapshot e recalcular score.
5. Se oferta agendada mudar materialmente, registrar warning para revisao; nao
   cancelar/publicar automaticamente.

### Idempotencia

`refresh:{workspace}:{source}:{offer}:{time_bucket}`.

## Job: publicacao agendada

### Trigger

- Scheduler frequente chama `publish-due`.
- `publishNow` cria item vencido e usa a mesma fila.

### Claim atomico

Selecionar lote de publicacoes:

- `status = scheduled`, ou `failed` recuperavel.
- `scheduled_for <= now()`.
- `next_attempt_at is null or <= now()`.
- Canal `connected`.
- Nao locked ou lock expirado.

O claim atomico atualiza `status = processing`, `locked_at`, `locked_by` e
incrementa tentativa. Execucoes concorrentes nao recebem a mesma linha.

### Etapas

1. Validar novamente canal, post aprovado e publicacao nao cancelada.
2. Criar/confirmar redirect link.
3. Montar payload Telegram do snapshot aprovado.
4. Publicar com idempotency key interna.
5. Em sucesso: guardar external message ID, marcar `published`, atualizar oferta
   e canal, registrar logs/audit de sistema.
6. Em falha: classificar, sanitizar, agendar retry ou marcar falha terminal.

### Retry

| Classe | Tentativas | Estrategia |
|---|---:|---|
| Rate limit | ate 5 | espera informada ou backoff |
| Timeout/5xx | ate 3 | 1m, 5m, 20m + jitter |
| Credencial/permissao | 0 automaticas | canal warning/disconnected |
| Conteudo invalido | 0 automaticas | exigir edicao |
| Estado invalido/cancelado | 0 | cancelar/ignorar com log |

ApÃ³s maximo, status `failed`, sem loop infinito. Admin pode `Reprocessar` depois
de corrigir causa.

### Idempotencia e duplicidade

- Unique `publications.idempotency_key`.
- Job sempre verifica status antes de enviar.
- External message ID registrado imediatamente apÃ³s sucesso.
- Timeout ambÃ­guo nao deve reenviar cegamente; marcar para intervencao se nao for
  possivel confirmar resultado.

## Job: analytics de clique

Nao e job de fila. `GET /r/{shortCode}`:

1. Resolve destino ativo.
2. Registra evento de forma best-effort com dados minimizados.
3. Redireciona mesmo se analytics falhar.

Agregacoes de relatorio sao calculadas por query no MVP. Job de agregacao e
pÃ³s-MVP.

## Logs

### `job_runs.summary`

Exemplo:

```json
{
  "received": 120,
  "created": 18,
  "updated": 84,
  "unchanged": 15,
  "invalid": 3
}
```

### Eventos minimos

- `job.started`, `job.succeeded`, `job.failed`
- `capture.item_invalid`, `capture.completed`
- `price.changed`, `price.refresh_failed`
- `publication.claimed`, `publication.sent`, `publication.failed`
- `channel.connection_failed`

Todo erro inclui correlation ID, codigo estavel, mensagem humana e detalhe
tecnico mascarado. Nunca inclui token, segredo, header completo ou corpo de post
em audit log.

## Concorrencia e recuperacao

- Locks possuem timeout; job posterior pode recuperar lock abandonado.
- Publicacao `processing` antiga e reconciliada antes de nova tentativa.
- Jobs longos processam lotes pequenos e retornam progresso; scheduler repete.
- Transacoes mantem consistencia entre estado e log/audit essencial.
- Falha de um item nao desfaz itens ja concluidos de um lote.

## Rate limits internos

- "Capturar agora": cooldown por workspace/fonte.
- Teste de canal: cooldown por canal.
- Reprocessar: somente falhas recuperaveis e maximo configurado.
- Redirect de clique: protecao contra abuso sem impedir redirecionamento legitimo.
- Limites concretos sao configuracao server-side e devem ser testados.

## Operacao e alertas MVP

- Dashboard "Requer sua atencao" deriva de falhas terminais, canais com alerta e
  publicacoes atrasadas.
- Alertas externos dedicados ficam pÃ³s-MVP; logs e painel sao suficientes para
  primeira validacao.
- Runbook minimo:
  - capturas falhando;
  - canal Telegram desconectado;
  - publicacao presa em processing;
  - fila atrasada;
  - aumento de erros no redirect.
