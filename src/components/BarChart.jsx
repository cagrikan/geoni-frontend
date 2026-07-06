// Bağımlılıksız, saf SVG çubuk grafik - Sparkline ile aynı yaklaşım.
// Tek veya çoklu seri (grouped ya da stacked), taban çizgisine sabit, sadece
// üst kenarı yuvarlatılmış çubuklar, seriler arası 2px boşluk. Her çubuk
// kendi pointermove/leave tooltip'ini taşır (native <title> yerine) ve
// hover'da hafifçe parlar.

import { useRef, useState } from 'react'

const GAP = 2
const RADIUS = 3

function topRoundedRectPath(x, y, w, h, r) {
  if (h <= 0 || w <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M ${x} ${y + h} L ${x} ${y + rr} Q ${x} ${y} ${x + rr} ${y} ` +
    `L ${x + w - rr} ${y} Q ${x + w} ${y} ${x + w} ${y + rr} L ${x + w} ${y + h} Z`
}

export default function BarChart({
  data, series, height = 140, stacked = false,
  valueFormatter = (v) => v, dateFormatter = (d) => d,
}) {
  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null) // { key, x, y, dateLabel, seriesLabel, value, color }

  if (!data || !data.length || !series || !series.length) return null

  const padTop = 10
  const padBottom = 22
  const plotH = height - padTop - padBottom
  const unitW = stacked ? 26 : Math.max(34, series.length * 12 + 8)
  const width = data.length * unitW
  const barGap = 6

  const maxVal = Math.max(
    1,
    ...data.map((d) =>
      stacked
        ? series.reduce((sum, s) => sum + (d[s.key] || 0), 0)
        : Math.max(...series.map((s) => d[s.key] || 0))
    )
  )

  const scaleY = (v) => (v / maxVal) * plotH

  // Etiket kalabalığını önlemek için en fazla ~6 tarih etiketi göster.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6))

  const showTooltip = (e, key, dateLabel, seriesLabel, value, color) => {
    const rect = wrapRef.current.getBoundingClientRect()
    setHover({ key, x: e.clientX - rect.left, y: e.clientY - rect.top, dateLabel, seriesLabel, value, color })
  }
  const hideTooltip = () => setHover(null)

  return (
    <div className="barchart" ref={wrapRef}>
      {series.length > 1 && (
        <div className="barchart__legend">
          {series.map((s) => (
            <span key={s.key} className="barchart__legend-item">
              <span className="barchart__legend-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="barchart__svg">
        <line x1="0" y1={padTop + plotH} x2={width} y2={padTop + plotH} stroke="var(--border)" strokeWidth="1" />
        {data.map((d, i) => {
          const slotX = i * unitW
          const dateLabel = dateFormatter(d.date ?? d.label)
          const label = i % labelEvery === 0 || i === data.length - 1 ? dateLabel : ''
          if (stacked) {
            let cursor = padTop + plotH
            const segments = series.map((s) => {
              const v = d[s.key] || 0
              const h = scaleY(v)
              cursor -= h
              return { s, v, y: cursor, h }
            })
            const barW = unitW - barGap
            const x = slotX + barGap / 2
            return (
              <g key={i}>
                {segments.map((seg, si) => {
                  const isTop = si === segments.length - 1 || segments.slice(si + 1).every((sg) => sg.v === 0)
                  const segH = Math.max(0, seg.h - (isTop ? 0 : GAP))
                  if (segH <= 0) return null
                  const key = `${i}-${seg.s.key}`
                  return (
                    <path
                      key={seg.s.key}
                      d={topRoundedRectPath(x, seg.y, barW, segH, isTop ? RADIUS : 0)}
                      fill={seg.s.color}
                      style={{ filter: hover?.key === key ? 'brightness(1.2)' : undefined, cursor: 'pointer' }}
                      onMouseMove={(e) => showTooltip(e, key, dateLabel, seg.s.label, seg.v, seg.s.color)}
                      onMouseLeave={hideTooltip}
                    />
                  )
                })}
                {label && <text x={slotX + unitW / 2} y={height - 6} textAnchor="middle" className="barchart__axis-label">{label}</text>}
              </g>
            )
          }
          const barW = (unitW - barGap) / series.length
          return (
            <g key={i}>
              {series.map((s, si) => {
                const v = d[s.key] || 0
                const h = scaleY(v)
                const x = slotX + barGap / 2 + si * barW
                const y = padTop + plotH - h
                const key = `${i}-${s.key}`
                return (
                  <path
                    key={s.key}
                    d={topRoundedRectPath(x, y, Math.max(0, barW - 1.5), h, RADIUS)}
                    fill={s.color}
                    style={{ filter: hover?.key === key ? 'brightness(1.2)' : undefined, cursor: 'pointer' }}
                    onMouseMove={(e) => showTooltip(e, key, dateLabel, s.label, v, s.color)}
                    onMouseLeave={hideTooltip}
                  />
                )
              })}
              {label && <text x={slotX + unitW / 2} y={height - 6} textAnchor="middle" className="barchart__axis-label">{label}</text>}
            </g>
          )
        })}
      </svg>
      {hover && (
        <div className="barchart__tooltip" style={{ left: hover.x, top: hover.y }}>
          <div className="barchart__tooltip-date">{hover.dateLabel}</div>
          <div className="barchart__tooltip-row">
            <span className="barchart__tooltip-key" style={{ background: hover.color }} />
            <span className="barchart__tooltip-label">{hover.seriesLabel}</span>
            <span className="barchart__tooltip-value">{valueFormatter(hover.value)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
