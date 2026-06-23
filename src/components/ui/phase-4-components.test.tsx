import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmptyState } from '@/components/feedback/empty-state';
import {
  buildSearchHref,
  buildClearFiltersHref,
  buildCurationStatusHref,
  buildFilterHref,
  hasSecondaryFilters,
  shouldRunTextSearch
} from '@/components/offers/filter-url';
import { OfferFilters } from '@/components/offers/offer-filters';
import { StatusBadge, HighlightBadge } from '@/components/ui/badge';
import { getScoreLabel, ScoreBadge } from '@/components/ui/score-badge';
import { ReviewHistory } from '@/components/curation/review-history';
import type { ReviewHistoryItem } from '@/server/curation/types';

const navigationState = vi.hoisted(() => ({
  pathname: '/offers',
  search: '',
  replace: vi.fn()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({ replace: navigationState.replace }),
  useSearchParams: () => new URLSearchParams(navigationState.search)
}));

describe('Phase 4 UI components', () => {
  beforeEach(() => {
    navigationState.pathname = '/offers';
    navigationState.search = '';
    navigationState.replace.mockClear();
  });

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

  it('preserves curation status in filter submissions through hidden fields', () => {
    const html = renderToStaticMarkup(
      <OfferFilters
        categories={[]}
        showDiscount={false}
        hiddenFields={[{ name: 'status', value: 'approved' }]}
      />
    );

    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="status"');
    expect(html).toContain('value="approved"');
  });

  it('reflects active URL filters in the form controls', () => {
    const categoryId = '20000000-0000-0000-0000-000000000001';
    const tagId = '30000000-0000-0000-0000-000000000001';
    navigationState.search = new URLSearchParams({
      q: 'fone',
      marketplace: 'mercado_livre',
      categoryId,
      tagId,
      minScore: '80',
      minDiscount: '20'
    }).toString();

    const html = renderToStaticMarkup(
      <OfferFilters
        categories={[{ id: categoryId, name: 'Tecnologia' }]}
        tags={[{ id: tagId, name: 'Frete gratis' }]}
      />
    );

    expect(html).toContain('value="fone"');
    expect(html).toContain('<option value="mercado_livre" selected="">Mercado Livre</option>');
    expect(html).toContain(`<option value="${categoryId}" selected="">Tecnologia</option>`);
    expect(html).toContain(`<option value="${tagId}" selected="">Frete gratis</option>`);
    expect(html).toContain('value="80"');
    expect(html).toContain('value="20"');
  });

  it('renders filter controls reset when URL has no filters', () => {
    navigationState.search = '';

    const html = renderToStaticMarkup(
      <OfferFilters
        categories={[{ id: '20000000-0000-0000-0000-000000000001', name: 'Tecnologia' }]}
        tags={[{ id: '30000000-0000-0000-0000-000000000001', name: 'Frete gratis' }]}
      />
    );

    expect(html).toContain('name="q"');
    expect(html).toContain('value=""');
    expect(html).toContain('<option value="" selected="">Todos</option>');
    expect(html).toContain('<option value="" selected="">Todas</option>');
    expect(html).not.toContain('<option value="mercado_livre" selected="">Mercado Livre</option>');
    expect(html).not.toContain('value="80"');
    expect(html).not.toContain('value="20"');
  });

  it('builds cumulative filter navigation targets and drops stale cursors', () => {
    const href = buildFilterHref({
      pathname: '/offers',
      currentSearch: 'marketplace=mercado_livre&cursor=30&sort=score_desc',
      values: {
        q: '',
        marketplace: 'mercado_livre',
        categoryId: '20000000-0000-0000-0000-000000000001',
        tagId: '',
        minScore: '80',
        minDiscount: ''
      }
    });

    expect(href).toBe('/offers?marketplace=mercado_livre&sort=score_desc&categoryId=20000000-0000-0000-0000-000000000001&minScore=80');
  });

  it('preserves marketplace when switching curation status tabs', () => {
    const href = buildCurationStatusHref(
      { status: 'pending', marketplace: 'mercado_livre', cursor: '30' },
      'approved'
    );

    expect(href).toBe('/curation?status=approved&marketplace=mercado_livre');
  });

  it('preserves category when switching curation status tabs', () => {
    const href = buildCurationStatusHref(
      {
        status: 'pending',
        categoryId: '20000000-0000-0000-0000-000000000001'
      },
      'rejected'
    );

    expect(href).toBe('/curation?status=rejected&categoryId=20000000-0000-0000-0000-000000000001');
  });

  it('preserves search terms when switching curation status tabs', () => {
    const href = buildCurationStatusHref(
      { status: 'pending', q: 'fone gamer' },
      'approved'
    );

    expect(href).toBe('/curation?status=approved&q=fone+gamer');
  });

  it('clears curation filters while preserving current status', () => {
    const href = buildClearFiltersHref({
      pathname: '/curation',
      params: {
        status: 'approved',
        marketplace: 'mercado_livre',
        categoryId: '20000000-0000-0000-0000-000000000001',
        q: 'fone',
        sort: 'priority_desc'
      },
      preserveStatus: true
    });

    expect(href).toBe('/curation?status=approved');
  });

  it('clears all offer filters', () => {
    const href = buildClearFiltersHref({
      pathname: '/offers',
      params: {
        marketplace: 'mercado_livre',
        categoryId: '20000000-0000-0000-0000-000000000001',
        q: 'fone'
      }
    });

    expect(href).toBe('/offers');
  });

  it('detects secondary filters without treating status as an active filter', () => {
    expect(hasSecondaryFilters({ status: 'approved' })).toBe(false);
    expect(hasSecondaryFilters({ status: 'approved', marketplace: 'mercado_livre' })).toBe(true);
  });

  it('builds debounced text search hrefs preserving existing offer filters', () => {
    const href = buildSearchHref({
      pathname: '/offers',
      currentSearch: 'marketplace=mercado_livre&categoryId=20000000-0000-0000-0000-000000000001&cursor=30',
      query: ' notebook '
    });

    expect(href).toBe('/offers?marketplace=mercado_livre&categoryId=20000000-0000-0000-0000-000000000001&q=notebook');
  });

  it('builds debounced text search hrefs preserving curation status', () => {
    const href = buildSearchHref({
      pathname: '/curation',
      currentSearch: 'status=approved&marketplace=mercado_livre',
      query: 'notebook'
    });

    expect(href).toBe('/curation?status=approved&marketplace=mercado_livre&q=notebook');
  });

  it('removes q when debounced search is cleared', () => {
    const href = buildSearchHref({
      pathname: '/curation',
      currentSearch: 'status=approved&marketplace=mercado_livre&q=notebook',
      query: ''
    });

    expect(href).toBe('/curation?status=approved&marketplace=mercado_livre');
  });

  it('does not build a search href for one-character queries', () => {
    expect(shouldRunTextSearch('n')).toBe(false);
    expect(buildSearchHref({ pathname: '/offers', currentSearch: '', query: 'n' })).toBeNull();
    expect(shouldRunTextSearch('no')).toBe(true);
  });
});
