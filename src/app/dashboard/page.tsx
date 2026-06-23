import Link from 'next/link';

import { ApprovalQueueList } from '@/components/curation/approval-list';
import { EmptyState } from '@/components/feedback/empty-state';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { formatDate } from '@/components/offers/offer-table';
import { formatPrice, OfferCard } from '@/components/offers/offer-card';
import { MarketplaceBadge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/ui/score-badge';
import { getDashboardData } from '@/server/ui/data';
import type { ApprovalStatus } from '@/server/curation/types';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <ProtectedShell currentPath="/dashboard">
      {async ({ session }) => {
        const data = await getDashboardData(session);
        const totalReviewed = data.summary.reviewedCount;
        const totalQueue = data.summary.pendingCount + totalReviewed;
        const nextPending = data.pending[0];

        return (
          <>
            <PageHeader
              eyebrow="Backoffice"
              title="Dashboard"
              description="Acompanhe o que precisa de decisao e encontre rapidamente as melhores oportunidades."
              action={<Button as={Link} href="/curation" variant="primary">Abrir curadoria</Button>}
            />

            <section className="dashboard-hero">
              <article className="card hero-card">
                <p className="eyebrow">Proxima melhor acao</p>
                {nextPending ? (
                  <>
                    <div className="hero-card-header">
                      <div>
                        <h2>{nextPending.title}</h2>
                        <p className="muted">
                          {formatPrice(nextPending.currentPrice)} - atualizado em {formatDate(nextPending.updatedAt)}
                        </p>
                      </div>
                      <ScoreBadge value={nextPending.score} size="lg" />
                    </div>
                    <div className="action-bar">
                      <StatusBadge status={nextPending.status} />
                      <MarketplaceBadge marketplace={nextPending.marketplace} />
                    </div>
                    <div className="action-bar hero-actions">
                      <Button as={Link} href={`/curation/${nextPending.queueId}`} variant="primary">Revisar agora</Button>
                      <Button as={Link} href="/curation" variant="secondary">Ver fila</Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="Fila em dia."
                    description="Nenhuma oferta pendente agora. Use o ranking para revisar oportunidades capturadas."
                    action={<Button as={Link} href="/offers" variant="secondary">Ver ofertas</Button>}
                  />
                )}
              </article>

              <div className="metric-grid">
                <MetricCard label="Ofertas capturadas" value={data.summary.totalOffers} helper="Base disponivel para curadoria" />
                <MetricCard label="Score forte" value={data.summary.highScoreOffers} helper="Ofertas com score >= 80" />
                <MetricCard label="Pendentes" value={data.summary.pendingCount} helper="Aguardando decisao humana" tone="warning" />
                <MetricCard label="Revisadas" value={totalReviewed} helper="Aprovadas ou rejeitadas" tone="success" />
              </div>
            </section>

            <section className="grid grid-2 section-spaced">
              <article className="card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Curadoria</p>
                    <h2>Distribuicao por status</h2>
                  </div>
                  <span className="badge badge-neutral">{totalQueue} itens</span>
                </div>
                <StatusMeter label="Pendentes" status="pending" value={data.summary.pendingCount} total={totalQueue} />
                <StatusMeter label="Aprovadas" status="approved" value={data.summary.approvedCount} total={totalQueue} />
                <StatusMeter label="Rejeitadas" status="rejected" value={data.summary.rejectedCount} total={totalQueue} />
              </article>

              <article className="card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Captura</p>
                    <h2>Ofertas recentes</h2>
                  </div>
                  <Button as={Link} href="/offers?sort=captured_desc" variant="ghost">Ver todas</Button>
                </div>
                <div className="compact-list">
                  {data.recentOffers.map((offer) => (
                    <Link key={offer.id} href={`/offers/${offer.id}`} className="compact-item">
                      <div>
                        <strong>{offer.title}</strong>
                        <p className="muted">{formatPrice(offer.currentPrice)} - {formatDate(offer.capturedAt)}</p>
                      </div>
                      <ScoreBadge value={offer.score} size="sm" showLabel={false} />
                    </Link>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid grid-2 section-spaced">
              <article className="card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Fila prioritaria</p>
                    <h2>Pendencias de curadoria</h2>
                  </div>
                  <Button as={Link} href="/curation?status=pending" variant="ghost">Ver pendentes</Button>
                </div>
                {data.pending.length > 0 ? (
                  <ApprovalQueueList items={data.pending} density="compact" />
                ) : (
                  <p className="muted">Nenhuma oferta pendente de decisao.</p>
                )}
              </article>

              <article className="card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Ranking</p>
                    <h2>Maior score</h2>
                  </div>
                  <Button as={Link} href="/offers?sort=score_desc" variant="ghost">Ver ranking</Button>
                </div>
                <div className="dashboard-offer-grid">
                  {data.topOffers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} href={`/offers/${offer.id}`} compact />
                  ))}
                </div>
              </article>
            </section>
          </>
        );
      }}
    </ProtectedShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = 'primary'
}: {
  label: string;
  value: number;
  helper: string;
  tone?: 'primary' | 'warning' | 'success';
}) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  );
}

function StatusMeter({
  label,
  status,
  value,
  total
}: {
  label: string;
  status: ApprovalStatus;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="status-meter">
      <div className="status-meter-label">
        <StatusBadge status={status} />
        <span>{value} itens</span>
      </div>
      <div className="status-meter-track" aria-label={`${label}: ${percentage}%`}>
        <span className={`status-meter-fill status-meter-${status}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
