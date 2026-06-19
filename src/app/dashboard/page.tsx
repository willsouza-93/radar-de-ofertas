import Link from 'next/link';

import { EmptyState } from '@/components/feedback/empty-state';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { ApprovalQueueList } from '@/components/curation/approval-list';
import { OfferCard } from '@/components/offers/offer-card';
import { Button } from '@/components/ui/button';
import { getDashboardData } from '@/server/ui/data';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <ProtectedShell currentPath="/dashboard">
      {async ({ session }) => {
        const data = await getDashboardData(session);
        return (
          <>
            <PageHeader
              eyebrow="Backoffice"
              title="Dashboard"
              description="Priorize as proximas acoes de curadoria antes de olhar metricas."
            />
            <section className="grid">
              <h2>Requer sua atencao</h2>
              {data.pending.length > 0 ? (
                <ApprovalQueueList items={data.pending} />
              ) : (
                <EmptyState
                  title="Tudo em dia por aqui."
                  description="Nenhuma oferta aguarda curadoria agora. Voce pode revisar as melhores ofertas capturadas."
                  action={<Button as={Link} href="/offers" variant="secondary">Ver ofertas</Button>}
                />
              )}
            </section>
            <section className="grid grid-2" style={{ marginTop: '1.5rem' }}>
              <div className="card">
                <p className="eyebrow">Melhores ofertas</p>
                <h2>Score alto</h2>
                <div className="grid">
                  {data.topOffers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} href={`/offers/${offer.id}`} />
                  ))}
                </div>
              </div>
              <div className="card">
                <p className="eyebrow">Resumo operacional</p>
                <h2>Foco do dia</h2>
                <p className="muted">Pendentes de curadoria: {data.pending.length}</p>
                <p className="muted">Ofertas fortes carregadas: {data.topOffers.length}</p>
              </div>
            </section>
          </>
        );
      }}
    </ProtectedShell>
  );
}
