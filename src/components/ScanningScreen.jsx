import { CircleCheck, Loader2 } from 'lucide-react'
import GeoniMark from '../GeoniMark'
import { useLanguage } from '../lib/LanguageContext'

function Pulse() {
  return (
    <svg className="scan-pulse" viewBox="0 0 240 240">
      <circle className="scan-pulse__ring scan-pulse__ring--1" cx="120" cy="120" r="50" fill="none" strokeWidth="1.5" />
      <circle className="scan-pulse__ring scan-pulse__ring--2" cx="120" cy="120" r="50" fill="none" strokeWidth="1.5" />
      <circle className="scan-pulse__ring scan-pulse__ring--3" cx="120" cy="120" r="50" fill="none" strokeWidth="1.5" />
      <circle className="scan-pulse__core" cx="120" cy="120" r="8" />
    </svg>
  )
}

function StepRow({ label, state }) {
  return (
    <div className={`scan-step scan-step--${state}`}>
      <span className="scan-step__icon">
        {state === 'done' && <CircleCheck size={16} strokeWidth={2} />}
        {state === 'active' && <Loader2 size={16} strokeWidth={2} className="scan-step__spin" />}
        {state === 'pending' && <span className="scan-step__dot" />}
      </span>
      <span className="scan-step__label">{label}</span>
    </div>
  )
}

// Her iki mod da artik SSE ile canli mesaj listesi alir (bkz. App.jsx).
// SSE baglanamazsa (ör. desteklenmeyen taraeyici) site taramasi icin sabit
// 4 asamalik statusKey tabanli listeye duser.
export default function ScanningScreen({ kind, target, statusKey, progressLog = [], onCancel }) {
  const { t, language } = useLanguage()

  const SITE_STEPS = [
    { key: 'queued', label: t('scan_step_queued') },
    { key: 'crawling', label: t('scan_step_crawling') },
    { key: 'indexing', label: t('scan_step_indexing') },
    { key: 'scoring', label: t('scan_step_scoring') },
  ]

  const steps = progressLog.length > 0
    ? progressLog.map((msg, i) => ({ label: msg, state: i < progressLog.length - 1 ? 'done' : 'active' }))
    : kind === 'site'
      ? SITE_STEPS.map((s, i) => {
          const curIdx = SITE_STEPS.findIndex(x => x.key === statusKey)
          return { label: s.label, state: i < curIdx ? 'done' : i === curIdx ? 'active' : 'pending' }
        })
      : []

  return (
    <div className="scan-screen">
      <button className="scan-screen__brand scan-screen__brand--clickable" onClick={onCancel} type="button">
        <GeoniMark />
        <span className="landing__logo">geoni</span>
      </button>

      <div className="scan-screen__center">
        <Pulse />
        <h1 className="scan-screen__title">
          {kind === 'site' ? (
            <>{target} <em>{t('scan_title_site_suffix')}</em></>
          ) : language === 'en' ? (
            <>{t('scan_title_brand_prefix')} <em>{target}</em></>
          ) : (
            <><em>{target}</em> {t('scan_title_brand_prefix')}</>
          )}
        </h1>
        <p className="scan-screen__sub">Claude, ChatGPT, Gemini{kind === 'brand' ? ' + Perplexity' : ''} {t('scan_sub')}</p>

        <div className="scan-steps">
          {steps.length > 0
            ? steps.map((s, i) => <StepRow key={i} label={s.label} state={s.state} />)
            : <StepRow label={t('scan_starting')} state="active" />}
        </div>

        <p className="scan-screen__eta">{t('scan_eta')}</p>
        {onCancel && (
          <button type="button" className="scan-screen__cancel" onClick={onCancel}>{t('scan_cancel')}</button>
        )}
      </div>
    </div>
  )
}
