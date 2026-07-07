import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function ConfirmDialog({ open, title, message, confirmLabel, danger = true, onConfirm, onCancel }) {
  const { t } = useLanguage()
  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-dialog__icon ${danger ? 'confirm-dialog__icon--danger' : ''}`}>
          <AlertTriangle size={20} strokeWidth={1.5} />
        </div>
        {title && <div className="confirm-dialog__title">{title}</div>}
        <div className="confirm-dialog__message">{message}</div>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel" onClick={onCancel}>{t('confirm_cancel')}</button>
          <button type="button" className={`confirm-dialog__confirm ${danger ? 'confirm-dialog__confirm--danger' : ''}`} onClick={onConfirm}>{confirmLabel || t('confirm_ok')}</button>
        </div>
      </div>
    </div>
  )
}
