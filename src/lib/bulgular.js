/* Rapor bulgularının saf karar mantığı — React yok, test edilebilir.

   Şimdilik yalnız site haritası bulgusu burada; diğer bulgular hâlâ
   `ResultsPage.jsx` içinde. Yeni bulgu eklerken karar BURAYA yazılır:
   bileşen içindeki `if` bloğu test edilemiyor ve sessizce yanlış eşikle
   yayına gidebiliyor (bkz. [[feedback-saf-mantik-ayri-dosya]]).
*/

/**
 * Site haritası bulgusu gösterilsin mi?
 *
 * NEDEN ÜÇ DURUMLU: `sitemap_found` üç değer taşıyabilir —
 *   true      → harita var, bulgu yok
 *   false     → harita YOK, bulgu göster
 *   undefined → ÖLÇÜLEMEDİ (eski payload ya da site hiç okunamadı)
 *
 * Ölçülememiş bir şeyi "eksik" diye göstermek kullanıcıyı olmayan bir işe
 * yönlendirir; bu yüzden yalnız `false` bulgu üretir. Naif bir `!sitemap_found`
 * kontrolü `undefined`ı da yakalardı ve tam da bu hatayı yapardı.
 *
 * Ölçüldü (2026-08-06): son 30 günde 106 web taramasının 30'unda (%28)
 * `sitemap_found` false — gerçek ve yaygın bir bulgu.
 */
export function siteHaritasiBulgusu(sitemapFound) {
  return sitemapFound === false
}
