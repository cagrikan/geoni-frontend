import GeoniMark from './GeoniMark'
import ProBlur from './ProBlur'

function scoreColor(score) {
  if (score >= 65) return 'var(--good)'
  if (score >= 40) return 'var(--warn)'
  return 'var(--bad)'
}

function ScoreGauge({ score }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)
  return (
    <div className="score-gauge">
      <svg viewBox="0 0 160 160" className="score-gauge__svg">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="score-gauge__num" style={{ color }}>{score}</div>
      <div className="score-gauge__label">AI BİLİNİRLİK SKORU</div>
    </div>
  )
}

const BREAKDOWN_LABELS = {
  claude:          'Claude',
  chatgpt:         'ChatGPT',
  gemini:          'Gemini',
  yanit_kalitesi:  'Yanıt Kalitesi',
  konu_uyumu:      'Konu Uyumu',
}

function Breakdown({ breakdown }) {
  return (
    <div className="breakdown">
      {Object.entries(breakdown || {}).map(([key, value]) => (
        <div className="breakdown__row" key={key}>
          <div className="breakdown__row-top">
            <span className="breakdown__row-label">{BREAKDOWN_LABELS[key] || key}</span>
            <span className="breakdown__row-value">{value}</span>
          </div>
          <div className="breakdown__bar-track">
            <div className="breakdown__bar-fill" style={{ width: `${Math.min(value, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TopicCard({ topic, isOpportunity }) {
  return (
    <div className="topic-card">
      <div className="topic-card__title">{topic.topic}</div>
      <div className="topic-card__footer">
        <div className="topic-card__meta">
          {(topic.platforms || []).map((p) => (
            <span className="topic-badge topic-badge--platform" key={p}>{p}</span>
          ))}
          {isOpportunity && (topic.competitors || []).slice(0, 3).map((c) => (
            <span className="topic-badge topic-badge--competitor" key={c}>{c}</span>
          ))}
        </div>
        {!isOpportunity && topic.source_url && (
          <a
            href={topic.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="topic-card__source"
          >
            {(() => { try { return new URL(topic.source_url).hostname.replace('www.', '') } catch { return topic.source_url } })()} →
          </a>
        )}
      </div>
    </div>
  )
}

export default function BrandCheckResultsPage({ result, onReset, user, onLogin, onDashboard, isPro = false }) {
  const {
    name,
    topic,
    score = 0,
    score_breakdown = {},
    recognition_count = 0,
    model_results = {},
    google_result_count = 0,
    performing_topics = [],
    opportunity_topics = [],
    created_at,
  } = result

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const formattedTime = created_at
    ? new Date(created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : null

  const capitalizedName = name
    ? name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : name

  const total = Object.keys(model_results).length || 3

  const freePerforming = performing_topics.slice(0, 2)
  const paidPerforming = performing_topics.slice(2)
  const freeOpps = opportunity_topics.slice(0, 2)
  const paidOpps = opportunity_topics.slice(2)

  return (
    <>
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onReset}>
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </button>
        <div className="nav-auth">
          {onDashboard && <button className="nav-dashboard-btn" onClick={onDashboard}>← Dashboard</button>}
          {!user && onLogin && <button className="nav-login-btn" onClick={onLogin}>Giriş Yap</button>}
        </div>
      </header>

      <div className="results">
        <div className="results__header">
          <div>
            <h1 className="results__title">AI Bilinirlik Raporu</h1>
            {formattedDate && (
              <div className="results__date">
                {formattedDate}{formattedTime && <span style={{ marginLeft: 8, opacity: .7 }}>{formattedTime}</span>} tarihinde oluşturuldu
              </div>
            )}
          </div>
          <div className="results__scanned">
            <span className="results__scanned-label">Sorgulanan</span>
            <span className="results__scanned-value">{capitalizedName}</span>
            {topic && topic !== name && (
              <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{topic}</span>
            )}
          </div>
        </div>

        <div className="results__top">
          <ScoreGauge score={score} />
          <ProBlur isPro={isPro} label="Detaylı skor dökümü Pro planında">
            <Breakdown breakdown={score_breakdown} />
          </ProBlur>
        </div>

        <div className="results__cta-compact">
          <span className="results__cta-compact-text">Bu skoru nasıl yükseltiriz?</span>
          <a href="https://geoni.ai#paketler" className="results__cta-compact-btn" target="_blank" rel="noopener">
            GEO Paketlerini İncele →
          </a>
        </div>

        <div className="results__stats results__stats--five">
          <div className="results__stat">
            <span className="results__stat-n">{recognition_count}/{total}</span>
            <span className="results__stat-l">Tanıyan Model</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n">{google_result_count}</span>
            <span className="results__stat-l">Web Sonucu</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: model_results?.claude?.recognized ? 'var(--good)' : 'var(--bad)' }}>
              {model_results?.claude?.recognized ? 'Evet' : 'Hayır'}
            </span>
            <span className="results__stat-l">Claude Tanıyor</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: model_results?.openai?.recognized ? 'var(--good)' : 'var(--bad)' }}>
              {model_results?.openai?.recognized ? 'Evet' : 'Hayır'}
            </span>
            <span className="results__stat-l">ChatGPT Tanıyor</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: model_results?.gemini?.recognized ? 'var(--good)' : 'var(--bad)' }}>
              {model_results?.gemini?.recognized ? 'Evet' : 'Hayır'}
            </span>
            <span className="results__stat-l">Gemini Tanıyor</span>
          </div>
        </div>

        <div className="topics">
          <div className="topics__col">
            <h3><span className="topics__col-icon">✓</span> Güçlü Olduğunuz Konular</h3>
            {freePerforming.length > 0 ? (
              freePerforming.map((t, i) => <TopicCard topic={t} key={i} />)
            ) : (
              <div className="topics__empty">Henüz güçlü bir konu tespit edilmedi.</div>
            )}
            {paidPerforming.length > 0 && (
              <ProBlur isPro={isPro} label={`+${paidPerforming.length} konu daha Pro planında`}>
                {paidPerforming.map((t, i) => <TopicCard topic={t} key={i} />)}
              </ProBlur>
            )}
          </div>
          <div className="topics__col">
            <h3><span className="topics__col-icon">→</span> Kaçırdığınız Fırsatlar</h3>
            {freeOpps.length > 0 ? (
              freeOpps.map((t, i) => <TopicCard topic={t} isOpportunity key={i} />)
            ) : (
              <div className="topics__empty">Fırsat alanı tespit edilmedi.</div>
            )}
            {paidOpps.length > 0 && (
              <ProBlur isPro={isPro} label={`+${paidOpps.length} fırsat daha Pro planında`}>
                {paidOpps.map((t, i) => <TopicCard topic={t} isOpportunity key={i} />)}
              </ProBlur>
            )}
          </div>
        </div>

        <div className="results__cta">
          <div className="results__cta-inner">
            <p className="results__cta-eyebrow">Sonraki Adım</p>
            <h2 className="results__cta-title">Bu skoru nasıl yükseltiriz?</h2>
            <p className="results__cta-sub">ChatGPT, Gemini ve Claude'un sizi alanınızda kaynak olarak göstermesi için sistematik GEO çalışması gerekiyor. Rakipleriniz bu yarışa çoktan girdi.</p>
            <a href="https://geoni.ai#paketler" className="results__cta-btn" target="_blank" rel="noopener">
              GEO Paketlerini İncele →
            </a>
          </div>
        </div>
      </div>

      <div className="results__sticky-bar">
        <span className="results__sticky-text">
          {recognition_count > 0 ? `${recognition_count}/${total} AI motoru sizi tanıyor` : 'Hiçbir AI motoru sizi tanımıyor — GEO ile değiştirin'}
        </span>
        <a href="https://geoni.ai#paketler" className="results__sticky-btn" target="_blank" rel="noopener">
          GEO Paketlerini İncele →
        </a>
      </div>
    </>
  )
}
