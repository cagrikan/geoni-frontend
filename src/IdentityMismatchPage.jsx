import { TriangleAlert } from 'lucide-react'
import GeoniMark from './GeoniMark'
import LanguageSwitcher from './components/LanguageSwitcher'
import { useLanguage } from './lib/LanguageContext'

export default function IdentityMismatchPage({ result, onReset }) {
  const { t } = useLanguage()
  const { name, match_score } = result

  return (
    <>
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onReset}>
          <GeoniMark />
          <span className="landing__logo">geoni</span>
        </button>
        <div className="nav-auth">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="results">
        <div className="identity-mismatch">
          <TriangleAlert size={40} strokeWidth={1.5} className="identity-mismatch__icon" />
          <h1 className="identity-mismatch__title">{t('identity_title')}</h1>
          <p className="identity-mismatch__desc">
            <strong>{name}</strong> {t('identity_desc_1')}
          </p>
          {match_score !== undefined && (
            <div className="identity-mismatch__score">
              {t('identity_match_score')} <strong>{match_score}/100</strong>
            </div>
          )}
          <p className="identity-mismatch__hint">
            {t('identity_hint')}
          </p>
          <button className="identity-mismatch__btn" onClick={onReset}>
            {t('identity_retry')}
          </button>
        </div>
      </div>
    </>
  )
}
