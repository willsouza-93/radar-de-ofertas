# Publication Pipeline Architecture

Status: arquitetura futura. A Fase 5A nao implementa publicacao, Telegram,
WhatsApp, scheduler, posts ou migrations.

## Objetivo

Definir a fronteira futura entre oferta aprovada e publicacao, preservando a
regra central:

```text
Capture never publishes.
Only approved offers can enter publication.
```

## Fluxo futuro

```text
Approved Offer
  -> Publication Pipeline
  -> Channel Adapter
  -> Telegram
  -> WhatsApp (future)
  -> Other channels (future)
```

## Entrada

Uma oferta so pode entrar no pipeline de publicacao quando:

- existe `approval_queue.status = approved`;
- existe `approval_decisions.decision = approved`;
- a decisao pertence ao mesmo workspace e offer;
- o conteudo de publicacao foi criado/aprovado em fase futura.

## Responsabilidades do pipeline

- validar se a oferta continua aprovada;
- montar payload de canal a partir de dados aprovados;
- garantir idempotencia por publicacao/canal;
- aplicar retry seguro;
- registrar sucesso/falha;
- nunca alterar decisao editorial.

## Channel adapters

Adaptadores futuros devem isolar detalhes de canal:

- Telegram;
- WhatsApp;
- redes sociais;
- site publico futuro.

Cada adapter deve declarar:

- limites;
- formato suportado;
- tamanho maximo de mensagem;
- suporte a imagem;
- comportamento de rate limit;
- erro recuperavel vs terminal.

## Telegram primeiro

Telegram continua sendo o primeiro canal recomendado porque:

- spike anterior validou viabilidade conceitual;
- custo operacional e baixo;
- Bot API possui modelo simples;
- permite validar publicacao sem WhatsApp ou redes sociais.

## WhatsApp futuro

WhatsApp deve continuar pos-MVP ate existir caminho oficial, seguro e
sustentavel.

Nao usar:

- automacao de navegador;
- cliente nao oficial;
- workaround que viole termos;
- credenciais pessoais sem governanca.

## Idempotencia futura

Chave recomendada:

```text
publication:<workspaceId>:<approvedOfferId>:<channelId>:<contentVersion>
```

Garantias:

- uma publicacao aprovada gera no maximo uma mensagem por canal/idempotency key;
- timeout ambiguo nao deve reenviar cegamente;
- external message ID deve ser registrado assim que existir.

## Observabilidade futura

Eventos:

- `publication.claimed`
- `publication.payload_built`
- `publication.sent`
- `publication.failed`
- `publication.retry_scheduled`
- `publication.terminal_failure`

Nunca registrar token do canal ou payload com segredo.

## Relacao com captura

Captura pode atualizar preco/sinais de uma oferta ja aprovada, mas nao deve
publicar nem reagendar automaticamente.

Se uma oferta aprovada sofrer mudanca material antes da publicacao futura, a
acao recomendada e gerar warning para revisao humana, nao publicar
silenciosamente.

## Fora da Fase 5A

- Post drafts.
- Publications.
- Channels.
- Redirect links.
- Click analytics.
- Telegram Bot API.
- Scheduler.
- WhatsApp.
