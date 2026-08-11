import { useLanguage } from '../lib/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="lang-switcher">
      {/* aria-pressed (M6): aktif dil yalniz CSS sinifiyla kodluydu — ekran
          okuyucu hangi dilin secili oldugunu bilemiyordu. */}
      <button
        type="button"
        className={`lang-switcher__btn ${language === 'tr' ? 'lang-switcher__btn--active' : ''}`}
        aria-pressed={language === 'tr'}
        onClick={() => setLanguage('tr')}
      >
        TR
      </button>
      <button
        type="button"
        className={`lang-switcher__btn ${language === 'en' ? 'lang-switcher__btn--active' : ''}`}
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  )
}
