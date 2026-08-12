import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FixtureSettings = {
  poolCount: number;
  teamsPerPool: number;
  legs: number;
};

type FixturePool = {
  id: number;
  name: string;
  share_token?: string;
};

type FixtureTeam = {
  id: number;
  pool_id: number;
  name: string;
};

type FixtureMatch = {
  id: number;
  pool_id: number;
  match_number: string | number | null;
  date: string | null;
  kickoff_at: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_goals: number | null;
  away_goals: number | null;
};

function matchNumberValue(match: FixtureMatch): number {
  const value = Number(match.match_number);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function sortMatchesByNumber(matches: FixtureMatch[]): FixtureMatch[] {
  return [...matches].sort((a, b) =>
    matchNumberValue(a) - matchNumberValue(b) || a.id - b.id
  );
}

function toLocalDateTimeInputValue(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function NumericInput({
  value,
  min,
  max,
  onCommit,
  className,
  style,
  'data-testid': testId,
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  function commit(raw: string) {
    const n = Number(raw);
    const clamped = isNaN(n) ? value : Math.min(max, Math.max(min, Math.round(n)));
    setLocal(String(clamped));
    if (clamped !== value) onCommit(clamped);
    else setLocal(String(clamped));
  }

  return (
    <Input
      type="number"
      value={local}
      className={className}
      style={style}
      data-testid={testId}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => commit(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

export default function FixturesPage() {
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  // ✅ All state declarations first
  const [pools, setPools] = useState<FixturePool[]>([]);
  const [teams, setTeams] = useState<FixtureTeam[]>([]);
  const [matches, setMatches] = useState<FixtureMatch[]>([]);
  const [settings, setSettings] = useState<FixtureSettings>({ poolCount: 2, teamsPerPool: 4, legs: 1 });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Per-entity debounce timers — one slot per team/pool/match-field
  const teamTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const poolTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const matchTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ✅ Derived values
  const totalMatches = matches.length;
  const playedMatches = matches.filter(
    m => m.home_goals !== null && m.away_goals !== null
  ).length;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: poolsData } = await supabase
        .from('pools').select('*').eq('user_id', user.id);
      if (poolsData) setPools(poolsData);

      const { data: teamsData } = await supabase
        .from('teams').select('*').eq('user_id', user.id).order('id');
      if (teamsData) setTeams(teamsData);

      const { data: matchesData } = await supabase
        .from('matches').select('*').eq('user_id', user.id).order('match_number');
      if (matchesData) setMatches(sortMatchesByNumber(matchesData));

      const { data: settingsData } = await supabase
        .from('settings').select('*').eq('user_id', user.id).maybeSingle();
      if (settingsData) {
        setSettings(prev => ({
          poolCount: settingsData.pool_count ?? prev.poolCount,
          teamsPerPool: settingsData.teams_per_pool ?? prev.teamsPerPool,
          legs: settingsData.legs ?? prev.legs,
        }));
      }
    };

    fetchData();
  }, [user]);

  // --- update functions ---
  const updateTeamName = (teamId: number, newName: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: newName } : t));
    clearTimeout(teamTimers.current.get(teamId));
    teamTimers.current.set(teamId, setTimeout(async () => {
      await supabase.from('teams').update({ name: newName }).eq('id', teamId);
    }, 600));
  };

  // ✅ Add these right here
  const deletePoolFixtures = async (poolId: number) => {
    await supabase.from('matches').delete().eq('pool_id', poolId);
    setMatches(prev => prev.filter(m => m.pool_id !== poolId));
  };

  const clearPoolScores = async (poolId: number) => {
    await supabase.from('matches')
      .update({ home_goals: null, away_goals: null })
      .eq('pool_id', poolId);
    setMatches(prev =>
      prev.map(m =>
        m.pool_id === poolId
          ? { ...m, home_goals: null, away_goals: null }
          : m
      )
    );
  };

  const updateMatch = useCallback((matchId: number, updates: Partial<FixtureMatch>) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updates } : m));
    const key = `${matchId}-${Object.keys(updates).join(',')}`;
    clearTimeout(matchTimers.current.get(key));
    matchTimers.current.set(key, setTimeout(async () => {
      await supabase.from('matches').update(updates).eq('id', matchId);
    }, 600));
  }, []);

  const updatePoolName = (poolIndex: number, newName: string) => {
    const pool = pools[poolIndex];
    if (!pool) return;
    setPools(prev => prev.map(p => p.id === pool.id ? { ...p, name: newName } : p));
    clearTimeout(poolTimers.current.get(pool.id));
    poolTimers.current.set(pool.id, setTimeout(async () => {
      await supabase.from('pools').update({ name: newName }).eq('id', pool.id);
    }, 600));
  };

  const syncPoolsAndTeams = async (newPoolCount: number, newTeamsPerPool: number) => {
    if (!user) return;
    // ── 1. Sync pools ──────────────────────────────────────────
    if (newPoolCount > pools.length) {
      // Add missing pools + their teams
      for (let i = pools.length; i < newPoolCount; i++) {
        // Generate a simple share token
        const shareToken = crypto.randomUUID();
        const { data: newPool } = await supabase
          .from('pools')
          .insert({ user_id: user.id, name: `Pool ${String.fromCharCode(65 + i)}`, share_token: shareToken })
          .select()
          .single();

        if (newPool) {
          setPools(prev => [...prev, newPool]);

          const newTeams = Array.from({ length: newTeamsPerPool }, (_, j) => ({
            user_id: user.id,
            pool_id: newPool.id,
            name: `Team ${j + 1}`,
          }));
          const { data: insertedTeams } = await supabase
            .from('teams').insert(newTeams).select();
          if (insertedTeams) setTeams(prev => [...prev, ...insertedTeams]);
        }
      }
    } else if (newPoolCount < pools.length) {
      // Remove excess pools and their teams/matches
      const toRemove = pools.slice(newPoolCount).map(p => p.id);
      await supabase.from('matches').delete().in('pool_id', toRemove);
      await supabase.from('teams').delete().in('pool_id', toRemove);
      await supabase.from('pools').delete().in('id', toRemove);
      setPools(prev => prev.slice(0, newPoolCount));
      setTeams(prev => prev.filter(t => !toRemove.includes(t.pool_id)));
      setMatches(prev => prev.filter(m => !toRemove.includes(m.pool_id)));
    }

    // ── 2. Sync teams per pool ─────────────────────────────────
    for (const pool of pools.slice(0, newPoolCount)) {
      const poolTeams = teams.filter(t => t.pool_id === pool.id);

      if (newTeamsPerPool > poolTeams.length) {
        const newTeams = Array.from(
          { length: newTeamsPerPool - poolTeams.length },
          (_, j) => ({
            user_id: user.id,
            pool_id: pool.id,
            name: `Team ${poolTeams.length + j + 1}`,
          })
        );
        const { data: insertedTeams } = await supabase
          .from('teams').insert(newTeams).select();
        if (insertedTeams) setTeams(prev => [...prev, ...insertedTeams]);

      } else if (newTeamsPerPool < poolTeams.length) {
        const toRemove = poolTeams.slice(newTeamsPerPool).map(t => t.id);
        await supabase.from('teams').delete().in('id', toRemove);
        setTeams(prev => prev.filter(t => !toRemove.includes(t.id)));
      }
    }
  };

  const updatePoolCount = async (newCount: number) => {
    if (!user) return;
    await supabase.from('settings').upsert({
      user_id: user.id,
      pool_count: newCount,              // ✅ snake_case
      teams_per_pool: settings.teamsPerPool,
      legs: settings.legs,
    });
    await syncPoolsAndTeams(newCount, settings.teamsPerPool);
    setSettings(prev => ({ ...prev, poolCount: newCount }));
  };

  const updateTeamsPerPool = async (newCount: number) => {
    if (!user) return;
    await supabase.from('settings').upsert({
      user_id: user.id,
      pool_count: settings.poolCount,
      teams_per_pool: newCount,          // ✅ snake_case
      legs: settings.legs,
    });
    await syncPoolsAndTeams(settings.poolCount, newCount);
    setSettings(prev => ({ ...prev, teamsPerPool: newCount }));
  };
  const updateLegs = async (newLegs: number) => {
    if (!user) return;
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSettings) {
      await supabase
        .from('settings')
        .update({ legs: newLegs })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('settings')
        .insert({ user_id: user.id, pool_count: settings.poolCount, teams_per_pool: settings.teamsPerPool, legs: newLegs });
    }

    setSettings(prev => ({ ...prev, legs: newLegs }));
  };
  const generateMatches = async (poolId: number, teamIds: number[]) => {
    if (!user) return;
    if (teamIds.length < 2) {
      alert('Need at least 2 teams.');
      return;
    }

    const newMatches = [];
    let matchNumber = 1;

    for (let leg = 0; leg < settings.legs; leg++) {
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          // Odd legs flip home/away so teams get both sides
          const home = leg % 2 === 0 ? teamIds[i] : teamIds[j];
          const away = leg % 2 === 0 ? teamIds[j] : teamIds[i];
          newMatches.push({
            pool_id: poolId,
            user_id: user.id,
            match_number: String(matchNumber++),
            home_team_id: home,
            away_team_id: away,
            date: null,
            kickoff_at: null,
            home_goals: null,
            away_goals: null,
          });
        }
      }
    }

    const { error } = await supabase.from('matches').insert(newMatches);
    if (error) console.error(error);
    else {
      const { data: freshMatches } = await supabase
        .from('matches').select('*').eq('user_id', user.id).order('match_number');
      if (freshMatches) setMatches(sortMatchesByNumber(freshMatches));
    }
  };

  const generateAllPoolFixtures = async () => {
    if (!user) return;

    const newMatches = [];

    for (const pool of pools) {
      const poolTeams = teams.filter(t => t.pool_id === pool.id);
      const hasFixtures = matches.some(m => m.pool_id === pool.id);

      if (hasFixtures || poolTeams.length < 2) continue;

      let matchNumber = 1;
      const teamIds = poolTeams.map(t => t.id);

      for (let leg = 0; leg < settings.legs; leg++) {
        for (let i = 0; i < teamIds.length; i++) {
          for (let j = i + 1; j < teamIds.length; j++) {
            const home = leg % 2 === 0 ? teamIds[i] : teamIds[j];
            const away = leg % 2 === 0 ? teamIds[j] : teamIds[i];

            newMatches.push({
              pool_id: pool.id,
              user_id: user.id,
              match_number: String(matchNumber++),
              home_team_id: home,
              away_team_id: away,
              date: null,
              kickoff_at: null,
              home_goals: null,
              away_goals: null,
            });
          }
        }
      }
    }

    if (newMatches.length === 0) {
      alert('No pools are ready for new fixtures.');
      return;
    }

    const { error } = await supabase.from('matches').insert(newMatches);
    if (error) {
      console.error(error);
      return;
    }

    const { data: freshMatches } = await supabase
      .from('matches').select('*').eq('user_id', user.id).order('match_number');
    if (freshMatches) setMatches(sortMatchesByNumber(freshMatches));
  };

  const poolsReadyForFixtures = pools.filter(pool =>
    !matches.some(m => m.pool_id === pool.id) &&
    teams.filter(t => t.pool_id === pool.id).length >= 2
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  if (!user) return <div style={{ textAlign: 'center', padding: '50px' }}>Please log in to see your fixtures</div>;

  const MatchRow = memo(function MatchRow({
    match,
    poolTeams,
    poolMatches,
    legs,
    onUpdate,
  }: {
    match: FixtureMatch;
    poolTeams: FixtureTeam[];
    poolMatches: FixtureMatch[];
    legs: number;
    onUpdate: (matchId: number, updates: Partial<FixtureMatch>) => void;
  }) {
    const timesPlayed = (teamAId: number, teamBId: number) =>
      poolMatches.filter(
        m =>
          m.id !== match.id &&
          ((m.home_team_id === teamAId && m.away_team_id === teamBId) ||
            (m.home_team_id === teamBId && m.away_team_id === teamAId))
      ).length;

    const availableAwayTeams = poolTeams.filter(t => {
      if (match.home_team_id === null) return true;
      if (t.id === match.home_team_id) return false;
      if (t.id === match.away_team_id) return true;
      return timesPlayed(match.home_team_id, t.id) < legs;
    });

    return (
      <div
        className="glass-match-row flex flex-wrap md:flex-nowrap items-center gap-2 p-3 rounded-lg mb-2"
      >
        <div className="w-14 shrink-0">
          <Input
            value={match.match_number ?? ''}
            onChange={e => onUpdate(match.id, { match_number: e.target.value })}
            placeholder="#"
            className="h-8 text-center text-xs font-mono"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="w-full md:w-44 shrink-0">
          <Input
            type="datetime-local"
            value={toLocalDateTimeInputValue(match.kickoff_at) || match.date || ''}
            onChange={e => onUpdate(match.id, {
              date: e.target.value,
              kickoff_at: e.target.value ? new Date(e.target.value).toISOString() : null,
            })}
            className="h-8 text-xs"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Select
            value={String(match.home_team_id ?? '')}
            onValueChange={val => onUpdate(match.id, { home_team_id: Number(val) })}
          >
            <SelectTrigger className="h-8 text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {poolTeams.map(t => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Input type="number" min="0"
            value={match.home_goals ?? ''}
            onChange={e => onUpdate(match.id, { home_goals: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="—" className="w-12 h-8 text-center font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <span className="text-white/30 text-sm font-bold">:</span>
          <Input type="number" min="0"
            value={match.away_goals ?? ''}
            onChange={e => onUpdate(match.id, { away_goals: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="—" className="w-12 h-8 text-center font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Select
            value={String(match.away_team_id ?? '')}
            onValueChange={val => onUpdate(match.id, { away_team_id: Number(val) })}
          >
            <SelectTrigger className="h-8 text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableAwayTeams.map(t => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  });
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-lg">Tournament Fixtures</h1>
        <p className="text-white/55">Configure pools, enter team names and match results. Standings update live.</p>
      </div>

      {/* League Settings */}
      <div className="glass-card rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
          data-testid="button-settings-toggle"
        >
          <div className="flex items-center gap-3">
            <span className="text-primary text-lg">⚙</span>
            <span className="font-semibold text-white text-sm tracking-wide">League Settings</span>
            <span className="text-white/40 text-xs font-mono">
              {settings.poolCount} {settings.poolCount === 1 ? 'pool' : 'pools'} ·{' '}
              {settings.teamsPerPool} teams/pool ·{' '}
              {settings.legs} {settings.legs === 1 ? 'leg' : 'legs'} ·{' '}
              {totalMatches} matches
            </span>
          </div>
          <span className={`text-white/40 text-xs transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {settingsOpen && (
          <div className="border-t border-white/10 px-5 py-5 grid grid-cols-1 sm:grid-cols-3 gap-5 animate-in slide-in-from-top-2 duration-200">
            {/* Pool count */}
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase tracking-wider">Number of Pools</Label>
              <div className="flex items-center gap-3">
                <NumericInput
                  value={settings.poolCount}
                  min={1}
                  max={4}
                  onCommit={updatePoolCount}
                  className="w-20 font-bold text-center text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                  data-testid="input-poolCount"
                />
                <span className="text-white/40 text-sm">(1–4)</span>
              </div>
            </div>

            {/* Teams per pool */}
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase tracking-wider">Teams per Pool</Label>
              <div className="flex items-center gap-3">
                <NumericInput
                  value={settings.teamsPerPool}
                  min={2}
                  max={10}
                  onCommit={updateTeamsPerPool}
                  className="w-20 font-bold text-center text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                  data-testid="input-teamsPerPool"
                />
                <span className="text-white/40 text-sm">(2–10)</span>
              </div>
            </div>

            {/* Legs */}
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase tracking-wider">Number of Legs</Label>
              <div className="flex items-center gap-3">
                <NumericInput
                  value={settings.legs}
                  min={1}
                  max={3}
                  onCommit={updateLegs}
                  className="w-20 font-bold text-center text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                  data-testid="input-legs"
                />
                <span className="text-white/40 text-sm">
                  {settings.legs === 1 ? 'single' : settings.legs === 2 ? 'home & away' : `${settings.legs}×`}
                </span>
              </div>
            </div>

            <div className="sm:col-span-3 pt-1">
              <button
                onClick={generateAllPoolFixtures}
                disabled={poolsReadyForFixtures.length === 0}
                className="group w-full rounded-lg border px-4 py-3 text-sm font-semibold text-green-100
                           bg-green-500/10 border-green-400/25
                           shadow-[0_0_0_rgba(74,222,128,0)]
                           transition-all duration-200
                           hover:bg-green-400/15 hover:border-green-300/55
                           hover:shadow-[0_0_28px_rgba(74,222,128,0.30)]
                           active:scale-[0.99]
                           disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none disabled:hover:bg-green-500/10 disabled:hover:border-green-400/25"
                data-testid="button-generate-all-fixtures"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-base transition-transform duration-200 group-hover:scale-110">⚽</span>
                  Generate Fixtures
                  <span className="text-white/35 font-mono text-xs">
                    {poolsReadyForFixtures.length > 0
                      ? `${poolsReadyForFixtures.length} ${poolsReadyForFixtures.length === 1 ? 'pool' : 'pools'} ready`
                      : 'all set'}
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {pools.map((pool, pi) => {
        const poolTeams = teams.filter(t => t.pool_id === pool.id);
        const poolMatches = sortMatchesByNumber(matches.filter(m => m.pool_id === pool.id));
        const poolPlayed = poolMatches.filter(m => m.home_goals !== null && m.away_goals !== null).length;

        const poolColors = [
          'rgba(34,197,94',
          'rgba(59,130,246',
          'rgba(168,85,247',
          'rgba(249,115,22',
        ];
        const base = poolColors[pi] ?? poolColors[0];

        return (
          <div key={pool.id}>
            {/* Pool header */}
            <div
              className="rounded-t-xl px-5 py-3 flex items-center justify-between gap-3"
              style={{ background: `${base},0.18)`, borderBottom: `1px solid ${base},0.3)` }}
            >
              <input
                value={pool.name}
                onChange={e => updatePoolName(pi, e.target.value)}
                className="font-display text-2xl font-bold text-white tracking-wide bg-transparent border-none outline-none focus:underline decoration-dashed decoration-white/30 underline-offset-4 min-w-0 flex-1"
                style={{ caretColor: `${base},1)` }}
                aria-label={`Rename ${pool.name}`}
                data-testid={`input-pool-name-${pool.id}`}
              />

              {/* Played count + pool actions */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-white/40 text-xs font-mono">
                  {poolPlayed}/{poolMatches.length} played
                </span>
                {poolMatches.length > 0 && poolPlayed > 0 && (
                  <button
                    onClick={() => clearPoolScores(pool.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-md border
                 text-yellow-400 bg-yellow-500/10 border-yellow-500/30
                 hover:bg-yellow-500/20 transition-colors duration-150"
                  >
                    ↺ Clear Scores
                  </button>
                )}
                {poolMatches.length > 0 && (
                  <>
                    <button
                      onClick={() => confirm(`Delete all fixtures for ${pool.name}?`) && deletePoolFixtures(pool.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border
                   text-red-400 bg-red-500/10 border-red-500/30
                   hover:bg-red-500/20 transition-colors duration-150"
                    >
                      🗑 Delete
                    </button>
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/view/${pool.share_token}`
                        navigator.clipboard.writeText(shareUrl)
                        alert('Link copied!')
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border
                   text-blue-400 bg-blue-500/10 border-blue-500/30
                   hover:bg-blue-500/20 transition-colors duration-150"
                    >
                      🔗 Share
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Team names */}
            <Card className="rounded-none overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)', border: 'none' }}>
              <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {poolTeams.map((team, idx) => (
                  <div key={team.id} className="space-y-1">
                    <Label className="text-xs text-white/35 uppercase tracking-wider">#{idx + 1}</Label>
                    <Input
                      value={team.name}
                      onChange={e => updateTeamName(team.id, e.target.value)}
                      className="font-medium text-white h-8 text-sm"
                      style={{ background: `${base},0.08)`, border: `1px solid ${base},0.2)` }}
                      data-testid={`input-team-${team.id}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Fixtures */}
            <div
              className="rounded-b-xl p-4"
              style={{ background: 'rgba(0,0,0,0.18)', border: `1px solid rgba(255,255,255,0.06)`, borderTop: 'none' }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Fixtures</div>
              {poolMatches.map(m => (
                <MatchRow key={m.id} match={m} poolTeams={poolTeams} poolMatches={poolMatches} legs={settings.legs} onUpdate={updateMatch} />
              ))}
              {poolMatches.length === 0 && (
                <p className="text-white/25 text-sm text-center py-4">No matches — add at least 2 teams.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
