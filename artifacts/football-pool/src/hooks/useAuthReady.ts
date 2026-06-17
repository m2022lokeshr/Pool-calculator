import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.ts'

export function useAuthReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(() => setReady(true))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  return ready
}