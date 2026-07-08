import { useState, useRef } from 'react'
import { FileEdit } from 'lucide-react'
import TicketChecklist from './TicketChecklist'
import TicketThread from './TicketThread'

export default function TicketJobCard({ ticket, canEdit, currentUserId, authedFetch, t, language }) {
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
  const [progress, setProgress] = useState(null)
  const threadRef = useRef(null)

  const useTemplate = () => {
    if (!ticket.delivery_template) return
    const filled = ticket.delivery_template.replaceAll('{target}', ticket.target || '')
    threadRef.current?.setBody(filled)
  }

  const allDone = progress && progress.done === progress.total

  return (
    <div className="ticket-job-card">
      <div className="ticket-job-card__meta">
        <span>{t('ticket_job_opened')}: {formatDate(ticket.created_at)}</span>
        {ticket.verified_at && <span>{t('ticket_job_finished')}: {formatDate(ticket.verified_at)}</span>}
      </div>
      <TicketChecklist
        ticketId={ticket.id}
        canEdit={canEdit}
        authedFetch={authedFetch}
        t={t}
        onProgress={(done, total) => setProgress({ done, total })}
      />
      {canEdit && allDone && ticket.delivery_template && (
        <button type="button" className="ticket-job-card__template-btn" onClick={useTemplate}>
          <FileEdit size={14} strokeWidth={1.75} /> {t('ticket_job_use_template')}
        </button>
      )}
      <TicketThread ref={threadRef} ticketId={ticket.id} currentUserId={currentUserId} authedFetch={authedFetch} t={t} />
    </div>
  )
}
