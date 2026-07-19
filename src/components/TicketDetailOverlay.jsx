import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Copy, Check, FileText, FileEdit, Wrench, Braces, Bot, Landmark, Link2 } from 'lucide-react'
import TicketThread from './TicketThread'
import TicketChecklist from './TicketChecklist'
import TicketStatusBadge from './TicketStatusBadge'

const TICKET_TYPE_ICONS = {
  schema_setup: Braces,
  llms_robots: Bot,
  wikidata_entity: Landmark,
  content_package: FileText,
  citation_placement: Link2,
}

/* Iki kolonlu bilet detayi (onaylanan v2 onizlemesi, Jira/Linear deseni):
   solda konusma, sagda surec zaman cizelgesi + is kirilimi + dosyalar +
   detaylar. Rol aksiyonlari (extraActions) Durum blogunun hemen altinda. */
// B3-1: teslim edilen hizmetin ETKISI — baseline (satin alindiginda) vs son tarama.
// "dosya urettik" -> "gorunurlugun artti" koprusu; hizmetin ROI kaniti.
function ImpactBlock({ ticketId, authedFetch, t }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let cancelled = false
    authedFetch(`/api/tickets/${ticketId}/impact`)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { /* sessiz: impact opsiyonel */ })
    return () => { cancelled = true }
  }, [ticketId])
  if (!data || !data.baseline || typeof data.baseline.score !== 'number') return null
  const { baseline, latest, delta } = data
  const up = delta != null && delta >= 0
  return (
    <div className="tdo__block tdo__impact">
      <h3>{t('ticket_impact_title')}</h3>
      {latest && delta != null ? (
        <div className="tdo__impact-delta">
          <span className="tdo__impact-scores">{baseline.score} → {latest.score}</span>
          <span className={`tdo__impact-badge ${up ? 'up' : 'down'}`}>{up ? '+' : ''}{delta}</span>
        </div>
      ) : (
        <p className="tdo__impact-hint">
          {t('ticket_impact_rescan')} <span className="tdo__impact-base">({t('ticket_impact_baseline')}: {baseline.score})</span>
        </p>
      )}
    </div>
  )
}

export default function TicketDetailOverlay({ ticket, canEdit, currentUserId, authedFetch, t, language, onBack, extraActions, contextLabel }) {
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null)
  const [copied, setCopied] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [progress, setProgress] = useState(null)
  const threadRef = useRef(null)

  const Icon = TICKET_TYPE_ICONS[ticket.ticket_type_key] || Wrench

  const refCode = ticket.ref_code || `BILET-${ticket.id}`
  const copyId = () => {
    try {
      navigator.clipboard.writeText(refCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* pano erisimi engellenmis olabilir */ }
  }

  // Surec zaman cizelgesi: DB'de zaten duran ama hic gosterilmeyen
  // created_at/assigned_at/submitted_at/verified_at alanlarindan.
  const steps = [
    { key: 'created', label: t('ticket_tl_created'), at: ticket.created_at },
    { key: 'assigned', label: t('ticket_tl_assigned'), at: ticket.assigned_at },
    {
      key: 'submitted',
      label: ticket.status === 'disputed' ? t('ticket_tl_disputed') : t('ticket_tl_submitted'),
      at: ticket.submitted_at,
    },
    { key: 'verified', label: t('ticket_tl_verified'), at: ticket.verified_at },
  ]
  const lastDoneIdx = steps.reduce((acc, s, i) => (s.at ? i : acc), -1)

  const useTemplate = () => {
    if (!ticket.delivery_template) return
    threadRef.current?.setBody(ticket.delivery_template.replaceAll('{target}', ticket.target || ''))
  }
  const allDone = progress && progress.done === progress.total

  // Musteriye ic checklist yerine hizmete ozel ust-duzey adimlar gosterilir
  // (mobil ile ayni); detayli is kirilimi yalnizca admin/uzmanda (canEdit).
  const stepsRaw = t(`ticket_steps_${ticket.ticket_type_key}`)
  const customerSteps = stepsRaw && stepsRaw.includes('|') ? stepsRaw.split('|') : []

  return (
    <div className="tdo">
      <div className="tdo__topbar">
        <button type="button" className="tdo__back" onClick={onBack}>
          <ArrowLeft size={15} strokeWidth={1.75} /> {contextLabel || t('ticket_detail_back')}
        </button>
        <span className="tdo__id">
          {refCode}
          <button type="button" className="tdo__copy" onClick={copyId} title={t('ticket_detail_copy')}>
            {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.75} />}
          </button>
        </span>
      </div>

      <div className="tdo__wrap">
        <div className="tdo__main">
          <div className="tdo__head">
            <span className="tdo__ico"><Icon size={16} strokeWidth={1.5} /></span>
            <div>
              <h1 className="tdo__title">{ticket.ticket_type_name}</h1>
              {ticket.target && <div className="tdo__target">{ticket.target}</div>}
            </div>
          </div>

          {canEdit && allDone && ticket.delivery_template && (
            <button type="button" className="ticket-job-card__template-btn" onClick={useTemplate}>
              <FileEdit size={14} strokeWidth={1.75} /> {t('ticket_job_use_template')}
            </button>
          )}

          <TicketThread
            ref={threadRef}
            ticketId={ticket.id}
            currentUserId={currentUserId}
            authedFetch={authedFetch}
            t={t}
            onMessages={(msgs) => setAttachments(msgs.filter((m) => m.attachment_url))}
          />
        </div>

        <aside className="tdo__side">
          <div className="tdo__block">
            <div className="tdo__status-row">
              <h3>{t('ticket_detail_status')}</h3>
              <TicketStatusBadge status={ticket.status} t={t} />
            </div>
            {extraActions}
          </div>

          {attachments.length > 0 && (
            <div className="tdo__block tdo__block--files">
              <h3>{t('ticket_detail_files')}</h3>
              <div className="tdo__files">
                {attachments.map((m) => (
                  <a key={m.id} href={m.attachment_url} target="_blank" rel="noopener noreferrer" download>
                    <FileText size={15} strokeWidth={1.6} />
                    <span>{m.attachment_name || t('ticket_thread_attachment')}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="tdo__block">
            <h3>{t('ticket_detail_process')}</h3>
            <div className="tdo__tl">
              {steps.map((s, i) => (
                <div key={s.key} className={`tdo__tl-step ${s.at ? 'tdo__tl-step--done' : ''} ${i === lastDoneIdx && !ticket.verified_at ? 'tdo__tl-step--now' : ''}`}>
                  <span className="tdo__tl-dot" />
                  <div>
                    <span className="tdo__tl-label">{s.label}</span>
                    {s.at && <time>{fmt(s.at)}</time>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {['submitted', 'verified', 'disputed'].includes(ticket.status) && (
            <ImpactBlock ticketId={ticket.id} authedFetch={authedFetch} t={t} />
          )}

          {canEdit ? (
            <div className="tdo__block">
              <h3>{t('ticket_checklist_title')}{progress ? ` — ${progress.done}/${progress.total}` : ''}</h3>
              <TicketChecklist
                ticketId={ticket.id}
                canEdit={canEdit}
                authedFetch={authedFetch}
                t={t}
                bare
                onProgress={(done, total) => setProgress({ done, total })}
              />
            </div>
          ) : customerSteps.length > 0 ? (
            <div className="tdo__block">
              <h3>{t('ticket_steps_title')}</h3>
              <ol className="tdo__steps">
                {customerSteps.map((s, i) => (
                  <li key={i}><span className="tdo__steps-num">{i + 1}</span><span>{s}</span></li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="tdo__block">
            <h3>{t('ticket_detail_details')}</h3>
            <div className="tdo__kv"><span>{t('ticket_detail_expert')}</span><span>{(() => {
              const isAuto = ['llms_robots', 'schema_setup'].includes(ticket.ticket_type_key)
              if (!ticket.assigned_expert_id) return isAuto ? t('ticket_expert_auto') : '—'
              // Musteriye uzmanin kimligini (e-posta) ASLA gosterme; sadece admin/uzman gorur.
              return canEdit ? (ticket.expert_email || '—') : t('ticket_expert_generic')
            })()}</span></div>
            <div className="tdo__kv"><span>{t('dash_credit_unit')}</span><span>{ticket.token_cost}</span></div>
            <div className="tdo__kv"><span>{t('ticket_detail_no')}</span><span>{refCode}</span></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
