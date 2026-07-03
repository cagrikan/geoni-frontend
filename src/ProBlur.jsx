import { Lock } from 'lucide-react'
import { useLanguage } from './lib/LanguageContext'

export default function ProBlur({ children, label, isPro = false }) {
  const { t } = useLanguage()
  if (isPro) return <>{children}</>
  return (
    <div className="pro-blur">
      <div className="pro-blur__content">{children}</div>
      <div className="pro-blur__overlay">
        <div className="pro-blur__badge">
          <Lock size={14} strokeWidth={1.5} className="pro-blur__lock" />
          <span className="pro-blur__label">{label || t('problur_default_label')}</span>
          <a href="https://geoni.ai#paketler" className="pro-blur__btn" target="_blank" rel="noopener">
            {t('problur_upgrade')}
          </a>
        </div>
      </div>
    </div>
  )
}
