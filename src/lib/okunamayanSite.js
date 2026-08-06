/* Okunamayan-site notunun KARARI — saf mantik, React yok.

   NEDEN AYRI DOSYA: karar JSX bilesenin icindeyken test edilemiyordu. Native/
   JSX alan dosya test kosucusunu zorluyor; karar ise tamamen mantik. Bilesen
   yalniz cizer, karar burada verilir ve kilitlenir.

   Arka plan (2026-08-06'da canli veriyle olculdu): son 30 gunde tamamlanan
   105 web taramasinin 42'si SIFIR sayfa cekebilmis ama yine de puan uretmis
   (ortalama 43,9; en yuksek 82). Backend durumu durustce kaydediyordu
   (`diagnostics.bot_protection_suspected`, `low_confidence`,
   `unmeasured_dimensions`) fakat istemcilerin HICBIRI `diagnostics` alanini
   okumuyordu — kullanici eksik olcume dayanan puani cekincesiz goruyordu. */

/** Not gosterilecek mi? */
export function notGosterilsinMi(diagnostics) {
  if (!diagnostics || typeof diagnostics !== 'object') return false
  return (
    diagnostics.bot_protection_suspected === true ||
    diagnostics.low_confidence === true ||
    olculemeyenler(diagnostics).length > 0
  )
}

/** Olculemeyen bolumler — her zaman dizi doner. */
export function olculemeyenler(diagnostics) {
  const d = diagnostics && diagnostics.unmeasured_dimensions
  return Array.isArray(d) ? d.filter(Boolean) : []
}

/**
 * Hangi metin? Bot engeli varsa "engelleniyor" anlatimi kullanilir — bu
 * kullanicinin DUZELTEBILECEGI bir bulgu, alarm degil. Engel yoksa yalnizca
 * guven dusuklugu soylenir.
 */
export function notTuru(diagnostics, totalPages) {
  if (!notGosterilsinMi(diagnostics)) return null
  return {
    baslik: (totalPages ?? 0) === 0 ? 'unread_title_none' : 'unread_title_partial',
    govde: diagnostics.bot_protection_suspected === true
      ? 'unread_body_blocked'
      : 'unread_body_lowconf',
    olculemeyen: olculemeyenler(diagnostics),
  }
}
