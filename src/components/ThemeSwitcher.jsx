import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="lang-switcher">
      <button
        type="button"
        className={`lang-switcher__btn ${theme === 'dark' ? 'lang-switcher__btn--active' : ''}`}
        onClick={() => setTheme('dark')}
      >
        <Moon size={13} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={`lang-switcher__btn ${theme === 'light' ? 'lang-switcher__btn--active' : ''}`}
        onClick={() => setTheme('light')}
      >
        <Sun size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
