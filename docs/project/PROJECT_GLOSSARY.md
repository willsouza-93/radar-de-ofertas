# Project Glossary

Status: documento vivo. Este glossario deve refletir sempre a linguagem atual
da `main`.

Politica: [LIVING_DOCUMENTATION_POLICY.md](LIVING_DOCUMENTATION_POLICY.md)

## Admin

Usuario interno autenticado com acesso administrativo completo ao backoffice.

## Affiliate URL

Link de afiliado. Pode ser usado em enriquecimento ou redirect futuro, mas nao
identifica oferta e nao deve substituir o redirect controlado na publicacao.

## Approval Decision

Registro append-only da decisao humana sobre uma oferta em review: aprovada ou
rejeitada.

## Approval Queue

Fila editorial por workspace/offer. O schema atual usa uma linha por
workspace/offer e preserva historico via decisions e notes.

## Candidate

Oportunidade de publicacao criada a partir de uma oferta aprovada. Candidate
nao e job executado e nao chama publisher.

## Capture

Dominio responsavel por receber dados brutos, normalizar, deduplicar, calcular
score e preparar ofertas para review.

## Capture Run

Execucao identificavel de captura. Ajuda em observabilidade, logs,
idempotencia e correlacao.

## Connector

Contrato/adaptador que produz `RawOffer`. Pode representar import manual,
marketplace oficial futuro ou outra origem aprovada.

## Correlation ID

Identificador que conecta eventos de uma jornada tecnica ou operacional entre
captura, review, publicacao e logs.

## Deduplication

Processo tecnico para evitar duplicidade de ofertas/capturas equivalentes.
Nao e o mesmo que Editorial Cooldown.

## Domain Event

Evento conceitual de dominio. O projeto documentou evolucao futura, mas ainda
nao implementou Event Bus.

## Editorial Cooldown

Janela editorial que permite ou bloqueia reentrada de uma oferta para review
apos determinado periodo. No desenho MVP, 24 horas.

## Editor

Usuario interno autenticado que opera captura/curadoria/aprovacao conforme as
permissoes da fase. Nao gerencia integracoes nem usuarios administrativos.

## Feature Flag

Controle operacional futuro para habilitar conectores, publishers, IA ou
capacidades por ambiente/workspace. Nao confundir com regra de dominio.

## Highlight

Sinal visual/semantico associado a oferta, como menor preco, cupom, frete
gratis ou alta comissao.

## Idempotency Key

Chave que impede duplicidade em operacoes repetidas. Na publicacao inclui
workspace, offer, target, approval decision, snapshot version e slot.

## Manual Connector

Primeiro conector real/estruturado do projeto. Produz `RawOffer` sem conhecer
Supabase, UI ou regra de negocio duplicada.

## Normalized Offer

Oferta apos normalizacao e validacao de campos brutos. Base para score,
dedupe, persistencia e snapshots.

## Offer

Entidade de oferta persistida com titulo, marketplace/source, preco, score,
highlights, categoria/tags e sinais de captura.

## Price Snapshot

Registro historico de preco/sinais no tempo. Criado quando mudancas relevantes
ocorrem.

## Publication

Dominio que transforma oferta aprovada em candidate, policy decision, mensagem
renderizada, job conceitual, publisher request e result.

## Publication Job

Unidade executavel de publicacao. Na Fase 6B existe apenas em memoria; futura
fase deve persistir.

## Publication Policy

Regras que decidem se um candidate pode seguir para job ou deve ser bloqueado,
pulando duplicidade, cooldown, target desabilitado e capacidades ausentes.

## Publication Result

Resposta normalizada de uma tentativa de publicacao: sucesso, falha
transitoria, falha permanente ou resultado ambiguo.

## Public Visitor

Consumidor final nao autenticado. Nao acessa backoffice, workspace, dashboard
ou relatorios. Interage com canais publicados e redirect publico futuro.

## Publisher

Contrato generico de envio. O core conhece apenas `Publisher`; Telegram e
outros canais serao adapters.

## Raw Offer

Entrada bruta produzida por connector antes de normalizacao.

## Redirect Link

Link controlado `/r/{shortCode}` usado para preservar analytics, seguranca e
governanca de cliques. Mensagens publicaveis devem usar redirect, nao link
bruto.

## Review

Fluxo editorial humano de avaliar oferta, adicionar notas, aprovar ou rejeitar.

## Review Note

Nota interna append-only associada a fila/oferta. Nao deve ser editada ou
excluida no MVP.

## Retry

Decisao de tentar novamente apos falha transitoria. Resultado ambiguo nao deve
gerar retry automatico.

## RLS

Row Level Security do Supabase/Postgres. Fronteira obrigatoria de seguranca
para dados internos.

## Score

Pontuacao deterministica e explicavel da oferta. Ajuda curadoria, mas nao
aprova nem publica.

## Snapshot

Versao imutavel ou historica de dados relevantes. Em preco, representa estado
capturado; em publicacao futura, deve representar conteudo aprovado.

## Template Renderer

Componente de dominio que transforma `PublicationContext` + template em
`RenderedMessage`, validando variaveis, limites e redirect controlado.

## Workspace

Fronteira de isolamento de dados internos. Usuarios internos pertencem a
workspaces via membership.

## Workspace Membership

Relacao entre usuario interno e workspace, com role e status. Usuarios
suspensos perdem acesso.
