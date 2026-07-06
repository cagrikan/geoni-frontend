import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'

// Tek ikonlu toggle: ikon her zaman gidilecek temayi gosterir (koydaysak
// gunes = "acığa gec", acıktaysak ay = "koyuya gec") - iki ayri buton yerine
// yer kaplamayan tek bir buton.
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}
