import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/feedback/empty-state';
import { StatusBadge, HighlightBadge } from '@/components/ui/badge';
import { getScoreLabel, ScoreBadge } from '@/components/ui/score-badge';
import { ReviewHistory } from '@/components/curation/review-history';
import type { ReviewHistoryItem } from '@/server/curation/types';

describe('Phase 4 UI components', () => {
  it('labels scores without depending only on color', () => {
    expect(getScoreLabel(95)).toBe('Excelente');
    expect(getScoreLabel(82)).toBe('Forte');
    expect(getScoreLabel(61)).toBe('Moderado');
    expect(getScoreLabel(40)).toBe('Baixo');

    const html = renderToStaticMarkup(<ScoreBadge value={82} />);
    expect(html).toContain('Score 82 de 100, Forte');
    expect(html).toContain('Forte');
  });

  it('renders only the approved curation statuses', () => {
    const html = renderToStaticMarkup(
      <>
        <StatusBadge status="pending" />
        <StatusBadge status="approved" />
        <StatusBadge status="rejected" />
      </>
    );

    expect(html).toContain('Pendente');
    expect(html).toContain('Aprovada');
    expect(html).toContain('Rejeitada');
    expect(html).not.toContain('Em revisao');
  });

  it('renders highlight labels from the product language', () => {
    const html = renderToStaticMarkup(
      <>
        <HighlightBadge highlight="lowest_price" />
        <HighlightBadge highlight="coupon" />
        <HighlightBadge highlight="free_shipping" />
        <HighlightBadge highlight="high_commission" />
      </>
    );

    expect(html).toContain('Menor preco');
    expect(html).toContain('Cupom');
    expect(html).toContain('Frete gratis');
    expect(html).toContain('Alta comissao');
  });

  it('renders empty state with action copy', () => {
    const html = renderToStaticMarkup(
      <EmptyState title="Fila em dia." description="Nenhuma oferta pendente de decisao." />
    );

    expect(html).toContain('Fila em dia.');
    expect(html).toContain('Nenhuma oferta pendente de decisao.');
  });

  it('keeps review history append-only in the rendered UI', () => {
    const items: ReviewHistoryItem[] = [
      {
        type: 'note',
        body: 'Cupom validado no app.',
        actor: { id: 'user-1', displayName: 'Editor' },
        createdAt: '2026-06-19T12:00:00.000Z'
      }
    ];

    const html = renderToStaticMarkup(<ReviewHistory items={items} />);

    expect(html).toContain('Cupom validado no app.');
    expect(html).not.toContain('Editar');
    expect(html).not.toContain('Excluir');
  });
});
