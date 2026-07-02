import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LandingPage from './LandingPage'
import ResultsPage from './ResultsPage'
import BrandCheckResultsPage from './BrandCheckResultsPage'
import IdentityMismatchPage from './IdentityMismatchPage'
import LoginPage from './pages/LoginPage'
import AuthCallback from './pages/AuthCallback'
import DashboardPage from './pages/DashboardPage'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

function AppInner() {
  const { user, loading: authLoading, refreshProfile } = useAuth()
  const [view, setView] = useState(() => {
    if (window.location.pathname === '/auth/callback') return 'auth_callback'
    if (window.location.pathname === '/dashboard') return 'dashboard'
    if (window.location.pathname === '/login') return 'login'
    return 'landing'
  })
  const [result, setResult] = useState(null)
  const [brandResult, setBrandResult] = useState(null)
  const [error, setError] = useState(null)
  const [statusText, setStatusText] = useState('queued')

  // Sync URL with view
  useEffect(() => {
    const path = window.location.pathname
    if (path === '/auth/callback') setView('auth_callback')
    else if (path === '/dashboard') setView(user ? 'dashboard' : 'login')
    else if (path === '/login') setView('login')
  }, [user])

  const navigateTo = (v) => {
    setView(v)
    const paths = { dashboard: '/dashboard', login: '/login', landing: '/', results: '/', brand_results: '/' }
    window.history.pushState({}, '', paths[v] || '/')
  }

  const pollAuditJob = async (jobId) => {
    const labels = { queued: 'Sıraya alındı', crawling: 'Site taranıyor', indexing: 'Dizin kontrol ediliyor', scoring: 'Skor hesaplanıyor' }
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      try {
        const res = await fetch(`${API_URL}/api/audit/${jobId}`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Tarama başarısız')
        const data = await res.json()
        if (data.status === 'complete') { setResult(data.result); setView('results'); if (refreshProfile) refreshProfile(); return }
        if (data.status === 'failed') throw new Error('Tarama başarısız')
        setStatusText(labels[data.status] || data.status)
      } catch (err) { setError(err.message); setView('landing'); return }
    }
    setError('Tarama zaman aşımına uğradı.'); setView('landing')
  }

  const pollBrandJob = async (jobId) => {
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await fetch(`${API_URL}/api/brand-check/${jobId}`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Sorgu başarısız')
        const data = await res.json()
        if (data.status === 'complete') { setBrandResult(data.result); setView('brand_results'); if (refreshProfile) refreshProfile(); return }
        if (data.status === 'failed') throw new Error('Sorgu başarısız')
        setStatusText('AI sorgulanıyor')
      } catch (err) { setError(err.message); setView('landing'); return }
    }
    setError('Sorgu zaman aşımına uğradı.'); setView('landing')
  }

  const handleAudit = async (domain, email) => {
    setError(null); setView('loading'); setStatusText('queued')
    try {
      const session = (await import('./lib/supabase')).supabase.auth.getSession ? await (await import('./lib/supabase')).supabase.auth.getSession() : null
      const token = session?.data?.session?.access_token || ''
      const res = await fetch(`${API_URL}/api/audit/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ domain, email: email || user?.email || 'anonymous@geoni.ai', competitors: [] }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'İstek başarısız')
      await pollAuditJob((await res.json()).job_id)
    } catch (err) { setError(err.message || 'Bağlantı hatası'); setView('landing') }
  }

  const handleBrandCheck = async (payload) => {
    setError(null); setView('loading'); setStatusText('AI sorgulanıyor')
    try {
      const session2 = (await import('./lib/supabase')).supabase.auth.getSession ? await (await import('./lib/supabase')).supabase.auth.getSession() : null
      const token2 = session2?.data?.session?.access_token || ''
      const res = await fetch(`${API_URL}/api/brand-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token2 ? { 'Authorization': `Bearer ${token2}` } : {}) },
        body: JSON.stringify({ ...payload, email: payload.email || user?.email || 'anonymous@geoni.ai' }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'İstek başarısız')
      const data = await res.json()
      if (data.identity_mismatch) {
        setBrandResult({ identity_mismatch: true, match_score: data.match_score, name: payload.name })
        setView('brand_results'); return
      }
      await pollBrandJob(data.job_id)
    } catch (err) { setError(err.message || 'Bağlantı hatası'); setView('landing') }
  }

  const handleReset = () => { setResult(null); setBrandResult(null); setError(null); navigateTo('landing') }

  const handleViewAudit = (audit) => {
    const resultJson = audit.result_json
    if (!resultJson) return
    if (audit.type === 'web') {
      // Ensure domain audit result has required fields
      setResult({ ...resultJson, domain: audit.domain || resultJson.domain })
      setView('results')
    } else {
      // Ensure brand check result has required fields
      setBrandResult({
        ...resultJson,
        name: audit.name || resultJson.name,
        topic: audit.topic || resultJson.topic || '',
        recognition_count: resultJson.recognition_count ?? 0,
        model_results: resultJson.model_results ?? {},
        score_breakdown: resultJson.score_breakdown ?? {},
        performing_topics: resultJson.performing_topics ?? [],
        opportunity_topics: resultJson.opportunity_topics ?? [],
        google_result_count: resultJson.google_result_count ?? 0,
      })
      setView('brand_results')
    }
    window.history.pushState({}, '', '/')
  }

  const handleDashboard = () => navigateTo('dashboard')

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div className="app-shell">
      {view === 'auth_callback' && <AuthCallback onDone={navigateTo} />}
      {view === 'login' && <LoginPage onSuccess={() => navigateTo('dashboard')} />}
      {view === 'dashboard' && <DashboardPage onReset={handleReset} onNewScan={() => navigateTo('landing')} onViewAudit={handleViewAudit} />}
      {(view === 'landing' || view === 'loading') && (
        <LandingPage
          onSubmitAudit={handleAudit}
          onSubmitBrandCheck={handleBrandCheck}
          loading={view === 'loading'}
          statusText={statusText}
          error={error}
          user={user}
          onDashboard={() => navigateTo('dashboard')}
          onLogin={() => navigateTo('login')}
        />
      )}
      {view === 'results' && result && <ResultsPage result={result} onReset={handleReset} user={user} onLogin={() => navigateTo('login')} onDashboard={user ? handleDashboard : null} />}
      {view === 'brand_results' && brandResult && !brandResult.identity_mismatch && (
        <BrandCheckResultsPage result={brandResult} onReset={handleReset} user={user} onLogin={() => navigateTo('login')} onDashboard={user ? handleDashboard : null} />
      )}
      {view === 'brand_results' && brandResult?.identity_mismatch && (
        <IdentityMismatchPage result={brandResult} onReset={handleReset} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
