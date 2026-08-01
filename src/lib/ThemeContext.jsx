import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Kayitli tercih YOKSA isletim sistemini dinle. Sabit 'light' donuluyordu:
    // koyu temadaki kullanici uygulamayi bembeyaz aciyordu. Ayni kusur statik
    // sitede de vardi (index.html, theme-toggle.js) — hepsi birlikte duzeltildi.
    try {
      const kayitli = localStorage.getItem('geoni_theme')
      if (kayitli === 'light' || kayitli === 'dark') return kayitli
    } catch { /* localStorage kapali olabilir (gizli sekme, izin) */ }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Kullanici HENUZ secim yapmadiysa isletim sistemini canli izle. Onceden her
  // render'da localStorage'a yaziliyordu; bu, OS'ten turetilen degeri ilk
  // aciliste "kullanici tercihi" gibi muhurluyor ve kullanici telefonunu koyuya
  // alsa bile site acik kaliyordu.
  useEffect(() => {
    let secildi = false
    try { const k = localStorage.getItem('geoni_theme'); secildi = (k === 'light' || k === 'dark') } catch { /* yoksay */ }
    if (secildi || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const degisti = (e) => setThemeState(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', degisti)
    return () => mq.removeEventListener('change', degisti)
  }, [])

  // Yalniz ACIK secim kalici olur (butona basmak). Bkz. yukaridaki not.
  const setTheme = (t) => {
    try { localStorage.setItem('geoni_theme', t) } catch { /* ignore */ }
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
