/**
 * Backend hata mesajlarinin dili.
 *
 * API artik hatayi KODLA uretiyor ve metni istegin diline gore seciyor
 * (geoni-scanner/api_errors.py). Dil oncelikle `X-Lang` basligindan okunur;
 * `Accept-Language`'a duserse TARAYICI dili kullanilir — ama kullanicinin
 * uygulamadaki tercihi ondan farkli olabilir (TR tarayicida EN arayuz).
 * Bu yuzden tercihi acikca gonderiyoruz.
 *
 * LanguageContext her degisiklikte `geoni_lang`i localStorage'a yaziyor;
 * burasi tek okuma noktasi (React agacindan bagimsiz cagrilabilsin diye
 * hook degil, duz fonksiyon).
 */
export function langHeaders() {
  try {
    const l = localStorage.getItem('geoni_lang')
    if (l === 'tr' || l === 'en') return { 'X-Lang': l }
  } catch { /* localStorage kapali olabilir (gizli sekme/izin) */ }
  return {}
}
