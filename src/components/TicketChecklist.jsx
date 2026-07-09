import { useState, useEffect } from 'react'
import { CheckSquare, Square, HelpCircle } from 'lucide-react'

export default function TicketChecklist({ ticketId, canEdit, authedFetch, t, onProgress, bare = false }) {
  const [tasks, setTasks] = useState(null)
  const [openHowTo, setOpenHowTo] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () =>
    authedFetch(`/api/tickets/${ticketId}/tasks`)
      .then((res) => {
        setTasks(res)
        if (res.length) onProgress?.(res.filter((t) => t.is_done).length, res.length)
      })
      .catch(() => setTasks([]))

  useEffect(() => { load() }, [ticketId])

  const toggle = async (task) => {
    if (!canEdit || busyId) return
    setBusyId(task.id)
    try {
      await authedFetch(`/api/tickets/${ticketId}/tasks/${task.id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ done: !task.is_done }),
      })
      await load()
    } catch { /* kullanici tekrar deneyebilir */ }
    setBusyId(null)
  }

  if (tasks === null) return <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>
  if (tasks.length === 0) return null

  const doneCount = tasks.filter((tk) => tk.is_done).length

  return (
    <div className={`ticket-checklist ${bare ? 'ticket-checklist--bare' : ''}`}>
      {!bare && (
        <div className="ticket-checklist__head">
          <span>{t('ticket_checklist_title')}</span>
          <span className="ticket-checklist__progress">{doneCount}/{tasks.length}</span>
        </div>
      )}
      <div className="ticket-checklist__bar">
        <div className="ticket-checklist__bar-fill" style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
      </div>
      <ul className="ticket-checklist__list">
        {tasks.map((task) => (
          <li key={task.id} className={`ticket-checklist__item ${task.is_done ? 'ticket-checklist__item--done' : ''}`}>
            <button
              type="button"
              className="ticket-checklist__check"
              disabled={!canEdit || busyId === task.id}
              onClick={() => toggle(task)}
            >
              {task.is_done ? <CheckSquare size={16} strokeWidth={1.75} /> : <Square size={16} strokeWidth={1.75} />}
            </button>
            <span className="ticket-checklist__title">{task.title}</span>
            {canEdit && task.how_to && (
              <button
                type="button"
                className="ticket-checklist__howto-btn"
                onClick={() => setOpenHowTo(openHowTo === task.id ? null : task.id)}
                title={t('ticket_checklist_howto')}
              >
                <HelpCircle size={13} strokeWidth={1.75} />
              </button>
            )}
            {openHowTo === task.id && <div className="ticket-checklist__howto-pop">{task.how_to}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}
