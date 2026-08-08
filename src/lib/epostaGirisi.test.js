/**
 * Web ve mobil AYNI giriş yollarını sunmalı.
 *
 * 🔴 GÜNÜN TEKRARLAYAN HATA BİÇİMİ (2026-08-08): "bir uçtan düzelt, diğerini
 * unut". Bugün üç kusur bundan çıktı. Mobile e-posta+parola girişi eklendiğinde
 * webde YOKTU — yani uygulamada e-posta ile hesap açan kişi aynı hesapla web'e
 * giremeyecekti. Aynı tuzağı ters yönde kurmamak için iki taraf da eklendi ve
 * bu test simetriyi kilitliyor.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const oku = (p) => readFileSync(join(KOK, p), 'utf8')
const AUTH = oku('src/lib/AuthContext.jsx')
const LOGIN = oku('src/pages/LoginPage.jsx')
const CEVIRI = oku('src/lib/translations.js')

describe('web e-posta girişi', () => {
  it('üç yol da context’te var', () => {
    expect(AUTH).toMatch(/signInWithPassword/)
    expect(AUTH).toMatch(/supabase\.auth\.signUp\(/)
    expect(AUTH).toMatch(/resetPasswordForEmail/)
  })

  it('üçü de dışarı veriliyor', () => {
    expect(AUTH).toMatch(/signInWithEmail, signUpWithEmail, sendPasswordReset,/)
  })

  it('🪤 hata yutulmuyor', () => {
    // Yutulan hata: kullanıcı butona basar, hiçbir şey olmaz.
    expect(AUTH.match(/if \(error\) throw error/g)?.length).toBeGreaterThanOrEqual(3)
  })

  it('🪤 doğrulama bekleyen kayıt "giriş oldu" sayılmıyor', () => {
    expect(AUTH).toMatch(/dogrulamaGerekli: !data\.session/)
    expect(LOGIN).toMatch(/dogrulamaGerekli/)
  })

  it('e-posta normalize ediliyor (üç fonksiyonda da)', () => {
    expect(AUTH.match(/String\(email\)\.trim\(\)\.toLowerCase\(\)/g)?.length).toBe(3)
  })

  it('boş/geçersiz form gönderilemiyor', () => {
    expect(LOGIN).toMatch(/epostaGecerli/)
    expect(LOGIN).toMatch(/parola\.length >= 6/)
    expect(LOGIN).toMatch(/disabled=\{bekliyor \|\| !epostaGecerli \|\| !parolaGecerli\}/)
  })

  it('🪤 sıfırlamada hesabın varlığı söylenmiyor', () => {
    const i = CEVIRI.indexOf('login_reset_sent_body')
    expect(CEVIRI.slice(i, i + 200)).toMatch(/kayıtlıysa/)
  })

  it('parola sıfırlama yalnız giriş modunda', () => {
    expect(LOGIN).toMatch(/\{!kayitModu && \(/)
  })

  it('metinler TR ve EN sözlükte birlikte var', () => {
    for (const k of ['login_email_open', 'login_email_signin', 'login_email_signup',
                     'login_reset_link', 'login_reset_sent_body', 'login_verify_body',
                     'pw_title', 'pw_done_title', 'pw_invalid_title']) {
      expect(CEVIRI.match(new RegExp(`${k}:`, 'g'))?.length, k).toBe(2)
    }
  })
})
