// Bağımlılıksız, saf SVG sparkline bileşeni.
// Skor geçmişini çizer; son nokta skor rengiyle vurgulanır,
// scoring_version değişimi olan noktalarda dikey kesikli çizgi gösterilir.

function bandColor(score) {
  if (score == null) return 'var(--text-muted)'
  return score >= 65 ? 'var(--good)' : score >= 40 ? 'var(--warn)' : 'var(--bad)'
}

export default function Sparkline({ points, width = 120, height = 32, showVersionMarks = true }) {
  if (!points || points.length < 2) return null

  const scores = points.map(p => p.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1
  const padY = 4
  const stepX = width / (points.length - 1)

  const coords = points.map((p, i) => ({
    ...p,
    x: i * stepX,
    y: height - padY - ((p.score - min) / range) * (height - padY * 2),
  }))

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const last = coords[coords.length - 1]
  const lineColor = bandColor(last.score)

  const versionMarks = showVersionMarks
    ? coords.filter((c, i) => i > 0 && c.scoring_version && coords[i - 1].scoring_version && c.scoring_version !== coords[i - 1].scoring_version)
    : []

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="sparkline" preserveAspectRatio="none">
      {versionMarks.map((c, i) => (
        <line
          key={`v-${i}`}
          x1={c.x} y1={0} x2={c.x} y2={height}
          stroke="var(--accent-2)" strokeWidth="1" strokeDasharray="2,2" opacity="0.55"
        />
      ))}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c.x} cy={c.y}
          r={i === coords.length - 1 ? 2.4 : 1.3}
          fill={i === coords.length - 1 ? lineColor : 'var(--border-mid)'}
        >
          <title>{new Date(c.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} — {c.score}</title>
        </circle>
      ))}
    </svg>
  )
}
