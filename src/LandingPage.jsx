import { useState, useEffect } from 'react'
import { Globe, User, Building2, ScanSearch, GitCompareArrows, Award } from 'lucide-react'
import GeoniMark from './GeoniMark'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

const MODE_TABS = [
  { key: 'site', icon: Globe, title: 'Web Sitesi' },
  { key: 'person', icon: User, title: 'Kişi' },
  { key: 'brand', icon: Building2, title: 'Marka / Şirket' },
]

const HOW_STEPS = [
  { icon: ScanSearch, title: 'Sorgula', desc: 'Sitenizi tarar, adınızı veya markanızı Claude, ChatGPT, Gemini ve Perplexity\'ye gerçek zamanlı sorarız.' },
  { icon: GitCompareArrows, title: 'Karşılaştır', desc: 'Yanıtları web\'deki gerçek verilerle karşılaştırır, doğruluğunu ve rakiplerinize kıyasla konumunuzu ölçeriz.' },
  { icon: Award, title: 'Puanla', desc: '0-100 arası AI Görünürlük Skoru, güçlü olduğunuz konular ve kaçırdığınız fırsatları somut biçimde sunarız.' },
]

const OPT = <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:'.8em'}}>(isteğe bağlı)</span>

const SITE_LAST_STEP = 1
const PERSON_LAST_STEP = 3
const BRAND_LAST_STEP = 2

export default function LandingPage({ onSubmitAudit, onSubmitBrandCheck, loading = false, statusText = '', error, user, onDashboard, onLogin, onViewSample }) {
  const [mode, setMode] = useState('site') // 'site' | 'person' | 'brand'
  const [step, setStep] = useState(0)
  const [scanCount, setScanCount] = useState(0)

  const changeMode = (key) => { setMode(key); setStep(0) }

  useEffect(() => {
    fetch(`${API_URL}/api/stats/scan-count`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.count && setScanCount(d.count))
      .catch(() => {})
  }, [])

  // site
  const [domain, setDomain]     = useState('')
  const [siteEmail, setSiteEmail] = useState('')

  // person
  const [personName, setPersonName]         = useState('')
  const [personRole, setPersonRole]         = useState('')
  const [personCompany, setPersonCompany]   = useState('')
  const [personCity, setPersonCity]         = useState('')
  const [personTopic, setPersonTopic]       = useState('')
  const [personLinkedin, setPersonLinkedin] = useState('')
  const [personEmail, setPersonEmail]       = useState('')

  // brand
  const [brandName, setBrandName]     = useState('')
  const [brandSector, setBrandSector] = useState('')
  const [brandCity, setBrandCity]     = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [brandEmail, setBrandEmail]   = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'site') {
      if (step === 0 && !domain) return
      if (step < SITE_LAST_STEP) { setStep(s => s + 1); return }
      if (!domain || !siteEmail) return
      onSubmitAudit(domain, siteEmail)
    } else if (mode === 'person') {
      if (step === 0 && !personName) return
      if (step < PERSON_LAST_STEP) { setStep(s => s + 1); return }
      onSubmitBrandCheck({
        type: 'person',
        name: personName,
        role: personRole,
        company: personCompany,
        location: personCity,
        topic: personTopic,
        linkedin_url: personLinkedin,
        email: personEmail || 'anonymous@geoni.ai',
      })
    } else {
      if (step === 0 && !brandName) return
      if (step < BRAND_LAST_STEP) { setStep(s => s + 1); return }
      onSubmitBrandCheck({
        type: 'brand',
        name: brandName,
        sector: brandSector,
        location: brandCity,
        website: brandWebsite,
        email: brandEmail || 'anonymous@geoni.ai',
      })
    }
  }

  const WizardProgress = ({ total }) => (
    <div className="wizard-progress">
      <span className="wizard-progress__count">Adım {step + 1}/{total + 1}</span>
      <div className="wizard-progress__dots">
        {Array.from({ length: total + 1 }).map((_, i) => (
          <span key={i} className={`wizard-dot ${i <= step ? 'wizard-dot--active' : ''}`} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="landing">
      <header className="landing__nav">
        <div className="landing__brand">
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </div>
        <div className="nav-auth">
          {user ? (
            <button className="nav-dashboard-btn" onClick={onDashboard}>Dashboard</button>
          ) : (
            <>
              <button className="nav-login-btn" onClick={onLogin}>Giriş Yap</button>
              <button className="nav-dashboard-btn" onClick={onLogin}>Ücretsiz Başla</button>
            </>
          )}
        </div>
      </header>

      {/* ══ HERO: tek sütun, ortalanmış, tek odak noktası ══ */}
      <section className="hero-centered">
        <p className="landing__eyebrow">AI Görünürlük Taraması</p>
        <h1 className="landing__headline landing__headline--center">
          Rakibiniz her AI yanıtında var.
          <br />
          <em>Siz yoksunuz.</em>
        </h1>
        <p className="hero-centered__subhead">
          ChatGPT, Claude, Gemini ve Perplexity artık kaynakça değil, tek bir yanıt veriyor.
          GEONI, bu dört motordaki görünürlüğünüzü ölçüp somut bir yol haritası çıkarır.
        </p>

        {onViewSample && (
          <button type="button" className="sample-report-btn" onClick={onViewSample}>
            Örnek bir rapor gör →
          </button>
        )}

        <div className="scan-panel">
          <div className="mode-tabs">
            {MODE_TABS.map(({ key, icon: Icon, title }) => (
              <button
                key={key}
                type="button"
                className={`mode-tab ${mode === key ? 'mode-tab--active' : ''}`}
                onClick={() => changeMode(key)}
              >
                <Icon size={16} strokeWidth={1.5} />
                {title}
              </button>
            ))}
          </div>

          <form className="landing__form" onSubmit={handleSubmit}>

            {/* ── WEB SİTESİ (2 adımlı wizard, diğer modlarla tutarlı) ── */}
            {mode === 'site' && (
              <>
                <WizardProgress total={SITE_LAST_STEP} />

                {step === 0 && (
                  <div className="landing__field landing__field--hero">
                    <label htmlFor="domain">Web sitesi</label>
                    <input id="domain" type="text" placeholder="firmaniz.com" value={domain} onChange={e => setDomain(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}
                {step === 1 && (
                  <div className="landing__field">
                    <label htmlFor="site-email">E-posta</label>
                    <input id="site-email" type="email" placeholder="ad@firmaniz.com" value={siteEmail} onChange={e => setSiteEmail(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}

                <div className="wizard-nav">
                  {step > 0 && <button type="button" className="wizard-back" onClick={() => setStep(s => s - 1)}>← Geri</button>}
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : step < SITE_LAST_STEP ? 'İleri →' : 'Ücretsiz Taramayı Başlat'}
                  </button>
                </div>
              </>
            )}

            {/* ── KİŞİ (4 adımlı wizard) ── */}
            {mode === 'person' && (
              <>
                <WizardProgress total={PERSON_LAST_STEP} />

                {step === 0 && (
                  <div className="landing__field landing__field--hero">
                    <label htmlFor="person-name">Ad Soyad</label>
                    <input id="person-name" type="text" placeholder="Ahmet Yılmaz" value={personName} onChange={e => setPersonName(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}
                {step === 1 && (
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="person-role">Unvan / Rol {OPT}</label>
                      <input id="person-role" type="text" placeholder="CTO, Avukat, Milletvekili..." value={personRole} onChange={e => setPersonRole(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-company">Şirket {OPT}</label>
                      <input id="person-company" type="text" placeholder="ARD Grup, Geoni.ai..." value={personCompany} onChange={e => setPersonCompany(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="person-city">Şehir {OPT}</label>
                      <input id="person-city" type="text" placeholder="Ankara" value={personCity} onChange={e => setPersonCity(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-topic">Konu / Alan {OPT}</label>
                      <input id="person-topic" type="text" placeholder="dijital dönüşüm, siyaset..." value={personTopic} onChange={e => setPersonTopic(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <>
                    <div className="landing__field">
                      <label htmlFor="person-linkedin">LinkedIn URL {OPT}</label>
                      <input id="person-linkedin" type="url" placeholder="https://linkedin.com/in/..." value={personLinkedin} onChange={e => setPersonLinkedin(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-email">E-posta {OPT}</label>
                      <input id="person-email" type="email" placeholder="ad@firmaniz.com" value={personEmail} onChange={e => setPersonEmail(e.target.value)} disabled={loading} />
                    </div>
                  </>
                )}

                <div className="wizard-nav">
                  {step > 0 && <button type="button" className="wizard-back" onClick={() => setStep(s => s - 1)}>← Geri</button>}
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : step < PERSON_LAST_STEP ? 'İleri →' : 'AI\'da Beni Ara'}
                  </button>
                </div>
              </>
            )}

            {/* ── MARKA / ŞİRKET (3 adımlı wizard) ── */}
            {mode === 'brand' && (
              <>
                <WizardProgress total={BRAND_LAST_STEP} />

                {step === 0 && (
                  <div className="landing__field landing__field--hero">
                    <label htmlFor="brand-name">Marka / Şirket Adı</label>
                    <input id="brand-name" type="text" placeholder="Geoni.ai, ARD Grup..." value={brandName} onChange={e => setBrandName(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}
                {step === 1 && (
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="brand-sector">Sektör {OPT}</label>
                      <input id="brand-sector" type="text" placeholder="Teknoloji, Hukuk, Finans..." value={brandSector} onChange={e => setBrandSector(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="brand-city">Şehir {OPT}</label>
                      <input id="brand-city" type="text" placeholder="İstanbul, Ankara..." value={brandCity} onChange={e => setBrandCity(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <>
                    <div className="landing__field">
                      <label htmlFor="brand-website">Web Sitesi {OPT}</label>
                      <input id="brand-website" type="text" placeholder="firmaniz.com" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="brand-email">E-posta {OPT}</label>
                      <input id="brand-email" type="email" placeholder="ad@firmaniz.com" value={brandEmail} onChange={e => setBrandEmail(e.target.value)} disabled={loading} />
                    </div>
                  </>
                )}

                <div className="wizard-nav">
                  {step > 0 && <button type="button" className="wizard-back" onClick={() => setStep(s => s - 1)}>← Geri</button>}
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : step < BRAND_LAST_STEP ? 'İleri →' : 'Markamı Sorgula'}
                  </button>
                </div>
              </>
            )}

          </form>

          {error && <p className="landing__error">{error}</p>}
        </div>

        <p className="landing__trust">
          {scanCount > 0 && <>{scanCount.toLocaleString('tr-TR')}+ tarama tamamlandı ·{' '}</>}
          Kredi kartı gerekmez · Sonuç ~30 saniyede hazır
        </p>
      </section>

      {/* ══ NASIL ÇALIŞIR: tam genişlik, 3 sütun ══ */}
      <section className="how-band">
        <p className="landing__how-eyebrow">Süreç</p>
        <h2 className="landing__how-title-main">Nasıl çalışır</h2>
        <div className="how-grid">
          {HOW_STEPS.map(({ icon: Icon, title, desc }) => (
            <div className="how-col" key={title}>
              <span className="how-col__icon"><Icon size={20} strokeWidth={1.5} /></span>
              <h3 className="how-col__title">{title}</h3>
              <p className="how-col__desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
