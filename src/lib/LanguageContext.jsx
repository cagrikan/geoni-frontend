import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('geoni_lang') || 'tr'
    } catch {
      return 'tr'
    }
  })

  useEffect(() => {
    try { localStorage.setItem('geoni_lang', language) } catch { /* ignore */ }
  }, [language])

  const setLanguage = (lang) => setLanguageState(lang)
  const toggleLanguage = () => setLanguageState(l => (l === 'tr' ? 'en' : 'tr'))

  const t = (key) => {
    const dict = translations[language] || translations.tr
    return dict[key] ?? translations.tr[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
