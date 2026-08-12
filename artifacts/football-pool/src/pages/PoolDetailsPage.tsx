import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'wouter'
import { supabase } from '../supabaseClient'
import { isOrganizerUser } from '../lib/authUser'
import { toast } from '@/hooks/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Pool = {
  id: string
  name: string
  invite_token: string
  is_open: boolean
  exact_score_points: number
  correct_outcome_points: number
}

type LeaderboardRow = { rank_position: number; display_name: string; points: number }

type MatrixRow = {
  fixture_id: number
  match_number: string | null
  match_date: string | null
  kickoff_at: string | null
  home_team: string
  away_team: string
  actual_home_goals: number | null
  actual_away_goals: number | null
  member_id: string
  display_name: string
  predicted_home_goals: number | null
  predicted_away_goals: number | null
  submitted: boolean
  reveal_scores: boolean
}

type OwnerMatch = {
  id: number
  match_number: string | null
  home_team_id: string | null
  away_team_id: string | null
  home_goals: number | null
  away_goals: number | null
  home_team_name: string
  away_team_name: string
}

export default function PoolDetailsPage() {
  const { poolId } = useParams<{ poolId: string }>()
  const [, navigate] = useLocation()
  const [pool, setPool] = useState<Pool | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [members, setMembers] = useState<string[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [matrix, setMatrix] = useState<MatrixRow[]>([])
  const [ownerMatches, setOwnerMatches] = useState<OwnerMatch[]>([])
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savingFixtures, setSavingFixtures] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!poolId) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isOrganizerUser(user)) {
      setLoading(false)
      return
    }

    // Pool (must be owner — RLS enforces)
    const { data: poolData, error: poolError } = await supabase
      .from('prediction_pools')
      .select('id, name, invite_token, is_open, exact_score_points, correct_outcome_points')
      .eq('id', poolId)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (poolError || !poolData) {
      setError(poolError?.message ?? 'Pool not found.')
      setLoading(false)
      return
    }
    setPool(poolData)

    // Members
    const { data: memberData } = await supabase
      .from('prediction_members')
      .select('display_name')
      .eq('prediction_pool_id', poolId)
      .order('created_at')
    const names = (memberData ?? []).map((m) => m.display_name)
    setMembers(names)
    setMemberCount(names.length)

    // Leaderboard
    const { data: leaderboardData, error: lbError } = await supabase.rpc('get_organizer_prediction_leaderboard', {
      p_prediction_pool_id: poolId,
    })
    if (lbError) setError(lbError.message)
    else setLeaderboard((leaderboardData ?? []) as LeaderboardRow[])

    // Prediction matrix (fixtures x players with visibility policy)
    const { data: matrixData, error: matrixError } = await supabase.rpc('get_organizer_pool_details', {
      p_pool_id: poolId,
    })
    if (matrixError) setError(matrixError.message)
    else setMatrix((matrixData ?? []) as MatrixRow[])

    // All owner matches (for fixture selection) + current selected links
    const [matchesRes, teamsRes, linksRes] = await Promise.all([
      supabase.from('matches').select('id, match_number, home_team_id, away_team_id, home_goals, away_goals').eq('user_id', user.id).order('match_number'),
      supabase.from('teams').select('id, name').eq('user_id', user.id),
      supabase.from('prediction_pool_matches').select('match_id').eq('prediction_pool_id', poolId),
    ])
    if (matchesRes.error) setError(matchesRes.error.message)
    else {
      const teamsById = new Map((teamsRes.data ?? []).map((t) => [String(t.id), t.name]))
      setOwnerMatches(((matchesRes.data ?? []) as OwnerMatch[]).map((m) => ({
        ...m,
        home_team_name: m.home_team_id ? (teamsById.get(m.home_team_id) ?? `Team ${m.home_team_id}`) : 'TBD',
        away_team_name: m.away_team_id ? (teamsById.get(m.away_team_id) ?? `Team ${m.away_team_id}`) : 'TBD',
      })))
    }
    const linked = new Set((linksRes.data ?? []).map((l) => l.match_id))
    setSelectedMatchIds(linked)

    setLoading(false)
  }

  useEffect(() => { void load() }, [poolId])

  const toggleMatch = (matchId: number) => {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev)
      if (next.has(matchId)) next.delete(matchId)
      else next.add(matchId)
      return next
    })
  }

  const saveFixtures = async () => {
    if (!pool) return
    setSavingFixtures(true)
    const { error } = await supabase.rpc('set_prediction_pool_matches', {
      p_pool_id: pool.id,
      p_match_ids: Array.from(selectedMatchIds),
    })
    setSavingFixtures(false)
    if (error) { toast({ variant: 'destructive', title: 'Could not save fixtures', description: error.message }) }
    else {
      toast({ title: 'Fixtures updated', description: 'Guests now see the selected fixtures only.' })
      await load()
    }
  }

  const setPoolOpen = async (isOpen: boolean) => {
    if (!pool) return
    const { error } = await supabase.from('prediction_pools').update({ is_open: isOpen }).eq('id', pool.id)
    if (error) toast({ variant: 'destructive', title: 'Could not update pool', description: error.message })
    else { setPool((prev) => prev ? { ...prev, is_open: isOpen } : prev); await load() }
  }

  const copyInvite = async () => {
    if (!pool) return
    const inviteUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/pick/${pool.invite_token}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
    } catch {
      toast({ variant: 'destructive', title: 'Could not copy invite link' })
    }
  }

  const deletePool = async () => {
    if (!pool) return
    setDeleting(true)
    const { error } = await supabase.rpc('delete_prediction_pool', { p_pool_id: pool.id })
    setDeleting(false)
    if (error) { toast({ variant: 'destructive', title: 'Could not delete pool', description: error.message }) }
    else {
      toast({ title: 'Pool deleted' })
      navigate('/pickem')
    }
  }

  if (loading) return <div className="p-10 text-center text-white">Loading pool…</div>
  if (error && !pool) return <div className="p-10 text-center text-white">{error}</div>
  if (!pool) return <div className="p-10 text-center text-white">Pool not found.</div>

  // Group matrix rows by fixture for the column headers, and by member for rows.
  const fixtures = matrix
    .filter((r, i, arr) => arr.findIndex((x) => x.fixture_id === r.fixture_id) === i)
    .sort((a, b) => {
      const ka = a.kickoff_at ? new Date(a.kickoff_at).getTime() : Number.MAX_SAFE_INTEGER
      const kb = b.kickoff_at ? new Date(b.kickoff_at).getTime() : Number.MAX_SAFE_INTEGER
      return ka - kb || Number(a.match_number ?? a.fixture_id) - Number(b.match_number ?? b.fixture_id)
    })
  const players = matrix
    .filter((r, i, arr) => arr.findIndex((x) => x.member_id === r.member_id) === i)
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
  const cellFor = (fixtureId: number, memberId: string) => matrix.find((r) => r.fixture_id === fixtureId && r.member_id === memberId)
  const reveal = fixtures.some((f) => f.reveal_scores)

  const teamName = (match: OwnerMatch) => {
    return `${match.home_team_name} vs ${match.away_team_name}`
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-white">
      <Link href="/pickem" className="text-sm text-white/50 hover:text-white">← Back to Pick’em</Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Pick’em pool</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide">{pool.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Link href={`/pick/${pool.invite_token}`} className="text-primary hover:underline">Open guest link</Link>
            <button onClick={() => void copyInvite()} className="text-white/60 hover:text-white">{copied ? 'Copied!' : 'Copy invite'}</button>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pool.is_open ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
              {pool.is_open ? 'Open' : 'Closed'}
            </span>
            <span className="text-white/45">{memberCount} {memberCount === 1 ? 'player' : 'players'}</span>
          </div>
        </div>
        <button
          onClick={() => void setPoolOpen(!pool.is_open)}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white"
        >
          {pool.is_open ? 'Close picks' : 'Reopen picks'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Players + Leaderboard */}
        <section className="rounded-xl border border-white/10 bg-black/20 p-5">
          <h2 className="font-display text-xl font-bold">Players</h2>
          {members.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">No players have joined yet.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {members.map((name) => <li key={name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"><span>{name}</span></li>)}
            </ol>
          )}

          <h2 className="mt-6 font-display text-xl font-bold">Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">No points yet.</p>
          ) : (
            <ol className="mt-3 divide-y divide-white/10">
              {leaderboard.map((entry) => (
                <li key={`${entry.rank_position}-${entry.display_name}`} className="flex items-center justify-between py-2 text-sm">
                  <span><span className="mr-2 text-white/45">#{entry.rank_position}</span>{entry.display_name}</span>
                  <span className="font-semibold">{entry.points} pts</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Fixture selection */}
        <section className="rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Fixtures</h2>
            <button
              onClick={() => void saveFixtures()}
              disabled={savingFixtures}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingFixtures ? 'Saving…' : 'Save selection'}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/45">Choose which tournament fixtures are included in this pool. Guests see and predict only these.</p>
          {ownerMatches.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">No tournament fixtures yet — set them up on the Fixtures page first.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {ownerMatches.map((m) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-white/5 px-3 py-2 hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={selectedMatchIds.has(m.id)}
                      onChange={() => toggleMatch(m.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-mono text-xs text-white/40">{m.match_number ?? m.id}</span>
                    <span className="flex-1 truncate">{teamName(m)}</span>
                    {m.home_goals !== null && m.away_goals !== null && (
                      <span className="text-xs text-white/50">{m.home_goals} – {m.away_goals}</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Prediction matrix */}
      <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5">
        <h2 className="font-display text-xl font-bold">Prediction matrix</h2>
        <p className="mt-2 text-xs text-white/45">
          {reveal
            ? 'Exact predictions are shown once kickoff has passed or a result is recorded.'
            : 'Before kickoff you can see who has submitted, but not the exact scores.'}
        </p>
        {players.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">No players have joined yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white/50">Player</TableHead>
                  {fixtures.map((f) => (
                    <TableHead key={f.fixture_id} className="min-w-24 text-center">
                      <div className="text-xs font-semibold text-white/70">{f.home_team} <span className="text-white/30">vs</span> {f.away_team}</div>
                      <div className="text-[10px] font-normal text-white/35">{f.match_number ?? f.fixture_id}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.member_id}>
                    <TableCell className="font-medium text-white/80">{player.display_name}</TableCell>
                    {fixtures.map((f) => {
                      const cell = cellFor(f.fixture_id, player.member_id)
                      const settled = f.actual_home_goals !== null && f.actual_away_goals !== null
                      let content: React.ReactNode
                      if (!cell) {
                        content = <span className="text-white/20">–</span>
                      } else if (!cell.submitted) {
                        content = <span className="text-white/30">Not submitted</span>
                      } else if (f.reveal_scores && cell.predicted_home_goals !== null && cell.predicted_away_goals !== null) {
                        const exact = settled && cell.predicted_home_goals === f.actual_home_goals && cell.predicted_away_goals === f.actual_away_goals
                        content = (
                          <span className={exact ? 'font-bold text-green-300' : 'text-white/80'}>
                            {cell.predicted_home_goals} – {cell.predicted_away_goals}
                          </span>
                        )
                      } else {
                        content = <span className="text-green-300/80">Submitted</span>
                      }
                      return <TableCell key={f.fixture_id} className="text-center text-sm">{content}</TableCell>
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Settings / delete */}
      <section className="mt-8 rounded-xl border border-red-500/20 bg-black/20 p-5">
        <h2 className="font-display text-xl font-bold text-red-300">Danger zone</h2>
        <p className="mt-2 text-sm text-white/55">
          Delete this prediction pool, its players, predictions, and fixture links. Tournament fixtures and other pools are never touched.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={`Type "${pool.name}" to confirm`}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35"
          />
          <button
            onClick={() => void deletePool()}
            disabled={deleting || deleteConfirmName.trim() !== pool.name}
            className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete pool'}
          </button>
        </div>
      </section>
    </div>
  )
}
