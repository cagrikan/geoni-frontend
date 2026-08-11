import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

export default function AuthCallback({ onDone }) {
  const { t } = useLanguage()

  useEffect(() => {
    // Kayit damgasi (ulke/saat dilimi/dil) BURADAN KALDIRILDI (2026-08-11).
    // Buradaki `getSession()` OAuth kod degisimi bitmeden donebiliyor; session
    // null gelince damga hic atilmiyordu. Olculdu: 21 google kaydindan yalniz
    // 1'i damgali, o da 2 Temmuz'dan. Ayrica bu sayfaya hic ugramayan giris
    // yollari tumuyle kapsam disi kaliyordu. Damga artik AuthContext'te
    // `onAuthStateChange` ile, oturumun olustugu HER yerde atiliyor.
    supabase.auth.getSession().then(({ data: { session } }) => {
      onDone(session ? 'dashboard' : 'landing')
    })
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-sub)', marginTop: 16, fontFamily: 'var(--mono)' }}>{t('auth_signing_in')}</p>
      </div>
    </div>
  )
}
