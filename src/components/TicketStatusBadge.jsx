export const TICKET_STATUS_KEY = {
  open: 'ticket_status_open', assigned: 'ticket_status_assigned', in_progress: 'ticket_status_in_progress',
  submitted: 'ticket_status_submitted', verified: 'ticket_status_verified', rejected: 'ticket_status_rejected',
  disputed: 'ticket_status_disputed',
}

export default function TicketStatusBadge({ status, t }) {
  return <span className={`ticket-status ticket-status--${status}`}>{t(TICKET_STATUS_KEY[status] || status)}</span>
}
