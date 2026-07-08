import { useState, useEffect } from 'react'
import { Wrench, Braces, Bot, Landmark, FileText, Link2 } from 'lucide-react'

const TICKET_TYPE_ICONS = {
  schema_setup: Braces,
  llms_robots: Bot,
  wikidata_entity: Landmark,
  content_package: FileText,
  citation_placement: Link2,
}

export default function TicketCard({ ticket, authedFetch, onClick, subtitle }) {
  const [progress, setProgress] = useState(null)
  const Icon = TICKET_TYPE_ICONS[ticket.ticket_type_key] || Wrench

  useEffect(() => {
    authedFetch(`/api/tickets/${ticket.id}/tasks`)
      .then((tasks) => { if (tasks.length) setProgress({ done: tasks.filter((t) => t.is_done).length, total: tasks.length }) })
      .catch(() => {})
  }, [ticket.id])

  return (
    <div className="ticket-card" onClick={onClick}>
      <div className="ticket-card__head">
        <div className="ticket-card__icon">
          <Icon size={15} strokeWidth={1.75} />
          {ticket.has_unread && <span className="ticket-unread-dot" />}
        </div>
        <span className="ticket-card__id">#{ticket.id}</span>
      </div>
      <div className="ticket-card__name">{ticket.ticket_type_name}</div>
      <div className="ticket-card__sub">{subtitle || ticket.target || '—'}</div>
      {progress && (
        <div className="ticket-card__progress">
          <div className="ticket-card__progress-bar"><div className="ticket-card__progress-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
          <span>{progress.done}/{progress.total}</span>
        </div>
      )}
    </div>
  )
}
