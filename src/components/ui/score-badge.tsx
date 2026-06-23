export function getScoreLabel(value: number): string {
  if (value >= 90) return 'Excelente';
  if (value >= 75) return 'Forte';
  if (value >= 60) return 'Moderado';
  return 'Baixo';
}

export function ScoreBadge({
  value,
  size = 'md',
  showLabel = true
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const label = getScoreLabel(value);
  const dimension = size === 'lg' ? 72 : size === 'sm' ? 42 : 54;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
      <span
        className="score-ring"
        style={{ width: dimension, height: dimension }}
        aria-label={`Score ${value} de 100, ${label}`}
      >
        {value}
      </span>
      {showLabel ? <strong>{label}</strong> : null}
    </span>
  );
}
