# Handoff de desenvolvimento

## Stack recomendada

- Next.js App Router + TypeScript.
- Tailwind CSS com CSS custom properties para tokens.
- Radix UI para primitives acessiveis.
- Lucide React para icones.
- React Hook Form + Zod para formularios.
- TanStack Table para tabelas.
- Recharts ou Visx para graficos, sempre com resumo textual.
- date-fns com locale `pt-BR`.
- Storybook para componentes e estados.

## Estrutura sugerida

```text
src/
  app/
    (auth)/
      login/page.tsx
      recuperar-senha/page.tsx
    (app)/
      layout.tsx
      page.tsx
      ofertas/page.tsx
      ofertas/[id]/page.tsx
      aprovacoes/page.tsx
      editor/[id]/page.tsx
      agendamentos/page.tsx
      canais/page.tsx
      categorias/page.tsx
      historico-precos/page.tsx
      cupons/page.tsx
      relatorios/page.tsx
      integracoes/page.tsx
      usuarios/page.tsx
      logs/page.tsx
    not-found.tsx
    error.tsx
    loading.tsx
  components/
    ui/
    layout/
    offers/
    publishing/
    reports/
    feedback/
  features/
    auth/
    offers/
    approvals/
    publishing/
    integrations/
    permissions/
  lib/
    auth/
    api/
    permissions/
    format/
  styles/
    globals.css
    tokens.css
  types/
```

## Tokens Tailwind

Mapear tokens semanticos para CSS variables, nao cores literais nos componentes.

```css
:root {
  --bg-canvas: 247 249 252;
  --bg-surface: 255 255 255;
  --text-primary: 19 34 56;
  --text-secondary: 82 100 122;
  --border-default: 221 229 237;
  --primary: 21 94 239;
  --success: 20 128 74;
  --warning: 181 71 8;
  --danger: 196 50 10;
  --radius-control: 10px;
  --radius-surface: 14px;
}

.dark {
  --bg-canvas: 13 20 33;
  --bg-surface: 20 30 45;
  --text-primary: 243 247 251;
  --text-secondary: 168 181 198;
  --border-default: 42 57 77;
  --primary: 108 156 255;
}
```

## Contratos principais

```ts
type Role = "admin" | "editor";

type OfferHighlight =
  | "lowest_price"
  | "coupon"
  | "free_shipping"
  | "high_commission";

type Offer = {
  id: string;
  title: string;
  marketplace: "mercado_livre" | "shopee";
  category: string;
  currentPrice: number;
  previousPrice?: number;
  discountPercent?: number;
  score: number;
  highlights: OfferHighlight[];
  status: "captured" | "review" | "approved" | "scheduled" | "published";
};

type Permission =
  | "offer:read"
  | "post:edit"
  | "post:approve"
  | "post:publish"
  | "integration:manage"
  | "user:manage"
  | "log:reprocess";
```

## Componentes para Storybook

Cada story deve cobrir claro/escuro, desktop/mobile e estados relevantes.

- Button, IconButton, Input, Select, Checkbox, Radio, Toggle.
- Tabs, Modal, Drawer, Toast, Alert, Tooltip, Badge.
- Card, DataTable, Pagination, Breadcrumb, Sidebar, Header, UserMenu.
- Skeleton, EmptyState, ErrorState, AccessLimitedState.
- Stepper, DatePicker, TagSelector.
- ScoreIndicator, OfferRow, PriceHistoryCard, ApprovalActions, PostPreviewCard.

## Regras de implementacao

- Server Components para shell e leitura inicial; Client Components apenas para
  interacoes.
- Autorizacao no servidor e guards por rota; interface deriva de `permissions`.
- URL e fonte de verdade para filtros, ordenacao, pagina e tabs compartilhadas.
- Preview e selecao podem usar route interception ou search params.
- Optimistic UI apenas para acoes reversiveis; publicar exige resposta real.
- Skeletons devem compartilhar a geometria do conteudo final.
- Erros de widgets devem ser isolados com error boundaries locais.
- Mascarar tokens, payloads e dados sensiveis em logs.
- Eventos de analytics nao incluem texto de posts nem credenciais.

## Eventos recomendados

- `offer_opened`
- `offer_filter_applied`
- `offer_sent_to_review`
- `post_edited`
- `offer_approved`
- `offer_rejected`
- `publication_scheduled`
- `publication_failed_opened`
- `channel_connection_tested`
- `restricted_area_attempted`

## QA responsivo

Validar em `360`, `390`, `768`, `1024`, `1280`, `1440` e `1600px`.

- Nenhuma acao principal fica fora da viewport.
- Drawer nao cobre confirmacao ou toast.
- Tabela mobile preserva score, preco e status.
- Textos longos truncam com acesso ao valor completo.
- Teclado virtual nao cobre CTA no editor.
- Tema escuro preserva contraste sem virar visual excessivamente escuro.

## Checklist de handoff

- [ ] Tokens implementados como variaveis semanticas.
- [ ] Tema claro/escuro e preferencia persistida.
- [ ] Todos os componentes possuem focus, disabled, loading e erro.
- [ ] Permissoes validadas no servidor e refletidas na UI.
- [ ] Fluxos Admin e Editor testados.
- [ ] Public Visitor/anon nao acessa o backoffice.
- [ ] Empty, loading, erro parcial e erro geral cobertos.
- [ ] Dialogos destrutivos possuem confirmacao e impacto.
- [ ] Filtros e tabs persistem na URL.
- [ ] Navegacao completa por teclado.
- [ ] Leitor de tela validado nos fluxos principais.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Formatos monetarios, datas e fuso BRT validados.
- [ ] Storybook documenta componentes e estados.
- [ ] Testes visuais nos seis breakpoints.
- [ ] Logs e analytics nao expÃµem informacao sensivel.

## Criterios de aceite dos fluxos principais

1. Um Editor aprova e agenda uma oferta em no maximo tres passos apos abrir a
   fila.
2. Um Public Visitor nunca acessa dados ou rotas internas do backoffice.
3. Uma falha de canal informa impacto e caminho de recuperacao.
4. O score e compreensivel sem depender de cor ou tooltip.
5. O dashboard oferece ao menos uma acao util na primeira dobra.
6. Mobile permite revisar, editar, visualizar preview e agendar sem desktop.
