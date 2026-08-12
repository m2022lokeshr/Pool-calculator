import type { User } from '@supabase/supabase-js'

type AnonymousUser = User & { is_anonymous?: boolean }

export function isAnonymousUser(user: User | null | undefined) {
  if (!user) return false
  const candidate = user as AnonymousUser
  return Boolean(candidate.is_anonymous || user.app_metadata?.provider === 'anonymous')
}

export function isOrganizerUser(user: User | null | undefined) {
  return Boolean(user && !isAnonymousUser(user))
}
