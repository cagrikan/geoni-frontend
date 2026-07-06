// Kategorik dagilimlar icin bagimsiz, oransal genislikli yatay cubuk listesi
// (orn. kredi harcama nedeni, motor bazli cagri sayisi).

export default function HBarList({ items, valueFormatter = (v) => v }) {
  if (!items || !items.length) return null
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="hbarlist">
      {items.map((item) => (
        <div key={item.label} className="hbarlist__row">
          <span className="hbarlist__label">{item.label}</span>
          <div className="hbarlist__track">
            <div className="hbarlist__fill" style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />
          </div>
          <span className="hbarlist__value">{valueFormatter(item.value)}</span>
        </div>
      ))}
    </div>
  )
}
