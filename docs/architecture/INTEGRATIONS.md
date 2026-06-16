# Integracoes MVP

## Regra de decisao

O produto deve preferir integracoes oficiais, autorizadas e sustentaveis. Como
os documentos de produto nao definem contratos externos, cada marketplace exige
um spike antes de implementacao. Nenhuma suposicao sobre disponibilidade,
permissoes ou limites de API deve virar compromisso de MVP sem validacao.

Ordem de preferencia:

1. API/feed oficial autorizado.
2. Importacao manual estruturada.
3. Cadastro manual individual.
4. Scraping somente como estudo de risco pÃ³s-MVP, nunca dependencia inicial.

## Contrato interno de conector

Todos os conectores de captura, inclusive manual, produzem um payload interno
normalizado:

```ts
type CapturedOfferInput = {
  marketplace: "mercado_livre" | "shopee" | "manual";
  externalId: string;
  sourceUrl: string;
  affiliateUrl: string;
  title: string;
  imageUrl?: string;
  categoryHint?: string;
  currentPrice: number;
  previousPrice?: number;
  couponCode?: string;
  freeShipping: boolean;
  commissionPercent?: number;
  capturedAt: string;
};
```

O conector nao calcula score, nao muda status editorial e nao publica. Ele
somente autentica, coleta, valida minimamente e entrega dados ao pipeline comum.

## Shopee

### Estrategia recomendada

1. Executar spike para confirmar acesso oficial aplicavel ao programa de
   afiliados, escopos, limites, formato de links e permissao de armazenamento.
2. Se aprovado, implementar um adapter server-only com credenciais fora do
   browser.
3. Mapear identificador externo, preco, preco anterior, cupom, frete, imagem,
   categoria e link de afiliado quando fornecidos oficialmente.
4. Respeitar rate limit e cache conforme contrato validado.

### Fallback MVP

- Importacao CSV/JSON a partir de fonte legitimamente obtida.
- Cadastro manual pela acao Admin "Capturar agora"/entrada manual.
- Campos nao fornecidos permanecem nulos; score lida com ausencia de fator.

### Riscos

- Acesso oficial pode ser restrito, exigir aprovacao ou nao cobrir dados
  necessarios.
- Termos podem limitar armazenamento, atualizacao ou exibicao.
- Links de afiliado podem expirar ou exigir geracao em fluxo especifico.
- Scraping e alternativa nao preferencial e fica fora do MVP.

## Mercado Livre

### Estrategia recomendada

1. Executar spike da API oficial para confirmar endpoints, autenticacao,
   limites, dados de preco/frete e uso permitido no contexto de afiliados.
2. Separar dados publicos do produto de dados/links especÃ­ficos de afiliado.
3. Implementar adapter server-only e persistir apenas o necessario ao produto.
4. Upsert por identificador oficial e gerar snapshot quando o preco mudar.

### Fallback MVP

- Importacao estruturada e cadastro manual.
- Link de afiliado informado/validado pelo Admin quando nao existir geracao
  oficial automatizavel.

### Riscos

- API de catalogo e programa de afiliados podem ter contratos diferentes.
- Preco anterior, cupom, comissao e frete podem nao estar disponiveis ou ser
  contextuais.
- Rate limits e regras de cache precisam ser confirmados no spike.
- Scraping nao deve ser usado para contornar indisponibilidade oficial.

## Telegram

### Escopo MVP

Telegram e o unico canal com publicacao automatizada apos aprovacao humana.

### Configuracao

- Admin informa/configura bot e identificador do canal.
- Token fica somente no ambiente server-side/secret store.
- A etapa "Testar conexao" e obrigatoria antes de marcar canal `connected`.
- O teste valida que o bot consegue publicar no destino configurado.

### Publicacao

- Mensagem deriva do snapshot aprovado do `post_draft`.
- Link publicado usa `redirect_links` para analytics de clique.
- Imagem e opcional; se envio com imagem falhar por problema recuperavel,
  registrar falha e aplicar retry, sem silently publicar conteudo diferente.
- Guardar identificador externo retornado para auditoria/idempotencia.
- Uma publicacao aprovada gera no maximo uma mensagem por idempotency key.

### Falhas

- Credencial/destino invalido: marcar canal `warning` ou `disconnected`, falha
  nao recuperavel ate intervencao.
- Rate limit/erro temporario: retry com espera indicada ou backoff.
- Conteudo invalido: falha nao recuperavel, orientar edicao.
- Timeout: antes de reenviar, verificar se existe identificador/resultado que
  permita evitar duplicidade; se incerto, enviar para revisao Admin.

## WhatsApp e redes sociais

Ficam pÃ³s-MVP. Motivos:

- Podem exigir provedores, templates aprovados, regras comerciais e custo.
- Workarounds via automacao de navegador ou cliente nao oficial representam
  risco operacional e de termos de uso.
- O MVP valida o fluxo editorial e de publicacao com Telegram.

Os previews aprovados podem aparecer como indisponiveis/pÃ³s-MVP, sem configurar
ou publicar.

## Fallback manual comum

Quando a integracao oficial nao estiver disponivel:

1. Admin cadastra ou importa oferta com dados minimos.
2. Sistema normaliza, deduplica, cria snapshot e calcula score.
3. Admin/Editor executa o mesmo fluxo de curadoria, aprovacao e Telegram.
4. A origem `manual` fica identificada para confianca e auditoria.

Campos obrigatorios: marketplace/origem, external ID estavel, titulo, URL fonte,
link de afiliado, preco atual e data de captura.

## Seguranca e conformidade

- Credenciais nunca no frontend, logs, analytics ou audit data.
- Dados externos sao validados como nao confiaveis.
- URLs devem aceitar somente protocolos/hosts permitidos conforme conector.
- Imagens externas nao sao baixadas/re-hospedadas sem necessidade e permissao.
- Documentar versao do contrato, limite e politica de retencao de cada fonte.
- Implementacao de cada conector depende de aprovacao do spike de termos de uso.

## Spikes obrigatorios antes da implementacao

| Spike | Saida esperada | Gate |
|---|---|---|
| Shopee oficial | Acesso, campos, afiliacao, limites e ToS | Go/no-go |
| Mercado Livre oficial | Acesso, campos, afiliacao, limites e ToS | Go/no-go |
| Telegram | Bot publica no canal de teste e retorna ID | Obrigatorio |
| Importacao manual | Template, validacao e deduplicacao | Obrigatorio |

Se os spikes de marketplaces falharem, o MVP continua com captura manual sem
alterar o fluxo aprovado.
