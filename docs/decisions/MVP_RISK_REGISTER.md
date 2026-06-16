# Registro de riscos do MVP

## Escala

- Probabilidade: baixa, media, alta.
- Impacto: baixo, medio, alto, critico.
- Owner deve ser nomeado antes da fase em que o risco se materializa.

| Risco | Probabilidade | Impacto | Mitigacao | Plano B |
|---|---|---|---|---|
| Mercado Livre sem API/afiliacao aplicavel | Alta | Alto | Spike oficial, ToS e Go/no-go | Cadastro manual; CSV pÃ³s-MVP |
| Shopee sem API/afiliacao aplicavel | Alta | Alto | Validacao externa oficial | Cadastro manual; sem conector |
| Campos externos incompletos | Alta | Medio | Campos opcionais valem zero; complemento manual | Score com menos fatores |
| Mudanca/limite de API externa | Media | Alto | Adapter isolado, rate limit e logs | Pausar conector e operar manualmente |
| Scraping virar dependencia | Baixa | Alto | Proibido no MVP e gate arquitetural | Entrada manual/oficial |
| Telegram sem permissao no canal | Media | Alto | Teste obrigatorio e permissao minima | Copia manual enquanto corrige |
| Token Telegram exposto | Baixa | Critico | Secret store, acesso minimo e rotacao | Revogar, novo bot/token e incidente |
| Duplicidade de publicacao | Media | Alto | Claim atomico, idempotency key e external ID | Bloquear retry ambiguo e revisao Admin |
| Timeout ambiguo do Telegram | Media | Alto | Nao reenviar cegamente | Intervencao manual |
| Rate limit Telegram | Baixa no MVP | Medio | Envio sequencial, retry/backoff | Atrasar fila |
| Scheduler atrasar/falhar | Media | Alto | Supabase Cron monitorado e jobs idempotentes | Vercel Cron Pro; publicar agora |
| Supabase Cron nao atender plano/custo | Media | Medio | Validar antes da Fase 4 | Vercel Cron Pro |
| GitHub Actions atrasar/descartar | Alta | Alto se usado | Nao usar para publicacao | Supabase/Vercel Cron |
| Indisponibilidade Supabase | Baixa/media | Alto | Jobs reexecutaveis, logs e recuperacao | Pausar operacao e retomar |
| RLS incorreta/vazamento entre workspaces | Media | Critico | Policies deny-by-default e matriz automatizada | Bloquear release/corrigir incidente |
| Service key no frontend/log | Baixa | Critico | Server-only, revisao de bundle/env/logs | Rotacionar chave e investigar |
| Acesso anonimo indevido ao backoffice ou tabelas internas | Media | Critico | RLS deny-by-default, sem grants anon e testes de Public Visitor | Bloquear release e corrigir incidente |
| Auditoria/logs armazenam segredo/conteudo indevido | Media | Alto | Sanitizacao e contratos de log | Retencao curta, expurgo e rotacao |
| Analytics de clique abusado/fraudado | Alta | Medio | Rate limit, IP hash e tratar como indicativo | Desativar contagem sem quebrar redirect |
| Redirect de clique indisponivel | Baixa/media | Alto | Endpoint simples e observavel | Link afiliado direto temporario |
| Custo Vercel/Supabase crescer | Media | Medio | Limites, lotes e alertas de uso | Reduzir frequencia/volume; rever plano |
| Dependencia excessiva de terceiro | Alta | Alto | Adapters e fallback manual | Operacao manual e troca de scheduler |
| Score inicial pouco util | Media | Medio | Explicavel/versionado e feedback | Ajustar pesos em nova versao |
| Dados manuais incorretos | Alta | Medio | Validacao, preview e auditoria | Corrigir/rejeitar antes de publicar |
| Link afiliado invalido/expirado | Media | Alto | Validacao antes de aprovar/publicar | Bloquear publicacao e editar |
| Job concorrente/processamento preso | Media | Alto | Locks com timeout e reconciliacao | Reprocessamento Admin |
| Falta de owner/billing/MFA | Media | Critico | Resolver bloqueador antes da Fase 1 | Nao iniciar ambientes |
| Retencao de dados indefinida | Media | Medio | Decidir antes das tabelas de logs/cliques | Retencao conservadora temporaria |

## Riscos bloqueadores da Fase 1

1. Owner, billing, MFA e recuperacao dos ambientes indefinidos.
2. URLs/callbacks dos ambientes indefinidos.
3. Processo de gestao de segredos indefinido.

## Riscos aceitos para iniciar Fase 1

- Marketplaces inconclusivos, porque cadastro manual e suficiente.
- Telegram ainda condicional, porque a publicacao entra na Fase 4.
- Scheduler ainda condicional, porque sera validado antes da Fase 4.

## Cadencia de revisao

- Revisar no inicio e fim de cada fase.
- Atualizar probabilidade/impacto apÃ³s cada spike ou incidente.
- Qualquer risco critico sem mitigacao bloqueia release.
