import { useLanguage } from '../lib/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="lang-switcher">
      <button
        type="button"
        className={`lang-switcher__btn ${language === 'tr' ? 'lang-switcher__btn--active' : ''}`}
        onClick={() => setLanguage('tr')}
      >
        TR
      </button>
      <button
        type="button"
        className={`lang-switcher__btn ${language === 'en' ? 'lang-switcher__btn--active' : ''}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  )
}
