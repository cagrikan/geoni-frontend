import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

export default function AuthCallback({ onDone }) {
  const { t } = useLanguage()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Kaydin ulkesini SUNUCU tarafinda isaretle (x-vercel-ip-country).
        // Istemci ulkeyi yazamaz; burada yalnizca ucu tetikliyoruz, hata olsa da
        // giris akisi ASLA bloke olmaz.
        // Ulke sunucudan (x-vercel-ip-country), saat dilimi/dil tarayicidan:
        // VPN IP'yi degistirir ama saat dilimini genelde degistirmez.
        fetch('/api/signup-country', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            lang: navigator.language
          })
        }).catch(() => {})
        onDone('dashboard')
      } else onDone('landing')
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
