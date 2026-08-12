import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '../supabaseClient'
import { isOrganizerUser } from '../lib/authUser'

type PredictionPool = { id: string; name: string; invite_token: string; is_open: boolean; memberCount: number }
type LeaderboardRow = { rank_position: number; display_name: string; points: number }

export default function PickemPage() {
  const [pools, setPools] = useState<PredictionPool[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedPoolId, setCopiedPoolId] = useState<string | null>(null)
  const [leaderboardPoolId, setLeaderboardPoolId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isOrganizerUser(user)) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase.from('prediction_pools').select('id, name, invite_token, is_open').eq('owner_id', user.id).order('created_at', { ascending: false })
    if (error) setError(error.message)
    else {
      const poolsWithMemberCounts = await Promise.all((data ?? []).map(async (pool) => {
        const { count } = await supabase.from('prediction_members').select('id', { count: 'exact', head: true }).eq('prediction_pool_id', pool.id)
        return { ...pool, memberCount: count ?? 0 }
      }))
      setPools(poolsWithMemberCounts as PredictionPool[])
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const createPool = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isOrganizerUser(user)) return
    const { data: newPool, error } = await supabase.from('prediction_pools').insert({ owner_id: user.id, name: trimmedName }).select('id').single()
    if (error) { setError(error.message); return }
    // Link the new pool to all of the owner's tournament matches (same behavior as the backfill).
    const { data: matches } = await supabase.from('matches').select('id').eq('user_id', user.id)
    if (matches && matches.length > 0 && newPool) {
      await supabase.from('prediction_pool_matches').insert(
        matches.map((m) => ({ prediction_pool_id: newPool.id, match_id: m.id }))
      )
    }
    setName('')
    await load()
  }

  const copyInvite = async (pool: PredictionPool) => {
    const inviteUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/pick/${pool.invite_token}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedPoolId(pool.id)
    } catch {
      setError('Could not copy the invite link. Open the guest link and copy it from the browser address bar.')
    }
  }

  const setPoolOpen = async (pool: PredictionPool, isOpen: boolean) => {
    const { error } = await supabase.from('prediction_pools').update({ is_open: isOpen }).eq('id', pool.id)
    if (error) setError(error.message)
    else await load()
  }

  const showLeaderboard = async (pool: PredictionPool) => {
    const { data, error } = await supabase.rpc('get_organizer_prediction_leaderboard', { p_prediction_pool_id: pool.id })
    if (error) setError(error.message)
    else {
      setLeaderboardPoolId(pool.id)
      setLeaderboard((data ?? []) as LeaderboardRow[])
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-white">
      <h1 className="font-display text-3xl font-bold tracking-wide">Pick’em</h1>
      <p className="mt-2 max-w-2xl text-white/55">Create a prediction pool only when you are ready to share it. Nothing is created automatically.</p>
      <div className="mt-7 flex max-w-lg gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Prediction pool name" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35" />
        <button onClick={() => void createPool()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Create</button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {!loading && pools.length === 0 && <p className="mt-8 text-sm text-white/45">No prediction pools yet.</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {pools.map((pool) => (
          <div key={pool.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-semibold">{pool.name}</p>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <Link href={`/pick/${pool.invite_token}`} className="text-primary hover:underline">Open guest link</Link>
              <div className="flex items-center gap-3">
                <Link href={`/pickem/${pool.id}`} className="text-white/60 hover:text-white">Details</Link>
                <button onClick={() => void copyInvite(pool)} className="text-white/60 hover:text-white">{copiedPoolId === pool.id ? 'Copied' : 'Copy invite'}</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50">
              <span>{pool.memberCount} {pool.memberCount === 1 ? 'player' : 'players'}</span>
              <button onClick={() => void setPoolOpen(pool, !pool.is_open)} className="text-white/70 hover:text-white">{pool.is_open ? 'Close picks' : 'Reopen picks'}</button>
              <button onClick={() => void showLeaderboard(pool)} className="text-white/70 hover:text-white">Leaderboard</button>
            </div>
            {leaderboardPoolId === pool.id && (
              <ol className="mt-4 divide-y divide-white/10 border-t border-white/10 pt-2">
                {leaderboard.length === 0 ? <li className="py-2 text-sm text-white/45">No players have joined yet.</li> : leaderboard.map((entry) => <li key={`${entry.rank_position}-${entry.display_name}`} className="flex justify-between py-2 text-sm"><span><span className="mr-2 text-white/45">#{entry.rank_position}</span>{entry.display_name}</span><span>{entry.points} pts</span></li>)}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
