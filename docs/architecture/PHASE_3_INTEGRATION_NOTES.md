# Notas de Integracao da Fase 3

Status: limites operacionais para Fase 3B.

## Usado via Supabase

- Migrations locais versionadas.
- Tabelas de curadoria em `public` com RLS.
- Helpers existentes de membership e role.
- Seeds locais/teste.
- pgTAP para RLS e grants.

Supabase staging:

- aplicar migrations somente apos merge e autorizacao explicita;
- nao aplicar seeds de fixture;
- validar com smoke tests estruturais;
- registrar resultado em docs/operations.

## Ficara para Next.js

- Server Actions:
  - `approveOffer`;
  - `rejectOffer`;
  - `addReviewNote`.
- Queries server-side:
  - `listApprovalQueue`;
  - `getApprovalDetail`;
  - `listReviewHistory`.
- Validacao Zod.
- Resolucao de workspace pela membership ativa.
- Tratamento de concorrencia com `expectedStatus`.

## Ficara para Fase 4

- criar post/draft editorial;
- editor de post;
- agendamento real;
- canais de publicacao;
- Telegram;
- scheduler;
- redirect publico;
- analytics de clique/conversao;
- jobs e logs de publicacao.

## Exige intervencao manual

- Autorizar aplicacao das migrations em staging.
- Criar dados reais de validacao integrada, se necessario.
- Confirmar qualquer rollback destrutivo.
- Decidir se ofertas antigas em staging devem receber backfill de fila.

## Nao exige agora

- secrets novos;
- `SUPABASE_SERVICE_ROLE_KEY`;
- Vercel env vars novas;
- GitHub Actions secrets;
- Edge Functions;
- Storage.
