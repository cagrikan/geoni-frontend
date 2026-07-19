import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// Supabase (~52KB gz) anonim landing ziyaretcisine pesin inmesin diye dinamik
// import ile tembel yukleniyor. Ilk cagirana kadar chunk hic cekilmez; sonraki
// cagrilar ayni promise'i paylasir (createClient tek kez calisir).
let _sbPromise = null
function getSupabase() {
  if (!_sbPromise) _sbPromise = import('./supabase').then((m) => m.supabase)
  return _sbPromise
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
        if (session?.user) fetchProfile(session.user.id)
        else setLoading(false)
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      })
      unsub = () => subscription.unsubscribe()
    })

    return () => { active = false; if (unsub) unsub() }
  }, [])

  const fetchProfile = async (userId) => {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data && !data.utm_source && !data.signup_referrer) {
      recordAcquisitionOnce(userId)
    }
    setProfile(data)
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
      user, profile, loading,
      signInWithGoogle, signInWithApple, signInWithLinkedIn,
      signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
