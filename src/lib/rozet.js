/* Gomulu rozet ("AI Friendly · Checked by GEONI") HAKKI — TEK KAYNAK.
 *
 * Rozet iki sart ister ve ikisi de sunucuda uygulanir:
 *   1) skor >= ROZET_ESIGI (70)
 *   2) sitenin en az MIN_SAYFA (3) sayfasi GERCEKTEN gezilebilmis olmali
 *
 * 2. sart 2026-08-08'de eklendi. O gune kadar rozet ucu yalniz skora bakiyordu:
 * botlari engelleyen, tek sayfasini bile okuyamadigimiz bir site 80 alip muhuru
 * sitesine gomebiliyordu. Olculdu: son 30 gunde 70+ alan 19 taramanin 5'i
 * (%26,3) SIFIR sayfa (iyzico.com 82 · parasut.com 80 · doktortakvimi.com 80 ·
 * n11.com 76 — hepsi bot korumasina takilmis). AI Friendly Ligi ayni kurali
 * ZATEN uyguluyordu (MIN_CRAWLED_PAGES = 3); rozet uygulamiyordu.
 *
 * 🪤 BURASI NEDEN VAR: sunucu (geoni/api/badge/[id].js) rozeti 404 veriyor ama
 * arayuz gomme kutusunu gostermeye devam ederse kullanici kodu kopyalayip
 * sitesine yapistiriyor ve KIRIK RESIM aliyor. Sunucu tarafini duzeltip burayi
 * unutmak, duzeltmeden once olan halden daha kotu.
 *
 * 🪤 UC DURUM, iki degil: sayfa sayisi BILINMIYORSA (undefined/null) rozet
 * ENGELLENMEZ. Retention eski taramalarin result_json'unu tamamen NULL'luyor
 * (olculdu: armut.com 77, cagricakir.com.tr 75 — anahtar bile yok); "bilmiyoruz"
 * durumunu "0 sayfa" saymak duzgun taranmis eski sitelerin rozetini kirardi.
 * Sunucu tarafi da ayni uc durumlu kurali uyguluyor.
 */
export const ROZET_ESIGI = 70
export const ROZET_MIN_SAYFA = 3

export function rozetHakkiVar(skor, sayfa) {
  if (!(Number(skor) >= ROZET_ESIGI)) return false
  if (sayfa === undefined || sayfa === null || sayfa === '') return true // bilmiyoruz -> engelleme
  const n = Number(sayfa)
  if (!Number.isFinite(n)) return true // bozuk deger de "bilmiyoruz"
  return n >= ROZET_MIN_SAYFA
}
