import { useState } from 'react';
import { usePoolState } from '@/hooks/usePoolState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Match, Team } from '@/lib/poolLogic';

export default function FixturesPage() {
  const {
    settings, pools, teams, matches,
    updateTeamName, updateMatch,
    updatePoolCount, updateTeamsPerPool, updateLegs,
  } = usePoolState();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const totalMatches = matches.length;
  const playedMatches = matches.filter(m => m.homeGoals !== null && m.awayGoals !== null).length;

  function renderMatchRow(match: Match, poolTeams: Team[]) {
    return (
      <div
        key={match.id}
        className="glass-match-row flex flex-wrap md:flex-nowrap items-center gap-2 p-3 rounded-lg mb-2"
        data-testid={`row-match-${match.id}`}
      >
        {/* Match number */}
        <div className="w-14 shrink-0">
          <Input
            value={match.matchNumber}
            onChange={e => updateMatch(match.id, { matchNumber: e.target.value })}
            placeholder="#"
            className="h-8 text-center text-xs font-mono"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            data-testid={`input-matchNo-${match.id}`}
          />
        </div>

        {/* Date */}
        <div className="w-full md:w-44 shrink-0">
          <Input
            type="datetime-local"
            value={match.date}
            onChange={e => updateMatch(match.id, { date: e.target.value })}
            className="h-8 text-xs"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            data-testid={`input-date-${match.id}`}
          />
        </div>

        {/* Home team */}
        <div className="flex-1 min-w-[120px]">
          <Select
            value={match.homeTeamId}
            onValueChange={val => updateMatch(match.id, { homeTeamId: val })}
          >
            <SelectTrigger
              className="h-8 text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              data-testid={`select-home-${match.id}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {poolTeams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            min="0"
            value={match.homeGoals === null ? '' : match.homeGoals}
            onChange={e => updateMatch(match.id, { homeGoals: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="—"
            className="w-12 h-8 text-center font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            data-testid={`input-homeGoals-${match.id}`}
          />
          <span className="text-white/30 text-sm font-bold">:</span>
          <Input
            type="number"
            min="0"
            value={match.awayGoals === null ? '' : match.awayGoals}
            onChange={e => updateMatch(match.id, { awayGoals: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="—"
            className="w-12 h-8 text-center font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            data-testid={`input-awayGoals-${match.id}`}
          />
        </div>

        {/* Away team */}
        <div className="flex-1 min-w-[120px]">
          <Select
            value={match.awayTeamId}
            onValueChange={val => updateMatch(match.id, { awayTeamId: val })}
          >
            <SelectTrigger
              className="h-8 text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              data-testid={`select-away-${match.id}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {poolTeams.filter(t => t.id !== match.homeTeamId).map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

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
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={settings.poolCount}
                  onChange={e => {
                    const v = Math.min(4, Math.max(1, Number(e.target.value)));
                    if (!isNaN(v)) updatePoolCount(v);
                  }}
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
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={settings.teamsPerPool}
                  onChange={e => {
                    const v = Math.min(10, Math.max(2, Number(e.target.value)));
                    if (!isNaN(v)) updateTeamsPerPool(v);
                  }}
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
                <Input
                  type="number"
                  min="1"
                  max="3"
                  value={settings.legs}
                  onChange={e => {
                    const v = Math.min(3, Math.max(1, Number(e.target.value)));
                    if (!isNaN(v)) updateLegs(v);
                  }}
                  className="w-20 font-bold text-center text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                  data-testid="input-legs"
                />
                <span className="text-white/40 text-sm">
                  {settings.legs === 1 ? 'single' : settings.legs === 2 ? 'home & away' : `${settings.legs}×`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Per-pool sections */}
      <div className="space-y-8">
        {pools.map((pool, pi) => {
          const poolTeams   = teams.filter(t => t.poolId === pool.id);
          const poolMatches = matches.filter(m => m.poolId === pool.id);
          const poolPlayed  = poolMatches.filter(m => m.homeGoals !== null && m.awayGoals !== null).length;

          // Pool colour accent
          const poolColors = [
            'rgba(34,197,94',   // green  – Pool A
            'rgba(59,130,246',  // blue   – Pool B
            'rgba(168,85,247',  // purple – Pool C
            'rgba(249,115,22',  // orange – Pool D
          ];
          const base = poolColors[pi] ?? poolColors[0];

          return (
            <div key={pool.id}>
              {/* Pool header */}
              <div
                className="rounded-t-xl px-5 py-3 flex items-center justify-between"
                style={{ background: `${base},0.18)`, borderBottom: `1px solid ${base},0.3)` }}
              >
                <h2 className="font-display text-2xl font-bold text-white tracking-wide">{pool.name}</h2>
                <span className="text-white/40 text-xs font-mono">{poolPlayed}/{poolMatches.length} played</span>
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
                {poolMatches.map(m => renderMatchRow(m, poolTeams))}
                {poolMatches.length === 0 && (
                  <p className="text-white/25 text-sm text-center py-4">No matches — add at least 2 teams.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global progress */}
      <div className="mt-6 text-center text-white/30 text-xs font-mono">
        {playedMatches} / {totalMatches} matches played across all pools
      </div>
    </div>
  );
}
