/* Skor istikrari (v3): yumusatilmis skor + oynaklik notu.
   Web-tabanli motorlar taramadan taramaya dalgalanir; skor belirgin
   degistiginde ve degisim tek bir bilesenden geliyorsa kullaniciya
   "yapisal degisim olmayabilir" diye durustce soylenir. */
export default function StabilityNote({ stability, driverLabel, t }) {
  if (!stability || stability.smoothed_score == null) return null

  const delta = stability.delta
  const showDriver = stability.driver && delta != null && Math.abs(delta) >= 5

  return (
    <div className="stability">
      <div className="stability__smoothed">
        {t('stability_smoothed')}: <b>{stability.smoothed_score}</b>
        <span className="stability__hint"> · {t('stability_smoothed_hint')}</span>
      </div>
      {showDriver && (
        <p className="stability__note">
          {t('stability_prev_prefix')} <b style={{ color: delta > 0 ? 'var(--good)' : 'var(--bad)' }}>{delta > 0 ? '+' : ''}{delta}</b> {t('stability_prev_suffix')}{' '}
          {t('stability_driver_prefix')} <b>{driverLabel || stability.driver}</b> {t('stability_driver_suffix')}
        </p>
      )}
    </div>
  )
}
