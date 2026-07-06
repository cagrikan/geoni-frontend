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

  const t = (key, params) => {
    const dict = translations[language] || translations.tr
    let str = dict[key] ?? translations.tr[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, v)
      }
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
