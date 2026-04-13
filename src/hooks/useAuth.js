import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    loading:  session === undefined,
    signIn:   (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut:  () => supabase.auth.signOut(),
  }
}
