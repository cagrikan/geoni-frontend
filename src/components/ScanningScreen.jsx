import { CircleCheck, Loader2 } from 'lucide-react'
import GeoniMark from '../GeoniMark'

const SITE_STEPS = [
  { key: 'queued', label: 'Sıraya alındı' },
  { key: 'crawling', label: 'Site taranıyor' },
  { key: 'indexing', label: 'Dizin kontrol ediliyor' },
  { key: 'scoring', label: 'Skor hesaplanıyor' },
]

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
      <div className="scan-screen__brand">
        <GeoniMark />
        <span className="landing__logo">GEONI</span>
      </div>

      <div className="scan-screen__center">
        <Pulse />
        <h1 className="scan-screen__title">
          {kind === 'site' ? <>{target} <em>taranıyor</em></> : <><em>{target}</em> için AI motorları sorgulanıyor</>}
        </h1>
        <p className="scan-screen__sub">Claude, ChatGPT, Gemini{kind === 'brand' ? ' ve Perplexity' : ''} gerçek zamanlı çalışıyor</p>

        <div className="scan-steps">
          {steps.length > 0
            ? steps.map((s, i) => <StepRow key={i} label={s.label} state={s.state} />)
            : <StepRow label="Başlatılıyor…" state="active" />}
        </div>

        <p className="scan-screen__eta">Ortalama süre ~30 saniye</p>
        {onCancel && (
          <button type="button" className="scan-screen__cancel" onClick={onCancel}>Vazgeç</button>
        )}
      </div>
    </div>
  )
}
