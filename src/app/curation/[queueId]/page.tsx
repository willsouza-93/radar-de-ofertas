import Link from 'next/link';

import { DecisionForms, ReviewNoteComposer } from '@/components/curation/decision-forms';
import { ReviewHistory } from '@/components/curation/review-history';
import { HighlightList, formatPrice } from '@/components/offers/offer-card';
import { formatDate } from '@/components/offers/offer-table';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/ui/score-badge';
import { getApprovalDetailData } from '@/server/ui/data';
import { getActionErrorMessage } from '@/server/ui/errors';

export const dynamic = 'force-dynamic';

export default function CurationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ queueId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ProtectedShell currentPath="/curation">
      {async ({ session }) => {
        const { queueId } = await params;
        const query = searchParams ? await searchParams : {};
        const actionError = getActionErrorMessage(query.actionError);
        const detail = await getApprovalDetailData(session, queueId);
        const isPending = detail.queue.status === 'pending';

        return (
          <>
            <PageHeader
              eyebrow="Detalhe de curadoria"
              title={detail.offer.title}
              description="Revise score, contexto e historico antes da decisao."
              action={<Button as={Link} href="/curation" variant="secondary">Voltar para curadoria</Button>}
            />
            {actionError ? (
              <section className="card" role="alert" style={{ marginBottom: '1rem' }}>
                <strong>Acao nao concluida.</strong>
                <p className="muted" style={{ marginBottom: 0 }}>{actionError}</p>
              </section>
            ) : null}
            <div className="grid grid-detail">
              <section className="grid">
                <article className="card">
                  <div className="action-bar" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <StatusBadge status={detail.queue.status} />
                      <h2 style={{ marginTop: '0.75rem' }}>{formatPrice(detail.offer.currentPrice)}</h2>
                      <p className="muted">Capturada em {formatDate(detail.offer.capturedAt)}</p>
                    </div>
                    <ScoreBadge value={detail.offer.score} size="lg" />
                  </div>
                  <HighlightList highlights={detail.offer.highlights} />
                  <p className="muted">Aprovacao nesta fase apenas marca a oferta como aprovada. Nada sera publicado ou agendado.</p>
                </article>
                {isPending ? <ReviewNoteComposer queueId={queueId} /> : null}
                <article className="card">
                  <h2>Historico</h2>
                  <ReviewHistory items={detail.history} />
                </article>
              </section>
              <aside className="grid">
                <article className="card">
                  <p className="eyebrow">Linha do tempo</p>
                  <ul className="timeline">
                    <li className="timeline-item"><strong>Capturada</strong><p className="muted">{formatDate(detail.offer.capturedAt)}</p></li>
                    <li className="timeline-item"><strong>Pendente</strong><p className="muted">{formatDate(detail.queue.createdAt)}</p></li>
                    {detail.queue.status !== 'pending' ? (
                      <li className="timeline-item"><strong>{detail.queue.status === 'approved' ? 'Aprovada' : 'Rejeitada'}</strong><p className="muted">{detail.queue.lastReviewedAt ? formatDate(detail.queue.lastReviewedAt) : 'Data indisponivel'}</p></li>
                    ) : null}
                  </ul>
                </article>
                {isPending ? (
                  <DecisionForms queueId={queueId} />
                ) : (
                  <article className="card">
                    <h2>Decisao final registrada</h2>
                    <p className="muted">Itens aprovados ou rejeitados nao aceitam novas notas ou mudancas pela UI da Fase 4B.</p>
                  </article>
                )}
              </aside>
            </div>
          </>
        );
      }}
    </ProtectedShell>
  );
}
