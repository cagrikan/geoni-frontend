import { CircleCheck, TrendingUp, EyeOff, Wrench, ArrowRight } from 'lucide-react'
import GeoniMark from './GeoniMark'
import ProBlur from './ProBlur'
import SovSection from './components/SovSection'
import LanguageSwitcher from './components/LanguageSwitcher'
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
        <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="score-gauge__num" style={{ color }}>{score}</div>
      <div className="score-gauge__label">{label}</div>
    </div>
  )
}

const BREAKDOWN_LABELS_TR = {
  index_coverage: 'Dizin Kapsamı',
  authority: 'Otorite',
  freshness: 'Tazelik',
  schema: 'Şema Bütünlüğü',
  ai_access: 'AI Erişimi',
  engagement: 'Etkileşim',
  brand_recall: 'Marka Bilinirliği',
}

const BREAKDOWN_LABELS_EN = {
  index_coverage: 'Index Coverage',
  authority: 'Authority',
  freshness: 'Freshness',
  schema: 'Schema Integrity',
  ai_access: 'AI Access',
  engagement: 'Engagement',
  brand_recall: 'Brand Recall',
}

function Breakdown({ breakdown, language }) {
  const labels = language === 'en' ? BREAKDOWN_LABELS_EN : BREAKDOWN_LABELS_TR
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

/* Tarama -> hizmet koprusu: raporun kendi verisinden somut eksikleri
   cikarir ve her birini app'teki ilgili hizmete baglar (hedef on-dolu).
   Urunun ana hunisi bu: "tara, eksigi gor, duzelttir". */
function FixSuggestions({ result, t }) {
  const { domain, platforms = {}, llms_txt, score_breakdown = {} } = result
  const fixes = []
  const blockedEngines = [
    !platforms.chatgpt && 'ChatGPT',
    !platforms.anthropic && 'Claude',
    !platforms.google && 'Gemini',
  ].filter(Boolean)
  if (blockedEngines.length > 0 || llms_txt === false) {
    fixes.push({
      key: 'bots',
      title: t('fix_bots_title'),
      why: blockedEngines.length > 0
        ? `${blockedEngines.join(', ')} ${t('fix_bots_why_blocked')}`
        : t('fix_bots_why_llms'),
    })
  }
  if ((score_breakdown.schema ?? 100) < 60) {
    fixes.push({ key: 'schema', title: t('fix_schema_title'), why: `${t('fix_schema_why')} ${score_breakdown.schema}/100` })
  }
  if ((score_breakdown.brand_recall ?? 100) < 40) {
    fixes.push({ key: 'entity', title: t('fix_entity_title'), why: `${t('fix_entity_why')} ${score_breakdown.brand_recall}/100` })
  }
  if (result.sov?.checked && (result.sov.score ?? 100) < 50) {
    fixes.push({ key: 'sov', title: t('fix_sov_title'), why: `${t('fix_sov_why')} ${result.sov.mention_count}/${result.sov.query_count}` })
  }
  if (fixes.length === 0) return null
  const href = `https://app.geoni.ai/dashboard?tab=tickets&target=${encodeURIComponent(domain || '')}`
  return (
    <div className="fixes">
      <h3 className="fixes__title"><Wrench size={15} strokeWidth={1.5} /> {t('fix_section_title')}</h3>
      <div className="fixes__list">
        {fixes.map((f) => (
          <a key={f.key} className="fixes__item" href={href}>
            <div className="fixes__item-body">
              <div className="fixes__item-title">{f.title}</div>
              <div className="fixes__item-why">{f.why}</div>
            </div>
            <span className="fixes__item-cta">{t('fix_cta')} <ArrowRight size={13} strokeWidth={1.75} /></span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function ResultsPage({ result, onReset, user, onLogin, onDashboard, isPro = false, isSample = false, isPrivate = false }) {
  const { t, language } = useLanguage()
  const {
    domain, score, score_breakdown,
    total_pages, platforms,
    top_topics = [], opportunities = [],
    created_at,
  } = result

  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const formattedTime = created_at
    ? new Date(created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
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
          <LanguageSwitcher />
          {onDashboard && <button className="nav-dashboard-btn" onClick={onDashboard}>{t('nav_dashboard_back')}</button>}
          {!user && onLogin && <button className="nav-login-btn" onClick={onLogin}>{t('nav_login')}</button>}
        </div>
      </header>

      <div className="results">
        {isSample && (
          <div className="results__sample-banner">
            <span>{t('sample_banner_text')} <strong>{t('sample_banner_bold')}</strong> {t('sample_banner_rest')}</span>
            <button type="button" className="results__sample-banner-btn" onClick={onReset}>
              {t('sample_banner_btn')}
            </button>
          </div>
        )}
        {isPrivate && (
          <div className="results__private-banner">
            <EyeOff size={14} strokeWidth={1.5} /> {t('private_scan_banner')}
          </div>
        )}
        <div className="results__header">
          <div>
            <h1 className="results__title">{t('results_site_title')}</h1>
            {formattedDate && (
              <div className="results__date">
                {formattedDate}{formattedTime && <span style={{ marginLeft: 8, opacity: .7 }}>{formattedTime}</span>} {t('results_created_at_suffix')}
              </div>
            )}
          </div>
          <div className="results__scanned">
            <span className="results__scanned-label">{t('results_site_scanned_label')}</span>
            <span className="results__scanned-value">{domain}</span>
            {!isSample && !isPrivate && <WatchlistButton user={user} type="web" label={domain} target={{ domain }} />}
          </div>
        </div>

        {/* Skor + Breakdown (breakdown blur) */}
        <div className="results__top">
          <ScoreGauge score={score} label={t('results_score_label')} />
          <ProBlur isPro={isPro} label={t('results_site_breakdown_label')}>
            <Breakdown breakdown={score_breakdown} language={language} />
          </ProBlur>
        </div>

        <div className="results__cta-compact">
          <span className="results__cta-compact-text">{t('results_upgrade_question')}</span>
          <a href={`https://app.geoni.ai/dashboard?tab=tickets&target=${encodeURIComponent(domain || '')}`} className="results__cta-compact-btn" target="_blank" rel="noopener">
            {t('results_view_packages')}
          </a>
        </div>

        {/* Stats */}
        <div className="results__stats results__stats--five">
          <div className="results__stat">
            <span className="results__stat-n">{total_pages}</span>
            <span className="results__stat-l">{t('results_site_pages_scanned')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.chatgpt ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.chatgpt ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_site_chatgpt_access')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.anthropic ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.anthropic ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_site_claude_access')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.google ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.google ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_site_gemini_access')}</span>
          </div>
          <div className="results__stat">
            <ProBlur isPro={isPro} label={t('results_site_llmtxt_label')}>
              <span className="results__stat-n">—</span>
              <span className="results__stat-l">llm.txt</span>
            </ProBlur>
          </div>
        </div>

        {/* Share of Voice: kategori sorgularinda gorunurluk (v3) */}
        <SovSection sov={result.sov} t={t} isPro={isPro} />

        {/* Eksik -> hizmet koprusu (ornek raporda gosterilmez) */}
        {!isSample && <FixSuggestions result={result} t={t} />}

        {/* Topics */}
        <div className="topics">
          <div className="topics__col">
            <h3><CircleCheck size={16} strokeWidth={1.5} className="topics__col-icon" /> {t('results_strong_topics')}</h3>
            {freeTopics.length > 0 ? (
              freeTopics.map((tp, i) => <TopicCard topic={tp} key={i} />)
            ) : (
              <div className="topics__empty">{t('results_strong_topics_empty')}</div>
            )}
            {paidTopics.length > 0 && (
              <ProBlur isPro={isPro} label={`+${paidTopics.length} ${t('results_more_topics')}`}>
                {paidTopics.map((tp, i) => <TopicCard topic={tp} key={i} />)}
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
            <p className="results__cta-sub">{t('results_cta_sub_site')}</p>
            <a href={`https://app.geoni.ai/dashboard?tab=tickets&target=${encodeURIComponent(domain || '')}`} className="results__cta-btn" target="_blank" rel="noopener">
              {t('results_view_packages')}
            </a>
          </div>
        </div>
      </div>

      <div className="results__sticky-bar">
        <span className="results__sticky-text">{t('results_sticky_upgrade')}</span>
        <a href={`https://app.geoni.ai/dashboard?tab=tickets&target=${encodeURIComponent(domain || '')}`} className="results__sticky-btn" target="_blank" rel="noopener">
          {t('results_view_packages')}
        </a>
      </div>
    </>
  )
}
