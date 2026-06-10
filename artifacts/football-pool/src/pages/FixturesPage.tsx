import { useState } from 'react';
import { usePoolState } from '@/hooks/usePoolState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Match, Team } from '@/lib/poolLogic';

export default function FixturesPage() {
  const { settings, teams, matches, updateTeamName, updateMatch, updateTeamCount, updateLegs } = usePoolState();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name ?? id;

  // Group matches by leg when legs > 1
  const legs = settings.legs;
  const matchGroups: { leg: number; items: Match[] }[] = [];
  for (let l = 1; l <= legs; l++) {
    matchGroups.push({ leg: l, items: matches.filter(m => m.leg === l) });
  }

  const renderMatchRow = (match: Match) => {
    const poolTeams = teams; // single league

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

        {/* Score inputs */}
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
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-lg">Tournament Fixtures</h1>
        <p className="text-white/55">Configure teams, set the schedule and enter match results. Standings update instantly.</p>
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
              {settings.teamCount} teams · {settings.legs} {settings.legs === 1 ? 'leg' : 'legs'} · {matches.length} matches
            </span>
          </div>
          <span className={`text-white/40 text-xs transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {settingsOpen && (
          <div className="border-t border-white/10 px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in slide-in-from-top-2 duration-200">
            {/* Team count */}
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase tracking-wider">Number of Teams</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="2"
                  max="20"
                  value={settings.teamCount}
                  onChange={e => {
                    const v = Math.min(20, Math.max(2, Number(e.target.value)));
                    if (!isNaN(v)) updateTeamCount(v);
                  }}
                  className="w-24 font-bold text-center text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                  data-testid="input-teamCount"
                />
                <span className="text-white/40 text-sm">(2–20)</span>
              </div>
            </div>

            {/* Legs */}
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase tracking-wider">Number of Legs</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={settings.legs}
                  onChange={e => {
                    const v = Math.min(5, Math.max(1, Number(e.target.value)));
                    if (!isNaN(v)) updateLegs(v);
                  }}
                  className="w-24 font-bold text-center text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                  data-testid="input-legs"
                />
                <span className="text-white/40 text-sm">
                  {settings.legs === 1 ? 'single round-robin' : settings.legs === 2 ? 'home & away' : `${settings.legs}× round-robin`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team names */}
      <Card className="glass-card rounded-xl overflow-hidden mb-8">
        <CardHeader className="border-b border-white/10 py-3 px-5" style={{ background: 'rgba(34,197,94,0.08)' }}>
          <CardTitle className="font-display text-xl text-primary">Teams</CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {teams.map((team, idx) => (
            <div key={team.id} className="space-y-1">
              <Label className="text-xs text-white/40 uppercase tracking-wider">#{idx + 1}</Label>
              <Input
                value={team.name}
                onChange={e => updateTeamName(team.id, e.target.value)}
                className="font-medium text-white"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                data-testid={`input-team-${team.id}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Matches */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-semibold text-primary tracking-wide">Matches</h3>
          <span className="text-white/35 text-xs font-mono">{matches.filter(m => m.homeGoals !== null && m.awayGoals !== null).length}/{matches.length} played</span>
        </div>

        {matchGroups.map(group => (
          <div key={group.leg}>
            {legs > 1 && (
              <div className="flex items-center gap-3 mb-3 mt-5 first:mt-0">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Leg {group.leg}</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>
            )}
            <div>
              {group.items.map(m => renderMatchRow(m))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
