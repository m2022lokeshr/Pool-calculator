import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.https://szjjprqnolmkyencbepn.supabase.co
const supabaseAnonKey = import.meta.env.sb_publishable_8JUXfE1q2ctU7JIVLrp0GA_OUxJwhiK

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)