import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

/**
 * Parola yenileme sayfası — sıfırlama e-postasındaki bağlantı buraya gelir.
 *
 * 🔴 NEDEN VAR (2026-08-08): parola sıfırlama HİÇBİR YERDE yoktu — ne webde ne
 * mobilde. E-posta+parola ile giren biri parolasını unutunca KALICI olarak
 * kilitleniyordu; çıkış yolu yoktu. Mobile e-posta girişi eklenince bu eksik
 * gerçek bir tuzağa dönüştü.
 *
 * 🪤 Token URL'in HASH kısmında gelir (`#access_token=…&type=recovery`) ve
 * supabase-js onu KENDİSİ okuyup geçici bir oturum kurar. Bu yüzden burada
 * token'ı elle ayrıştırmıyoruz; `onAuthStateChange` → PASSWORD_RECOVERY
 * olayını bekliyoruz. Elle ayrıştırma denemesi, kütüphane hash'i temizledikten
 * sonra boş dönerdi.
 *
 * 🪤 Olay, bu bileşen abone olmadan ÖNCE de düşebilir (sayfa geç yüklenirse).
 * O yüzden abonelikten ayrı olarak mevcut oturumu da bir kez soruyoruz;
 * yalnız olaya güvenmek "bağlantı geçersiz" diyen yanlış bir ekran üretirdi.
 */
export default function ParolaYenile({ onDone }) {
  const { t } = useLanguage()
  const [hazir, setHazir] = useState(false)
  const [gecersiz, setGecersiz] = useState(false)
  const [parola, setParola] = useState('')
  const [parola2, setParola2] = useState('')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState(null)
  const [bitti, setBitti] = useState(false)

  useEffect(() => {
    let iptal = false
    const { data: sub } = supabase.auth.onAuthStateChange((olay) => {
      if (iptal) return
      if (olay === 'PASSWORD_RECOVERY' || olay === 'SIGNED_IN') setHazir(true)
    })
    // Olay kaçmış olabilir — mevcut oturuma da bak.
    supabase.auth.getSession().then(({ data }) => {
      if (iptal) return
      if (data?.session) setHazir(true)
      else setTimeout(() => { if (!iptal) setGecersiz((g) => (g === false && !data?.session ? true : g)) }, 2500)
    })
    return () => { iptal = true; sub?.subscription?.unsubscribe?.() }
  }, [])

  const kaydet = async (e) => {
    e.preventDefault()
    setHata(null)
    if (parola.length < 6) { setHata(t('pw_too_short')); return }
    if (parola !== parola2) { setHata(t('pw_mismatch')); return }
    setKaydediliyor(true)
    const { error } = await supabase.auth.updateUser({ password: parola })
    setKaydediliyor(false)
    // Hata YUTULMAZ: sessizce başarısız olan bir parola değişimi, kullanıcının
    // eski parolayla kilitli kalmasına ve bunu bilmemesine yol açar.
    if (error) { setHata(error.message); return }
    setBitti(true)
  }

  if (bitti) {
    return (
      <div className="pw-sayfa">
        <h1>{t('pw_done_title')}</h1>
        <p>{t('pw_done_body')}</p>
        <button className="pw-btn" onClick={() => onDone?.('login')}>{t('pw_go_login')}</button>
      </div>
    )
  }

  if (gecersiz && !hazir) {
    return (
      <div className="pw-sayfa">
        <h1>{t('pw_invalid_title')}</h1>
        <p>{t('pw_invalid_body')}</p>
        <button className="pw-btn" onClick={() => onDone?.('login')}>{t('pw_go_login')}</button>
      </div>
    )
  }

  return (
    <div className="pw-sayfa">
      <h1>{t('pw_title')}</h1>
      <p>{t('pw_sub')}</p>
      <form onSubmit={kaydet} className="pw-form">
        <input
          type="password" autoComplete="new-password" value={parola}
          onChange={(e) => setParola(e.target.value)}
          placeholder={t('pw_new_ph')} disabled={!hazir || kaydediliyor}
        />
        <input
          type="password" autoComplete="new-password" value={parola2}
          onChange={(e) => setParola2(e.target.value)}
          placeholder={t('pw_again_ph')} disabled={!hazir || kaydediliyor}
        />
        {hata && <p className="pw-hata">{hata}</p>}
        <button className="pw-btn" type="submit" disabled={!hazir || kaydediliyor}>
          {kaydediliyor ? t('pw_saving') : t('pw_save')}
        </button>
      </form>
    </div>
  )
}
