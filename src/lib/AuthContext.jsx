import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
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
      await supabase.from('profiles').update({
        utm_source: acq.utm_source,
        utm_medium: acq.utm_medium,
        utm_campaign: acq.utm_campaign,
        signup_referrer: acq.signup_referrer,
      }).eq('id', userId)
      localStorage.removeItem('geoni_acquisition')
    } catch { /* ignore */ }
  }

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })

  const signInWithApple = () => supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })

  const signInWithLinkedIn = () => supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })

  const signOut = () => supabase.auth.signOut()

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
