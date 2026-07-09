import { useState } from 'react'
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
  const colStatuses = (c) => c.statuses || [c.key]
  const colTicketsOf = (c) => tickets.filter((tk) => colStatuses(c).includes(tk.status))
  const firstNonEmpty = columns.find((c) => colTicketsOf(c).length > 0)?.key || columns[0]?.key
  const [activeTab, setActiveTab] = useState(firstNonEmpty)
  const tab = columns.some((c) => c.key === activeTab) ? activeTab : firstNonEmpty

  return (
    <div className="ticket-board-wrap">
      <div className="ticket-status-tabs">
        {columns.map((col) => {
          const count = colTicketsOf(col).length
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
        {(() => {
          const activeCol = columns.find((c) => c.key === tab)
          const list = activeCol ? colTicketsOf(activeCol) : []
          return list.length === 0 ? (
          <div className="ticket-board__empty">—</div>
        ) : list.map((tk) => (
          <TicketCard key={tk.id} ticket={tk} authedFetch={authedFetch} onClick={() => onCardClick(tk)} subtitle={subtitleFor?.(tk)} />
        ))
        })()}
      </div>

      <div className="ticket-board">
        {columns.map((col) => {
          const colTickets = colTicketsOf(col)
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
