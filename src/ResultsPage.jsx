import GeoniMark from './GeoniMark'

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
        <circle
          cx="80" cy="80" r={radius}
          fill="none" stroke="var(--border)" strokeWidth="10"
        />
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
            <div
              className="breakdown__bar-fill"
              style={{ width: `${Math.min(value, 100)}%` }}
            />
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
    domain,
    score,
    score_breakdown,
    total_pages,
    indexed_pages,
    platforms,
    top_topics = [],
    opportunities = [],
    created_at,
  } = result

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <header className="landing__nav">
        <div className="landing__brand">
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </div>
      </header>

      <div className="results">
        <div className="results__header">
          <div>
            <div className="results__domain">{domain}</div>
            <h1 className="results__title">AI Görünürlük Raporu</h1>
            {formattedDate && <div className="results__date">{formattedDate} tarihinde oluşturuldu</div>}
          </div>
          <button className="results__reset" onClick={onReset}>Yeni Tarama</button>
        </div>

        <div className="results__top">
          <ScoreGauge score={score} />
          <Breakdown breakdown={score_breakdown} />
        </div>

        <div className="results__cta-compact">
          <span className="results__cta-compact-text">Bu skoru nasıl yükseltiriz?</span>
          <a href="https://geoni.ai#paketler" className="results__cta-compact-btn" target="_blank" rel="noopener">
            GEO Paketlerini İncele →
          </a>
        </div>

        <div className="results__stats">
          <div className="results__stat">
            <span className="results__stat-n">{total_pages}</span>
            <span className="results__stat-l">Taranan Sayfa</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n">{indexed_pages}</span>
            <span className="results__stat-l">Dizinli Sayfa</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n">{platforms?.chatgpt ? 'Evet' : 'Hayır'}</span>
            <span className="results__stat-l">ChatGPT Erişimi</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n">{platforms?.anthropic ? 'Evet' : 'Hayır'}</span>
            <span className="results__stat-l">Claude Erişimi</span>
          </div>
        </div>

        <div className="topics">
          <div className="topics__col">
            <h3><span className="topics__col-icon">✓</span> Güçlü Olduğunuz Konular</h3>
            {top_topics.length > 0 ? (
              top_topics.map((t, i) => <TopicCard topic={t} key={i} />)
            ) : (
              <div className="topics__empty">Henüz güçlü bir konu tespit edilmedi.</div>
            )}
          </div>
          <div className="topics__col">
            <h3><span className="topics__col-icon">→</span> Kaçırdığınız Fırsatlar</h3>
            {opportunities.length > 0 ? (
              opportunities.map((t, i) => <TopicCard topic={t} isOpportunity key={i} />)
            ) : (
              <div className="topics__empty">Fırsat alanı tespit edilmedi.</div>
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
