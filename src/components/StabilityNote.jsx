/* Skor istikrari (v3): yumusatilmis skor + oynaklik notu.
   Web-tabanli motorlar taramadan taramaya dalgalanir; skor belirgin
   degistiginde kullaniciya durustce soylenir.

   🔴 2026-08-09 (kurucu karari): degisim, SEBEBI BULUNAMASA DA yazilir.
   YASANDI: yeni bir kullanici ayni markayi 6 dakika arayla iki kez taradi ve
   21 ile 32 gordu. Urun bunu ZATEN hesaplamisti (delta +11, yumusatilmis 28)
   ama not yalniz `driver` doluyken cizildigi icin ekranda HICBIR SEY yazmadi.
   Olculdu: son 30 gunde belirgin degisim (|delta| >= 5) olan 46 taramanin
   18'inde (%39) `driver` bos — yani anlamli degisimlerin beste ikisinde
   kullanici aciklamasiz birakiliyordu. Sebep bulunamadiginda susmak,
   kullanicinin en cok kafasinin karistigi anda susmak demekti.

   Kural artik: |delta| >= ESIK ise degisim HER ZAMAN yazilir; sebep varsa
   cumleye eklenir. Yeni olcum gerekmiyor, sayi zaten hesaplanmis. */

import { notGosterilsinMi, degisimYazilsinMi, sebepVarMi } from '../lib/istikrar'

export default function StabilityNote({ stability, driverLabel, t }) {
  if (!notGosterilsinMi(stability)) return null

  const delta = stability.delta
  const degisimVar = degisimYazilsinMi(stability)
  const sebepVar = sebepVarMi(stability)

  return (
    <div className="stability">
      <div className="stability__smoothed">
        {t('stability_smoothed')}: <b>{stability.smoothed_score}</b>
        <span className="stability__hint"> · {t('stability_smoothed_hint')}</span>
      </div>
      {degisimVar && (
        <p className="stability__note">
          {t('stability_prev_prefix')}{' '}
          <b style={{ color: delta > 0 ? 'var(--good)' : 'var(--bad)' }}>
            {delta > 0 ? '+' : ''}{delta}
          </b>{' '}
          {t('stability_prev_suffix')}
          {sebepVar ? (
            <>
              {' '}{t('stability_driver_prefix')} <b>{driverLabel || stability.driver}</b>{' '}
              {t('stability_driver_suffix')}
            </>
          ) : (
            /* Sebep tek bir bilesene baglanamadi: uydurmuyoruz, ama degisimi de
               saklamiyoruz — motorlarin dalgalandigini duz cumleyle soyluyoruz. */
            <> {t('stability_no_driver')}</>
          )}
        </p>
      )}
    </div>
  )
}
