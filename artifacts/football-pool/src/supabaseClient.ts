import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://szjjprqnolmkyencbepn.supabase.co'
const supabaseAnonKey = 'sb_publishable_8JUXfE1q2ctU7JIVLrp0GA_OUxJwhiK'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)