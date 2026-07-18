import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext(null)

// Dil onceligi: (1) URL'deki ?lang= (geoni.ai -> app.geoni.ai gecisinde
// pazarlama sitesinden tasinan tercih), (2) daha once kaydedilmis secim,
// (3) tarayici dili (navigator.language). Boylece EN gezen yabanci ziyaretci
// "Create Free Account" deyince Turkce uygulamaya dusmez.
function detectInitialLang() {
  try {
    const urlLang = new URLSearchParams(window.location.search).get('lang')
    if (urlLang === 'tr' || urlLang === 'en') {
      try { localStorage.setItem('geoni_lang', urlLang) } catch { /* ignore */ }
      return urlLang
    }
    const stored = localStorage.getItem('geoni_lang')
    if (stored === 'tr' || stored === 'en') return stored
    const nav = (navigator.language || '').toLowerCase()
    return nav.startsWith('tr') ? 'tr' : 'en'
  } catch {
    return 'tr'
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLang)

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
