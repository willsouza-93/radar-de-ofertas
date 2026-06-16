# Spike Telegram

## Objetivo

Validar publicacao automatizada **apos aprovacao humana** em um canal Telegram.

## Conclusao

**Go condicional.** A Bot API oficial suporta envio a canais quando o bot possui
permissoes relevantes. O Go definitivo exige teste real com bot e canal de teste.

## Como criar o bot

1. Abrir o bot oficial `@BotFather`.
2. Executar `/newbot`.
3. Definir nome e username.
4. Receber o token do bot.
5. Tratar o token como senha, com capacidade de revogacao.

A documentacao oficial confirma `/newbot` e recomenda armazenar o token com
seguranca.

## Como adicionar ao canal

1. Criar um canal privado de teste separado de producao.
2. Adicionar o bot como administrador do canal.
3. Conceder somente a permissao necessaria para postar mensagens
   (`can_post_messages`).
4. Nao conceder editar/apagar/gerenciar membros sem necessidade.

## Como obter channel/chat ID

- Canal publico: a Bot API aceita username no formato `@username` em metodos que
  recebem `chat_id`.
- Canal privado: obter o identificador numerico durante o teste, inspecionando
  um update `channel_post` ou ferramenta operacional controlada.
- O procedimento exato para canal privado deve ser validado no teste real:
  **Necessita validacao externa**.

## Como testar publicacao

Sequencia operacional, sem implementar codigo nesta fase:

1. Validar token com `getMe`.
2. Validar destino/permissoes com `getChat` e/ou `getChatMember`.
3. Enviar mensagem curta via `sendMessage`.
4. Confirmar retorno de sucesso e guardar `message_id`.
5. Enviar mensagem com link de teste.
6. Testar erro removendo `can_post_messages`.
7. Testar canal pausado/desconectado no produto futuramente.
8. Revogar/rotacionar token apÃ³s teste se ele tiver sido exposto.

## Limites conhecidos

- Mensagem de texto: 1 a 4096 caracteres.
- Em um unico chat, a FAQ recomenda evitar mais de uma mensagem por segundo.
- Grupos: limite documentado de 20 mensagens por minuto.
- Broadcast gratuito: aproximadamente 30 mensagens por segundo.
- Excesso pode gerar `429`; o valor de retry deve ser respeitado quando
  fornecido.
- Limites podem mudar: validar novamente antes da Fase 4.

Para um unico canal MVP, esses limites nao representam risco relevante se a
fila enviar sequencialmente e aplicar retry.

## Permissoes necessarias

- Bot como administrador do canal.
- `can_post_messages = true`.
- Permissoes adicionais nao sao necessarias para o fluxo MVP de publicar.
- Se no futuro houver edicao/exclusao, validar permissoes separadamente.

## Armazenamento de credenciais

- Token somente em secret store/variavel server-only do ambiente.
- Nunca em browser, `NEXT_PUBLIC_*`, banco `public`, logs, audit ou screenshots.
- Acesso limitado ao responsavel tecnico.
- Rotacao imediata em caso de exposicao.
- Staging e producao devem usar bots/tokens distintos.

## Ambiente de testes

- Bot exclusivo de staging.
- Canal privado exclusivo de staging.
- Somente membros da equipe.
- Prefixo visivel nas mensagens, por exemplo `[TESTE]`.
- Links apontam para dominio de staging.
- Publicacao real controlada/manual durante spike e smoke tests.
- Nao usar canal de producao em CI automatizada.

## Riscos relevantes

| Risco | Nivel | Mitigacao |
|---|---|---|
| Token exposto | Alto | Secret store, menor acesso e rotacao |
| Bot sem permissao | Medio | Teste obrigatorio antes de conectar |
| Mensagem duplicada apos timeout ambiguo | Alto | Claim atomico, idempotencia e intervencao |
| Rate limit | Baixo no MVP | Envio sequencial e retry |
| Mudanca da API | Baixo/medio | Validar docs antes da Fase 4 |
| Conteudo/link rejeitado | Medio | Validacao e erro humano antes de retry |

## Checklist

- [ ] Criar bot de teste via BotFather.
- [ ] Guardar token em local seguro temporario.
- [ ] Criar canal privado de teste.
- [ ] Adicionar bot como Admin com `can_post_messages`.
- [ ] Obter e registrar chat ID/username.
- [ ] Executar `getMe`.
- [ ] Executar validacao de chat/permissao.
- [ ] Enviar texto e link.
- [ ] Confirmar `message_id`.
- [ ] Confirmar erro quando permissao e removida.
- [ ] Confirmar procedimento de rotacao.
- [ ] Registrar data, responsavel e evidencias sem token.

## Criterios de sucesso

- Bot publica uma unica mensagem no canal de teste.
- Resposta confirma sucesso e fornece identificador persistivel.
- Permissao minima e suficiente.
- Token fica fora de frontend e documentos.
- Erro de permissao e identificavel.

## Criterios de falha

- Nao e possivel adicionar bot/admin ao canal escolhido.
- Nao e possivel obter destino estavel.
- Envio nao retorna resultado confiavel.
- Restricao operacional/termos impede o uso.
- Equipe nao consegue proteger/rotacionar token.

## Go / No-Go

**Status atual: Go condicional.**

- Go definitivo: checklist e criterios de sucesso completos.
- No-Go: qualquer criterio de falha sem mitigacao.
- Plano B: manter aprovacao/agendamento e oferecer copia manual do post enquanto
  o canal e corrigido; nao adicionar WhatsApp como workaround.

## Fontes oficiais

- https://core.telegram.org/bots/tutorial
- https://core.telegram.org/bots/api
- https://core.telegram.org/bots/faq
