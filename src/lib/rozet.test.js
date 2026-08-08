import { describe, it, expect } from 'vitest'
import { rozetHakkiVar, ROZET_ESIGI, ROZET_MIN_SAYFA } from './rozet'

describe('rozetHakkiVar', () => {
  it('70 altinda rozet yok', () => {
    expect(rozetHakkiVar(69, 20)).toBe(false)
    expect(rozetHakkiVar(0, 20)).toBe(false)
  })

  it('70 ve ustu + yeterli sayfa -> rozet var', () => {
    expect(rozetHakkiVar(70, 3)).toBe(true)
    expect(rozetHakkiVar(85, 20)).toBe(true)
  })

  // 🪤 ASIL KUSUR (2026-08-08): botlari engelleyen, tek sayfasini bile
  // okuyamadigimiz siteler 70+ aliyordu — iyzico.com 82, parasut.com 80,
  // doktortakvimi.com 80, n11.com 76, hepsi 0 sayfa. Son 30 gunde 70+ alan
  // 19 taramanin 5'i (%26,3) boyleydi.
  it('okunamayan site (0-2 sayfa) 70+ olsa bile rozet ALMAZ', () => {
    expect(rozetHakkiVar(82, 0)).toBe(false)
    expect(rozetHakkiVar(77, 1)).toBe(false)
    expect(rozetHakkiVar(80, 2)).toBe(false)
  })

  // 🪤 UC DURUM, iki degil. Retention eski taramalarin result_json'unu tamamen
  // NULL'luyor (olculdu: armut.com 77, cagricakir.com.tr 75 — anahtar bile yok).
  // "Bilmiyoruz"u "0 sayfa" saymak duzgun taranmis eski sitelerin rozetini
  // kirardi. Marka/kisi taramalarinda da sayfa kavrami YOKTUR.
  it('sayfa sayisi BILINMIYORSA rozet engellenmez', () => {
    expect(rozetHakkiVar(80, undefined)).toBe(true)
    expect(rozetHakkiVar(80, null)).toBe(true)
    expect(rozetHakkiVar(80, '')).toBe(true)
    expect(rozetHakkiVar(80, 'bozuk')).toBe(true)
  })

  it('esikler sunucudakiyle ayni sayilar', () => {
    // db.py MIN_CRAWLED_PAGES = 3 · api/badge/[id].js MIN_PAGES = 3
    expect(ROZET_ESIGI).toBe(70)
    expect(ROZET_MIN_SAYFA).toBe(3)
  })
})
