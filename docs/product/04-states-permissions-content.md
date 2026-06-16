# Estados, permissoes e conteudo

## Modelo de permissao

Permissoes devem ser aplicadas na API e refletidas na interface. Esconder um
botao nao substitui autorizacao no servidor.

| Acao | Admin | Editor |
|---|---:|---:|
| Visualizar dashboard, ofertas e relatorios | Sim | Sim |
| Editar texto e preview | Sim | Sim |
| Aprovar, rejeitar e agendar | Sim | Sim |
| Publicar agora e cancelar publicacao | Sim | Sim |
| Gerenciar categorias e cupons | Sim | Nao |
| Configurar canais e integracoes | Sim | Nao |
| Gerenciar usuarios | Sim | Nao |
| Ver logs tecnicos completos/reprocessar | Sim | Nao |

Public Visitor nao e papel interno. Nao autentica, nao pertence ao workspace e
nao acessa nenhuma area do backoffice.

### Regras de interface

- Acoes sem permissao ficam ocultas em fluxos normais.
- Link direto restrito abre `AccessLimitedState`, nao uma pagina 404.
- Acoes visiveis mas temporariamente indisponiveis ficam disabled com tooltip.
- Mudanca de papel atualiza navegacao sem exigir novo login.
- Public Visitor que tenta uma rota interna e direcionado ao login, sem acesso a
  dados do backoffice.

## Estados globais

### Loading

- Primeira carga: skeleton fiel ao layout, sem spinner central isolado.
- Atualizacao local: manter dados anteriores e mostrar indicador discreto.
- Acao: botao preserva largura, mostra spinner e bloqueia duplo envio.
- Mais de 8 segundos: mensagem "Isso esta levando mais tempo que o normal."

### Empty

| Contexto | Titulo | Texto | Acao |
|---|---|---|---|
| Primeiro acesso | Comece conectando uma fonte | As ofertas aparecerao apos a primeira sincronizacao. | Conectar marketplace |
| Fila concluida | Fila em dia | Nenhuma oferta aguarda sua aprovacao. | Ver ofertas |
| Filtro sem resultado | Nenhuma oferta encontrada | Ajuste ou limpe os filtros para ampliar a busca. | Limpar filtros |
| Sem agenda | Nada agendado neste periodo | Aprove uma oferta ou escolha outro periodo. | Ver fila |
| Sem permissao | Acesso limitado | Esta area e reservada para administradores. | Voltar ao inicio |

### Error

- Erro local nao derruba a pagina inteira.
- Sempre oferecer tentativa novamente quando recuperavel.
- Explicar impacto e preservar o que ainda funciona.
- IDs tecnicos ficam copiaveis, mas recolhidos por padrao.

| Contexto | Mensagem |
|---|---|
| Captura falhou | "A captura nao terminou. As ofertas anteriores continuam disponiveis." |
| Publicacao falhou | "Nao foi possivel publicar no Telegram. Revise a conexao e tente novamente." |
| Link invalido | "Este link de afiliado nao parece valido." |
| Sem conexao | "Voce esta offline. Alteracoes serao salvas quando a conexao voltar." |
| Permissao | "Seu perfil pode visualizar esta area, mas nao fazer alteracoes." |

## Feedback e confirmacoes

### Toasts de sucesso

- "Oferta aprovada e agendada para hoje, 18:30."
- "Rascunho salvo."
- "Canal conectado com sucesso."
- "Filtros salvos como 'Tecnologia 80+'."
- "Publicacao cancelada. Desfazer"

### Alertas

- "A automacao esta pausada. Novas ofertas nao serao capturadas."
- "2 canais precisam de atencao antes da proxima publicacao."
- "Este cupom expira em menos de 24 horas."
- "O preco atual esta 8% acima do menor preco registrado."

### Modais de confirmacao

**Rejeitar oferta**
- Titulo: "Rejeitar esta oferta?"
- Campo obrigatorio: Motivo.
- Acoes: "Voltar" e "Rejeitar oferta".

**Publicar agora**
- Titulo: "Publicar agora em 3 canais?"
- Texto: "A publicacao sera enviada imediatamente e nao podera ser editada."
- Acoes: "Cancelar" e "Publicar agora".

**Desconectar integracao**
- Titulo: "Desconectar Mercado Livre?"
- Texto: "A captura sera interrompida e 4 agendamentos podem ficar sem dados."
- Acoes: "Manter conexao" e "Desconectar".

## Tooltips e auxiliares

- Score: "Combina desconto, historico de preco, comissao e confiabilidade."
- Menor preco: "Menor valor observado desde que o produto entrou no radar."
- Alta comissao: "Comissao acima da media desta categoria."
- Capturar agora: "Solicita uma nova sincronizacao. Pode levar alguns minutos."
- Reprocessar: "Executa novamente somente esta etapa."
- Canal pausado: "Publicacoes agendadas nao serao enviadas enquanto estiver pausado."
- Autosave: "Suas alteracoes sao salvas automaticamente."

## Estados por componente

### Oferta row

- Default: dados essenciais e acao principal.
- Hover/focus: fundo sutil e acoes secundarias.
- Selected: borda/inset primary e `aria-selected`.
- Processing: opacidade moderada, status "Processando".
- Success: transicao curta e toast; item muda de estagio.
- Error: alert inline com "Tentar novamente".
- Disabled: somente quando fonte esta indisponivel, com explicacao.

### Post preview

- Default: canal selecionado e preview completo.
- Editing: realce no trecho correspondente ao campo em foco.
- Loading: skeleton da imagem e linhas.
- Warning: limite proximo ou link ausente.
- Error: canal nao configurado e CTA permitido para Admin.
- Empty: "Comece escrevendo o texto da publicacao."

### Graficos

- Loading: skeleton de eixos e legenda.
- Empty: texto explicativo no lugar da area de plotagem.
- Error: mantem titulo/filtros e mostra retry local.
- Acessivel: resumo textual antes do grafico e tabela opcional.

## Acessibilidade

- WCAG 2.2 AA como meta minima.
- Contraste `4.5:1` para texto comum e `3:1` para texto grande/UI.
- Ordem de tabulacao acompanha a leitura visual.
- Skip link: "Pular para o conteudo".
- Todos os controles possuem nome acessivel; icon buttons usam `aria-label`.
- Focus nunca e removido; drawers e modais prendem foco e devolvem ao gatilho.
- Alerts dinamicos usam `aria-live="polite"`; erros bloqueantes usam assertive.
- Tabelas usam headers, caption e ordenacao anunciada.
- Graficos oferecem resumo textual e dados tabulares.
- Atalhos de teclado nao usam apenas uma tecla enquanto o usuario digita.
- Alvos de toque de pelo menos `44x44px`.
- Motion reduzido remove deslocamentos e animacoes nao essenciais.
- Datas usam formato local e fuso explicito quando houver agendamento.

## Conteudo e tom

- Direto, util e humano; evitar linguagem tecnica antes da explicacao.
- Usar sentence case: "Aprovar e agendar", nao "Aprovar E Agendar".
- Acoes destrutivas dizem exatamente o que sera removido ou interrompido.
- Numeros usam formato brasileiro: `R$ 129,90`, `12.480`, `27%`.
- Datas: "Hoje, 18:30" em contexto curto; "12 jun 2026, 18:30 BRT" em logs.
