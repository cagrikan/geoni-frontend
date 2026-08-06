import { describe, it, expect } from 'vitest'
import { siteHaritasiBulgusu } from './bulgular'

describe('siteHaritasiBulgusu', () => {
  it('harita YOKSA bulgu gösterilir', () => {
    expect(siteHaritasiBulgusu(false)).toBe(true)
  })

  it('harita varsa gösterilmez', () => {
    expect(siteHaritasiBulgusu(true)).toBe(false)
  })

  it('🪤 ÖLÇÜLEMEDİYSE gösterilmez — naif !sitemap_found burada yanılırdı', () => {
    expect(siteHaritasiBulgusu(undefined)).toBe(false)
    expect(siteHaritasiBulgusu(null)).toBe(false)
  })

  it('🪤 "false" METNİ false sayılmaz', () => {
    expect(siteHaritasiBulgusu('false')).toBe(false)
  })

  it('0 ve boş metin de bulgu üretmez', () => {
    expect(siteHaritasiBulgusu(0)).toBe(false)
    expect(siteHaritasiBulgusu('')).toBe(false)
  })
})
