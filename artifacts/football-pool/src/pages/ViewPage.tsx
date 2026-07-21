import { useEffect, useState } from 'react'
import { useParams } from 'wouter'
import { supabase } from '../supabaseClient'

export default function ViewPage() {
  const { token } = useParams()
  const [pool, setPool] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      const { data: poolData } = await supabase
        .from('pools').select('*').eq('share_token', token).single()
      if (!poolData) { setLoading(false); return }
      setPool(poolData)
      const { data: teamsData } = await supabase
        .from('teams').select('*').eq('pool_id', poolData.id).order('id')
      if (teamsData) {
        setTeams(teamsData)
      }
      const { data: matchesData } = await supabase
        .from('matches').select('*').eq('pool_id', poolData.id).order('match_number')
      if (matchesData) {
        setMatches(matchesData)
      }
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return <div className="text-center p-10 text-white">Loading...</div>
  if (!pool) return <div className="text-center p-10 text-white">Pool not found.</div>

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-white">
      <button
        onClick={() => window.location.href = '/'}
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg
                   bg-primary/10 border border-primary/30 text-primary
                   hover:bg-primary/20 hover:border-primary/50 transition-all duration-150"
      >
        ← Create Your own Pool
      </button>
      <h1 className="font-bold text-3xl mt-6 mb-6">{pool.name}</h1>
      {matches.map(m => {
        const home = teams.find(t => t.id === Number(m.home_team_id))?.name ?? '?'
        const away = teams.find(t => t.id === Number(m.away_team_id))?.name ?? '?'
        return (
          <div key={m.id} className="flex items-center gap-3 py-2 border-b border-white/10 text-sm">
            <span className="w-6 text-white/30 text-xs">{m.match_number}</span>
            <span className="flex-1 text-right">{home}</span>
            <span className="font-bold">
              {m.home_goals ?? '—'} : {m.away_goals ?? '—'}
            </span>
            <span className="flex-1">{away}</span>
          </div>
        )
      })}
    </div>
  )
}