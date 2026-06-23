export function ErrorState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="card" role="alert">
      <p className="eyebrow">Erro</p>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {action ? <div className="action-bar">{action}</div> : null}
    </section>
  );
}
