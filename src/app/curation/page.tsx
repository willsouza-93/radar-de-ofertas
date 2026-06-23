import Link from 'next/link';

import { ApprovalQueueList } from '@/components/curation/approval-list';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { buildClearFiltersHref, buildCurationStatusHref, hasSecondaryFilters } from '@/components/offers/filter-url';
import { OfferFilters } from '@/components/offers/offer-filters';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { listApprovalQueueData, listOfferFilterOptions } from '@/server/ui/data';
import { parseCurationSearchParams } from '@/server/ui/search-params';
import type { ApprovalStatus } from '@/server/curation/types';

export const dynamic = 'force-dynamic';

const tabs: Array<{ label: string; status: ApprovalStatus }> = [
  { label: 'Pendentes', status: 'pending' },
  { label: 'Aprovadas', status: 'approved' },
  { label: 'Rejeitadas', status: 'rejected' }
];

export default function CurationPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ProtectedShell currentPath="/curation">
      {async ({ session }) => {
        const params = searchParams ? await searchParams : {};
        const filters = parseCurationSearchParams(params);
        const options = await listOfferFilterOptions(session);

        if (!filters.ok) {
          return (
            <>
              <PageHeader title="Curadoria" description="Revise ofertas e registre decisoes humanas." />
              <ErrorState title="Filtros invalidos" description={filters.message} action={<Button as={Link} href="/curation" variant="secondary">Limpar filtros</Button>} />
            </>
          );
        }

        const selectedStatus = filters.value.status ?? 'pending';
        const data = await listApprovalQueueData(session, { ...filters.value, status: selectedStatus });
        const hasActiveFilters = hasSecondaryFilters(params);
        const clearFiltersHref = buildClearFiltersHref({ pathname: '/curation', params, preserveStatus: true });

        return (
          <>
            <PageHeader title="Curadoria" description="Fila operacional para aprovar ou rejeitar ofertas. Nada e publicado nesta fase." />
            <nav className="action-bar" aria-label="Status de curadoria" style={{ marginBottom: '1rem' }}>
              {tabs.map((tab) => (
                <Button
                  key={tab.status}
                  as={Link}
                  href={buildCurationStatusHref(params, tab.status)}
                  variant={selectedStatus === tab.status ? 'primary' : 'secondary'}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
            <OfferFilters
              categories={options.categories}
              showDiscount={false}
              hiddenFields={[{ name: 'status', value: selectedStatus }]}
            />
            <div className="action-bar" style={{ marginBottom: '1rem', alignItems: 'center' }}>
              <StatusBadge status={selectedStatus} />
              {hasActiveFilters ? (
                <Button as={Link} href={clearFiltersHref} variant="ghost">Limpar filtros</Button>
              ) : null}
            </div>
            {data.items.length > 0 ? (
              <ApprovalQueueList items={data.items} />
            ) : (
              <EmptyState
                title={selectedStatus === 'pending' ? 'Fila em dia.' : 'Nada encontrado.'}
                description={selectedStatus === 'pending' ? 'Nenhuma oferta pendente de decisao.' : 'Nao ha itens nesse status com os filtros atuais.'}
                action={<Button as={Link} href="/offers" variant="secondary">Ver ofertas</Button>}
              />
            )}
          </>
        );
      }}
    </ProtectedShell>
  );
}
