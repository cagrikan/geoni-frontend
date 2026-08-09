import { describe, it, expect } from 'vitest'
import { DEGISIM_ESIGI, notGosterilsinMi, degisimYazilsinMi, sebepVarMi } from './istikrar'

describe('istikrar notu karari', () => {
  it('yumuşatılmış skor yoksa hiç çizilmez', () => {
    expect(notGosterilsinMi(null)).toBe(false)
    expect(notGosterilsinMi({ delta: 11 })).toBe(false)
  })

  /* 🔴 Kurucu kararı 2026-08-09 — asıl düzeltme bu. Gerçek vaka:
     aynı marka 6 dk arayla 21 → 32, driver boş geldi, ekranda hiçbir şey yazmadı. */
  it('SEBEP BOŞ olsa da belirgin değişim yazılır', () => {
    const s = { smoothed_score: 28, delta: 11, driver: null }
    expect(degisimYazilsinMi(s)).toBe(true)
    expect(sebepVarMi(s)).toBe(false)
  })

  it('sebep varsa da yazılır (eski davranış korunuyor)', () => {
    const s = { smoothed_score: 71, delta: -5, driver: 'brand_recall' }
    expect(degisimYazilsinMi(s)).toBe(true)
    expect(sebepVarMi(s)).toBe(true)
  })

  it('eşiğin altındaki oynama yazılmaz — gürültü yapmıyoruz', () => {
    expect(degisimYazilsinMi({ smoothed_score: 70, delta: 4, driver: null })).toBe(false)
    expect(degisimYazilsinMi({ smoothed_score: 70, delta: -4, driver: 'x' })).toBe(false)
  })

  it('delta yoksa (ilk tarama) yazılmaz', () => {
    expect(degisimYazilsinMi({ smoothed_score: 50, delta: null })).toBe(false)
  })

  it('eşik 5 puan', () => {
    expect(DEGISIM_ESIGI).toBe(5)
    expect(degisimYazilsinMi({ smoothed_score: 50, delta: 5, driver: null })).toBe(true)
  })
})
