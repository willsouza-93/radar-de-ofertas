import Link from 'next/link';

import { HighlightList, formatPrice } from '@/components/offers/offer-card';
import { StatusBadge, MarketplaceBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/ui/score-badge';
import { formatDate } from '@/components/offers/offer-table';
import type { ApprovalStatus } from '@/server/curation/types';
import type { OfferHighlight, OfferMarketplace } from '@/server/offers/types';

export type ApprovalQueueViewItem = {
  queueId: string;
  offerId: string;
  status: ApprovalStatus;
  title: string;
  score: number;
  highlights: OfferHighlight[];
  currentPrice: number;
  marketplace: OfferMarketplace;
  updatedAt: string;
};

export function ApprovalQueueList({
  items,
  density = 'comfortable'
}: {
  items: ApprovalQueueViewItem[];
  density?: 'comfortable' | 'compact';
}) {
  return (
    <div className="grid">
      {items.map((item) => (
        <article className={`card queue-card queue-card-${density}`} key={item.queueId}>
          <div className="queue-card-header">
            <div>
              <div className="action-bar">
                <StatusBadge status={item.status} />
                <MarketplaceBadge marketplace={item.marketplace} />
              </div>
              <h3 style={{ marginTop: '0.75rem' }}>{item.title}</h3>
              <p className="muted">{formatPrice(item.currentPrice)} - atualizado em {formatDate(item.updatedAt)}</p>
              {density === 'comfortable' ? <HighlightList highlights={item.highlights} /> : null}
            </div>
            <ScoreBadge value={item.score} showLabel={density === 'comfortable'} />
          </div>
          <Button as={Link} href={`/curation/${item.queueId}`} variant="primary">
            {item.status === 'pending' ? 'Revisar' : 'Ver historico'}
          </Button>
        </article>
      ))}
    </div>
  );
}
