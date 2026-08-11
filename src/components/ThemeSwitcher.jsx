import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useLanguage } from '../lib/LanguageContext'

// Tek ikonlu toggle: ikon her zaman gidilecek temayi gosterir (koydaysak
// gunes = "acığa gec", acıktaysak ay = "koyuya gec") - iki ayri buton yerine
// yer kaplamayan tek bir buton.
// aria-label i18n'den gelir (M1): sabit Turkce metin, ekran okuyucudaki EN
// kullanicisina Turkce okunuyordu.
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'
  const label = isDark ? t('theme_to_light') : t('theme_to_dark')

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={label}
      aria-label={label}
    >
      {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}
