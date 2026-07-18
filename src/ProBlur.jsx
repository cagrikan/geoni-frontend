import { Lock } from 'lucide-react'
import { useLanguage } from './lib/LanguageContext'

export default function ProBlur({ children, label, isPro = false, onUpgrade }) {
  const { t } = useLanguage()
  if (isPro) return <>{children}</>
  return (
    <div className="pro-blur">
      <div className="pro-blur__content">{children}</div>
      <div className="pro-blur__overlay">
        <div className="pro-blur__badge">
          <Lock size={14} strokeWidth={1.5} className="pro-blur__lock" />
          <span className="pro-blur__label">{label || t('problur_default_label')}</span>
          {/* Yukseltme: kullaniciyi pazarlama sitesine atmak yerine uygulama ici
              kredi sekmesine goturur (onUpgrade). onUpgrade yoksa fallback link
              yine uygulama ici dashboard kredi sekmesine gider (marketing degil). */}
          <a
            href="https://app.geoni.ai/dashboard?tab=credits"
            className="pro-blur__btn"
            onClick={(e) => { if (onUpgrade) { e.preventDefault(); onUpgrade() } }}
          >
            {t('problur_upgrade')}
          </a>
        </div>
      </div>
    </div>
  )
}
