import { Lock } from 'lucide-react'
import { useLanguage } from './lib/LanguageContext'

// cta=true → kilit rozeti + "Tam raporu aç" butonu (birincil blur, sayfada BİR kez).
// cta=false → yalnız kilit rozeti (ikincil blur'lar; her yerde buton = spam görünümü).
export default function ProBlur({ children, label, isPro = false, onUpgrade, cta = true }) {
  const { t } = useLanguage()
  if (isPro) return <>{children}</>
  return (
    <div className="pro-blur">
      <div className="pro-blur__content">{children}</div>
      <div className="pro-blur__overlay">
        <div className="pro-blur__badge">
          <Lock size={14} strokeWidth={1.5} className="pro-blur__lock" />
          <span className="pro-blur__label">{label || t('problur_default_label')}</span>
          {cta && (
            <a
              href="https://app.geoni.ai/dashboard?tab=credits"
              className="pro-blur__btn"
              onClick={(e) => { if (onUpgrade) { e.preventDefault(); onUpgrade() } }}
            >
              {t('problur_upgrade')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
