# Arquitetura do Radar de Ofertas

Especificacao tecnica MVP-first baseada exclusivamente nos documentos aprovados
em `/docs/product`.

## Ordem de leitura

1. [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)
2. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
3. [SUPABASE_RLS.md](SUPABASE_RLS.md)
4. [API_CONTRACTS.md](API_CONTRACTS.md)
5. [INTEGRATIONS.md](INTEGRATIONS.md)
6. [JOBS_AND_AUTOMATIONS.md](JOBS_AND_AUTOMATIONS.md)
7. [TEST_PLAN.md](TEST_PLAN.md)
8. [MVP_BACKLOG.md](MVP_BACKLOG.md)

## Fase 1 - Fundacao, Auth, RLS e Banco

1. [PHASE_1_IMPLEMENTATION_PLAN.md](PHASE_1_IMPLEMENTATION_PLAN.md)
2. [IDENTITY_MODEL.md](IDENTITY_MODEL.md)
3. [RLS_STRATEGY.md](RLS_STRATEGY.md)
4. [MIGRATION_PLAN.md](MIGRATION_PLAN.md)
5. [SEED_STRATEGY.md](SEED_STRATEGY.md)
6. [PHASE_1_TEST_MATRIX.md](PHASE_1_TEST_MATRIX.md)

## Decisoes centrais

- Monolito modular Next.js + Supabase.
- Workspace como fronteira de isolamento, sem UI multiempresa no MVP.
- Captura manual obrigatoria; conectores oficiais dependem de spikes.
- Score determinista e explicavel.
- Aprovacao humana obrigatoria.
- Telegram como unico canal publicador.
- RLS e verificacao server-side em toda acao sensivel.
- Jobs pequenos, idempotentes e sem worker permanente.
