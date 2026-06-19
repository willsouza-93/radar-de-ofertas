import Link from 'next/link';

import { HighlightList, formatPrice } from '@/components/offers/offer-card';
import { formatDate } from '@/components/offers/offer-table';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/ui/score-badge';
import { getOfferDetailData } from '@/server/ui/data';

export const dynamic = 'force-dynamic';

export default function OfferDetailPage({ params }: { params: Promise<{ offerId: string }> }) {
  return (
    <ProtectedShell currentPath="/offers">
      {async ({ session }) => {
        const { offerId } = await params;
        const detail = await getOfferDetailData(session, offerId);
        return (
          <>
            <PageHeader
              eyebrow="Oferta"
              title={detail.offer.title}
              description={`Capturada em ${formatDate(detail.offer.capturedAt)}`}
              action={<Button as={Link} href="/offers" variant="secondary">Voltar para ofertas</Button>}
            />
            <div className="grid grid-detail">
              <section className="grid">
                <article className="card">
                  <div className="action-bar" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <h2>{formatPrice(detail.offer.currentPrice)}</h2>
                      {detail.offer.previousPrice ? <p className="muted">Preco anterior: {formatPrice(detail.offer.previousPrice)}</p> : null}
                    </div>
                    <ScoreBadge value={detail.offer.score} size="lg" />
                  </div>
                  <HighlightList highlights={detail.offer.highlights} />
                  <div className="action-bar">
                    <Button as="a" href={detail.offer.sourceUrl} target="_blank" rel="noreferrer" variant="secondary">Abrir origem</Button>
                    <Button as="a" href={detail.offer.affiliateUrl} target="_blank" rel="noreferrer" variant="primary">Abrir link afiliado</Button>
                  </div>
                </article>
                <article className="card">
                  <h2>Historico de precos</h2>
                  {detail.priceSnapshots.length > 0 ? (
                    <ul className="timeline">
                      {detail.priceSnapshots.map((snapshot) => (
                        <li key={`${snapshot.id}-${snapshot.observedAt}`} className="timeline-item">
                          <strong>{formatPrice(snapshot.price)}</strong>
                          <p className="muted" style={{ margin: 0 }}>{formatDate(snapshot.observedAt)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Sem snapshots registrados ainda.</p>
                  )}
                </article>
              </section>
              <aside className="grid">
                <article className="card">
                  <p className="eyebrow">Categoria</p>
                  <h2>{detail.category?.name ?? 'Sem categoria'}</h2>
                  <p className="muted">Tags: {detail.tags.map((tag) => tag.name).join(', ') || 'nenhuma'}</p>
                </article>
                <article className="card">
                  <p className="eyebrow">Score v1</p>
                  <p className="muted">Score explicavel e deterministico. Nao aprova nem publica automaticamente.</p>
                </article>
              </aside>
            </div>
          </>
        );
      }}
    </ProtectedShell>
  );
}
