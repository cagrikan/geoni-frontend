import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { LanguageProvider, useLanguage } from './lib/LanguageContext'
import { ThemeProvider } from './lib/ThemeContext'
import LandingPage from './LandingPage'
import ScanningScreen from './components/ScanningScreen'
import ResultsPage from './ResultsPage'
import BrandCheckResultsPage from './BrandCheckResultsPage'
import IdentityMismatchPage from './IdentityMismatchPage'
import './App.css'

// Giris/panel sayfalari sadece giris yapmis kullanicilar (ve AdminPage
// sadece adminler) tarafindan ziyaret ediliyor - anonim bir ziyaretcinin
// ilk yuklemede bunlarin kodunu indirmesine gerek yok. Lazy-load ile ana
// bundle kuculuyor, bu sayfalar sadece gerektiginde ayri parca olarak cekiliyor.
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  )
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

// Ilk ziyarette (first-touch) UTM/referrer bilgisini yakalar - sadece bir
// kez, sonraki ziyaretlerde uzerine yazilmaz. Kayit olma aninda
// AuthContext bunu profile yazar (bkz. lib/AuthContext.jsx).
function captureAcquisition() {
  try {
    if (localStorage.getItem('geoni_acq_captured')) return
    const params = new URLSearchParams(window.location.search)
    const data = {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      signup_referrer: document.referrer || null,
    }
    if (data.utm_source || data.utm_medium || data.utm_campaign || data.signup_referrer) {
      localStorage.setItem('geoni_acquisition', JSON.stringify(data))
    }
    localStorage.setItem('geoni_acq_captured', '1')
  } catch { /* localStorage erisimi engellenmis olabilir - sessizce gec */ }
}

// geoni.ai'daki "Satın Alın" gibi linkler /dashboard?tab=credits ile gelir.
// Giris yapmamis kullanici once /login'e yonlendigi icin bu query string
// navigateTo('dashboard') ile silinir - localStorage'a alip DashboardPage'de
// tuketiyoruz ki giris sonrasi da dogru sekmede acilsin.
function capturePendingTab() {
  try {
    if (window.location.pathname !== '/dashboard') return
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab) localStorage.setItem('geoni_pending_tab', tab)
    // E-postadaki "Bilete Git" ?ticket=<id> ile gelir; giris yonlendirmesinde
    // kaybolmasin diye sakla, DashboardPage acilinca ilgili bileti acar.
    const ticket = params.get('ticket')
    if (ticket) localStorage.setItem('geoni_pending_ticket', ticket)
    // Rapor sayfasindaki "bu eksigi giderin" koprusu hedefi de tasir -
    // Hizmetler sekmesi acilinca kartlarin hedef alani on-dolu gelir.
    const target = params.get('target')
    if (target) localStorage.setItem('geoni_pending_target', target)
  } catch { /* ignore */ }
}

// geoni.ai'daki on-rapor widget'i "tam skorunu al" derken taradigi domaini
// tasir (?scan_domain=...). Giris tamamlaninca tam tarama otomatik baslar -
// eskiden domain kayboluyor, kullanici bos dashboard'a dusuyordu.
function captureScanDomain() {
  try {
    const params = new URLSearchParams(window.location.search)
    const d = params.get('scan_domain')
    if (d) localStorage.setItem('geoni_pending_scan', JSON.stringify({ type: 'site', domain: d }))
  } catch { /* ignore */ }
}

const SAMPLE_RESULT_BY_LANG = {
  tr: {
    domain: 'ornek-magaza.com',
    score: 68,
    score_breakdown: { index_coverage: 74, authority: 61, freshness: 55, schema: 82, ai_access: 88, engagement: 63, brand_recall: 71 },
    total_pages: 142,
    indexed_pages: 118,
    platforms: { chatgpt: true, anthropic: true, google: false },
    top_topics: [
      { topic: 'Kurumsal Sürdürülebilirlik Raporlaması', platforms: ['chatgpt', 'claude'] },
      { topic: 'B2B E-ticaret Entegrasyonları', platforms: ['chatgpt', 'claude', 'gemini'] },
      { topic: 'Lojistik ve Tedarik Zinciri Danışmanlığı', platforms: ['chatgpt'] },
      { topic: 'Kurumsal Satın Alma Süreçleri', platforms: ['claude'] },
    ],
    sov: {
      checked: true, score: 33.3, mention_count: 1, query_count: 3,
      engines_used: ['perplexity', 'google'], custom_queries_used: false, own_cited_count: 1,
      queries: [
        { query: 'Türkiye\'de en iyi B2B e-ticaret çözümü sunanlar kimler?', mentioned: true, engines: { perplexity: { answered: true, mentioned: true }, google: { answered: true, mentioned: false } } },
        { query: 'Kurumsal tedarik zinciri yazılımı için hangi firmayı önerirsin?', mentioned: false, engines: { perplexity: { answered: true, mentioned: false }, google: { answered: true, mentioned: false } } },
        { query: 'Lojistik danışmanlığında öne çıkan markalar hangileri?', mentioned: false, engines: { perplexity: { answered: true, mentioned: false }, google: { answered: true, mentioned: false } } },
      ],
      competitors: [ { name: 'Rakip A', mentions: 3 }, { name: 'Rakip B', mentions: 2 }, { name: 'Rakip C', mentions: 1 } ],
      sources: [ { domain: 'ecommercedb.com', mentions: 3, own: false }, { domain: 'ornek-magaza.com', mentions: 1, own: true }, { domain: 'webrazzi.com', mentions: 1, own: false } ],
    },
    opportunities: [
      { topic: 'Yapay Zeka Destekli Envanter Yönetimi', platforms: [], competitors: ['rakip-a.com', 'rakip-b.com'] },
      { topic: 'Sürdürülebilir Ambalaj Çözümleri', platforms: [], competitors: ['rakip-c.com'] },
      { topic: 'Uluslararası Nakliye Optimizasyonu', platforms: [], competitors: ['rakip-a.com', 'rakip-d.com'] },
      { topic: 'Perakende Analitik Platformları', platforms: [], competitors: ['rakip-b.com'] },
    ],
  },
  en: {
    domain: 'example-store.com',
    score: 68,
    score_breakdown: { index_coverage: 74, authority: 61, freshness: 55, schema: 82, ai_access: 88, engagement: 63, brand_recall: 71 },
    total_pages: 142,
    indexed_pages: 118,
    platforms: { chatgpt: true, anthropic: true, google: false },
    top_topics: [
      { topic: 'Corporate Sustainability Reporting', platforms: ['chatgpt', 'claude'] },
      { topic: 'B2B E-commerce Integrations', platforms: ['chatgpt', 'claude', 'gemini'] },
      { topic: 'Logistics and Supply Chain Consulting', platforms: ['chatgpt'] },
      { topic: 'Corporate Procurement Processes', platforms: ['claude'] },
    ],
    sov: {
      checked: true, score: 33.3, mention_count: 1, query_count: 3,
      engines_used: ['perplexity', 'google'], custom_queries_used: false, own_cited_count: 1,
      queries: [
        { query: 'Who are the best B2B e-commerce solution providers?', mentioned: true, engines: { perplexity: { answered: true, mentioned: true }, google: { answered: true, mentioned: false } } },
        { query: 'Which company would you recommend for enterprise supply chain software?', mentioned: false, engines: { perplexity: { answered: true, mentioned: false }, google: { answered: true, mentioned: false } } },
        { query: 'Which brands stand out in logistics consulting?', mentioned: false, engines: { perplexity: { answered: true, mentioned: false }, google: { answered: true, mentioned: false } } },
      ],
      competitors: [ { name: 'Competitor A', mentions: 3 }, { name: 'Competitor B', mentions: 2 }, { name: 'Competitor C', mentions: 1 } ],
      sources: [ { domain: 'ecommercedb.com', mentions: 3, own: false }, { domain: 'example-store.com', mentions: 1, own: true }, { domain: 'retaildive.com', mentions: 1, own: false } ],
    },
    opportunities: [
      { topic: 'AI-Powered Inventory Management', platforms: [], competitors: ['competitor-a.com', 'competitor-b.com'] },
      { topic: 'Sustainable Packaging Solutions', platforms: [], competitors: ['competitor-c.com'] },
      { topic: 'International Shipping Optimization', platforms: [], competitors: ['competitor-a.com', 'competitor-d.com'] },
      { topic: 'Retail Analytics Platforms', platforms: [], competitors: ['competitor-b.com'] },
    ],
  },
}

function AppInner() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const { t, language } = useLanguage()

  useEffect(() => {
    document.title = t('page_title')
    document.documentElement.lang = language
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', t('page_description'))
  }, [language])

  useEffect(() => { captureAcquisition(); capturePendingTab(); captureScanDomain() }, [])

  // Login oncesi doldurulmus kisi/marka formu: giris tamamlaninca tarama
  // otomatik baslar - kullanici login duvarindan sonra her seyi bastan
  // doldurmak zorunda kalmaz (bkz. form-kaybi geri bildirimi).
  useEffect(() => {
    if (!user) return
    try {
      const raw = localStorage.getItem('geoni_pending_scan')
      if (!raw) return
      localStorage.removeItem('geoni_pending_scan')
      const payload = JSON.parse(raw)
      if (payload?.type === 'site' && payload.domain) {
        // Site taramasi: geoni.ai widget'i ya da login duvarindan gelen form
        handleAudit(payload.domain, payload.email, !!payload.private)
      } else if (payload && payload.name) {
        handleBrandCheck(payload)
      }
    } catch { /* bozuk kayit - sessizce yok say */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const [view, setView] = useState(() => {
    if (window.location.pathname === '/auth/callback') return 'auth_callback'
    if (window.location.pathname === '/dashboard') return 'dashboard'
    if (window.location.pathname === '/admin') return 'admin'
    if (window.location.pathname === '/login') return 'login'
    return 'landing'
  })
  const [result, setResult] = useState(null)
  const [brandResult, setBrandResult] = useState(null)
  const [error, setError] = useState(null)
  const [isSample, setIsSample] = useState(false)
  const [isPrivateResult, setIsPrivateResult] = useState(false)
  const [scanKind, setScanKind] = useState('site')
  const [scanTarget, setScanTarget] = useState('')
  const [statusKey, setStatusKey] = useState('queued')
  const [progressLog, setProgressLog] = useState([])

  // Sync URL with view
  useEffect(() => {
    const path = window.location.pathname
    if (path === '/auth/callback') setView('auth_callback')
    else if (path === '/dashboard') setView(user ? 'dashboard' : 'login')
    else if (path === '/admin') setView(user ? 'admin' : 'login')
    else if (path === '/login') setView('login')
  }, [user])

  // Tarayici geri/ileri tuslari: sonuc/ornek/yukleme ekranlarindan her zaman
  // guvenle landing'e donebilmek icin (bkz. "ornek rapordan geri gelemiyorum").
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      if (path === '/auth/callback') { setView('auth_callback'); return }
      if (path === '/dashboard') { setView(user ? 'dashboard' : 'login'); return }
      if (path === '/admin') { setView(user ? 'admin' : 'login'); return }
      if (path === '/login') { setView('login'); return }
      setResult(null); setBrandResult(null); setError(null); setIsSample(false)
      setView('landing')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [user])

  const navigateTo = (v) => {
    setView(v)
    const paths = { dashboard: '/dashboard', admin: '/admin', login: '/login', landing: '/', results: '/', brand_results: '/' }
    window.history.pushState({}, '', paths[v] || '/')
  }

  // loading/results/sample gibi view degisikliklerinde de bir history kaydi
  // birakir, boylece tarayci geri tusu her zaman bir onceki adima doner.
  const pushView = (v) => { setView(v); window.history.pushState({}, '', '/') }

  const [lastJobId, setLastJobId] = useState(null)

  // Tarama "nesli": her yeni tarama/iptal bunu artirir. Suren poll dongusu,
  // kendi nesli hala guncel degilse sonucu UYGULAMAZ ve view degistirmez.
  // Boylece (a) "Vazgec" sonrasi eski dongu kullaniciyi eski sonuca fırlatmaz,
  // (b) ust uste iki tarama yarismaz (yanlis jobId ile paylasim linki uretmez).
  const scanGenRef = useRef(0)

  const pollAuditJob = async (jobId, gen) => {
    let errStreak = 0
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      if (scanGenRef.current !== gen) return  // iptal edildi / yeni tarama basladi
      try {
        const res = await fetch(`${API_URL}/api/audit/${jobId}`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || t('error_audit_failed'))
        const data = await res.json()
        errStreak = 0
        if (scanGenRef.current !== gen) return
        if (data.status === 'complete') { setResult(data.result); setLastJobId(jobId); pushView('results'); if (refreshProfile) refreshProfile(); return }
        if (data.status === 'failed') { setError(t('error_audit_failed')); pushView('landing'); return }
        setStatusKey(data.status)
      } catch (err) {
        // Gecici ag hatasi (Wi-Fi->4G, tek 502) taramayi OLDURMESIN: is arka
        // planda suruyor, kredi dusuldu. 4 ardisik hataya kadar tolere et.
        if (++errStreak >= 4) { if (scanGenRef.current === gen) { setError(err.message); pushView('landing') } return }
      }
    }
    if (scanGenRef.current === gen) { setError(t('error_audit_timeout')); pushView('landing') }
  }

  const pollBrandJob = async (jobId, entityType, gen) => {
    let errStreak = 0
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 2000))
      if (scanGenRef.current !== gen) return
      try {
        const res = await fetch(`${API_URL}/api/brand-check/${jobId}`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || t('error_query_failed'))
        const data = await res.json()
        errStreak = 0
        if (scanGenRef.current !== gen) return
        if (data.status === 'complete') { setBrandResult({ ...data.result, type: entityType }); setLastJobId(jobId); pushView('brand_results'); if (refreshProfile) refreshProfile(); return }
        if (data.status === 'failed') { setError(t('error_query_failed')); pushView('landing'); return }
      } catch (err) {
        if (++errStreak >= 4) { if (scanGenRef.current === gen) { setError(err.message); pushView('landing') } return }
      }
    }
    if (scanGenRef.current === gen) { setError(t('error_query_timeout')); pushView('landing') }
  }

  const handleAudit = async (domain, email, isPrivate = false, customQueries = null) => {
    setError(null); setIsSample(false); setIsPrivateResult(isPrivate); setScanKind('site'); setScanTarget(domain); setStatusKey('queued'); setProgressLog([])
    const gen = ++scanGenRef.current
    pushView('loading')
    try {
      const session = (await import('./lib/supabase')).supabase.auth.getSession ? await (await import('./lib/supabase')).supabase.auth.getSession() : null
      const token = session?.data?.session?.access_token || ''
      const res = await fetch(`${API_URL}/api/audit/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ domain, email: email || user?.email || 'anonymous@geoni.ai', competitors: [], lang: language, private: isPrivate, custom_queries: customQueries }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || t('error_request_failed'))
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
      await pollAuditJob(jobId, gen)
      es?.close()
    } catch (err) { setError(err.message || t('error_connection')); pushView('landing') }
  }

  const handleBrandCheck = async (payload) => {
    setError(null); setIsPrivateResult(!!payload.private); setScanKind('brand'); setScanTarget(payload.name); setProgressLog([])
    const gen = ++scanGenRef.current
    pushView('loading')
    try {
      const session2 = (await import('./lib/supabase')).supabase.auth.getSession ? await (await import('./lib/supabase')).supabase.auth.getSession() : null
      const token2 = session2?.data?.session?.access_token || ''
      const res = await fetch(`${API_URL}/api/brand-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token2 ? { 'Authorization': `Bearer ${token2}` } : {}) },
        body: JSON.stringify({ ...payload, email: payload.email || user?.email || 'anonymous@geoni.ai', lang: language }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || t('error_request_failed'))
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
      await pollBrandJob(data.job_id, payload.type, gen)
      es?.close()
    } catch (err) { setError(err.message || t('error_connection')); pushView('landing') }
  }

  const handleSocialCheck = async ({ handle, niche, email }) => {
    // Anonim sosyal gorunurluk taramasi (giris gerekmez). /api/social-check
    // marka-recall motorunu @handle + nis ile calistirir; sonuc brand-check
    // sekliyle doner, ayni ekranlarda gosterilir.
    setError(null); setIsPrivateResult(false); setScanKind('brand'); setScanTarget('@' + handle); setProgressLog([])
    const gen = ++scanGenRef.current
    pushView('loading')
    try {
      const res = await fetch(`${API_URL}/api/social-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, niche, email, lang: language }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || t('error_request_failed'))
      const data = await res.json()
      let es
      try {
        es = new EventSource(`${API_URL}/api/brand-check/${data.job_id}/stream`)
        es.onmessage = (evt) => {
          try { const p = JSON.parse(evt.data); if (p.message) setProgressLog(prev => [...prev, p.message]); if (p.done) es.close() } catch { /* ignore */ }
        }
        es.onerror = () => es.close()
      } catch { /* polling yeterli */ }
      await pollBrandJob(data.job_id, 'brand', gen)
      es?.close()
    } catch (err) { setError(err.message || t('error_connection')); pushView('landing') }
  }

  const handleReset = () => { scanGenRef.current++; setResult(null); setBrandResult(null); setError(null); setIsSample(false); setIsPrivateResult(false); navigateTo('landing') }

  const handleViewSample = () => {
    setError(null); setIsSample(true); setIsPrivateResult(false)
    setResult({ ...SAMPLE_RESULT_BY_LANG[language] || SAMPLE_RESULT_BY_LANG.tr, created_at: new Date().toISOString() })
    pushView('results')
  }

  const handleViewAudit = (audit) => {
    const resultJson = audit.result_json
    if (!resultJson) return
    setIsPrivateResult(false)
    if (audit.type === 'web') {
      // Ensure domain audit result has required fields
      setResult({ ...resultJson, domain: audit.domain || resultJson.domain })
      pushView('results')
    } else {
      // Ensure brand check result has required fields
      setBrandResult({
        ...resultJson,
        type: audit.type || resultJson.type || 'person',
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
      <Suspense fallback={<PageFallback />}>
        {view === 'auth_callback' && <AuthCallback onDone={navigateTo} />}
        {view === 'login' && <LoginPage onSuccess={() => navigateTo('dashboard')} onHome={() => navigateTo('landing')} />}
        {view === 'dashboard' && <DashboardPage onReset={handleReset} onNewScan={() => navigateTo('landing')} onViewAudit={handleViewAudit} onRescanWeb={handleAudit} onRescanBrand={handleBrandCheck} onAdmin={profile?.is_admin ? () => navigateTo('admin') : null} />}
        {view === 'admin' && <AdminPage onBack={() => navigateTo('dashboard')} />}
      </Suspense>
      {view === 'landing' && (
        <LandingPage
          onSubmitAudit={handleAudit}
          onSubmitBrandCheck={handleBrandCheck}
          onSubmitSocial={handleSocialCheck}
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
      {view === 'results' && result && <ResultsPage result={result} jobId={isPrivateResult || isSample ? null : lastJobId} onReset={handleReset} user={user} onLogin={() => navigateTo('login')} onDashboard={user ? handleDashboard : null} isPro={isSample || profile?.is_admin || (profile?.credit_balance > 0 && profile?.total_credits_purchased > 0)} isSample={isSample} isPrivate={isPrivateResult} />}
      {view === 'brand_results' && brandResult && !brandResult.identity_mismatch && (
        <BrandCheckResultsPage result={brandResult} jobId={isPrivateResult ? null : lastJobId} onReset={handleReset} user={user} onLogin={() => navigateTo('login')} onDashboard={user ? handleDashboard : null} isPro={profile?.is_admin || (profile?.credit_balance > 0 && profile?.total_credits_purchased > 0)} isPrivate={isPrivateResult} />
      )}
      {view === 'brand_results' && brandResult?.identity_mismatch && (
        <IdentityMismatchPage result={brandResult} onReset={handleReset} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
