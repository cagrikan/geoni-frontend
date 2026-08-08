/**
 * Geçici 404 taramayı ÖLDÜRMEMELİ — web istemcisinde de.
 *
 * CANLIDA ÖLÇÜLDÜ (2026-08-08): kullanıcı kontörü ödedi, rapor sunucuda
 * üretildi ve kaydedildi, ama ekranda "Tarama bulunamadı." çıktı. Sebep
 * istemcinin çok erken pes etmesiydi.
 *
 * Web'de durum mobilden DAHA kötüydü: ilk 40 yoklama 3 saniyede bir dönüyor,
 * yani 4 ardışık hata = **12 saniye**. Dağıtım ya da sunucunun uykudan uyanması
 * ise 2-3 DAKİKA sürüyor. Üstelik pes edince `pushView('landing')` ile
 * kullanıcıyı ANA SAYFAYA atıyor — tarama ekranı tamamen kayboluyor.
 *
 * Kural: 404 için ~30 ardışık deneme (ilk fazda ~90 sn), ağ/5xx için eski 4.
 * Üst sınır zaten döngünün kendi tavanı (tarama ~35 dk, marka ~5 dk).
 *
 * 🪤 Test kaynağı METİN olarak okur: App.jsx bir React ağacı kurar, jsdom+mock
 *    zinciri bu tek kuralı doğrulamak için orantısız pahalı olurdu.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KAYNAK = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'App.jsx'), 'utf8')

describe('web istemcisi poll dayanıklılığı', () => {
  it('her iki döngüde de 404 ayrı ele alınıyor', () => {
    // Biri site taraması, diğeri kişi/marka/sosyal — biri düzeltilip diğeri
    // atlanırsa bugünün tekrarlayan hata biçimi geri gelir.
    expect(KAYNAK.match(/bulunamadi \? 30 : 4/g)?.length).toBe(2)
  })

  // 🪤 Naif sayım yanıltıyor: `e.status = res.status` dosyada başka bir yardımcıda
  // da geçiyor (401 login duvarı), `errStreak = 0` ise hem tanım hem sıfırlama.
  // Bu yüzden her iki DÖNGÜNÜN GÖVDESİ ayrı ayrı kontrol ediliyor.
  const dongu = (ad) => {
    const i = KAYNAK.indexOf(ad)
    if (i < 0) throw new Error(`${ad} bulunamadı — yeniden adlandırıldıysa test körleşir`)
    return KAYNAK.slice(i, i + 3600)
  }

  it.each(['const pollAuditJob', 'const pollBrandJob'])('%s: HTTP kodu hataya iliştiriliyor', (ad) => {
    // Yoksa 404 ile geçici ağ hatası ayırt edilemez ve kural ölü kalır.
    expect(dongu(ad)).toMatch(/e\.status = res\.status/)
  })

  it.each(['const pollAuditJob', 'const pollBrandJob'])('%s: sayaç iki kez artmıyor', (ad) => {
    expect(dongu(ad)).not.toMatch(/\+\+errStreak >=/)
  })

  it.each(['const pollAuditJob', 'const pollBrandJob'])('%s: başarılı yanıtta sayaç sıfırlanıyor', (ad) => {
    expect(dongu(ad)).toMatch(/errStreak = 0/)
  })

  it('gerekçe kaynakta yazılı', () => {
    // Silinirse biri "neden 30" deyip 4'e geri çeker.
    expect(KAYNAK).toMatch(/12 SANIYE/)
  })
})
