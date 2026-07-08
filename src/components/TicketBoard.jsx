import TicketCard from './TicketCard'

// Surukle-birak yok - durum degisimi zaten mevcut buton eylemleriyle
// oluyor (ata/basla/teslim et/onayla), kart o eylemden sonra otomatik
// dogru sutuna geciyor (React state yeniden render ediyor).
export default function TicketBoard({ tickets, columns, authedFetch, onCardClick, subtitleFor }) {
  return (
    <div className="ticket-board">
      {columns.map((col) => {
        const colTickets = tickets.filter((tk) => tk.status === col.key)
        return (
          <div key={col.key} className="ticket-board__col">
            <div className="ticket-board__col-head">
              <span>{col.label}</span>
              <span className="ticket-board__col-count">{colTickets.length}</span>
            </div>
            <div className="ticket-board__col-body">
              {colTickets.length === 0 ? (
                <div className="ticket-board__empty">—</div>
              ) : colTickets.map((tk) => (
                <TicketCard
                  key={tk.id}
                  ticket={tk}
                  authedFetch={authedFetch}
                  onClick={() => onCardClick(tk)}
                  subtitle={subtitleFor?.(tk)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
