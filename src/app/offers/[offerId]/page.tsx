import Link from 'next/link';

import { HighlightList, formatPrice } from '@/components/offers/offer-card';
import { formatDate } from '@/components/offers/offer-table';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/ui/score-badge';
import { publishTelegramOfferAction } from '@/server/ui/actions';
import { getOfferDetailData } from '@/server/ui/data';
import { getActionErrorMessage } from '@/server/ui/errors';
import { getTelegramPublishingConfig } from '@/server/publishers/telegram';

export const dynamic = 'force-dynamic';

export default function OfferDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ProtectedShell currentPath="/offers">
      {async ({ session }) => {
        const { offerId } = await params;
        const query = await searchParams;
        const detail = await getOfferDetailData(session, offerId);
        const telegramConfig = getTelegramPublishingConfig();
        const publicationError = getActionErrorMessage(query.publicationError);
        const publicationStatus = getPublicationStatusMessage(query.publicationStatus);
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
                <article className="card">
                  <div className="action-bar" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <p className="eyebrow">Publicacao</p>
                      <h2>Telegram</h2>
                    </div>
                    <Badge tone={publicationTone(detail.publication.latestJob?.status)}>
                      {publicationLabel(detail.publication.latestJob?.status)}
                    </Badge>
                  </div>

                  {publicationError ? <p className="alert alert-danger">{publicationError}</p> : null}
                  {publicationStatus ? <p className="alert alert-success">{publicationStatus}</p> : null}

                  <p className="muted">
                    {detail.publication.latestJob?.safeMessage ?? 'Nenhuma publicacao solicitada para esta oferta.'}
                  </p>

                  {detail.publication.latestAttempt ? (
                    <p className="muted">
                      Ultima tentativa: {detail.publication.latestAttempt.safeMessage}
                    </p>
                  ) : null}

                  {!telegramConfig.enabled ? (
                    <p className="alert alert-warning">
                      {telegramConfig.reason === 'disabled'
                        ? 'Publicacao Telegram desabilitada pelo kill switch.'
                        : 'Telegram nao configurado no ambiente server-side.'}
                    </p>
                  ) : null}

                  {!detail.offer.affiliateUrl ? (
                    <p className="alert alert-warning">Publicacao bloqueada: link afiliado ausente.</p>
                  ) : null}

                  {session.user.role === 'admin' && detail.publication.approvalStatus === 'approved' ? (
                    <form action={publishTelegramOfferAction} className="grid" style={{ gap: '0.75rem' }}>
                      <input type="hidden" name="offerId" value={detail.offer.id} />
                      <label className="checkbox-row">
                        <input type="checkbox" name="confirm" value="yes" required />
                        <span>Confirmo o envio manual desta oferta aprovada.</span>
                      </label>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!telegramConfig.enabled || detail.publication.latestJob?.status === 'succeeded'}
                      >
                        Publicar no Telegram
                      </Button>
                    </form>
                  ) : (
                    <p className="muted">
                      {detail.publication.approvalStatus === 'approved'
                        ? 'Apenas Admin pode publicar manualmente.'
                        : 'A acao aparece somente para oferta aprovada.'}
                    </p>
                  )}
                </article>
              </aside>
            </div>
          </>
        );
      }}
    </ProtectedShell>
  );
}

function publicationLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    requested: 'Solicitada',
    processing: 'Enviando',
    succeeded: 'Publicada',
    failed: 'Falhou',
    paused: 'Ambigua',
    cancelled: 'Cancelada'
  };
  return status ? labels[status] ?? status : 'Sem job';
}

function publicationTone(status: string | undefined): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' {
  if (status === 'succeeded') return 'success';
  if (status === 'processing' || status === 'requested') return 'primary';
  if (status === 'paused') return 'warning';
  if (status === 'failed' || status === 'cancelled') return 'danger';
  return 'neutral';
}

function getPublicationStatusMessage(status: string | string[] | undefined): string | null {
  const value = Array.isArray(status) ? status[0] : status;
  const messages: Record<string, string> = {
    sent: 'Publicacao enviada ao Telegram.',
    existing: 'Esta oferta ja estava publicada neste ciclo editorial.',
    blocked: 'Publicacao bloqueada por configuracao ou estado atual.',
    failed: 'Tentativa registrada com falha segura.'
  };
  return value ? messages[value] ?? null : null;
}
