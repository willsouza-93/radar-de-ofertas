import type { OfferHighlight } from '@/server/offers/types';
import type { ApprovalStatus } from '@/server/curation/types';

export function Badge({
  children,
  tone = 'neutral'
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const labelByStatus: Record<ApprovalStatus, string> = {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada'
  };
  const toneByStatus: Record<ApprovalStatus, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };

  return <Badge tone={toneByStatus[status]}>{labelByStatus[status]}</Badge>;
}

export function HighlightBadge({ highlight }: { highlight: OfferHighlight }) {
  const labelByHighlight: Record<OfferHighlight, string> = {
    lowest_price: 'Menor preco',
    coupon: 'Cupom',
    free_shipping: 'Frete gratis',
    high_commission: 'Alta comissao'
  };

  return <Badge tone="primary">{labelByHighlight[highlight]}</Badge>;
}

export function MarketplaceBadge({ marketplace }: { marketplace: string }) {
  const labels: Record<string, string> = {
    manual: 'Manual',
    mercado_livre: 'Mercado Livre',
    shopee: 'Shopee'
  };

  return <Badge>{labels[marketplace] ?? marketplace}</Badge>;
}
