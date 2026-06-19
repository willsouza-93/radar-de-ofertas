export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="card" style={{ textAlign: 'center' }}>
      <p className="eyebrow">Estado vazio</p>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {action ? <div className="action-bar" style={{ justifyContent: 'center' }}>{action}</div> : null}
    </section>
  );
}
