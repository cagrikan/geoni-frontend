import { useState, useEffect, useRef } from 'react'
import { Globe, User, Building2, ScanSearch, GitCompareArrows, Award, EyeOff, Wrench, AtSign } from 'lucide-react'
import GeoniMark from './GeoniMark'
import LanguageSwitcher from './components/LanguageSwitcher'
import ThemeSwitcher from './components/ThemeSwitcher'
import { useLanguage } from './lib/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'
// Cloudflare Turnstile (anti-abuse) — public site key.
const TURNSTILE_SITE_KEY = '0x4AAAAAAD4ueQF4cOLzYPy4'

const SITE_LAST_STEP = 1
const PERSON_LAST_STEP = 3
const BRAND_LAST_STEP = 2

export default function LandingPage({ onSubmitAudit, onSubmitBrandCheck, onSubmitSocial, loading = false, statusText = '', error, user, onDashboard, onLogin, onViewSample }) {
  const { t, language } = useLanguage()
  // Worker'i onceden isit: landing ekrani = tarama niyeti. Kullanici formu
  // doldururken worker cold-start'i (0->1) arka planda gecer (backend'de 25sn
  // global cooldown var, spam olmaz).
  useEffect(() => {
    fetch(`${API_URL}/api/prewarm`, { method: 'POST' }).catch(() => {})
  }, [])
  // Slogan havuzu: her sayfa acilisinda rastgele biri (mount basina sabit)
  const [sloganNo] = useState(() => Math.floor(Math.random() * 5) + 1)
  // Sayac gecisi: once 3 sn "AI Gorunurluk Taramasi" gorunur, sonra sayi
  // yumusak gecisle gelir - fetch bitince aninda takas goz tirmaliyordu.
  const [eyelineCountReady, setEyelineCountReady] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setEyelineCountReady(true), 3000)
    return () => clearTimeout(id)
  }, [])
  const [mode, setMode] = useState('site') // 'site' | 'person' | 'brand'
  const [step, setStep] = useState(0)

  // ── Cloudflare Turnstile (anti-abuse) ──────────────────────────────────
  // Managed widget: cogu kullanici gorunmez cozer. Token tarama istegine
  // eklenir (App.jsx -> body.turnstile_token). Yuklenmezse token bos gider;
  // backend SOFT-ALLOW eder (soft rollout) -> mevcut taramalar kirilmaz.
  const turnstileRef = useRef(null)
  const widgetIdRef = useRef(null)
  const turnstileTokenRef = useRef('')
  useEffect(() => {
    let cancelled = false
    let poll = null
    const render = () => {
      if (cancelled || !turnstileRef.current || !window.turnstile) return
      if (widgetIdRef.current !== null) return
      try {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          // Site temasına uydur (yoksa "auto" OS'a bakar → koyu temada beyaz "Başarılı" barı çirkin)
          theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
          callback: (tok) => { turnstileTokenRef.current = tok || '' },
          'error-callback': () => { turnstileTokenRef.current = '' },
          'expired-callback': () => { turnstileTokenRef.current = '' },
        })
      } catch { /* script gec/gelmedi -> soft-allow */ }
    }
    if (window.turnstile) render()
    else poll = setInterval(() => { if (window.turnstile) { clearInterval(poll); render() } }, 300)
    return () => { cancelled = true; if (poll) clearInterval(poll) }
  }, [])
  // Token tek-kullanimlik: gercek tarama gonderildikten sonra widget'i sifirla
  // ki ard arda taramalar taze token alsin.
  const resetTurnstile = () => {
    turnstileTokenRef.current = ''
    try { if (window.turnstile && widgetIdRef.current !== null) window.turnstile.reset(widgetIdRef.current) } catch { /* ignore */ }
  }

  const [scanCount, setScanCount] = useState(0)
  const [isPrivate, setIsPrivate] = useState(false)
  const [showPrivateToast, setShowPrivateToast] = useState(false)

  const togglePrivate = () => {
    setIsPrivate((prev) => {
      const next = !prev
      if (next) {
        setShowPrivateToast(true)
        setTimeout(() => setShowPrivateToast(false), 4500)
      }
      return next
    })
  }

  const MODE_TABS = [
    { key: 'site', icon: Globe, title: t('mode_site') },
    { key: 'person', icon: User, title: t('mode_person') },
    { key: 'brand', icon: Building2, title: t('mode_brand') },
    { key: 'social', icon: AtSign, title: t('mode_social') },
  ]

  const HOW_STEPS = [
    { icon: ScanSearch, title: t('how_step1_title'), desc: t('how_step1_desc') },
    { icon: GitCompareArrows, title: t('how_step2_title'), desc: t('how_step2_desc') },
    { icon: Award, title: t('how_step3_title'), desc: t('how_step3_desc') },
    { icon: Wrench, title: t('how_step4_title'), desc: t('how_step4_desc') },
  ]

  const OPT = <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:'.8em'}}>{t('field_optional')}</span>

  const SITE_STEP_TITLES = ['', t('step_title_contact')]
  const PERSON_STEP_TITLES = ['', t('step_title_profession'), t('step_title_location_expertise'), t('step_title_contact')]
  const BRAND_STEP_TITLES = ['', t('step_title_sector_location'), t('step_title_contact')]

  const changeMode = (key) => { setMode(key); setStep(0) }

  useEffect(() => {
    fetch(`${API_URL}/api/stats/scan-count`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.count && setScanCount(d.count))
      .catch(() => {})
  }, [])

  // AI Görünürlük Ligi (sosyal kanıt + FOMO): AI'ın en iyi tanıdığı siteler.
  const [leaders, setLeaders] = useState([])
  useEffect(() => {
    fetch(`${API_URL}/api/ai-friendly`)
      .then(r => r.ok ? r.json() : null)
      .then(d => Array.isArray(d?.items) && setLeaders(d.items.filter(x => x?.domain && x?.score >= 50).slice(0, 8)))
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

  // social (tek adim, anonim - giris gerekmez, funnel)
  const [socialHandle, setSocialHandle] = useState('')
  const [socialNiche, setSocialNiche]   = useState('')
  const [socialEmail, setSocialEmail]   = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Sosyal: tek adim, ANONIM (giris gerekmez - funnel). Mevcut akislari
    // etkilememek icin en basta ele alinir.
    if (mode === 'social') {
      const h = socialHandle.trim().replace(/^@/, '')
      if (h.length < 2 || !socialEmail.trim()) return
      onSubmitSocial?.({ handle: h, niche: socialNiche.trim(), email: socialEmail.trim(), turnstile_token: turnstileTokenRef.current })
      resetTurnstile()
      return
    }
    if (mode === 'site') {
      if (step === 0 && !domain) return
      if (step < SITE_LAST_STEP) { setStep(s => s + 1); return }
      if (!domain || !siteEmail) return
      if (!user) {
        // Kisi/marka ile ayni desen: anonim tarama hesaba baglanamiyor ve
        // gecmiste gorunmuyordu - form saklanir, giris sonrasi otomatik baslar.
        try { localStorage.setItem('geoni_pending_scan', JSON.stringify({ type: 'site', domain, email: siteEmail, private: isPrivate })) } catch { /* ignore */ }
        onLogin(); return
      }
      onSubmitAudit(domain, siteEmail, isPrivate, null, turnstileTokenRef.current)
      resetTurnstile()
    } else if (mode === 'person') {
      if (step === 0 && !personName) return
      if (step < PERSON_LAST_STEP) { setStep(s => s + 1); return }
      const personPayload = {
        type: 'person',
        name: personName,
        role: personRole,
        company: personCompany,
        location: personCity,
        topic: personTopic,
        linkedin_url: personLinkedin,
        email: personEmail || 'anonymous@geoni.ai',
        private: isPrivate,
      }
      if (!user) {
        // Login'e gitmeden formu sakla - giris sonrasi tarama otomatik baslar,
        // kullanici her seyi bastan doldurmak zorunda kalmaz.
        try { localStorage.setItem('geoni_pending_scan', JSON.stringify(personPayload)) } catch { /* ignore */ }
        onLogin(); return
      }
      onSubmitBrandCheck(personPayload, turnstileTokenRef.current)
      resetTurnstile()
    } else {
      if (step === 0 && !brandName) return
      if (step < BRAND_LAST_STEP) { setStep(s => s + 1); return }
      const brandPayload = {
        type: 'brand',
        name: brandName,
        sector: brandSector,
        location: brandCity,
        website: brandWebsite,
        email: brandEmail || 'anonymous@geoni.ai',
        private: isPrivate,
      }
      if (!user) {
        try { localStorage.setItem('geoni_pending_scan', JSON.stringify(brandPayload)) } catch { /* ignore */ }
        onLogin(); return
      }
      onSubmitBrandCheck(brandPayload, turnstileTokenRef.current)
      resetTurnstile()
    }
  }

  const StepTitle = ({ titles }) => (
    titles[step] ? <h2 className="wizard-step-title">{titles[step]}</h2> : null
  )

  const WizardProgress = ({ total }) => (
    <div className="wizard-progress">
      <span className="wizard-progress__count">{t('wizard_step_count')} {step + 1}/{total + 1}</span>
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
        <button className="landing__brand landing__brand--clickable" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} type="button">
          <GeoniMark />
          <span className="landing__logo">geoni</span>
        </button>
        <div className="nav-auth">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {user ? (
            <button className="nav-dashboard-btn" onClick={onDashboard}>{t('nav_dashboard')}</button>
          ) : (
            <>
              <button className="nav-login-btn" onClick={onLogin}>{t('nav_login')}</button>
              <button className="nav-dashboard-btn" onClick={onLogin}>{t('nav_start_free')}</button>
            </>
          )}
        </div>
      </header>

      {/* ══ GIRIS: form-odakli uygulama sahnesi (onaylanan onizleme, slogan v2) ══ */}
      <section className="app-stage">
        <h1 className="app-slogan">{t(`app_slogan_${sloganNo}`)}</h1>
        <div className="hero-eyeline app-stage__eyeline">
          <span className="hero-eyeline__pulse" />
          <span key={eyelineCountReady && scanCount > 0 ? 'count' : 'eyebrow'} className="eyeline-swap">
            {eyelineCountReady && scanCount > 0
              ? <>{t('eyeline_today_prefix')}<b>{scanCount.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}</b> {t('hero_eyeline_scans')}</>
              : t('hero_eyebrow')}
          </span>
        </div>

        <div className="scan-app">
          <div className="scan-app__head">
            <div className="scan-app__title">
              <span className="scan-app__tico"><GeoniMark /></span>
              {t('scan_card_title')}
            </div>
            <span className="scan-app__eta">{t('scan_card_eta')}</span>
          </div>

          <div className="app-tabs">
            {MODE_TABS.map(({ key, icon: Icon, title }) => (
              <button
                key={key}
                type="button"
                className={`app-tab ${mode === key ? 'app-tab--on' : ''}`}
                onClick={() => changeMode(key)}
              >
                <span className="app-tab__ico"><Icon size={17} strokeWidth={1.75} /></span>
                {title}
                <small>{t(`tab_desc_${key}`)}</small>
              </button>
            ))}
          </div>

          {showPrivateToast && (
            <div className="private-toast" role="status">
              <EyeOff size={14} strokeWidth={1.5} />
              {t('private_scan_toast')}
            </div>
          )}

          <form className="landing__form" onSubmit={handleSubmit}>

            {/* ── WEB SİTESİ (2 adımlı wizard, diğer modlarla tutarlı) ── */}
            {mode === 'site' && (
              <>
                <StepTitle titles={SITE_STEP_TITLES} />

                {step === 0 && (
                  <div className="landing__field landing__field--hero">
                    <label htmlFor="domain">{t('field_domain_label')}</label>
                    <input id="domain" type="text" placeholder={t('field_domain_placeholder')} value={domain} onChange={e => setDomain(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}
                {step === 1 && (
                  <div className="landing__field">
                    <label htmlFor="site-email">{t('field_site_email_label')}</label>
                    <input id="site-email" type="email" placeholder={t('field_email_placeholder')} value={siteEmail} onChange={e => setSiteEmail(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}

                <div className="wizard-nav">
                  <WizardProgress total={SITE_LAST_STEP} />
                  {step > 0 && <button type="button" className="wizard-back" onClick={() => setStep(s => s - 1)}>{t('wizard_back')}</button>}
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : step < SITE_LAST_STEP ? t('wizard_next') : !user ? `${t('nav_login')} →` : t('submit_site')}
                  </button>
                </div>
              </>
            )}

            {/* ── KİŞİ (4 adımlı wizard) ── */}
            {mode === 'person' && (
              <>
                <StepTitle titles={PERSON_STEP_TITLES} />
                {/* Dogru-veri vurgusu: baglam alanlari adas karismasini ve
                    halusinasyonu azaltir - kullanici bunu bilerek doldursun */}
                {step >= 1 && step <= 2 && (
                  <p className="wizard-accuracy-note">{t('wizard_accuracy_note')}</p>
                )}

                {step === 0 && (
                  <div className="landing__field landing__field--hero">
                    <label htmlFor="person-name">{t('field_person_name_label')}</label>
                    <input id="person-name" type="text" placeholder={t('field_person_name_placeholder')} value={personName} onChange={e => setPersonName(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}
                {step === 1 && (
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="person-role">{t('field_person_role_label')} {OPT}</label>
                      <input id="person-role" type="text" placeholder={t('field_person_role_placeholder')} value={personRole} onChange={e => setPersonRole(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-company">{t('field_person_company_label')} {OPT}</label>
                      <input id="person-company" type="text" placeholder={t('field_person_company_placeholder')} value={personCompany} onChange={e => setPersonCompany(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="person-city">{t('field_person_city_label')} {OPT}</label>
                      <input id="person-city" type="text" placeholder={t('field_city_placeholder')} value={personCity} onChange={e => setPersonCity(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-topic">{t('field_person_topic_label')} {OPT}</label>
                      <input id="person-topic" type="text" placeholder={t('field_person_topic_placeholder')} value={personTopic} onChange={e => setPersonTopic(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <>
                    <div className="landing__field">
                      <label htmlFor="person-linkedin">{t('field_person_linkedin_label')} {OPT}</label>
                      <input id="person-linkedin" type="url" placeholder="https://linkedin.com/in/..." value={personLinkedin} onChange={e => setPersonLinkedin(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-email">{t('field_person_email_label')} {OPT}</label>
                      <input id="person-email" type="email" placeholder={t('field_email_placeholder')} value={personEmail} onChange={e => setPersonEmail(e.target.value)} disabled={loading} />
                    </div>
                  </>
                )}

                <div className="wizard-nav">
                  <WizardProgress total={PERSON_LAST_STEP} />
                  {step > 0 && <button type="button" className="wizard-back" onClick={() => setStep(s => s - 1)}>{t('wizard_back')}</button>}
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : step < PERSON_LAST_STEP ? t('wizard_next') : !user ? `${t('nav_login')} →` : t('submit_person')}
                  </button>
                </div>
              </>
            )}

            {/* ── MARKA / ŞİRKET (3 adımlı wizard) ── */}
            {mode === 'brand' && (
              <>
                <StepTitle titles={BRAND_STEP_TITLES} />
                {step >= 1 && step <= 2 && (
                  <p className="wizard-accuracy-note">{t('wizard_accuracy_note')}</p>
                )}

                {step === 0 && (
                  <div className="landing__field landing__field--hero">
                    <label htmlFor="brand-name">{t('field_brand_name_label')}</label>
                    <input id="brand-name" type="text" placeholder={t('field_brand_name_placeholder')} value={brandName} onChange={e => setBrandName(e.target.value)} disabled={loading} required autoFocus />
                  </div>
                )}
                {step === 1 && (
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="brand-sector">{t('field_brand_sector_label')} {OPT}</label>
                      <input id="brand-sector" type="text" placeholder={t('field_brand_sector_placeholder')} value={brandSector} onChange={e => setBrandSector(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="brand-city">{t('field_brand_city_label')} {OPT}</label>
                      <input id="brand-city" type="text" placeholder={t('field_brand_city_placeholder')} value={brandCity} onChange={e => setBrandCity(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <>
                    <div className="landing__field">
                      <label htmlFor="brand-website">{t('field_brand_website_label')} {OPT}</label>
                      <input id="brand-website" type="text" placeholder={t('field_domain_placeholder')} value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} disabled={loading} autoFocus />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="brand-email">{t('field_brand_email_label')} {OPT}</label>
                      <input id="brand-email" type="email" placeholder={t('field_email_placeholder')} value={brandEmail} onChange={e => setBrandEmail(e.target.value)} disabled={loading} />
                    </div>
                  </>
                )}

                <div className="wizard-nav">
                  <WizardProgress total={BRAND_LAST_STEP} />
                  {step > 0 && <button type="button" className="wizard-back" onClick={() => setStep(s => s - 1)}>{t('wizard_back')}</button>}
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : step < BRAND_LAST_STEP ? t('wizard_next') : !user ? `${t('nav_login')} →` : t('submit_brand')}
                  </button>
                </div>
              </>
            )}

            {/* ── SOSYAL (tek adim, anonim) ── */}
            {mode === 'social' && (
              <>
                <div className="landing__field landing__field--hero">
                  <label htmlFor="social-handle">{t('field_social_handle_label')}</label>
                  <input id="social-handle" type="text" placeholder={t('field_social_handle_placeholder')} value={socialHandle} onChange={e => setSocialHandle(e.target.value)} disabled={loading} required autoFocus />
                </div>
                <div className="landing__field">
                  <label htmlFor="social-niche">{t('field_social_niche_label')}</label>
                  <input id="social-niche" type="text" placeholder={t('field_social_niche_placeholder')} value={socialNiche} onChange={e => setSocialNiche(e.target.value)} disabled={loading} />
                </div>
                <div className="landing__field">
                  <label htmlFor="social-email">{t('field_site_email_label')}</label>
                  <input id="social-email" type="email" placeholder={t('field_email_placeholder')} value={socialEmail} onChange={e => setSocialEmail(e.target.value)} disabled={loading} required />
                </div>
                <div className="wizard-nav">
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : t('submit_site')}
                  </button>
                </div>
              </>
            )}

            {/* Anti-abuse: Managed Turnstile (cogunlukla gorunmez). Token
                tarama istegine eklenir; yuklenmezse istek yine gider (soft). */}
            <div ref={turnstileRef} className="landing__turnstile" style={{ marginTop: 6 }} />

          </form>

          {error && <p className="landing__error">{error}</p>}

          <label className="app-priv">
            <input type="checkbox" checked={isPrivate} onChange={togglePrivate} />
            <EyeOff size={13} strokeWidth={1.5} />
            {t('private_scan_label')}
          </label>
          <div className="app-trust"><b>{t('trust_free')}</b> · {t('scan_trust_line')}</div>
        </div>

        <div className="app-underlinks">
          {onViewSample && (
            <button type="button" onClick={onViewSample}>{t('hero_sample_btn')} →</button>
          )}
          <button type="button" onClick={() => document.querySelector('.how-band')?.scrollIntoView({ behavior: 'smooth' })}>{t('underlink_how')}</button>
        </div>
      </section>

      {/* ══ NASIL ÇALIŞIR: tam genişlik, 3 sütun ══ */}
      <section className="how-band">
        <h2 className="landing__how-title-main">{t('how_title')}</h2>
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

      {/* ══ AI GÖRÜNÜRLÜK LİGİ: sosyal kanıt + FOMO (≥4 giriş yoksa gizli) ══ */}
      {leaders.length >= 4 && (
        <section className="league-band">
          <h2 className="league__title">{t('league_title')}</h2>
          <p className="league__sub">{t('league_sub')}</p>
          <ol className="league__list">
            {leaders.map((it, i) => (
              <li className="league__row" key={it.domain}>
                <span className="league__rank">{i + 1}</span>
                <span className="league__domain">{it.domain}</span>
                <span className="league__score" style={{ color: it.score >= 70 ? '#2fbd84' : '#F5A623' }}>{Math.round(it.score)}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="landing__submit league__cta" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {t('league_cta')}
          </button>
        </section>
      )}

      {/* Kapanis: sayfa "Nasil calisir"dan sonra aniden bitiyordu */}
      <section className="landing-close">
        <p dangerouslySetInnerHTML={{ __html: t('landing_close_text') }} />
        <button type="button" className="landing__submit" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          {t('landing_close_btn')}
        </button>
      </section>

      <footer className="landing-footer">
        <span>© 2026 GEONI</span>
        <span className="landing-footer__links">
          <a href="https://geoni.ai" target="_blank" rel="noopener">geoni.ai</a>
          <a href="mailto:mail@geoni.ai">mail@geoni.ai</a>
          <a href="https://geoni.ai/privacy" target="_blank" rel="noopener">{t('login_terms_privacy')}</a>
          <a href="https://geoni.ai/terms" target="_blank" rel="noopener">{t('login_terms_of_use')}</a>
        </span>
      </footer>
    </div>
  )
}
