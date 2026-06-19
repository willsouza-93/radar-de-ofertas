import Link from 'next/link';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { OfferFilters } from '@/components/offers/offer-filters';
import { OfferTable } from '@/components/offers/offer-table';
import { Button } from '@/components/ui/button';
import { listOfferFilterOptions, listOffersData } from '@/server/ui/data';
import { parseOfferSearchParams } from '@/server/ui/search-params';

export const dynamic = 'force-dynamic';

export default function OffersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ProtectedShell currentPath="/offers">
      {async ({ session }) => {
        const params = searchParams ? await searchParams : {};
        const filters = parseOfferSearchParams(params);
        const options = await listOfferFilterOptions(session);

        if (!filters.ok) {
          return (
            <>
              <PageHeader title="Ofertas" description="Filtre oportunidades capturadas." />
              <ErrorState title="Filtros invalidos" description={filters.message} action={<Button as={Link} href="/offers" variant="secondary">Limpar filtros</Button>} />
            </>
          );
        }

        const data = await listOffersData(session, filters.value);
        return (
          <>
            <PageHeader title="Ofertas" description="Produtos capturados e ranqueados pelo score MVP v1." />
            <OfferFilters categories={options.categories} tags={options.tags} />
            {data.items.length > 0 ? (
              <OfferTable offers={data.items} />
            ) : (
              <EmptyState
                title="Nenhuma oferta encontrada."
                description="Limpe ou ajuste os filtros para ampliar a busca."
                action={<Button as={Link} href="/offers" variant="secondary">Limpar filtros</Button>}
              />
            )}
          </>
        );
      }}
    </ProtectedShell>
  );
}
