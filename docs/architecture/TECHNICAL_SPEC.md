# Radar de Ofertas - Especificacao Tecnica MVP-first

## Status e fontes oficiais

Este documento transforma os artefatos aprovados em `/docs/product` em arquitetura
tecnica. UX, fluxos, papeis, permissoes e nomenclaturas permanecem inalterados.
Em caso de conflito, os documentos de produto aprovados prevalecem.

## Cortes de escopo recomendados

Para validar `Captura -> Curadoria -> Aprovacao -> Agendamento -> Publicacao`
com baixo custo, ficam fora do MVP:

1. Publicacao automatica sem aprovacao humana.
2. WhatsApp e redes sociais; seus previews continuam na UX, mas aparecem como
   indisponiveis/pÃ³s-MVP. Telegram e o unico canal publicador do MVP.
3. Scraping em producao. Somente integracoes oficiais aprovadas ou entrada
   manual/CSV/JSON. Qualquer experimento de scraping exige avaliacao juridica e
   tecnica separada.
4. Conversoes e receita confirmadas por marketplace. O MVP mede cliques no link
   intermediario e sucesso/falha de publicacao; conversao fica sem dado ate
   existir fonte oficial.
5. Geracao de texto por IA. O MVP aceita texto inicial por template determinista
   e edicao humana.
6. Score com machine learning. O MVP usa formula versionada e explicavel.
7. Multiempresa configuravel. O banco nasce com `workspace_id` para isolamento,
   mas o MVP opera um workspace criado por seed.
8. Realtime, notificacoes push, fila dedicada, data warehouse e BI externo.
9. Atualizacao continua de preco. O MVP executa captura agendada e snapshots
   controlados, sem monitoramento em tempo real.
10. Exportacoes avancadas, filtros salvos, cupons gerenciaveis, categorias com
    regras automaticas e administracao completa de integracoes.
11. Publicacao simultanea em varios canais, campanhas, A/B tests e reescrita
    automatica por canal.
12. Aplicativo nativo. A aplicacao web responsiva cobre desktop, tablet e mobile.

As telas aprovadas que dependem desses itens permanecem previstas, mas usam
estado vazio, leitura limitada ou indicacao pÃ³s-MVP sem inventar novos fluxos.

## Objetivo tecnico do MVP

Entregar uma aplicacao web responsiva em que:

1. Admin captura/importa ofertas e configura um canal Telegram.
2. O sistema normaliza dados, salva historico de preco e calcula score.
3. Admin/Editor envia ofertas para a fila, edita o post, aprova e agenda.
4. Um job publica no Telegram no horario definido, com retry e idempotencia.
5. Admin/Editor investiga falhas conforme suas permissoes.
6. Admin/Editor acessam somente dados e acoes autorizados.
7. Cliques em links publicados e resultados de publicacao ficam registrados.
8. Public Visitor acessa somente ofertas publicadas em canais externos e o
   redirect publico `/r/{shortCode}`.

## Arquitetura de alto nivel

```text
Browser
  -> Next.js App Router na Vercel
     -> Server Components: leituras autenticadas
     -> Server Actions: mutacoes internas
     -> Route Handlers: redirect de clique, cron e webhooks futuros
        -> Supabase Auth
        -> Supabase Postgres + RLS
        -> Supabase Storage (somente se upload de imagem for necessario)
        -> Telegram Bot API

Scheduler autenticado
  -> Route Handler interno de jobs
     -> claim atomico no Postgres
     -> Telegram Bot API
     -> logs, auditoria e resultado no Postgres
```

## Decisoes tecnicas

| Decisao | Escolha MVP | Motivo |
|---|---|---|
| Arquitetura | Monolito modular Next.js | Menor custo operacional e deploy simples |
| Banco/Auth | Supabase | Postgres, Auth e RLS no mesmo produto |
| Tenant | `workspace_id` em dados de negocio | Isolamento seguro sem UI multiempresa |
| Mutacoes internas | Server Actions | Contratos proximos da UI, validacao no servidor |
| APIs externas/jobs | Route Handlers | Webhooks, redirects e chamadas autenticadas |
| Autorizacao | RLS + verificacao explicita no servidor | Defesa em profundidade |
| Papel | `workspace_members.role` | Nao confiar em metadata editavel pelo usuario |
| Jobs | Scheduler -> endpoint interno -> Postgres | Barato, observavel e substituivel |
| Fila | Tabelas com claim atomico | Evita infraestrutura de queue no MVP |
| Segredos | Variaveis server-only; credenciais cifradas fora de tabelas expostas | Evita vazamento ao cliente |
| Score | Formula determinista versionada | Explicavel e testavel |
| Datas | `timestamptz` em UTC | Exibicao converte para BRT |
| Dinheiro | `numeric(12,2)` + `currency` | Evita erro de ponto flutuante |
| IDs | UUID | Compatibilidade e baixa exposicao sequencial |

## Modulos do MVP

### Identidade e acesso

- Login e recuperacao para Admin e Editor via Supabase Auth.
- Perfil e membership no workspace.
- Convite, mudanca de papel e suspensao por Admin.
- Guards de rota orientam UX; RLS e servidor autorizam de fato.
- Public Visitor nao autentica e nao pertence a workspace.

### Captura e normalizacao

- Entrada manual obrigatoria e importacao estruturada opcional.
- Conectores oficiais entram apenas apos spike de viabilidade.
- Upsert por `(workspace_id, marketplace, external_id)`.
- Cada preco observado gera snapshot quando mudar ou em captura relevante.

### Curadoria e score

- Score `0..100`, formula versionada e fatores persistidos.
- Highlights derivados: menor preco, cupom, frete gratis, alta comissao.
- Estado da oferta segue nomenclaturas aprovadas:
  `captured -> review -> approved -> scheduled -> published`.
- Rejeicao usa estado proprio de curadoria sem apagar a oferta.

#### Formula MVP v1

- Desconto: ate 35 pontos.
- Historico de preco: ate 30 pontos.
- Comissao: ate 20 pontos.
- Confiabilidade/completude da fonte: ate 15 pontos.
- Fator ausente vale zero no MVP; nao reponderar silenciosamente.
- Limiares e regras exatas ficam em configuracao versionada e coberta por testes.
- O score nunca aprova ou publica; somente ordena e explica a curadoria.

### Conteudo e aprovacao

- Um rascunho de post por oferta/canal no MVP.
- Autosave via Server Action.
- Admin/Editor podem editar, aprovar, rejeitar e agendar.
- Toda transicao sensivel gera audit log.

### Agendamento e publicacao

- Telegram unico canal publicador.
- Agendamento sempre nasce de uma oferta aprovada.
- Job busca publicacoes vencidas, faz claim, publica e registra resultado.
- "Publicar agora" usa a mesma pipeline, apenas com `scheduled_for = now()`.

### Logs e analytics

- Audit log imutavel para acoes humanas sensiveis.
- Automation log para jobs, integracoes e falhas.
- Link intermediario registra clique e redireciona ao link de afiliado.
- Relatorio MVP: publicacoes, cliques e taxa de clique; conversao fica vazia.

## Fronteiras de responsabilidade

### Frontend

- Renderizar UX aprovada e estados por permissao.
- Validar forma para resposta imediata, sem substituir validacao server-side.
- Nunca receber `service_role`, token de Telegram ou segredo de integracao.
- Nunca decidir autorizacao final.

### Next.js server

- Obter usuario autenticado e workspace ativo.
- Validar inputs com Zod e permissao antes de mutacoes.
- Executar Server Actions com cliente Supabase do usuario quando RLS for
  suficiente.
- Usar cliente privilegiado apenas em jobs internos e administracao que exige
  Supabase Auth Admin API, sempre server-only.
- Traduzir erros tecnicos para contratos de erro estaveis.

### Supabase

- Sistema de registro para usuarios relacionados, ofertas, posts, publicacoes,
  cliques, logs e auditoria.
- Constraints, transicoes criticas e RLS.
- Funcoes privadas auxiliares de autorizacao e claim de jobs.
- `public` sempre com RLS; funcoes privilegiadas em schema nao exposto.

### Jobs

- Operacoes assÃ­ncronas, reexecutaveis e idempotentes.
- Nunca alteram decisao editorial; somente capturam, atualizam ou executam
  publicacao previamente aprovada.
- Registram inicio, fim, erro, tentativa, correlation ID e proxima tentativa.

## Auth e sessao

- Nao existe cadastro publico no MVP.
- Recuperacao de senha pelo fluxo Supabase Auth.
- Admin/Editor entram por convite ou provisionamento, com papel atribuido por
  Admin.
- Sessao em cookies SSR; cada operacao sensivel revalida usuario e membership.
- Papel nao vem de `user_metadata`. A fonte e `workspace_members`.
- Usuario suspenso perde acesso aos dados do workspace via RLS.
- Public Visitor nao possui registro Auth por consumir promocoes e nao recebe
  membership.

## Fluxo de dados principal

1. Captura cria/atualiza `offers` e insere `price_snapshots`.
2. Servico de score calcula fatores, score, highlights e versao.
3. Admin/Editor envia oferta para `review` e cria/atualiza `post_drafts`.
4. Editor salva rascunho; audit log registra a edicao sem armazenar segredo.
5. Aprovar cria decisao e agenda cria `publications`.
6. Job faz claim de publicacao, envia Telegram e marca `published` ou `failed`.
7. Link publicado aponta para `/r/{short_code}`; redirect registra `click_events`.

## Nao funcionais do MVP

- SeguranÃ§a: RLS em todas as tabelas expostas, menor privilegio e segredos
  server-only.
- Disponibilidade: falha do Telegram nao perde agendamento; retry controlado.
- Consistencia: constraints e idempotency keys evitam duplicidade.
- Observabilidade: logs estruturados, correlation IDs e audit trail.
- Performance: paginacao server-side e indices orientados aos filtros aprovados.
- Custo: sem workers permanentes, filas externas ou warehouse.

## Setup local, migrations e seeds

- Supabase CLI local como ambiente de banco/Auth.
- Toda alteracao de schema nasce em migration versionada.
- Seeds idempotentes criam workspace MVP, categorias, usuarios de teste,
  ofertas, snapshots, rascunhos e agendamentos ficticios.
- `.env.example` documenta somente nomes de variaveis.
- Credenciais reais nunca entram em seed, migration, fixture ou log.
- Ambientes: local, preview/staging e production com projetos Supabase separados.

## Variaveis de ambiente previstas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` ou equivalente server-only para tarefas privilegiadas
- `INTERNAL_JOBS_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `APP_BASE_URL`

O nome exato das chaves Supabase deve ser validado no setup, sem expor qualquer
chave privilegiada com prefixo `NEXT_PUBLIC_`.

## Gate de saida do MVP

O MVP esta validado quando um Editor consegue, em ambiente production-like,
revisar uma oferta capturada, editar o post, aprovar, agendar, publicar no
Telegram e verificar o resultado/log; o Public Visitor consegue acessar o
redirect publico sem acessar o backoffice; e os testes de RLS provam que nenhum
papel ultrapassa seu acesso.
