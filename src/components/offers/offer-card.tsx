import Link from 'next/link';

import { HighlightBadge, MarketplaceBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/ui/score-badge';
import type { OfferHighlight, OfferListItem } from '@/server/offers/types';

export function OfferCard({
  offer,
  href,
  cta = 'Ver detalhes',
  compact = false
}: {
  offer: OfferListItem;
  href: string;
  cta?: string;
  compact?: boolean;
}) {
  return (
    <article className={`card offer-card${compact ? ' offer-card-compact' : ''}`}>
      <div className="offer-card-header">
        <div>
          <MarketplaceBadge marketplace={offer.marketplace} />
          <h3 style={{ marginTop: '0.75rem' }}>{offer.title}</h3>
          <p className="muted">{formatPrice(offer.currentPrice)} {offer.discountPercent ? `- ${offer.discountPercent}% off` : ''}</p>
        </div>
        <ScoreBadge value={offer.score} showLabel={false} />
      </div>
      {compact ? null : <HighlightList highlights={offer.highlights} />}
      <Button as={Link} href={href} variant="secondary">{cta}</Button>
    </article>
  );
}

export function HighlightList({ highlights }: { highlights: OfferHighlight[] }) {
  if (highlights.length === 0) return <span className="muted">Sem destaques</span>;
  return (
    <div className="action-bar" style={{ margin: '0.75rem 0' }}>
      {highlights.map((highlight) => <HighlightBadge key={highlight} highlight={highlight} />)}
    </div>
  );
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
