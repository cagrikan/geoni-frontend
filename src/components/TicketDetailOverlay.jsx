import { useState, useRef } from 'react'
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
export default function TicketDetailOverlay({ ticket, canEdit, currentUserId, authedFetch, t, language, onBack, extraActions }) {
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null)
  const [copied, setCopied] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [progress, setProgress] = useState(null)
  const threadRef = useRef(null)

  const Icon = TICKET_TYPE_ICONS[ticket.ticket_type_key] || Wrench

  const copyId = () => {
    try {
      navigator.clipboard.writeText(`BILET-${ticket.id}`)
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

  return (
    <div className="tdo">
      <div className="tdo__topbar">
        <button type="button" className="tdo__back" onClick={onBack}>
          <ArrowLeft size={15} strokeWidth={1.75} /> {t('ticket_detail_back')}
        </button>
        <span className="tdo__id">
          BILET-{ticket.id}
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

          {attachments.length > 0 && (
            <div className="tdo__block">
              <h3>{t('ticket_detail_files')}</h3>
              <div className="tdo__files">
                {attachments.map((m) => (
                  <a key={m.id} href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                    <FileText size={13} strokeWidth={1.5} /> {m.attachment_name || t('ticket_thread_attachment')}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="tdo__block">
            <h3>{t('ticket_detail_details')}</h3>
            <div className="tdo__kv"><span>{t('ticket_detail_expert')}</span><span>{ticket.ticket_type_key === 'llms_robots' && !ticket.assigned_expert_id ? t('ticket_expert_auto') : (ticket.expert_email || '—')}</span></div>
            <div className="tdo__kv"><span>{t('dash_credit_unit')}</span><span>{ticket.token_cost}</span></div>
            <div className="tdo__kv"><span>{t('ticket_detail_no')}</span><span>#{ticket.id}</span></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
