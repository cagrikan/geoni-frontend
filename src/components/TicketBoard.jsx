import { useState, useMemo } from 'react'
import TicketCard from './TicketCard'

// Surukle-birak yok - durum degisimi zaten mevcut buton eylemleriyle
// oluyor (ata/basla/teslim et/onayla), kart o eylemden sonra otomatik
// dogru sutuna geciyor (React state yeniden render ediyor).
//
// Masaustu: sabit genislikte sutunlar + yatay kaydirma (Linear/Trello/Jira
// deseni - auto-fit grid degil, dar ekranda sutunlar sikismak/kirilmak
// yerine kaydiriliyor).
// Mobil (<=760px, .dashboard__body ile ayni kirilim): yatay kaydirmali dar
// sutunlar yerine ust durum sekmeleri + secili duruma ait tam genislikte
// liste (Linear/Asana mobil deseni) - ikisi de ayni DOM'da, CSS ile
// gosterilip gizleniyor.
export default function TicketBoard({ tickets, columns, authedFetch, onCardClick, subtitleFor }) {
  const firstNonEmpty = useMemo(() => columns.find((c) => tickets.some((tk) => tk.status === c.key))?.key || columns[0]?.key, [columns, tickets])
  const [activeTab, setActiveTab] = useState(firstNonEmpty)
  const tab = columns.some((c) => c.key === activeTab) ? activeTab : firstNonEmpty

  return (
    <div className="ticket-board-wrap">
      <div className="ticket-status-tabs">
        {columns.map((col) => {
          const count = tickets.filter((tk) => tk.status === col.key).length
          return (
            <button
              key={col.key}
              type="button"
              className={`ticket-status-tab ${col.key === tab ? 'ticket-status-tab--active' : ''}`}
              onClick={() => setActiveTab(col.key)}
            >
              <span className={`ticket-status-tab__dot ticket-status-tab__dot--${col.key}`} />
              {col.label}
              <span className="ticket-status-tab__count">{count}</span>
            </button>
          )
        })}
      </div>
      <div className="ticket-mobile-list">
        {tickets.filter((tk) => tk.status === tab).length === 0 ? (
          <div className="ticket-board__empty">—</div>
        ) : tickets.filter((tk) => tk.status === tab).map((tk) => (
          <TicketCard key={tk.id} ticket={tk} authedFetch={authedFetch} onClick={() => onCardClick(tk)} subtitle={subtitleFor?.(tk)} />
        ))}
      </div>

      <div className="ticket-board">
        {columns.map((col) => {
          const colTickets = tickets.filter((tk) => tk.status === col.key)
          return (
            <div key={col.key} className="ticket-board__col">
              <div className="ticket-board__col-head">
                <span className={`ticket-status-tab__dot ticket-status-tab__dot--${col.key}`} />
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
    </div>
  )
}
