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
        <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="score-gauge__num" style={{ color }}>{score}</div>
      <div className="score-gauge__label">AI Görünürlük Skoru</div>
    </div>
  )
}

const BREAKDOWN_LABELS = {
  index_coverage: 'Dizin Kapsamı',
  authority: 'Otorite',
  freshness: 'Tazelik',
  schema: 'Şema Bütünlüğü',
  engagement: 'Etkileşim',
  brand_recall: 'Marka Bilinirliği',
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
      <div className="topic-card__meta">
        {(topic.platforms || []).map((p) => (
          <span className="topic-badge topic-badge--platform" key={p}>{p}</span>
        ))}
        {isOpportunity && (topic.competitors || []).slice(0, 3).map((c) => (
          <span className="topic-badge topic-badge--competitor" key={c}>{c}</span>
        ))}
      </div>
    </div>
  )
}

export default function ResultsPage({ result, onReset }) {
  const {
    domain, score, score_breakdown,
    total_pages, indexed_pages, platforms,
    top_topics = [], opportunities = [],
    created_at,
  } = result

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const formattedTime = created_at
    ? new Date(created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : null

  const freeTopics = top_topics.slice(0, 2)
  const paidTopics = top_topics.slice(2)
  const freeOpps = opportunities.slice(0, 2)
  const paidOpps = opportunities.slice(2)

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
            <h1 className="results__title">AI Görünürlük Raporu</h1>
            {formattedDate && (
              <div className="results__date">
                {formattedDate}{formattedTime && <span style={{ marginLeft: 8, opacity: .7 }}>{formattedTime}</span>} tarihinde oluşturuldu
              </div>
            )}
          </div>
          <div className="results__scanned">
            <span className="results__scanned-label">Taranan Alan Adı</span>
            <span className="results__scanned-value">{domain}</span>
          </div>
        </div>

        {/* Skor + Breakdown (breakdown blur) */}
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

        {/* Stats */}
        <div className="results__stats results__stats--five">
          <div className="results__stat">
            <span className="results__stat-n">{total_pages}</span>
            <span className="results__stat-l">Taranan Sayfa</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.chatgpt ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.chatgpt ? 'Evet' : 'Hayır'}
            </span>
            <span className="results__stat-l">ChatGPT Bot İzni</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.anthropic ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.anthropic ? 'Evet' : 'Hayır'}
            </span>
            <span className="results__stat-l">Claude Bot İzni</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.google ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.google ? 'Evet' : 'Hayır'}
            </span>
            <span className="results__stat-l">Gemini Bot İzni</span>
          </div>
          <div className="results__stat">
            <ProBlur isPro={isPro} label="Pro">
              <span className="results__stat-n">—</span>
              <span className="results__stat-l">llm.txt</span>
            </ProBlur>
          </div>
        </div>

        {/* Topics */}
        <div className="topics">
          <div className="topics__col">
            <h3><span className="topics__col-icon">✓</span> Güçlü Olduğunuz Konular</h3>
            {freeTopics.length > 0 ? (
              freeTopics.map((t, i) => <TopicCard topic={t} key={i} />)
            ) : (
              <div className="topics__empty">Henüz güçlü bir konu tespit edilmedi.</div>
            )}
            {paidTopics.length > 0 && (
              <ProBlur isPro={isPro} label={`+${paidTopics.length} konu daha Pro planında`}>
                {paidTopics.map((t, i) => <TopicCard topic={t} key={i} />)}
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
            <p className="results__cta-sub">ChatGPT, Perplexity ve Claude'un sizi kaynak olarak göstermesi için sistematik GEO çalışması gerekiyor. Rakipleriniz bu yarışa çoktan girdi.</p>
            <a href="https://geoni.ai#paketler" className="results__cta-btn" target="_blank" rel="noopener">
              GEO Paketlerini İncele →
            </a>
          </div>
        </div>
      </div>

      <div className="results__sticky-bar">
        <span className="results__sticky-text">Skorunuzu yükseltmek ister misiniz?</span>
        <a href="https://geoni.ai#paketler" className="results__sticky-btn" target="_blank" rel="noopener">
          GEO Paketlerini İncele →
        </a>
      </div>
    </>
  )
}
