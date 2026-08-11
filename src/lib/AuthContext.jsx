import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

// Supabase (~52KB gz) anonim landing ziyaretcisine pesin inmesin diye dinamik
// import ile tembel yukleniyor. Ilk cagirana kadar chunk hic cekilmez; sonraki
// cagrilar ayni promise'i paylasir (createClient tek kez calisir).
let _sbPromise = null
function getSupabase() {
  if (!_sbPromise) _sbPromise = import('./supabase').then((m) => m.supabase)
  return _sbPromise
}

// Kayit damgasi (ulke/saat dilimi/dil) yalnizca AuthCallback sayfasindan
// tetikleniyordu. Iki sorun vardi: (1) o sayfa `getSession()`i ANINDA cagiriyor,
// OAuth kod degisimi henuz bitmemisse session null donuyor ve damga hic
// atilmiyordu — 21 google kaydindan yalniz 1'i damgali, o da 2 Temmuz'dan;
// (2) callback yoluna hic ugramayan giris bicimleri kapsam disi kaliyordu.
// Damga artik oturumun olustugu HER yerde, `onAuthStateChange` ile tetikleniyor:
// zamanlama yarisindan etkilenmez. Uc idempotent ("yalniz bossa yaz",
// signup-country.js:57-60), bu yuzden tekrar cagrilmasi zararsiz; yine de
// TOKEN_REFRESHED selinde bosuna istek atmamak icin kullanici basina tek sefer
// calisir. Hata yutulur: giris akisi ASLA bloke olmaz.
// NOT: mobil (React Native) bu kodu calistirmaz — oradaki kayitlar hala
// damgasiz kalir, ayri bir degisiklik gerekir.
const _damgalananlar = new Set()
function kayitDamgasiGonder(session) {
  const uid = session?.user?.id
  if (!uid || _damgalananlar.has(uid)) return
  _damgalananlar.add(uid)
  fetch('/api/signup-country', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: navigator.language
    })
  }).catch(() => {})
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Profil cekimi gecici olarak basarisiz mi? (bos profil ile ayirt edilir)
  const [profileError, setProfileError] = useState(false)
  const retryTimer = useRef(null)

  useEffect(() => {
    // Zaten oturumu olan (localStorage'da sb-*-auth-token) kullanici ya da OAuth
    // donusu (/auth/callback, ya da URL'de access_token/code) haric anonim
    // ziyaretci icin supabase HIC yuklenmez — sadece landing gorur.
    let hasToken = false
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) { hasToken = true; break }
      }
    } catch { /* localStorage erisilemezse anonim varsay */ }
    const onAuthRoute =
      window.location.pathname.startsWith('/auth/callback') ||
      /access_token|refresh_token/.test(window.location.hash) ||
      /[?&]code=/.test(window.location.search)

    if (!hasToken && !onAuthRoute) {
      setLoading(false)
      return
    }

    let active = true
    let unsub = null
    getSupabase().then((supabase) => {
      if (!active) return
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) { kayitDamgasiGonder(session); fetchProfile(session.user.id) }
        else setLoading(false)
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) { kayitDamgasiGonder(session); fetchProfile(session.user.id) }
        else { setProfile(null); setLoading(false) }
      })
      unsub = () => subscription.unsubscribe()
    })

    return () => { active = false; if (unsub) unsub(); clearTimeout(retryTimer.current) }
  }, [])

  // Profil cekimi basarisiz oldugunda ONCEKI profil KORUNUR. Eskiden `data`
  // (hata durumunda null) dogrudan yaziliyordu: gecici bir ag hatasi ODEYEN
  // musteriyi "Ucretsiz Plan"a dusuruyor, rapor bolumlerini kilitliyordu —
  // ustelik ne hata mesaji ne de tekrar-dene vardi (2026-07-30 denetimi #5).
  const fetchProfile = async (userId, deneme = 0) => {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // PGRST116 = "satir donmedi": profil GERCEKTEN yok (yeni hesapta trigger
    // henuz yazmamis olabilir). Bu bir hata degil, bos durumdur.
    if (error && error.code !== 'PGRST116') {
      setProfileError(true)
      setLoading(false)
      if (deneme < 3) {
        clearTimeout(retryTimer.current)
        retryTimer.current = setTimeout(
          () => fetchProfile(userId, deneme + 1),
          1000 * 2 ** deneme,  // 1sn, 2sn, 4sn
        )
      }
      return
    }

    setProfileError(false)
    if (data && !data.utm_source && !data.signup_referrer) {
      recordAcquisitionOnce(userId)
    }
    setProfile(data ?? null)
    setLoading(false)
  }

  // App.jsx ilk ziyarette localStorage'a yazar; burada ilk girişte (profil
  // henuz bos ise) profile tek seferlik aktarilir. Zaten yazilmissa (ya da
  // hic acquisition verisi yoksa) sessizce hicbir sey yapmaz.
  const recordAcquisitionOnce = async (userId) => {
    try {
      const raw = localStorage.getItem('geoni_acquisition')
      if (!raw) return
      const acq = JSON.parse(raw)
      const supabase = await getSupabase()
      await supabase.from('profiles').update({
        utm_source: acq.utm_source,
        utm_medium: acq.utm_medium,
        utm_campaign: acq.utm_campaign,
        signup_referrer: acq.signup_referrer,
      }).eq('id', userId)
      // Referral: referred_by client tarafindan YAZILMAZ (spoof engeli) -> backend
      // ?ref kodunu server-authoritative dogrular (kod->referrer, self-ref + tek-atim).
      if (acq.ref_code) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          if (token) {
            await fetch(`${API_URL}/api/me/referred-by`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ ref_code: acq.ref_code }),
            })
          }
        } catch { /* referral basarisizsa signup'i etkilemesin */ }
      }
      localStorage.removeItem('geoni_acquisition')
    } catch { /* ignore */ }
  }

  const signInWithGoogle = async () => (await getSupabase()).auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })

  const signInWithApple = async () => (await getSupabase()).auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })

  const signInWithLinkedIn = async () => (await getSupabase()).auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })

  // Cikis sonrasi login ekrani degil pazarlama sitesi acilir
  const signOut = async () => {
    try { const supabase = await getSupabase(); await supabase.auth.signOut() } catch { /* oturum zaten dusmus olabilir */ }
    window.location.href = 'https://geoni.ai'
  }

  const refreshProfile = () => user && fetchProfile(user.id)

  return (
    <AuthContext.Provider value={{
      user, profile, loading, profileError,
      signInWithGoogle, signInWithApple, signInWithLinkedIn,
      signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
