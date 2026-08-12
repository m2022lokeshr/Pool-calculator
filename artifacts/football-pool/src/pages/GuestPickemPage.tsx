import { useEffect, useState } from 'react'
import { useParams } from 'wouter'
import { supabase } from '../supabaseClient'

type Pool = { id: string; name: string; is_open: boolean }
type Fixture = {
  match_id: number
  match_number: string | null
  match_date: string | null
  kickoff_at: string | null
  home_team: string
  away_team: string
  actual_home_goals: number | null
  actual_away_goals: number | null
  predicted_home_goals: number | null
  predicted_away_goals: number | null
}
type LeaderboardRow = { rank_position: number; display_name: string; points: number }

async function ensureGuestUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user
}

export default function GuestPickemPage() {
  const { token } = useParams()
  const [pool, setPool] = useState<Pool | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null)

  const loadFixturesAndLeaderboard = async () => {
    if (!token) return false
    const { data: fixtureData, error: fixtureError } = await supabase.rpc('get_prediction_fixtures', { p_invite_token: token })
    if (fixtureError) return false
    setFixtures((fixtureData ?? []) as Fixture[])
    setJoined(true)
    const { data: leaderboardData } = await supabase.rpc('get_prediction_leaderboard', { p_invite_token: token })
    setLeaderboard((leaderboardData ?? []) as LeaderboardRow[])
    return true
  }

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        await ensureGuestUser()
      } catch {
        setMessage('Guest access needs to be enabled in Supabase before players can join.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_prediction_pool_by_invite', { p_invite_token: token })
      const predictionPool = (data ?? [])[0] as Pool | undefined
      if (error || !predictionPool) setMessage('This prediction pool is unavailable.')
      else {
        setPool(predictionPool)
        await loadFixturesAndLeaderboard()
      }
      setLoading(false)
    }
    void load()
  }, [token])

  const join = async () => {
    if (!pool || !displayName.trim() || !token) return
    try {
      await ensureGuestUser()
    } catch {
      setMessage('Guest access needs to be enabled in Supabase before players can join.')
      return
    }
    const { error } = await supabase.rpc('join_prediction_pool', {
      p_invite_token: token,
      p_display_name: displayName.trim(),
    })
    if (error) { setMessage(error.message); return }
    setMessage('')
    await loadFixturesAndLeaderboard()
  }

  const updateScore = (matchId: number, side: 'home' | 'away', value: string) => {
    const score = value === '' ? null : Number(value)
    if (score !== null && (!Number.isInteger(score) || score < 0 || score > 99)) return
    setFixtures((current) => current.map((fixture) => fixture.match_id !== matchId ? fixture : {
      ...fixture,
      [side === 'home' ? 'predicted_home_goals' : 'predicted_away_goals']: score,
    }))
  }

  const savePrediction = async (fixture: Fixture) => {
    if (!token || fixture.predicted_home_goals === null || fixture.predicted_away_goals === null) return
    setSavingMatchId(fixture.match_id)
    const { error } = await supabase.rpc('save_prediction', {
      p_invite_token: token,
      p_match_id: fixture.match_id,
      p_home_goals: fixture.predicted_home_goals,
      p_away_goals: fixture.predicted_away_goals,
    })
    setSavingMatchId(null)
    if (error) { setMessage(error.message); return }
    setMessage('Prediction saved.')
  }

  if (loading) return <div className="p-10 text-center text-white">Loading prediction pool…</div>
  if (!pool) return <div className="p-10 text-center text-white">{message}</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Guest Pick’em</p>
      <h1 className="mt-2 font-display text-3xl font-bold">{pool.name}</h1>
      {!joined ? (
        <>
          <p className="mt-2 text-white/55">Choose a display name to join. No account or email is required.</p>
          <div className="mt-7 flex gap-2">
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your display name" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35" />
            <button onClick={() => void join()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Join</button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-white/55">Enter your score predictions. Results already entered by the organizer are locked.</p>
          {fixtures.length === 0 ? <p className="mt-8 text-sm text-white/45">No fixtures are available yet.</p> : (
            <div className="mt-7 space-y-3">
              {fixtures.map((fixture) => {
                const isSettled = fixture.actual_home_goals !== null && fixture.actual_away_goals !== null
                const isLocked = isSettled || (fixture.kickoff_at !== null && new Date(fixture.kickoff_at).getTime() <= Date.now())
                return (
                  <div key={fixture.match_id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{fixture.home_team} <span className="text-white/35">vs</span> {fixture.away_team}</p>
                      <span className="text-xs text-white/45">{fixture.match_date || fixture.match_number || 'Fixture'}</span>
                    </div>
                    {isSettled ? (
                      <p className="mt-3 text-sm text-white/65">Result: {fixture.actual_home_goals} – {fixture.actual_away_goals}</p>
                    ) : isLocked ? (
                      <p className="mt-3 text-sm text-white/65">Predictions are locked.</p>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input aria-label={`${fixture.home_team} predicted goals`} type="number" min="0" max="99" value={fixture.predicted_home_goals ?? ''} onChange={(event) => updateScore(fixture.match_id, 'home', event.target.value)} className="w-16 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-center text-sm text-white" />
                        <span className="text-white/45">–</span>
                        <input aria-label={`${fixture.away_team} predicted goals`} type="number" min="0" max="99" value={fixture.predicted_away_goals ?? ''} onChange={(event) => updateScore(fixture.match_id, 'away', event.target.value)} className="w-16 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-center text-sm text-white" />
                        <button disabled={fixture.predicted_home_goals === null || fixture.predicted_away_goals === null || savingMatchId === fixture.match_id} onClick={() => void savePrediction(fixture)} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{savingMatchId === fixture.match_id ? 'Saving…' : 'Save pick'}</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold">Leaderboard</h2>
            {leaderboard.length === 0 ? <p className="mt-3 text-sm text-white/45">No players have joined yet.</p> : (
              <ol className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10 bg-black/20 px-4">
                {leaderboard.map((entry) => <li key={`${entry.rank_position}-${entry.display_name}`} className="flex items-center justify-between py-3 text-sm"><span><span className="mr-3 text-white/45">#{entry.rank_position}</span>{entry.display_name}</span><span className="font-semibold">{entry.points} pts</span></li>)}
              </ol>
            )}
          </section>
        </>
      )}
      {message && <p className="mt-4 text-sm text-white/65">{message}</p>}
    </div>
  )
}
