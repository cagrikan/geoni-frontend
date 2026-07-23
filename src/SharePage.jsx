import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import GeoniMark from './GeoniMark'
import { useLanguage } from './lib/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

function scoreColor(score) {
  if (score >= 65) return 'var(--good)'
  if (score >= 40) return 'var(--warn)'
  return 'var(--bad)'
}

// ResultsPage'deki ScoreGauge ile ayni gorsel (ayni .score-gauge CSS'i);
// paylasim kartinda tek basina kullanilabilsin diye burada kucuk kopya.
function ScoreGauge({ score, label }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference
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

/* Viral paylasim landing'i: birine gonderilen geoni.ai/s/<jobId> linki
   tarayicida (ya da app yuklu degilse iOS Safari'de) buraya duser. Backend
   /api/share/<id> PII'siz minimal skor karti doner (job_id, type, label,
   score, recognized, created_at). Amac: alan kisi skoru gorsun + "kendi
   siteni tara" CTA'siyla donguye girsin. Kayitli olmayan/silinmis id ->
   dostane "bulunamadi" + yine ayni CTA. */
export default function SharePage({ shareId, onScanOwn, onHome }) {
  const { t, language } = useLanguage()
  const [state, setState] = useState('loading')   // loading | ok | notfound
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    setState('loading')
    fetch(`${API_URL}/api/share/${encodeURIComponent(shareId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return
        if (d && (typeof d.score === 'number' || d.recognized != null)) { setData(d); setState('ok') }
        else setState('notfound')
      })
      .catch(() => { if (alive) setState('notfound') })
    return () => { alive = false }
  }, [shareId])

  // Sekme basligini paylasilan hedefe gore ayarla (sosyal onizleme SSR
  // gerektirir; bu en azindan sekme/gecmis basligini duzeltir).
  useEffect(() => {
    if (state === 'ok' && data?.label) {
      document.title = `${data.label} · ${data.score != null ? `${data.score}/100 · ` : ''}GEONI`
    }
    return () => { document.title = t('page_title') }
  }, [state, data, language, t])

  const dateStr = data?.created_at
    ? new Date(data.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const isWeb = data?.type === 'web'

  return (
    <div className="share-page">
      <button type="button" className="share-page__brand" onClick={onHome} aria-label={t('share_page_what')}>
        <span className="geoni-mark-wrap"><GeoniMark /></span>
        <span className="share-page__brand-name">GEONI</span>
      </button>

      <div className="share-page__card">
        {state === 'loading' && (
          <div className="share-page__loading">
            <div className="spinner" />
            <p>{t('share_page_loading')}</p>
          </div>
        )}

        {state === 'notfound' && (
          <>
            <span className="share-page__kicker">{t('share_page_kicker')}</span>
            <h1 className="share-page__title">{t('share_page_notfound_title')}</h1>
            <p className="share-page__sub">{t('share_page_notfound_sub')}</p>
            <button type="button" className="share-page__cta" onClick={onScanOwn}>
              <Sparkles size={16} strokeWidth={1.75} /> {t('share_page_cta')} <ArrowRight size={16} strokeWidth={1.75} />
            </button>
          </>
        )}

        {state === 'ok' && (
          <>
            <span className="share-page__kicker">{t('share_page_kicker')}</span>
            <div className="share-page__label">{data.label}</div>

            {data.score != null ? (
              <ScoreGauge score={data.score} label={t('share_page_score_label')} />
            ) : (
              <div className={`share-page__recog ${data.recognized ? 'is-yes' : 'is-no'}`}>
                {data.recognized ? t('share_page_recognized') : t('share_page_not_recognized')}
              </div>
            )}

            <p className="share-page__sub">
              {t(isWeb ? 'share_page_web_sub' : 'share_page_brand_sub', { label: data.label })}
            </p>

            <button type="button" className="share-page__cta" onClick={onScanOwn}>
              <Sparkles size={16} strokeWidth={1.75} /> {t('share_page_cta')} <ArrowRight size={16} strokeWidth={1.75} />
            </button>
            <button type="button" className="share-page__link" onClick={onHome}>{t('share_page_what')}</button>

            {dateStr && <div className="share-page__date">{dateStr}</div>}
          </>
        )}
      </div>
    </div>
  )
}
