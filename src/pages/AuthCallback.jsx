import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

export default function AuthCallback({ onDone }) {
  const { t } = useLanguage()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) onDone('dashboard')
      else onDone('landing')
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
