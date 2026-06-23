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

export function ApprovalQueueList({ items }: { items: ApprovalQueueViewItem[] }) {
  return (
    <div className="grid">
      {items.map((item) => (
        <article className="card" key={item.queueId}>
          <div className="action-bar" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="action-bar">
                <StatusBadge status={item.status} />
                <MarketplaceBadge marketplace={item.marketplace} />
              </div>
              <h3 style={{ marginTop: '0.75rem' }}>{item.title}</h3>
              <p className="muted">{formatPrice(item.currentPrice)} - atualizado em {formatDate(item.updatedAt)}</p>
              <HighlightList highlights={item.highlights} />
            </div>
            <ScoreBadge value={item.score} />
          </div>
          <Button as={Link} href={`/curation/${item.queueId}`} variant="primary">
            {item.status === 'pending' ? 'Revisar' : 'Ver historico'}
          </Button>
        </article>
      ))}
    </div>
  );
}
