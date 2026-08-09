/* Skor istikrari notunun KARARI — saf mantik, React yok.

   NEDEN AYRI DOSYA: karar JSX bilesenin icindeyken test edilemiyordu; bu depoda
   ayni kalip `okunamayanSite.js` icin de kullanildi. Bilesen yalniz cizer,
   karar burada verilir ve testle kilitlenir.

   🔴 2026-08-09 (kurucu karari): degisim, SEBEBI BULUNAMASA DA yazilir.
   YASANDI: yeni bir kullanici ayni markayi 6 dakika arayla iki kez taradi,
   21 ve 32 gordu. Urun bunu ZATEN hesaplamisti (delta +11, yumusatilmis 28)
   ama not yalniz `driver` doluyken ciziliyordu -> ekranda hicbir sey yazmadi.
   Olculdu: son 30 gunde |delta| >= 5 olan 46 taramanin 18'inde (%39) `driver`
   bos. Yani anlamli degisimlerin beste ikisinde kullanici aciklamasiz kaliyordu. */

/** Notun cizilmesi icin gereken en kucuk degisim (puan). */
export const DEGISIM_ESIGI = 5

/** Yumusatilmis skor satiri cizilsin mi? */
export function notGosterilsinMi(stability) {
  return Boolean(stability) && stability.smoothed_score != null
}

/** "Onceki taramaya gore +N puan" cumlesi yazilsin mi? */
export function degisimYazilsinMi(stability) {
  if (!notGosterilsinMi(stability)) return false
  const d = stability.delta
  return d != null && Math.abs(d) >= DEGISIM_ESIGI
}

/** Degisimin sebebi tek bir bilesene baglanabildi mi? */
export function sebepVarMi(stability) {
  return Boolean(stability && stability.driver)
}
