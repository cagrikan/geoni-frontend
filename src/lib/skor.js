/* Skor renk esigi — TEK KAYNAK.
 *
 * Kor denetim 2026-08-04: web `>= 65`, mobil `>= 70` kullaniyordu. Ayni skor
 * (ör. 67) web'de "iyi/yesil", mobilde "gelistirilmeli/turuncu" gorunuyordu —
 * dort mobil ekrani birden etkiliyordu ve mobilde bu farki aciklayan bir
 * legend de yoktu. Web'in 65'i BELGELI (arayuzde legend var: "65+ iyi ·
 * 40-64 gelistirilmeli · 40 alti zayif — muhur icin 70 gerekir"), mobilinki
 * gerekcesizdi. Ikisi 65'te birlestirildi.
 *
 * 70 AYRI bir esiktir (gomulu rozet/muhur hakki) ve buradan TURETILMEZ.
 */
export const SKOR_IYI = 65
export const SKOR_ORTA = 40
