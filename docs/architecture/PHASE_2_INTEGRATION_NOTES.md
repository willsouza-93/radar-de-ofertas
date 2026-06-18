# Notas de integracao da Fase 2

Status: limites operacionais para Fase 2B.

## Executado via Supabase

Na Fase 2B, o Codex podera executar localmente:

- Criacao de migrations com Supabase CLI.
- `npx supabase db reset`.
- `npx supabase test db`.
- Consultas locais para validar schema/RLS.
- Seeds locais/teste.

No Supabase staging:

- Aplicar migrations futuras somente apos merge na `main`.
- Aplicacao deve ser workflow separado ou operacao manual controlada.
- Nao aplicar seeds de fixture com usuarios/senhas genericas.
- Nao executar operacao destrutiva sem confirmacao explicita.

## Exigira Next.js

Quando a Fase 2B implementar app/codigo:

- Server Actions:
  - `captureOfferManual`
  - `updateOfferManual`
- Queries server-side:
  - `listOffers`
  - `getOfferDetail`
- Validadores Zod.
- Modulo deterministico de score.
- Normalizacao de URL, preco e strings.

O frontend final nao faz parte da Fase 2A. Qualquer UI criada na Fase 2B deve
ser minima e apenas para validar contratos, se explicitamente autorizada.

## Exigira acao manual

- Confirmar aplicacao de migrations em Supabase staging.
- Revisar diff de migrations antes de staging.
- Criar dados de staging pela aplicacao ou procedimento controlado, se
  necessario.
- Configurar `SUPABASE_SERVICE_ROLE_KEY` apenas se uma necessidade server-side
  real surgir e for aprovada.

## Nao exige agora

- GitHub Secrets para PR CI.
- Supabase remoto em CI de pull request.
- Vercel CLI local.
- Service role key.
- Edge Functions.
- Storage.
- Scheduler.
- Telegram.

## Fases futuras

Mover para backlog futuro:

- Mercado Livre API.
- Shopee API.
- Scraping.
- Telegram.
- WhatsApp.
- Publicacao.
- Aprovacao/agendamento.
- IA e geracao de texto.
- Site publico.
- Analytics de clique/conversao.
- Upload de imagens.
- Cupons como entidade gerenciavel.
- Logs/jobs completos.

## Fluxo recomendado para Fase 2B

1. Implementar e validar tudo localmente.
2. Abrir PR.
3. CI de PR roda Supabase local.
4. Merge na `main` apenas com CI verde.
5. Aplicar migrations em staging por operacao controlada.
6. Validar staging com smoke manual.
7. Registrar resultado em changelog da Fase 2.
