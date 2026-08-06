import { describe, it, expect } from 'vitest'
import { notGosterilsinMi, olculemeyenler, notTuru } from './okunamayanSite'

describe('notGosterilsinMi', () => {
  it('temiz taramada not YOK', () => {
    expect(notGosterilsinMi({ low_confidence: false, bot_protection_suspected: false })).toBe(false)
  })

  it('bot engeli varsa gösterilir', () => {
    expect(notGosterilsinMi({ bot_protection_suspected: true })).toBe(true)
  })

  it('güven düşükse gösterilir', () => {
    expect(notGosterilsinMi({ low_confidence: true })).toBe(true)
  })

  it('ölçülemeyen bölüm varsa gösterilir', () => {
    expect(notGosterilsinMi({ unmeasured_dimensions: ['schema'] })).toBe(true)
  })

  it('🪤 diagnostics hiç yoksa patlamaz', () => {
    expect(notGosterilsinMi(undefined)).toBe(false)
    expect(notGosterilsinMi(null)).toBe(false)
    expect(notGosterilsinMi('bozuk')).toBe(false)
  })

  it('🪤 "true" metni true SAYILMAZ — yalnız gerçek boolean', () => {
    expect(notGosterilsinMi({ low_confidence: 'false' })).toBe(false)
    expect(notGosterilsinMi({ bot_protection_suspected: 0 })).toBe(false)
  })
})

describe('olculemeyenler', () => {
  it('dizi değilse boş dizi döner', () => {
    expect(olculemeyenler({ unmeasured_dimensions: 'schema' })).toEqual([])
    expect(olculemeyenler({})).toEqual([])
    expect(olculemeyenler(null)).toEqual([])
  })

  it('boş/null öğeleri ayıklar', () => {
    expect(olculemeyenler({ unmeasured_dimensions: ['schema', null, '', 'freshness'] }))
      .toEqual(['schema', 'freshness'])
  })
})

describe('notTuru', () => {
  it('hiç sayfa yoksa "okuyamadık" başlığı', () => {
    const n = notTuru({ bot_protection_suspected: true }, 0)
    expect(n.baslik).toBe('unread_title_none')
    expect(n.govde).toBe('unread_body_blocked')
  })

  it('kısmi okuma varsa "kısmen" başlığı', () => {
    const n = notTuru({ low_confidence: true }, 7)
    expect(n.baslik).toBe('unread_title_partial')
    expect(n.govde).toBe('unread_body_lowconf')
  })

  it('bot engeli YOKSA suçlayıcı metin kullanılmaz', () => {
    const n = notTuru({ low_confidence: true }, 0)
    expect(n.govde).toBe('unread_body_lowconf')
  })

  it('gösterilmeyecekse null döner', () => {
    expect(notTuru({}, 20)).toBeNull()
  })

  it('🪤 total_pages verilmezse 0 sayılır — iyimser davranmaz', () => {
    const n = notTuru({ bot_protection_suspected: true }, undefined)
    expect(n.baslik).toBe('unread_title_none')
  })

  it('gerçek canlı kayıtla (iyzico.com, 6 Ağu) doğru karar', () => {
    // Canlıdan alınan gerçek diagnostics parçası.
    const n = notTuru({
      low_confidence: true,
      bot_protection_suspected: true,
      unmeasured_dimensions: ['schema'],
    }, 0)
    expect(n.baslik).toBe('unread_title_none')
    expect(n.govde).toBe('unread_body_blocked')
    expect(n.olculemeyen).toEqual(['schema'])
  })
})
