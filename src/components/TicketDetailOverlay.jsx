import { ArrowLeft } from 'lucide-react'
import TicketJobCard from './TicketJobCard'
import TicketStatusBadge from './TicketStatusBadge'

export default function TicketDetailOverlay({ ticket, canEdit, currentUserId, authedFetch, t, language, onBack, extraActions }) {
  return (
    <div className="ticket-detail-overlay">
      <button type="button" className="ticket-detail-overlay__back" onClick={onBack}>
        <ArrowLeft size={15} strokeWidth={1.75} /> {t('ticket_detail_back')}
      </button>
      <div className="ticket-detail-overlay__body">
        <h2 className="ticket-detail-overlay__title">#{ticket.id} · {ticket.ticket_type_name}</h2>
        <div className="ticket-detail-overlay__meta">
          <span>{ticket.target || '—'}</span>
          <TicketStatusBadge status={ticket.status} t={t} />
        </div>
        {extraActions}
        <TicketJobCard ticket={ticket} canEdit={canEdit} currentUserId={currentUserId} authedFetch={authedFetch} t={t} language={language} />
      </div>
    </div>
  )
}
