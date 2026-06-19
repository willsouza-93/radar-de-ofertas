export function LoadingState({ label = 'Carregando informacoes...' }: { label?: string }) {
  return (
    <section className="card" aria-busy="true">
      <p className="eyebrow">Loading</p>
      <h2>{label}</h2>
      <div className="grid">
        <SkeletonLine width="80%" />
        <SkeletonLine width="64%" />
        <SkeletonLine width="72%" />
      </div>
    </section>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <span
      style={{
        display: 'block',
        width,
        height: '0.9rem',
        borderRadius: '999px',
        background: 'var(--muted-soft)'
      }}
    />
  );
}
