import { useState } from 'react'
import GeoniMark from './GeoniMark'

function BgRadar({ active }) {
  return (
    <svg className={`bg-radar ${active ? 'bg-radar--active' : ''}`} viewBox="0 0 240 240">
      <defs>
        <linearGradient id="radarTrailGradient" x1="120" y1="120" x2="120" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <circle className="bg-radar__ring bg-radar__ring--1" cx="120" cy="120" r="110" fill="none" stroke="#818CF8" strokeWidth="1.5" />
      <circle className="bg-radar__ring bg-radar__ring--2" cx="120" cy="120" r="80" fill="none" stroke="#818CF8" strokeWidth="1.5" />
      <circle className="bg-radar__ring bg-radar__ring--3" cx="120" cy="120" r="50" fill="none" stroke="#818CF8" strokeWidth="1.5" />
      <g className="bg-radar__sweep-group">
        <path d="M120 120 L120 10 A110 110 0 0 1 165 22 Z" className="bg-radar__sweep-trail" />
        <line x1="120" y1="120" x2="120" y2="10" className="bg-radar__sweep-line" />
      </g>
      <circle className="bg-radar__core" cx="120" cy="120" r="6" fill="#22D3EE" />
      <circle className="bg-radar__blip" cx="165" cy="80" r="4" />
      <circle className="bg-radar__blip" cx="70" cy="150" r="3.5" />
      <circle className="bg-radar__blip" cx="180" cy="170" r="4.5" />
      <circle className="bg-radar__blip" cx="95" cy="60" r="3" />
      <circle className="bg-radar__blip" cx="150" cy="195" r="4" />
      <circle className="bg-radar__blip" cx="55" cy="100" r="3.5" />
    </svg>
  )
}

const OPT = <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:'.8em'}}>(isteğe bağlı)</span>

export default function LandingPage({ onSubmitAudit, onSubmitBrandCheck, loading, statusText, error }) {
  const [mode, setMode] = useState('site') // 'site' | 'person' | 'brand'

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
      if (!domain || !siteEmail) return
      onSubmitAudit(domain, siteEmail)
    } else if (mode === 'person') {
      if (!personName) return
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
      if (!brandName) return
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

  return (
    <div className="landing">
      <header className="landing__nav">
        <div className="landing__brand">
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </div>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-left">
          <BgRadar active={loading} />

          <div className="landing__hero-wrap">
            <p className="landing__eyebrow">AI Görünürlük Taraması</p>
            <h1 className="landing__headline">
              Rakibiniz her AI yanıtında var.
              <br />
              <em>Siz yoksunuz.</em>
            </h1>

            <div className="mode-toggle">
              <button className={`mode-toggle__btn ${mode === 'site' ? 'mode-toggle__btn--active' : ''}`} onClick={() => setMode('site')} type="button">
                Web Sitesi
              </button>
              <button className={`mode-toggle__btn ${mode === 'person' ? 'mode-toggle__btn--active' : ''}`} onClick={() => setMode('person')} type="button">
                Kişi
              </button>
              <button className={`mode-toggle__btn ${mode === 'brand' ? 'mode-toggle__btn--active' : ''}`} onClick={() => setMode('brand')} type="button">
                Marka / Şirket
              </button>
            </div>

            <form className="landing__form" onSubmit={handleSubmit}>

              {/* ── WEB SİTESİ ── */}
              {mode === 'site' && (
                <>
                  <div className="landing__field">
                    <label htmlFor="domain">Web sitesi</label>
                    <input id="domain" type="text" placeholder="firmaniz.com" value={domain} onChange={e => setDomain(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="landing__field">
                    <label htmlFor="site-email">E-posta</label>
                    <input id="site-email" type="email" placeholder="ad@firmaniz.com" value={siteEmail} onChange={e => setSiteEmail(e.target.value)} disabled={loading} required />
                  </div>
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : 'Ücretsiz Taramayı Başlat'}
                  </button>
                </>
              )}

              {/* ── KİŞİ ── */}
              {mode === 'person' && (
                <>
                  <div className="landing__field">
                    <label htmlFor="person-name">Ad Soyad</label>
                    <input id="person-name" type="text" placeholder="Ahmet Yılmaz" value={personName} onChange={e => setPersonName(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="person-role">Unvan / Rol {OPT}</label>
                      <input id="person-role" type="text" placeholder="CTO, Avukat, Milletvekili..." value={personRole} onChange={e => setPersonRole(e.target.value)} disabled={loading} />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-company">Şirket {OPT}</label>
                      <input id="person-company" type="text" placeholder="ARD Grup, Geoni.ai..." value={personCompany} onChange={e => setPersonCompany(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="person-city">Şehir {OPT}</label>
                      <input id="person-city" type="text" placeholder="Ankara" value={personCity} onChange={e => setPersonCity(e.target.value)} disabled={loading} />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="person-topic">Konu / Alan {OPT}</label>
                      <input id="person-topic" type="text" placeholder="dijital dönüşüm, siyaset..." value={personTopic} onChange={e => setPersonTopic(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                  <div className="landing__field">
                    <label htmlFor="person-linkedin">LinkedIn URL {OPT}</label>
                    <input id="person-linkedin" type="url" placeholder="https://linkedin.com/in/..." value={personLinkedin} onChange={e => setPersonLinkedin(e.target.value)} disabled={loading} />
                  </div>
                  <div className="landing__field">
                    <label htmlFor="person-email">E-posta {OPT}</label>
                    <input id="person-email" type="email" placeholder="ad@firmaniz.com" value={personEmail} onChange={e => setPersonEmail(e.target.value)} disabled={loading} />
                  </div>
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : 'AI\'da Beni Ara'}
                  </button>
                </>
              )}

              {/* ── MARKA / ŞİRKET ── */}
              {mode === 'brand' && (
                <>
                  <div className="landing__field">
                    <label htmlFor="brand-name">Marka / Şirket Adı</label>
                    <input id="brand-name" type="text" placeholder="Geoni.ai, ARD Grup..." value={brandName} onChange={e => setBrandName(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="landing__field-row">
                    <div className="landing__field">
                      <label htmlFor="brand-sector">Sektör {OPT}</label>
                      <input id="brand-sector" type="text" placeholder="Teknoloji, Hukuk, Finans..." value={brandSector} onChange={e => setBrandSector(e.target.value)} disabled={loading} />
                    </div>
                    <div className="landing__field">
                      <label htmlFor="brand-city">Şehir {OPT}</label>
                      <input id="brand-city" type="text" placeholder="İstanbul, Ankara..." value={brandCity} onChange={e => setBrandCity(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                  <div className="landing__field">
                    <label htmlFor="brand-website">Web Sitesi {OPT}</label>
                    <input id="brand-website" type="text" placeholder="firmaniz.com" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} disabled={loading} />
                  </div>
                  <div className="landing__field">
                    <label htmlFor="brand-email">E-posta {OPT}</label>
                    <input id="brand-email" type="email" placeholder="ad@firmaniz.com" value={brandEmail} onChange={e => setBrandEmail(e.target.value)} disabled={loading} />
                  </div>
                  <button type="submit" className="landing__submit" disabled={loading}>
                    {loading ? statusText + '…' : 'Markamı Sorgula'}
                  </button>
                </>
              )}

            </form>

            {error && <p className="landing__error">{error}</p>}
            <p className="landing__trust">Kredi kartı gerekmez · Sonuç ~30 saniyede hazır</p>
          </div>
        </div>

        <div className="landing__hero-right">
          <p className="landing__subhead" style={{ marginBottom: 32 }}>
            ChatGPT, Claude ve Perplexity artık tek bir yanıt veriyor — listelemiyor.
            O yanıtta yer almayan marka, müşteri için yok hükmünde.
            Sitenizi tarayıp şu anki AI görünürlüğünüzü ölçelim.
          </p>
          <p className="landing__how-eyebrow">Süreç</p>
          <h2 className="landing__how-title-main">Nasıl çalışır</h2>
          <div className="landing__how-list">
            <div className="landing__how-item">
              <span className="landing__how-num">01</span>
              <div>
                <h3 className="landing__how-title">Tara</h3>
                <p>Sitenizdeki sayfaları gerçek zamanlı tarıyoruz, içerik ve yapıyı çıkarıyoruz.</p>
              </div>
            </div>
            <div className="landing__how-item">
              <span className="landing__how-num">02</span>
              <div>
                <h3 className="landing__how-title">Karşılaştır</h3>
                <p>Google, Bing ve AI motorlarındaki dizin durumunuzu kontrol ederiz.</p>
              </div>
            </div>
            <div className="landing__how-item">
              <span className="landing__how-num">03</span>
              <div>
                <h3 className="landing__how-title">Puanla</h3>
                <p>0-100 arası AI Görünürlük Skoru ve somut, uygulanabilir öneriler sunarız.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
