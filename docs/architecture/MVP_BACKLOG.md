# Backlog MVP-first

## Premissas

- Fluxo validado: `Captura -> Curadoria -> Aprovacao -> Agendamento -> Publicacao`.
- Telegram e o unico canal publicador.
- Toda publicacao exige aprovacao humana.
- Entrada manual garante que o MVP nao dependa da aprovacao de marketplace.
- As telas e nomenclaturas aprovadas nao mudam; itens pÃ³s-MVP usam estados
  previstos sem funcionalidade executavel.

## Fase 0 - Descoberta tecnica e gates

### Tarefas

- Confirmar arquitetura e cortes de escopo.
- Spike Telegram com canal de teste.
- Spike Mercado Livre oficial.
- Spike Shopee oficial.
- Definir template de importacao/cadastro manual.
- Escolher scheduler barato conforme limites reais.
- Definir ambientes local, staging e production.

### Criterios de aceite

- Telegram envia mensagem de teste e retorna identificador.
- Go/no-go documentado para cada marketplace.
- Fallback manual validado independentemente dos marketplaces.
- Nenhuma estrategia de scraping e requisito do MVP.

### Dependencias e riscos

- Acesso/aprovacao de APIs externas.
- Termos de uso e limites.
- Decisao de scheduler.

## Fase 1 - Fundacao local, Auth e seguranca

### Tarefas

- Inicializar Next.js App Router e Supabase local.
- Configurar projetos Supabase separados.
- Criar migrations versionadas de enums, identidade e helpers.
- Implementar Auth: login, recuperacao e provisionamento/convite de Admin e
  Editor.
- Criar workspace MVP e memberships.
- Implementar RLS inicial e testes por papel/workspace.
- Definir clientes Supabase browser/server/privilegiado server-only.
- Criar seed idempotente.

### Seed minimo

- Workspace `Radar de Ofertas`.
- Admin, Editor, Admin de outro workspace e usuario suspenso.
- Categorias aprovadas.
- Ofertas e snapshots em todos os estados.
- Canal Telegram ficticio conectado/pausado.
- Drafts, publicacoes, logs e cliques ficticios.

### Criterios de aceite

- Nao existe cadastro publico no MVP.
- Admin/Editor veem apenas o permitido.
- Public Visitor/anon nao acessa o backoffice ou tabelas internas.
- Usuario de outro workspace e suspenso sao bloqueados.
- Testes RLS passam em CI local.
- Nenhuma chave privilegiada aparece no browser.

### Riscos

- Policies permissivas ou ausentes.

## Fase 2 - Captura manual, ofertas e score

### Tarefas

- Migrations de categorias, ofertas e snapshots.
- Contrato normalizado de captura.
- Server Action de captura manual/upsert.
- Formula score MVP v1, fatores e highlights.
- Dashboard orientado a acao com dados reais minimos.
- Lista, filtros MVP, detalhe e historico de preco.
- Logs de captura e audit minimo.

### Criterios de aceite

- Admin cria/atualiza oferta sem duplicar.
- Mudanca de preco gera snapshot.
- Score e explicacao sao deterministas.
- Filtros aprovados essenciais funcionam server-side.

### Dependencias

- Fase 1.

### Riscos

- Formula inicial mal calibrada; manter versionada e configuracao simples.

## Fase 3 - Curadoria, editor e aprovacao

### Tarefas

- Migrations de drafts e auditoria.
- Enviar oferta para review e criar draft Telegram por template.
- Editor com autosave e controle otimista de versao.
- Fila de aprovacao e preview Telegram.
- Aprovar, rejeitar com motivo e audit logs.
- Guards/UX por papel sem alterar design aprovado.

### Criterios de aceite

- Admin/Editor editam e aprovam conforme suas permissoes.
- Rejeicao exige motivo.
- Autosave nao sobrescreve edicao concorrente.
- Editor aprova/agendar em no maximo tres passos apos abrir fila.
- Toda acao sensivel possui audit log.

### Dependencias

- Fases 1 e 2.

## Fase 4 - Canal Telegram, agendamento e publicacao

### Tarefas

- Migrations de canal, publication e redirect.
- Configurar/testar/pausar Telegram para Admin.
- Criar agendamento atomicamente com aprovacao.
- Agenda aprovada em calendario/lista com dados MVP.
- Endpoint interno e scheduler para `publish-due`.
- Claim atomico, retry, idempotencia e logs.
- "Publicar agora" pela mesma pipeline.
- Redirect de clique.

### Criterios de aceite

- Somente canal conectado recebe agendamento.
- Publicacao agendada ocorre uma unica vez.
- Falha recuperavel tem retry; terminal exige intervencao.
- Editor agenda/cancela/publica agora; nao configura canal.
- Clique redireciona mesmo se analytics falhar.

### Dependencias

- Spike Telegram e Fase 3.

### Riscos

- Duplicidade apÃ³s timeout ambiguo.
- Limites/indisponibilidade do scheduler ou Telegram.

## Fase 5 - Logs, relatorios minimos e administracao

### Tarefas

- Logs da automacao conforme papel.
- Reprocessamento Admin.
- Relatorio de publicacoes, cliques e taxa de clique.
- Usuarios e permissoes: convite, papel e suspensao.
- Estados vazios, loading, erros e acesso limitado aprovados.
- Paginas 404/erro geral.

### Criterios de aceite

- Admin investiga e reprocessa falha recuperavel.
- Editor ve falha de publicacao sem detalhes tecnicos completos.
- Admin nao consegue suspender/rebaixar o ultimo Admin.
- Relatorio deixa conversoes/receita como indisponiveis, sem inventar dados.

### Dependencias

- Fases 1 a 4.

## Fase 6 - Conectores aprovados e hardening

### Tarefas

- Implementar apenas adapters oficiais aprovados nos spikes.
- Job de captura agendada e refresh limitado de preco.
- Testes de contrato dos adapters.
- Revisao de indices e queries.
- Auditoria de RLS/segredos/logs.
- E2E responsivo, acessibilidade e smoke staging.
- Runbook e checklist de release.

### Criterios de aceite

- Falha de conector nao bloqueia fluxo manual.
- Jobs respeitam limites, retry e idempotencia.
- Zero falha critica de seguranca/testes.
- Fluxo completo validado em staging production-like.

### Dependencias

- Go dos spikes e Fases 1 a 5.

## Ordem ideal resumida

1. Gates externos e fallback manual.
2. Auth, workspace, RLS e seeds.
3. Oferta, snapshot e score.
4. Draft, fila e aprovacao.
5. Telegram, agenda, job e redirect.
6. Logs, relatorios e usuarios.
7. Conectores oficiais e hardening.

## Itens explicitamente excluidos do MVP

- WhatsApp, redes sociais e workarounds nao oficiais.
- Scraping em producao.
- Publicacao totalmente automatica.
- IA generativa e ML de score.
- Conversoes/receita sem fonte oficial.
- Multiempresa configuravel.
- Realtime, push, fila externa, warehouse e BI.
- Campanhas, A/B tests, notificacoes e filtros salvos.
- Gerenciamento avancado de cupons/categorias.
- Apps nativos.

## Registro de riscos

| Risco | Impacto | Mitigacao MVP |
|---|---|---|
| Marketplace sem API adequada | Alto | Fallback manual obrigatorio |
| Termos impedem armazenamento/uso | Alto | Spike e go/no-go antes de implementar |
| Duplicidade Telegram | Alto | Claim atomico, idempotencia e tratamento de timeout |
| RLS incorreta | Alto | Matriz automatizada e dois workspaces em teste |
| Service key exposta | Alto | Server-only, revisao e teste de bundle/env |
| Score pouco util | Medio | Formula explicavel/versionada e ajuste posterior |
| Job excede timeout | Medio | Lotes pequenos e scheduler repetitivo |
| Click analytics abusado | Medio | Rate limit, minimizacao e IP hash |
| MVP crescer por telas pÃ³s-MVP | Medio | Estados vazios/indisponiveis, sem backend extra |

## Definition of Done do MVP

- Fluxo principal completo no Telegram em staging e production.
- Admin e Editor cumprem matriz aprovada no frontend, servidor e RLS.
- Public Visitor/anon acessa somente o redirect publico obrigatorio.
- Migrations, seeds e setup local reproduziveis.
- Jobs idempotentes e falhas investigaveis.
- Testes essenciais e runbook aprovados.
- Itens pÃ³s-MVP claramente indisponiveis, sem alterar UX ou prometer dados.
