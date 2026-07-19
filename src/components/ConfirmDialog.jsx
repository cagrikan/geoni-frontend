import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function ConfirmDialog({ open, title, message, confirmLabel, danger = true, onConfirm, onCancel }) {
  const { t } = useLanguage()
  const confirmRef = useRef(null)

  // Erisilebilirlik (E10): ESC ile kapat + acilista fokusu diyaloga tasi.
  // Onceki fokusu kapaninca geri dondur. (TicketThread lightbox deseni.)
  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', onKey)
    confirmRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'confirm-dialog-title' : undefined}
        aria-label={title ? undefined : (typeof message === 'string' ? message : t('confirm_ok'))}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-dialog__icon ${danger ? 'confirm-dialog__icon--danger' : ''}`}>
          <AlertTriangle size={20} strokeWidth={1.5} />
        </div>
        {title && <div className="confirm-dialog__title" id="confirm-dialog-title">{title}</div>}
        <div className="confirm-dialog__message">{message}</div>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel" onClick={onCancel}>{t('confirm_cancel')}</button>
          <button ref={confirmRef} type="button" className={`confirm-dialog__confirm ${danger ? 'confirm-dialog__confirm--danger' : ''}`} onClick={onConfirm}>{confirmLabel || t('confirm_ok')}</button>
        </div>
      </div>
    </div>
  )
}
