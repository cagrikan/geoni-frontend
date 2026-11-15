import { describe, it, expect } from 'vitest'
import { OTOMATIK_IZLEME_ACIK } from './otomatikIzleme'
import { translations } from './translations'

describe('saved targets while automatic monitoring is paused', () => {
  it('does not advertise monitoring as enabled', () => {
    expect(OTOMATIK_IZLEME_ACIK).toBe(false)
    for (const lang of ['tr', 'en']) {
      const dict = translations[lang]
      expect(dict.watchlist_add).toBe(lang === 'tr' ? 'Kaydet' : 'Save')
      expect(dict.watchlist_added).toBe(lang === 'tr' ? 'Kaydedildi ✓' : 'Saved ✓')
      expect(dict.dash_watchlist_empty_hint).toContain(lang === 'tr' ? 'kapalıdır' : 'currently off')
      expect(dict.dash_watchlist_empty_hint).not.toMatch(/15 gün|15 days/)
      expect(dict.watchlist_saved_target).toContain(lang === 'tr' ? 'Yeniden Tara' : 'Rescan')
    }
  })
})
