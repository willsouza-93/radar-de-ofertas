# Fase 0 - Decisoes e viabilidade

## Convencao de pasta

De agora em diante, `docs/architecture` e o nome correto da pasta de arquitetura.

## Estado executivo em 12 de junho de 2026

| Pergunta | Resposta atual |
|---|---|
| Conseguimos publicar no Telegram? | **Provavelmente sim; Go condicional** a teste real de bot/canal |
| Conseguimos capturar ofertas oficialmente? | **Parcial/inconclusivo**; Mercado Livre tem APIs oficiais de itens, mas afiliacao e campos completos nao foram confirmados. Shopee necessita validacao externa |
| Qual entrada minima do MVP? | **Cadastro manual individual** |
| Qual scheduler sera utilizado? | **Supabase Cron**, condicionado a teste de chamada HTTP autenticada e validacao de custo/plano |
| Existe bloqueador para iniciar a Fase 1? | **Sim**, apenas bloqueadores operacionais de fundacao listados abaixo. Marketplaces e Telegram nao bloqueiam Auth/RLS/Banco |

## Decisoes ja aprovadas

- Monolito modular Next.js.
- Supabase Auth, Postgres e RLS.
- Workspace como fronteira de isolamento.
- Telegram como unico canal publicador do MVP.
- Aprovacao humana obrigatoria.
- Score deterministico, explicavel e versionado.
- Entrada manual obrigatoria.
- Nenhuma publicacao automatica sem aprovacao.
- Nenhum scraping em producao no MVP.
- RBAC interno somente com Admin e Editor.
- Public Visitor e anonimo, nao pertence a workspace e acessa somente ofertas
  publicadas em canais externos e `/r/{shortCode}` no MVP.

## Decisoes desta Fase 0

| Tema | Decisao |
|---|---|
| Entrada MVP | Cadastro manual individual |
| Importacao | CSV como primeira evolucao pÃ³s-MVP; JSON somente para integracoes/operacao tecnica |
| Scheduler | Supabase Cron como recomendacao principal |
| Vercel Cron | Plano B se o projeto usar Vercel Pro; Hobby nao atende agendamento preciso |
| GitHub Actions | Nao usar para publicacao agendada; aceitavel para tarefas nao urgentes |
| Mercado Livre | Conector oficial fica condicionado a spike autenticado e validacao de afiliacao/ToS |
| Shopee | Conector oficial nao autorizado nesta fase; necessita validacao externa |
| Telegram | Go condicional a checklist operacional com canal de teste |

## Decisoes pendentes

| Decisao necessaria | Responsavel | Impacto | Prazo recomendado |
|---|---|---|---|
| Nomear owner dos projetos Supabase/Vercel e responsavel por billing | Product Owner | Bloqueia criacao segura dos ambientes | Antes da Fase 1 |
| Escolher plano Supabase e validar disponibilidade/custo de Cron | Tech Lead + Product Owner | Confirma scheduler e custo | Antes da Fase 4; recomendavel antes da Fase 1 |
| Criar canal Telegram de teste e nomear administrador | Product Owner | Necessario ao Go definitivo de publicacao | Durante Fase 0 |
| Criar bot Telegram e guardar token em secret store temporario seguro | Tech Lead/Admin | Necessario ao teste real | Durante Fase 0 |
| Definir horario/frequencia aceitavel do job de publicacao | Product Owner + Tech Lead | Determina SLA do scheduler | Antes da Fase 4 |
| Confirmar politica de retencao de click events, logs e auditoria | Product Owner + Security | Custo e privacidade | Antes das migrations correspondentes |
| Confirmar canal legal/comercial para Mercado Livre afiliados | Product Owner/Legal | Decide Go do conector | Antes da Fase 6 |
| Confirmar canal legal/comercial para Shopee afiliados/Open Platform | Product Owner/Legal | Decide Go do conector | Antes da Fase 6 |
| Definir dominio/base URL por ambiente | Tech Lead | Auth redirects e links de clique | Antes da configuracao Auth |
| Definir limite operacional inicial de ofertas/dia e publicacoes/dia | Product Owner | Dimensiona custo e rate limit interno | Antes da Fase 2 |

## Decisoes bloqueadoras para iniciar a Fase 1

1. **Owner e acesso aos ambientes:** identificar quem cria e controla projetos
   Supabase e Vercel, billing, MFA e recuperacao.
2. **Ambientes e URLs:** definir local, staging e production, incluindo URLs de
   callback Auth.
3. **Gestao de segredos:** definir onde segredos server-only serao armazenados e
   quem pode acessa-los.

Nao bloqueiam a Fase 1:

- Go definitivo do Telegram, pois a Fase 1 cobre fundacao/Auth/RLS/Banco.
- APIs de Mercado Livre ou Shopee, pois cadastro manual e obrigatorio.
- Scheduler definitivo em producao, desde que a recomendacao seja validada antes
  da Fase 4.

## Gates para encerrar a Fase 0

- [ ] Bloqueadores operacionais da Fase 1 resolvidos.
- [ ] Bot Telegram publica uma mensagem unica no canal de teste.
- [ ] Bot retorna identificador da mensagem e erros conhecidos sao observados.
- [ ] Template de cadastro manual aprovado.
- [ ] Supabase Cron testado conceitualmente/operacionalmente para chamar endpoint
  autenticado, ou Plano B escolhido.
- [ ] Go/no-go de marketplaces aceito sem bloquear entrada manual.

## Evidencias oficiais consultadas

- [Telegram Bot tutorial](https://core.telegram.org/bots/tutorial)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Bots FAQ](https://core.telegram.org/bots/faq)
- [Mercado Libre authentication](https://developers.mercadolibre.com.ar/en_us/authentication-and-authorization)
- [Mercado Libre items and searches](https://developers.mercadolibre.com.ar/en_us/items-and-searches)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Vercel Cron](https://vercel.com/docs/cron-jobs)
- [Vercel Cron pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [GitHub Actions schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
