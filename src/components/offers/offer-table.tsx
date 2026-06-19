import Link from 'next/link';

import { HighlightList, formatPrice, OfferCard } from '@/components/offers/offer-card';
import { MarketplaceBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/ui/score-badge';
import type { OfferListItem } from '@/server/offers/types';

export function OfferTable({ offers }: { offers: OfferListItem[] }) {
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Marketplace</th>
              <th>Preco</th>
              <th>Score</th>
              <th>Destaques</th>
              <th>Capturada em</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>
                  <strong>{offer.title}</strong>
                  <p className="muted" style={{ margin: 0 }}>{offer.category?.name ?? 'Sem categoria'}</p>
                </td>
                <td><MarketplaceBadge marketplace={offer.marketplace} /></td>
                <td>
                  <strong>{formatPrice(offer.currentPrice)}</strong>
                  {offer.previousPrice ? <p className="muted" style={{ margin: 0 }}>antes {formatPrice(offer.previousPrice)}</p> : null}
                </td>
                <td><ScoreBadge value={offer.score} size="sm" /></td>
                <td><HighlightList highlights={offer.highlights} /></td>
                <td>{formatDate(offer.capturedAt)}</td>
                <td><Button as={Link} href={`/offers/${offer.id}`} variant="secondary">Ver detalhes</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid" style={{ marginTop: '1rem' }}>
        {offers.map((offer) => <OfferCard key={offer.id} offer={offer} href={`/offers/${offer.id}`} />)}
      </div>
    </>
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
