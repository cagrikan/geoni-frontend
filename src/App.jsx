import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LandingPage from './LandingPage'
import ScanningScreen from './components/ScanningScreen'
import ResultsPage from './ResultsPage'
import BrandCheckResultsPage from './BrandCheckResultsPage'
import IdentityMismatchPage from './IdentityMismatchPage'
import LoginPage from './pages/LoginPage'
import AuthCallback from './pages/AuthCallback'
import DashboardPage from './pages/DashboardPage'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

const SAMPLE_RESULT = {
  domain: 'ornek-magaza.com',
  score: 68,
  score_breakdown: {
    index_coverage: 74,
    authority: 61,
    freshness: 55,
    schema: 82,
    engagement: 63,
    brand_recall: 71,
  },
  total_pages: 142,
  indexed_pages: 118,
  platforms: { chatgpt: true, anthropic: true, google: false },
  top_topics: [
    { topic: 'Kurumsal Sürdürülebilirlik Raporlaması', platforms: ['chatgpt', 'claude'] },
    { topic: 'B2B E-ticaret Entegrasyonları', platforms: ['chatgpt', 'claude', 'gemini'] },
    { topic: 'Lojistik ve Tedarik Zinciri Danışmanlığı', platforms: ['chatgpt'] },
    { topic: 'Kurumsal Satın Alma Süreçleri', platforms: ['claude'] },
  ],
  opportunities: [
    { topic: 'Yapay Zeka Destekli Envanter Yönetimi', platforms: [], competitors: ['rakip-a.com', 'rakip-b.com'] },
    { topic: 'Sürdürülebilir Ambalaj Çözümleri', platforms: [], competitors: ['rakip-c.com'] },
    { topic: 'Uluslararası Nakliye Optimizasyonu', platforms: [], competitors: ['rakip-a.com', 'rakip-d.com'] },
    { topic: 'Perakende Analitik Platformları', platforms: [], competitors: ['rakip-b.com'] },
  ],
  created_at: new Date().toISOString(),
}

function AppInner() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [view, setView] = useState(() => {
    if (window.location.pathname === '/auth/callback') return 'auth_callback'
    if (window.location.pathname === '/dashboard') return 'dashboard'
    if (window.location.pathname === '/login') return 'login'
    return 'landing'
  })
  const [result, setResult] = useState(null)
  const [brandResult, setBrandResult] = useState(null)
  const [error, setError] = useState(null)
  const [isSample, setIsSample] = useState(false)
  const [scanKind, setScanKind] = useState('site')
  const [scanTarget, setScanTarget] = useState('')
  const [statusKey, setStatusKey] = useState('queued')
  const [progressLog, setProgressLog] = useState([])

  // Sync URL with view
  useEffect(() => {
    const path = window.location.pathname
    if (path === '/auth/callback') setView('auth_callback')
    else if (path === '/dashboard') setView(user ? 'dashboard' : 'login')
    else if (path === '/login') setView('login')
  }, [user])

  // Tarayici geri/ileri tuslari: sonuc/ornek/yukleme ekranlarindan her zaman
  // guvenle landing'e donebilmek icin (bkz. "ornek rapordan geri gelemiyorum").
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      if (path === '/auth/callback') { setView('auth_callback'); return }
      if (path === '/dashboard') { setView(user ? 'dashboard' : 'login'); return }
      if (path === '/login') { setView('login'); return }
      setResult(null); setBrandResult(null); setError(null); setIsSample(false)
      setView('landing')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [user])

  const navigateTo = (v) => {
    setView(v)
    const paths = { dashboard: '/dashboard', login: '/login', landing: '/', results: '/', brand_results: '/' }
    window.history.pushState({}, '', paths[v] || '/')
  }

  // loading/results/sample gibi view degisikliklerinde de bir history kaydi
  // birakir, boylece tarayci geri tusu her zaman bir onceki adima doner.
  const pushView = (v) => { setView(v); window.history.pushState({}, '', '/') }

  const pollAuditJob = async (jobId) => {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      try {
        const res = await fetch(`${API_URL}/api/audit/${jobId}`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Tarama başarısız')
        const data = await res.json()
        if (data.status === 'complete') { setResult(data.result); pushView('results'); if (refreshProfile) refreshProfile(); return }
        if (data.status === 'failed') throw new Error('Tarama başarısız')
        setStatusKey(data.status)
      } catch (err) { setError(err.message); pushView('landing'); return }
    }
    setError('Tarama zaman aşımına uğradı.'); pushView('landing')
  }

  const pollBrandJob = async (jobId) => {
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await fetch(`${API_URL}/api/brand-check/${jobId}`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Sorgu başarısız')
        const data = await res.json()
        if (data.status === 'complete') { setBrandResult(data.result); pushView('brand_results'); if (refreshProfile) refreshProfile(); return }
        if (data.status === 'failed') throw new Error('Sorgu başarısız')
      } catch (err) { setError(err.message); pushView('landing'); return }
    }
    setError('Sorgu zaman aşımına uğradı.'); pushView('landing')
  }

  const handleAudit = async (domain, email) => {
    setError(null); setIsSample(false); setScanKind('site'); setScanTarget(domain); setStatusKey('queued'); setProgressLog([])
    pushView('loading')
    try {
      const session = (await import('./lib/supabase')).supabase.auth.getSession ? await (await import('./lib/supabase')).supabase.auth.getSession() : null
      const token = session?.data?.session?.access_token || ''
      const res = await fetch(`${API_URL}/api/audit/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ domain, email: email || user?.email || 'anonymous@geoni.ai', competitors: [] }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'İstek başarısız')
      const jobId = (await res.json()).job_id
      let es
      try {
        es = new EventSource(`${API_URL}/api/audit/${jobId}/stream`)
        es.onmessage = (evt) => {
          try {
            const parsed = JSON.parse(evt.data)
            if (parsed.message) setProgressLog(prev => [...prev, parsed.message])
            if (parsed.done) es.close()
          } catch { /* ignore malformed event */ }
        }
        es.onerror = () => es.close()
      } catch { /* EventSource desteklenmiyorsa polling zaten yeterli */ }
      await pollAuditJob(jobId)
      es?.close()
    } catch (err) { setError(err.message || 'Bağlantı hatası'); pushView('landing') }
  }

  const handleBrandCheck = async (payload) => {
    setError(null); setScanKind('brand'); setScanTarget(payload.name); setProgressLog([])
    pushView('loading')
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
        pushView('brand_results'); return
      }
      // Canlı model-bazli ilerleme (SSE) — sadece progressLog'u besler,
      // is tamamlanma karari hala pollBrandJob'daki polling'de.
      let es
      try {
        es = new EventSource(`${API_URL}/api/brand-check/${data.job_id}/stream`)
        es.onmessage = (evt) => {
          try {
            const parsed = JSON.parse(evt.data)
            if (parsed.message) {
              setProgressLog(prev => [...prev, parsed.message])
            }
            if (parsed.done) es.close()
          } catch { /* ignore malformed event */ }
        }
        es.onerror = () => es.close()
      } catch { /* EventSource desteklenmiyorsa polling zaten yeterli */ }
      await pollBrandJob(data.job_id)
      es?.close()
    } catch (err) { setError(err.message || 'Bağlantı hatası'); pushView('landing') }
  }

  const handleReset = () => { setResult(null); setBrandResult(null); setError(null); setIsSample(false); navigateTo('landing') }

  const handleViewSample = () => { setError(null); setIsSample(true); setResult(SAMPLE_RESULT); pushView('results') }

  const handleViewAudit = (audit) => {
    const resultJson = audit.result_json
    if (!resultJson) return
    if (audit.type === 'web') {
      // Ensure domain audit result has required fields
      setResult({ ...resultJson, domain: audit.domain || resultJson.domain })
      pushView('results')
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
      pushView('brand_results')
    }
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
      {view === 'landing' && (
        <LandingPage
          onSubmitAudit={handleAudit}
          onSubmitBrandCheck={handleBrandCheck}
          error={error}
          user={user}
          onDashboard={() => navigateTo('dashboard')}
          onLogin={() => navigateTo('login')}
          onViewSample={handleViewSample}
        />
      )}
      {view === 'loading' && (
        <ScanningScreen
          kind={scanKind}
          target={scanTarget}
          statusKey={statusKey}
          progressLog={progressLog}
          onCancel={handleReset}
        />
      )}
      {view === 'results' && result && <ResultsPage result={result} onReset={handleReset} user={user} onLogin={() => navigateTo('login')} onDashboard={user ? handleDashboard : null} isPro={!isSample && (profile?.is_admin || (profile?.credit_balance > 0 && profile?.total_credits_purchased > 0))} isSample={isSample} />}
      {view === 'brand_results' && brandResult && !brandResult.identity_mismatch && (
        <BrandCheckResultsPage result={brandResult} onReset={handleReset} user={user} onLogin={() => navigateTo('login')} onDashboard={user ? handleDashboard : null} isPro={profile?.is_admin || (profile?.credit_balance > 0 && profile?.total_credits_purchased > 0)} />
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
