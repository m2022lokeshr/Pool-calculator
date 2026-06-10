import { usePoolState } from '@/hooks/usePoolState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Match, Team } from '@/lib/poolLogic';

export default function FixturesPage() {
  const { teams, matches, updateTeamName, updateMatch } = usePoolState();

  const teamsA = teams.filter(t => t.pool === 'A');
  const teamsB = teams.filter(t => t.pool === 'B');
  const matchesA = matches.filter(m => m.pool === 'A');
  const matchesB = matches.filter(m => m.pool === 'B');

  const renderTeamInputs = (poolTeams: Team[], pool: string) => (
    <Card className="glass-card mb-6 rounded-xl overflow-hidden">
      <CardHeader className="border-b border-white/10 py-3 px-4" style={{background: 'rgba(34,197,94,0.08)'}}>
        <CardTitle className="font-display text-xl text-primary">Pool {pool} Teams</CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {poolTeams.map((team, idx) => (
          <div key={team.id} className="space-y-1">
            <Label htmlFor={`team-${team.id}`} className="text-xs text-white/50 uppercase tracking-wider">Team {idx + 1}</Label>
            <Input 
              id={`team-${team.id}`}
              value={team.name} 
              onChange={e => updateTeamName(team.id, e.target.value)} 
              data-testid={`input-team-${team.id}`}
              className="font-medium text-white placeholder:text-white/30"
              style={{background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)'}}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderMatchRow = (match: Match, poolTeams: Team[]) => (
    <div key={match.id} className="glass-match-row flex flex-wrap md:flex-nowrap items-center gap-2 p-3 rounded-lg mb-2">
      <div className="w-16">
        <Input 
          value={match.matchNumber} 
          onChange={e => updateMatch(match.id, { matchNumber: e.target.value })}
          placeholder="No."
          className="h-8 text-center text-xs font-mono bg-muted"
          data-testid={`input-matchNo-${match.id}`}
        />
      </div>
      <div className="w-full md:w-auto md:flex-1">
        <Input 
          type="datetime-local" 
          value={match.date} 
          onChange={e => updateMatch(match.id, { date: e.target.value })}
          className="h-8 text-xs"
          data-testid={`input-date-${match.id}`}
        />
      </div>
      <div className="flex-1 flex items-center justify-between gap-2 w-full md:w-auto">
        <div className="flex-1 min-w-[120px]">
          <Select 
            value={match.homeTeamId} 
            onValueChange={val => updateMatch(match.id, { homeTeamId: val })}
          >
            <SelectTrigger className="h-8 text-sm" data-testid={`select-homeTeam-${match.id}`}>
              <SelectValue placeholder="Home Team" />
            </SelectTrigger>
            <SelectContent>
              {poolTeams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Input 
            type="number" 
            min="0"
            value={match.homeGoals === null ? '' : match.homeGoals}
            onChange={e => {
              const val = e.target.value;
              updateMatch(match.id, { homeGoals: val === '' ? null : Number(val) });
            }}
            placeholder="-"
            className="w-12 h-8 text-center font-bold"
            data-testid={`input-homeGoals-${match.id}`}
          />
          <span className="text-muted-foreground text-xs font-bold px-1">-</span>
          <Input 
            type="number" 
            min="0"
            value={match.awayGoals === null ? '' : match.awayGoals}
            onChange={e => {
              const val = e.target.value;
              updateMatch(match.id, { awayGoals: val === '' ? null : Number(val) });
            }}
            placeholder="-"
            className="w-12 h-8 text-center font-bold"
            data-testid={`input-awayGoals-${match.id}`}
          />
        </div>

        <div className="flex-1 min-w-[120px]">
          <Select 
            value={match.awayTeamId} 
            onValueChange={val => updateMatch(match.id, { awayTeamId: val })}
          >
            <SelectTrigger className="h-8 text-sm text-right" data-testid={`select-awayTeam-${match.id}`}>
              <SelectValue placeholder="Away Team" />
            </SelectTrigger>
            <SelectContent>
              {poolTeams.filter(t => t.id !== match.homeTeamId).map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-lg">Tournament Fixtures</h1>
        <p className="text-white/55">Manage participating teams and enter match results. Standings are calculated automatically.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          {renderTeamInputs(teamsA, 'A')}
          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display text-lg font-semibold mb-4 text-primary tracking-wide">Pool A Matches</h3>
            <div className="space-y-2">
              {matchesA.map(m => renderMatchRow(m, teamsA))}
            </div>
          </div>
        </div>

        <div>
          {renderTeamInputs(teamsB, 'B')}
          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display text-lg font-semibold mb-4 text-primary tracking-wide">Pool B Matches</h3>
            <div className="space-y-2">
              {matchesB.map(m => renderMatchRow(m, teamsB))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
