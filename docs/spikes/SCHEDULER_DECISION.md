# Decisao de scheduler MVP

## Necessidade

O scheduler apenas aciona endpoints internos idempotentes. Ele nao carrega a
regra de negocio nem publica diretamente. A precisao necessaria para publicacao
deve ser definida pelo Product Owner; a recomendacao assume execucao frequente,
com tolerancia de poucos minutos.

## Comparacao

| Criterio | GitHub Actions | Supabase Cron | Vercel Cron |
|---|---|---|---|
| Facilidade | Media; workflow e secrets separados | Alta; junto do banco e dashboard | Alta; integrado ao deploy Next.js |
| Intervalo oficial | Minimo 5 minutos | De cada segundo a anual | Hobby diario; Pro/Enterprise por minuto |
| Precisao/confiabilidade | Pode atrasar e ate descartar em alta carga | Monitoramento de runs no Postgres; validar operacao real | Hobby tem precisao horaria; Pro por minuto |
| Observabilidade | Logs/historico de workflows | `cron.job_run_details` e dashboard | Logs/observabilidade de Functions |
| Custos | Publico gratis; privado tem quota/minutos | Necessita validacao externa do plano/custo | Cron incluso, mas Functions cobradas; Pro necessario para frequencia |
| Segredos | GitHub Secrets | Vault/configuracao segura a validar | Environment variables/`CRON_SECRET` |
| Acoplamento | Repositorio/CI | Banco Supabase | Deploy Vercel |
| Adequacao a publicacao | Baixa/media | Alta, condicionada a teste | Alta no Pro; inadequada no Hobby |

## Evidencias confirmadas

### GitHub Actions

- Menor intervalo agendado: 5 minutos.
- Workflows agendados podem atrasar em alta carga e alguns podem ser descartados.
- Executam somente no branch default.
- Repositorios privados possuem quota de minutos conforme plano.

Conclusao: inadequado como scheduler principal de publicacao, mas aceitavel para
capturas nao urgentes, smoke ou manutencao.

### Supabase Cron

- Usa `pg_cron`.
- Pode executar SQL, funcoes de banco ou chamadas HTTP.
- Registra execucoes/status no Postgres.
- Documentacao recomenda no maximo 8 jobs concorrentes e ate 10 minutos por job.

Conclusao: encaixa melhor no modelo aprovado de Postgres como sistema de registro
e endpoints idempotentes.

### Vercel Cron

- Aciona Vercel Functions por HTTP GET no deployment de producao.
- Disponivel em todos os planos.
- Hobby: uma execucao por dia e precisao horaria de Â±59 minutos.
- Pro/Enterprise: intervalo e precisao por minuto.
- Execucoes consomem limites/custo de Functions.

Conclusao: boa opcao se Vercel Pro estiver aprovado; Hobby nao atende agenda.

## Recomendacao principal

**Supabase Cron.**

Motivos:

- Proximo da fila/estado de jobs no Postgres.
- Observabilidade de execucoes no mesmo ambiente.
- Frequencia adequada sem depender de GitHub Actions.
- Pode chamar o Route Handler interno aprovado, mantendo regras no Next.js.

## Condicoes para Go

- Confirmar disponibilidade e custo no plano Supabase escolhido:
  **Necessita validacao externa**.
- Provar chamada HTTP autenticada ao endpoint interno.
- Garantir que segredo nao aparece em logs.
- Confirmar que latencia/precisao atendem SLA decidido.
- Confirmar que jobs ficam abaixo de 10 minutos e baixa concorrencia.
- Manter idempotencia e claim no banco, pois scheduler nao garante unicidade.

## Plano B

**Vercel Cron em plano Pro.**

Usar se Supabase Cron nao atender autenticacao, confiabilidade, custo ou
operacao. Manter os mesmos endpoints e idempotencia para a troca ser pequena.

## Opcao nao recomendada

**GitHub Actions para publicacao agendada.**

O risco oficial de atraso/descarte e a natureza de CI tornam a opcao inadequada
ao fluxo principal. Pode ser usado para tarefas sem SLA.

## Go / No-Go

**Go condicional para Supabase Cron.**

- Nao bloqueia a Fase 1.
- Deve estar validado antes da Fase 4.

## Fontes oficiais

- https://supabase.com/docs/guides/cron
- https://vercel.com/docs/cron-jobs
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://docs.github.com/en/actions/concepts/billing-and-usage
