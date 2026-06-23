import { formatDate } from '@/components/offers/offer-table';
import type { ReviewHistoryItem } from '@/server/curation/types';

export function ReviewHistory({ items }: { items: ReviewHistoryItem[] }) {
  if (items.length === 0) {
    return <p className="muted">Ainda nao ha notas ou decisoes registradas.</p>;
  }

  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={`${item.type}-${item.createdAt}`} className="timeline-item">
          <strong>{getTitle(item)}</strong>
          <p className="muted" style={{ margin: 0 }}>
            {item.actor.displayName ?? 'Usuario'} - {formatDate(item.createdAt)}
          </p>
          <p style={{ marginBottom: 0 }}>{getBody(item)}</p>
        </li>
      ))}
    </ol>
  );
}

function getTitle(item: ReviewHistoryItem): string {
  if (item.type === 'note') return 'Observacao';
  return item.decision === 'approved' ? 'Oferta aprovada' : 'Oferta rejeitada';
}

function getBody(item: ReviewHistoryItem): string {
  if (item.type === 'note') return item.body;
  return item.reason ?? 'Sem observacao adicional.';
}
