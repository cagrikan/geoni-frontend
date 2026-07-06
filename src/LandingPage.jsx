import { useState, useEffect } from 'react'
import { Globe, User, Building2, ScanSearch, GitCompareArrows, Award, Eye, EyeOff } from 'lucide-react'
import GeoniMark from './GeoniMark'
import LanguageSwitcher from './components/LanguageSwitcher'
import ThemeSwitcher from './components/ThemeSwitcher'
import { useLanguage } from './lib/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

const SITE_LAST_STEP = 1
const PERSON_LAST_STEP = 3
const BRAND_LAST_STEP = 2

export default function LandingPage({ onSubmitAudit, onSubmitBrandCheck, loading = false, statusText = '', error, user, onDashboard, onLogin }) {
  const { t } = useLanguage()
  const [mode, setMode] = useState('site') // 'site' | 'person' | 'brand'
  const [step, setStep] = useState(0)
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
  ]

  const HOW_STEPS = [
    { icon: ScanSearch, title: t('how_step1_title'), desc: t('how_step1_desc') },
    { icon: GitCompareArrows, title: t('how_step2_title'), desc: t('how_step2_desc') },
    { icon: Award, title: t('how_step3_title'), desc: t('how_step3_desc') },
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
      onSubmitAudit(domain, siteEmail, isPrivate)
    } else if (mode === 'person') {
      if (step === 0 && !personName) return
      if (step < PERSON_LAST_STEP) { setStep(s => s + 1); return }
      if (!user) { onLogin(); return }
      onSubmitBrandCheck({
        type: 'person',
        name: personName,
        role: personRole,
        company: personCompany,
        location: personCity,
        topic: personTopic,
        linkedin_url: personLinkedin,
        email: personEmail || 'anonymous@geoni.ai',
        private: isPrivate,
      })
    } else {
      if (step === 0 && !brandName) return
      if (step < BRAND_LAST_STEP) { setStep(s => s + 1); return }
      if (!user) { onLogin(); return }
      onSubmitBrandCheck({
        type: 'brand',
        name: brandName,
        sector: brandSector,
        location: brandCity,
        website: brandWebsite,
        email: brandEmail || 'anonymous@geoni.ai',
        private: isPrivate,
      })
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
          <span className="landing__logo">GEONI</span>
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

      {/* ══ HERO: tek sütun, ortalanmış, tek odak noktası ══ */}
      <section className="hero-centered">
        <p className="landing__eyebrow">{t('hero_eyebrow')}</p>
        <h1 className="landing__headline landing__headline--center">
          {t('hero_headline_1')}
          <br />
          <em>{t('hero_headline_2')}</em>
        </h1>
        <p className="hero-centered__subhead">
          {t('hero_subhead')}
        </p>

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
            <button
              type="button"
              className={`mode-tab mode-tab--private ${isPrivate ? 'mode-tab--active' : ''}`}
              onClick={togglePrivate}
              title={t('private_scan_label')}
              aria-label={t('private_scan_label')}
            >
              {isPrivate ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
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
                    {loading ? statusText + '…' : step < SITE_LAST_STEP ? t('wizard_next') : t('submit_site')}
                  </button>
                </div>
              </>
            )}

            {/* ── KİŞİ (4 adımlı wizard) ── */}
            {mode === 'person' && (
              <>
                <StepTitle titles={PERSON_STEP_TITLES} />

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

          </form>

          {error && <p className="landing__error">{error}</p>}
        </div>

        <p className="landing__trust">
          {scanCount > 0 && <>{scanCount.toLocaleString('tr-TR')}{t('hero_trust_scans')}{' '}</>}
          {t('hero_trust')}
        </p>
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
    </div>
  )
}
