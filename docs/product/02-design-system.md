# Design system

## Identidade

**Nome de trabalho:** Radar UI
**Personalidade:** editorial, precisa, confiavel, leve e eficiente.
**Base visual:** superficies claras, tinta azul-marinho, verde de oportunidade,
azul de tecnologia e coral apenas para falhas.

## Tokens de cor

Todos os pares abaixo atendem contraste WCAG AA quando usados conforme indicado.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg-canvas` | `#F7F9FC` | `#0D1421` | Fundo global |
| `bg-surface` | `#FFFFFF` | `#141E2D` | Superficie principal |
| `bg-subtle` | `#F0F4F8` | `#1B2738` | Agrupamentos |
| `bg-glass` | `rgba(255,255,255,.76)` | `rgba(20,30,45,.78)` | Drawers e popovers |
| `text-primary` | `#132238` | `#F3F7FB` | Texto principal |
| `text-secondary` | `#52647A` | `#A8B5C6` | Texto auxiliar |
| `text-muted` | `#74859A` | `#8291A5` | Metadados |
| `border-default` | `#DDE5ED` | `#2A394D` | Divisores e bordas |
| `primary-600` | `#155EEF` | `#6C9CFF` | Acao primaria |
| `primary-700` | `#004EEB` | `#8DB4FF` | Hover |
| `success-600` | `#14804A` | `#42D392` | Aprovado, oportunidade |
| `warning-600` | `#B54708` | `#F7B955` | Atencao |
| `danger-600` | `#C4320A` | `#FF8A70` | Erro, rejeicao |
| `info-600` | `#087EA4` | `#64C7E8` | Informacao |

### Score

- `90-100`: excelente, `success-600`, rotulo "Excelente".
- `75-89`: forte, `primary-600`, rotulo "Forte".
- `60-74`: moderado, `warning-600`, rotulo "Moderado".
- `0-59`: baixo, `danger-600`, rotulo "Baixo".
- Nunca depender somente da cor; exibir numero e rotulo.

### Categorias

Badges usam fundo suave e texto escuro: Pet `#7C5CFC`, Mercado `#168C5B`,
Tecnologia `#1769E0`, Casa `#C56A12`, Automotivo `#556987`, Gamer `#9A42C8`,
Bebes `#D45B8C`, Eletrodomesticos `#087EA4`, Outras `#667085`.

## Tipografia

Fonte: **Geist Sans**. Fallback: `Inter, system-ui, sans-serif`.

| Estilo | Tamanho/linha | Peso |
|---|---|---|
| Display | `32/40` | 650 |
| H1 | `28/36` | 650 |
| H2 | `22/30` | 650 |
| H3 | `18/26` | 600 |
| Body large | `16/24` | 450 |
| Body | `14/22` | 450 |
| Label | `13/18` | 600 |
| Caption | `12/18` | 500 |
| Numeros | tabular | 600 |

## Espacamento e dimensoes

- Escala: `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`.
- Grid desktop: 12 colunas, gutter `24px`.
- Grid tablet: 8 colunas, gutter `20px`.
- Grid mobile: 4 colunas, gutter `16px`.
- Altura de controles: `32px` compacto, `40px` padrao, `48px` destaque.
- Alvo minimo de toque: `44x44px`.

## Bordas, radius e elevacao

- Borda padrao: `1px solid border-default`.
- Radius: `6px` pequeno, `10px` controle, `14px` superficie, `20px` modal.
- Cards principais usam borda ou sombra, nunca ambos sem necessidade.
- `shadow-sm`: `0 1px 2px rgba(16,24,40,.06)`.
- `shadow-md`: `0 8px 24px rgba(16,24,40,.10)`.
- Glass: blur maximo `16px`; somente header flutuante, drawer, modal e popover.

## Iconografia e imagem

- Biblioteca recomendada: Lucide React, stroke `1.75`.
- Icones: `16px` inline, `20px` controles, `24px` navegacao.
- Imagens de produto: fundo neutro, `object-contain`, radius `10px`.
- Logo do marketplace nunca substitui o nome textual acessivel.

## Componentes e estados

Cada componente implementa `default`, `hover`, `focus-visible`, `active`,
`disabled` e `loading`. Estados semanticos usam mensagem e icone.

### Botao

- Variantes: primary, secondary, subtle, ghost, destructive, link.
- Loading preserva largura, substitui icone por spinner e usa `aria-busy`.
- Focus: anel externo `2px primary-600` com offset `2px`.
- Texto: verbo + objeto. Ex.: "Aprovar oferta", "Salvar rascunho".

### Campos

- Input, select, date picker, tag selector e textarea compartilham label,
  helper, contador opcional e mensagem de erro.
- Erro: borda danger, icone e texto especifico.
- Select e filtros devem suportar teclado e busca quando houver mais de 8 itens.

### Checkbox, radio e toggle

- Checkbox para selecao multipla; radio para escolha exclusiva.
- Toggle apenas para efeito imediato, nunca para confirmar acao destrutiva.
- Labels clicaveis com descricao quando a consequencia nao for obvia.

### Tabs

- Underline para conteudo de pagina; segmented control para alternar previews.
- Em mobile, scroll horizontal com indicador de overflow.

### Feedback

- Toast: confirmacoes breves, maximo 6 segundos, acao "Desfazer" quando cabivel.
- Alert: contexto persistente dentro da pagina.
- Modal: decisoes bloqueantes ou destrutivas.
- Tooltip: explica icones e termos; nunca contem acao essencial.

### Badge

- Variantes: neutral, category, status e highlight.
- Highlights: "Menor preco", "Cupom", "Frete gratis", "Alta comissao".
- Maximo de tres badges visiveis; excedente vira "+2".

### Card e row

- Card somente para objetos ou agrupamentos independentes.
- Listas de ofertas usam uma superficie agrupada com rows separadas.
- Hover de row revela acoes secundarias, mas a acao principal permanece visivel.

### Table

- Header sticky, ordenacao, densidade confortavel/compacta e colunas opcionais.
- Selecao em lote aparece em action bar contextual.
- Mobile: cada row vira bloco expansivel com pares label/valor.

### Navegacao

- Sidebar com grupos, item ativo e contador discreto.
- Header com busca, status, notificacoes e menu do usuario.
- Breadcrumb apenas em niveis profundos, nunca no Inicio.

### Componentes de dominio

**ScoreIndicator**
- Formas: ring `56px`, pill compacta e barra explicativa.
- Tooltip: "Score combina desconto, historico, comissao e confiabilidade."

**PriceHistoryCard**
- Preco atual, menor preco, media 30 dias e grafico.
- Marcadores acessiveis para mudancas e cupons.

**ApprovalActions**
- Primaria: "Aprovar e agendar".
- Secundarias: "Salvar rascunho", "Rejeitar".
- Rejeitar exige motivo; aprovar exige confirmacao somente se houver alerta.

**PostPreviewCard**
- Segmented control por canal.
- Preview realista, texto, link, imagem e contador.
- Avisos de limite e conteudo ausente aparecem junto ao campo.

**Stepper**
- Etapas nomeadas, status atual e conclusao.
- Mobile mostra "Etapa 2 de 4" e titulo atual.

## Motion

- Duracoes: `120ms` hover, `180ms` controles, `240ms` drawers/modais.
- Easing: `cubic-bezier(.2,.8,.2,1)`.
- Aprovacao move item para a proxima coluna com fade/slide curto.
- Score anima apenas na primeira aparicao.
- Respeitar `prefers-reduced-motion`; sem parallax.
