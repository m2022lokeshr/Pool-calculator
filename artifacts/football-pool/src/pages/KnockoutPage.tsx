import { usePoolState } from '@/hooks/usePoolState';
import { QualifierCount, ResolvedKOMatch, getRoundLabel, getMatchLabel } from '@/lib/poolLogic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const QUALIFIER_OPTIONS: { value: QualifierCount; label: string }[] = [
  { value: 2, label: '2 teams (Final only)' },
  { value: 4, label: '4 teams (Semi-Finals + Final)' },
  { value: 8, label: '8 teams (Quarter-Finals → Final)' },
];

function TeamLabel({
  team,
  isWinner,
  isHome,
}: {
  team: { teamName: string } | null;
  isWinner: boolean;
  isHome: boolean;
}) {
  if (!team) {
    return (
      <span className="text-white/30 italic text-sm">TBD</span>
    );
  }
  return (
    <span
      className={`text-sm font-semibold transition-colors truncate max-w-[120px] ${
        isWinner ? 'text-green-400' : 'text-white/85'
      }`}
    >
      {isWinner && <span className="mr-1 text-green-400">✓</span>}
      {team.teamName}
    </span>
  );
}

function KoMatchCard({
  match,
  label,
  onUpdate,
  isFinal,
}: {
  match: ResolvedKOMatch;
  label: string;
  onUpdate: (id: string, homeGoals: number | null, awayGoals: number | null) => void;
  isFinal: boolean;
}) {
  const hasTeams = match.homeTeam && match.awayTeam;
  const homeWon = match.winner?.teamId === match.homeTeam?.teamId;
  const awayWon = match.winner?.teamId === match.awayTeam?.teamId;

  return (
    <div
      className={`glass-match-row rounded-xl p-4 transition-all ${
        isFinal ? 'ring-1 ring-primary/40' : ''
      }`}
      data-testid={`ko-match-${match.id}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">{label}</div>

      {/* Home row */}
      <div className={`flex items-center gap-3 mb-2 p-2 rounded-lg transition-colors ${homeWon ? 'bg-green-500/10' : 'bg-white/[0.03]'}`}>
        <div className="flex-1 min-w-0">
          <TeamLabel team={match.homeTeam} isWinner={homeWon} isHome />
        </div>
        <Input
          type="number"
          min="0"
          value={match.homeGoals === null ? '' : match.homeGoals}
          onChange={e => {
            const v = e.target.value;
            onUpdate(match.id, v === '' ? null : Number(v), match.awayGoals);
          }}
          placeholder="—"
          disabled={!hasTeams}
          className="w-14 h-8 text-center font-bold text-base disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          data-testid={`input-ko-home-${match.id}`}
        />
      </div>

      <div className="text-center text-white/20 text-xs font-bold my-1 tracking-wider">vs</div>

      {/* Away row */}
      <div className={`flex items-center gap-3 mt-2 p-2 rounded-lg transition-colors ${awayWon ? 'bg-green-500/10' : 'bg-white/[0.03]'}`}>
        <div className="flex-1 min-w-0">
          <TeamLabel team={match.awayTeam} isWinner={awayWon} isHome={false} />
        </div>
        <Input
          type="number"
          min="0"
          value={match.awayGoals === null ? '' : match.awayGoals}
          onChange={e => {
            const v = e.target.value;
            onUpdate(match.id, match.homeGoals, v === '' ? null : Number(v));
          }}
          placeholder="—"
          disabled={!hasTeams}
          className="w-14 h-8 text-center font-bold text-base disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          data-testid={`input-ko-away-${match.id}`}
        />
      </div>
    </div>
  );
}

export default function KnockoutPage() {
  const { qualifiers, resolvedBracket, standings, updateKoMatch, updateQualifiers } = usePoolState();

  const totalRounds = Math.log2(qualifiers);

  // Group by round descending (QF first, then SF, then Final)
  const rounds: { round: number; label: string; matches: ResolvedKOMatch[] }[] = [];
  for (let r = totalRounds; r >= 1; r--) {
    const rMatches = resolvedBracket.filter(m => m.round === r);
    if (rMatches.length > 0) {
      rounds.push({ round: r, label: getRoundLabel(r, totalRounds), matches: rMatches });
    }
  }

  const finalMatch = resolvedBracket.find(m => m.round === 1);
  const champion = finalMatch?.winner ?? null;

  function handleUpdate(id: string, homeGoals: number | null, awayGoals: number | null) {
    updateKoMatch(id, { homeGoals, awayGoals });
  }

  const enoughTeams = standings.length >= qualifiers;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-lg">Knockout Stage</h1>
        <p className="text-white/55">Single-elimination bracket auto-seeded from league standings.</p>
      </div>

      {/* Settings bar */}
      <div className="glass-card rounded-xl p-4 mb-8 flex flex-wrap items-center gap-4">
        <span className="text-white/60 text-sm font-medium">Teams qualifying:</span>
        <Select
          value={String(qualifiers)}
          onValueChange={v => updateQualifiers(Number(v) as QualifierCount)}
        >
          <SelectTrigger
            className="w-64 h-9 text-sm text-white"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
            data-testid="select-qualifiers"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUALIFIER_OPTIONS.map(o => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!enoughTeams && (
          <span className="text-yellow-400 text-xs">
            ⚠ League needs at least {qualifiers} teams (currently {standings.length})
          </span>
        )}
      </div>

      {/* Champion banner */}
      {champion && (
        <div
          className="mb-8 rounded-2xl p-5 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(234,179,8,0.18), rgba(234,179,8,0.07))',
            border: '1.5px solid rgba(234,179,8,0.5)',
            boxShadow: '0 0 32px rgba(234,179,8,0.15)',
          }}
          data-testid="banner-champion"
        >
          <div className="text-yellow-400/70 text-xs font-bold uppercase tracking-widest mb-2">Tournament Champion</div>
          <div className="font-display text-4xl font-bold text-yellow-300 drop-shadow-lg">
            🏆 {champion.teamName}
          </div>
        </div>
      )}

      {/* Bracket */}
      <div className="space-y-8">
        {rounds.map(({ round, label, matches }) => (
          <div key={round}>
            {/* Round header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest px-3">{label}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Matches grid */}
            <div
              className={`grid gap-4 ${
                matches.length === 1
                  ? 'max-w-sm mx-auto'
                  : matches.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {matches.map(m => (
                <KoMatchCard
                  key={m.id}
                  match={m}
                  label={getMatchLabel(m.round, m.slot, totalRounds)}
                  onUpdate={handleUpdate}
                  isFinal={m.round === 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Seeding info */}
      {enoughTeams && (
        <div className="mt-8 glass-card rounded-xl p-4">
          <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Seeding (from League Standings)</div>
          <div className="flex flex-wrap gap-2">
            {standings.slice(0, qualifiers).map((s, i) => (
              <div
                key={s.teamId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-white/40">#{i + 1}</span>
                <span className="text-white/80">{s.teamName}</span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 h-4 border-primary/40 text-primary"
                >
                  {s.points}pts
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
