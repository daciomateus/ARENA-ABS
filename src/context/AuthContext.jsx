import { useCallback, useEffect, useMemo, useState } from 'react'
import { appSiteUrl } from '../lib/env'
import { supabase } from '../lib/supabaseClient'
import { ensureProfileExists, getProfileById } from '../services/profileService'
import { AuthContext } from './auth-context'

function getEmailRedirectUrl() {
  const baseUrl = appSiteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  if (!baseUrl) return undefined
  return `${baseUrl.replace(/\/$/, '')}/quadras`
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null)
      return null
    }

    try {
      await ensureProfileExists(user)
      const profileData = await getProfileById(user.id)
      setProfile(profileData)
      return profileData
    } catch {
      setProfile(null)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(initialSession)
        setLoading(false)

        if (initialSession?.user) {
          loadProfile(initialSession.user)
        }
      } catch {
        if (mounted) setLoading(false)
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)

      if (nextSession?.user) {
        loadProfile(nextSession.user)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(async ({ nome, telefone, email, password }) => {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
        data: {
          nome,
          telefone,
        },
      },
    })

    if (response.error) throw response.error

    if (response.data.session && response.data.user) {
      await ensureProfileExists(response.data.user, { nome, telefone })
      loadProfile(response.data.user)
    }

    return response.data
  }, [loadProfile])

  const signIn = useCallback(async ({ email, password }) => {
    const response = await supabase.auth.signInWithPassword({ email, password })
    if (response.error) throw response.error
    return response.data
  }, [])

  const signOut = useCallback(async () => {
    setSession(null)
    setProfile(null)
    setLoading(false)

    const response = await supabase.auth.signOut({ scope: 'local' })
    if (response.error) throw response.error
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAuthenticated: Boolean(session?.user),
    isAdmin: profile?.tipo_usuario === 'admin',
    signUp,
    signIn,
    signOut,
    refreshProfile: () => loadProfile(session?.user ?? null),
  }), [session, profile, loading, loadProfile, signIn, signOut, signUp])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
