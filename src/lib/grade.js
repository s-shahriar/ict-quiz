// Score-ring color by grade band, so the result reads at a glance.
// Bands match the Bengali messages on the score screens.
export const gradeColor = pct =>
  pct >= 80 ? 'var(--ok)' :
  pct >= 60 ? 'var(--info)' :
  pct >= 40 ? 'var(--warn)' :
              'var(--bad)'
