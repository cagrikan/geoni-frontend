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

export default function LandingPage({ onSubmit, loading, statusText, error }) {
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!domain || !email) return
    onSubmit(domain, email)
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
            <p className="landing__subhead">
              ChatGPT, Claude ve Perplexity artık tek bir yanıt veriyor — listelemiyor.
              O yanıtta yer almayan marka, müşteri için yok hükmünde. Sitenizi tarayıp
              şu anki AI görünürlüğünüzü ölçelim.
            </p>

            <form className="landing__form" onSubmit={handleSubmit}>
              <div className="landing__field">
                <label htmlFor="domain">Web sitesi</label>
                <input
                  id="domain"
                  type="text"
                  placeholder="firmaniz.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="landing__field">
                <label htmlFor="email">E-posta</label>
                <input
                  id="email"
                  type="email"
                  placeholder="ad@firmaniz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <button type="submit" className="landing__submit" disabled={loading}>
                {loading ? statusText + '…' : 'Ücretsiz Taramayı Başlat'}
              </button>
            </form>

            {error && <p className="landing__error">{error}</p>}

            <p className="landing__trust">Kredi kartı gerekmez · Sonuç ~60 saniyede hazır</p>
          </div>
        </div>

        <div className="landing__hero-right">
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

