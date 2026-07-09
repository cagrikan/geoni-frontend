import { Wrench, Braces, Bot, Landmark, FileText, Link2 } from 'lucide-react'

const TICKET_TYPE_ICONS = {
  schema_setup: Braces,
  llms_robots: Bot,
  wikidata_entity: Landmark,
  content_package: FileText,
  citation_placement: Link2,
}

/* Ilerleme artik listeleme yanitindan geliyor (tasks_done/tasks_total) -
   eskiden her kart kendi /tasks istegini atiyordu, pano N bilet icin N
   yetki-kontrollu istek bekliyordu. */
export default function TicketCard({ ticket, onClick, subtitle }) {
  const Icon = TICKET_TYPE_ICONS[ticket.ticket_type_key] || Wrench
  const total = ticket.tasks_total || 0
  const done = ticket.tasks_done || 0

  return (
    <div className="ticket-card" onClick={onClick}>
      <div className="ticket-card__icon">
        <Icon size={15} strokeWidth={1.75} />
        {ticket.has_unread && <span className="ticket-unread-dot" />}
      </div>
      <div className="ticket-card__body">
        <span className="ticket-card__id">#{ticket.id}</span>
        <div className="ticket-card__name">{ticket.ticket_type_name}</div>
        <div className="ticket-card__sub">{subtitle || ticket.target || '\u2014'}</div>
        {total > 0 && (
          <div className={`ticket-card__progress ${done === total ? 'ticket-card__progress--done' : ''}`}>
            <div className="ticket-card__progress-bar"><div className="ticket-card__progress-fill" style={{ width: `${(done / total) * 100}%` }} /></div>
            <span>{done}/{total}</span>
          </div>
        )}
      </div>
    </div>
  )
}
