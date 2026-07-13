import { CircleCheck, TrendingUp, EyeOff } from 'lucide-react'
import GeoniMark from './GeoniMark'
import ProBlur from './ProBlur'
import SovSection from './components/SovSection'
import StabilityNote from './components/StabilityNote'
import LanguageSwitcher from './components/LanguageSwitcher'
import ShareResult from './components/ShareResult'
import EmbedBadge from './components/EmbedBadge'
import WatchlistButton from './components/WatchlistButton'
import { useLanguage } from './lib/LanguageContext'

function scoreColor(score) {
  if (score >= 65) return 'var(--good)'
  if (score >= 40) return 'var(--warn)'
  return 'var(--bad)'
}

function ScoreGauge({ score, label }) {
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
      <div className="score-gauge__label">{label}</div>
    </div>
  )
}

function Breakdown({ breakdown, t }) {
  const labels = {
    claude: 'Claude',
    chatgpt: 'ChatGPT',
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    yanit_kalitesi: t('breakdown_yanit_kalitesi'),
    konu_uyumu: t('breakdown_konu_uyumu'),
    kategori_gorunurlugu: t('breakdown_kategori_gorunurlugu'),
  }
  return (
    <div className="breakdown">
      {Object.entries(breakdown || {}).map(([key, value]) => (
        <div className="breakdown__row" key={key}>
          <div className="breakdown__row-top">
            <span className="breakdown__row-label">{labels[key] || key}</span>
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

/* Duygu (sentiment) rozeti: judge'in yanit tonu degerlendirmesi (v3).
   Uydurma suphesinde ton yerine "karistiriyor olabilir" uyarisi gosterilir —
   model "taniyor" gorunse de muhtemelen yanlis kisiyi anlatiyordur. */
function SentimentTag({ sentiment, hallucination, t }) {
  if (hallucination) {
    return <span className="sentiment-tag sentiment-tag--warn" title={t('sentiment_hallucination_hint')}>⚠ {t('sentiment_hallucination')}</span>
  }
  if (!sentiment) return null
  const map = {
    pozitif: { cls: 'sentiment-tag--pos', label: t('sentiment_pozitif') },
    notr: { cls: 'sentiment-tag--neu', label: t('sentiment_notr') },
    negatif: { cls: 'sentiment-tag--neg', label: t('sentiment_negatif') },
  }
  const m = map[sentiment]
  if (!m) return null
  return <span className={`sentiment-tag ${m.cls}`}>{m.label}</span>
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

export default function BrandCheckResultsPage({ result, jobId = null, onReset, user, onLogin, onDashboard, isPro = false, isPrivate = false }) {
  const { t, language } = useLanguage()
  const {
    name,
    topic,
    type = 'person',
    score = 0,
    score_breakdown = {},
    recognition_count = 0,
    model_results = {},
    google_result_count = 0,
    performing_topics = [],
    opportunity_topics = [],
    created_at,
  } = result

  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const formattedTime = created_at
    ? new Date(created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
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
          <span className="landing__logo">geoni</span>
        </button>
        <div className="nav-auth">
          <LanguageSwitcher />
          {onDashboard && <button className="nav-dashboard-btn" onClick={onDashboard}>{t('nav_dashboard_back')}</button>}
          {!user && onLogin && <button className="nav-login-btn" onClick={onLogin}>{t('nav_login')}</button>}
        </div>
      </header>

      <div className="results">
        {isPrivate && (
          <div className="results__private-banner">
            <EyeOff size={14} strokeWidth={1.5} /> {t('private_scan_banner')}
          </div>
        )}
        <div className="results__header">
          <div>
            <h1 className="results__title">{t('results_brand_title')}</h1>
            {formattedDate && (
              <div className="results__date">
                {formattedDate}{formattedTime && <span style={{ marginLeft: 8, opacity: .7 }}>{formattedTime}</span>} {t('results_created_at_suffix')}
              </div>
            )}
          </div>
          <div className="results__scanned">
            <span className="results__scanned-label">{t('results_brand_queried_label')}</span>
            <span className="results__scanned-value">{capitalizedName}</span>
            {topic && topic !== name && (
              <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{topic}</span>
            )}
            {!isPrivate && <WatchlistButton user={user} type={type} label={capitalizedName} target={{ name, topic }} />}
          </div>
        </div>

        <ShareResult jobId={jobId} text={t('share_brand_text', { name: capitalizedName, score })} />
        <EmbedBadge jobId={jobId} />

        <div className="results__top">
          <div className="results__gauge-col">
            <ScoreGauge score={score} label={t('results_brand_score_label')} />
            <StabilityNote
              stability={result.stability}
              driverLabel={{
                claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini', perplexity: 'Perplexity',
                yanit_kalitesi: t('breakdown_yanit_kalitesi'),
                konu_uyumu: t('breakdown_konu_uyumu'),
                kategori_gorunurlugu: t('breakdown_kategori_gorunurlugu'),
              }[result.stability?.driver]}
              t={t}
            />
          </div>
          <ProBlur isPro={isPro} label={t('results_brand_breakdown_label')}>
            <Breakdown breakdown={score_breakdown} t={t} />
          </ProBlur>
        </div>

        <div className="results__cta-compact">
          <span className="results__cta-compact-text">{t('results_upgrade_question')}</span>
          <a href={`https://app.geoni.ai/dashboard?tab=tickets&target=${encodeURIComponent(result?.name || '')}`} className="results__cta-compact-btn" target="_blank" rel="noopener">
            {t('results_view_packages')}
          </a>
        </div>

        <div className={`results__stats ${model_results?.perplexity ? 'results__stats--six' : 'results__stats--five'}`}>
          <div className="results__stat">
            <span className="results__stat-n">{recognition_count}/{total}</span>
            <span className="results__stat-l">{t('results_brand_recognizing_models')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n">{google_result_count}</span>
            <span className="results__stat-l">{t('results_brand_web_results')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: model_results?.claude?.recognized ? 'var(--good)' : 'var(--bad)' }}>
              {model_results?.claude?.recognized ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_brand_claude_recognizes')}</span>
            <SentimentTag sentiment={model_results?.claude?.sentiment} hallucination={model_results?.claude?.hallucination} t={t} />
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: model_results?.openai?.recognized ? 'var(--good)' : 'var(--bad)' }}>
              {model_results?.openai?.recognized ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_brand_chatgpt_recognizes')}</span>
            <SentimentTag sentiment={model_results?.openai?.sentiment} hallucination={model_results?.openai?.hallucination} t={t} />
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: model_results?.gemini?.recognized ? 'var(--good)' : 'var(--bad)' }}>
              {model_results?.gemini?.recognized ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_brand_gemini_recognizes')}</span>
            <SentimentTag sentiment={model_results?.gemini?.sentiment} hallucination={model_results?.gemini?.hallucination} t={t} />
          </div>
          {model_results?.perplexity && (
            <div className="results__stat">
              <span className="results__stat-n" style={{ color: model_results.perplexity.recognized ? 'var(--good)' : 'var(--bad)' }}>
                {model_results.perplexity.recognized ? t('results_yes') : t('results_no')}
              </span>
              <span className="results__stat-l">{t('results_brand_perplexity_recognizes')}</span>
              <SentimentTag sentiment={model_results.perplexity.sentiment} hallucination={model_results.perplexity.hallucination} t={t} />
            </div>
          )}
        </div>

        {/* Share of Voice: kategori sorgularinda gorunurluk (v3) */}
        <SovSection sov={result.sov} t={t} isPro={isPro} />

        <div className="topics">
          <div className="topics__col">
            <h3><CircleCheck size={16} strokeWidth={1.5} className="topics__col-icon" /> {t('results_strong_topics')}</h3>
            {freePerforming.length > 0 ? (
              freePerforming.map((tp, i) => <TopicCard topic={tp} key={i} />)
            ) : (
              <div className="topics__empty">{t('results_strong_topics_empty')}</div>
            )}
            {paidPerforming.length > 0 && (
              <ProBlur isPro={isPro} label={`+${paidPerforming.length} ${t('results_more_topics')}`}>
                {paidPerforming.map((tp, i) => <TopicCard topic={tp} key={i} />)}
              </ProBlur>
            )}
          </div>
          <div className="topics__col">
            <h3><TrendingUp size={16} strokeWidth={1.5} className="topics__col-icon" /> {t('results_missed_opportunities')}</h3>
            {freeOpps.length > 0 ? (
              freeOpps.map((tp, i) => <TopicCard topic={tp} isOpportunity key={i} />)
            ) : (
              <div className="topics__empty">{t('results_opportunities_empty')}</div>
            )}
            {paidOpps.length > 0 && (
              <ProBlur isPro={isPro} label={`+${paidOpps.length} ${t('results_more_opportunities')}`}>
                {paidOpps.map((tp, i) => <TopicCard topic={tp} isOpportunity key={i} />)}
              </ProBlur>
            )}
          </div>
        </div>

        <div className="results__cta">
          <div className="results__cta-inner">
            <p className="results__cta-eyebrow">{t('results_next_step')}</p>
            <h2 className="results__cta-title">{t('results_upgrade_question')}</h2>
            <p className="results__cta-sub">{t('results_cta_sub_brand')}</p>
            <a href={`https://app.geoni.ai/dashboard?tab=tickets&target=${encodeURIComponent(result?.name || '')}`} className="results__cta-btn" target="_blank" rel="noopener">
              {t('results_view_packages')}
            </a>
          </div>
        </div>
      </div>

      <div className="results__sticky-bar">
        <span className="results__sticky-text">
          {recognition_count > 0 ? `${recognition_count}/${total} ${t('results_brand_sticky_recognized')}` : t('results_brand_sticky_none')}
        </span>
        <a href={`https://app.geoni.ai/dashboard?tab=tickets&target=${encodeURIComponent(result?.name || '')}`} className="results__sticky-btn" target="_blank" rel="noopener">
          {t('results_view_packages')}
        </a>
      </div>
    </>
  )
}
