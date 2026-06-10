import { usePoolState } from '@/hooks/usePoolState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StandingsPage() {
  const { pools, poolStandings, settings, qualifiers } = usePoolState();

  const qualifiersPerPool = Math.floor(qualifiers / settings.poolCount);

  const poolColors = [
    { bg: 'rgba(34,197,94',  text: 'text-green-400',  border: 'rgba(34,197,94',  label: 'green'  },
    { bg: 'rgba(59,130,246', text: 'text-blue-400',   border: 'rgba(59,130,246', label: 'blue'   },
    { bg: 'rgba(168,85,247', text: 'text-purple-400', border: 'rgba(168,85,247', label: 'purple' },
    { bg: 'rgba(249,115,22', text: 'text-orange-400', border: 'rgba(249,115,22', label: 'orange' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-lg">Points Table</h1>
        <p className="text-white/55">
          Live pool standings · Top {qualifiersPerPool} from each pool advance to the knockout stage.
        </p>
      </div>

      <div className="space-y-8">
        {pools.map((pool, pi) => {
          const standings = poolStandings[pi] ?? [];
          const c = poolColors[pi] ?? poolColors[0];

          return (
            <div key={pool.id} className="glass-card rounded-xl overflow-hidden">
              {/* Pool header */}
              <div
                className="px-5 py-3 flex items-center justify-between border-b border-white/10"
                style={{ background: `${c.bg},0.14)` }}
              >
                <h2 className="font-display text-2xl font-bold text-white tracking-wide">{pool.name}</h2>
                {qualifiersPerPool > 0 && (
                  <span className="text-white/45 text-xs font-medium">
                    Top {qualifiersPerPool} qualify
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-10 text-center text-white/50">Pos</TableHead>
                      <TableHead className="font-bold text-white/70">Team</TableHead>
                      <TableHead className="text-center w-10 text-white/50" title="Played">P</TableHead>
                      <TableHead className="text-center w-10 text-white/50" title="Won">W</TableHead>
                      <TableHead className="text-center w-10 text-white/50" title="Drawn">D</TableHead>
                      <TableHead className="text-center w-10 text-white/50" title="Lost">L</TableHead>
                      <TableHead className="text-center w-10 text-white/50" title="Goals For">GF</TableHead>
                      <TableHead className="text-center w-10 text-white/50" title="Goals Against">GA</TableHead>
                      <TableHead className="text-center w-14 text-white/60" title="Goal Difference">GD</TableHead>
                      <TableHead className={`text-center w-14 font-display text-lg ${c.text}`}>Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((s, idx) => {
                      const qualifies = idx < qualifiersPerPool;
                      return (
                        <TableRow
                          key={s.teamId}
                          className={`border-white/8 transition-all ${qualifies ? 'finalist-row' : 'hover:bg-white/5'}`}
                          data-testid={`row-standing-${s.teamId}`}
                        >
                          <TableCell className="text-center font-bold text-white/50">{idx + 1}</TableCell>
                          <TableCell className="font-bold text-white">
                            <div className="flex items-center gap-2 flex-wrap">
                              {s.teamName}
                              {qualifies && (
                                <span
                                  className="finalist-badge"
                                  style={{ background: `${c.bg},0.2)`, borderColor: `${c.border},0.4)` }}
                                >
                                  ✓ Qualifies
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-white/80">{s.played}</TableCell>
                          <TableCell className="text-center text-green-400 font-medium">{s.won}</TableCell>
                          <TableCell className="text-center text-yellow-400 font-medium">{s.drawn}</TableCell>
                          <TableCell className="text-center text-red-400 font-medium">{s.lost}</TableCell>
                          <TableCell className="text-center text-white/60">{s.gf}</TableCell>
                          <TableCell className="text-center text-white/60">{s.ga}</TableCell>
                          <TableCell className={`text-center font-bold ${s.gd > 0 ? 'text-primary' : s.gd < 0 ? 'text-red-400' : 'text-white/50'}`}>
                            {s.gd > 0 ? `+${s.gd}` : s.gd}
                          </TableCell>
                          <TableCell className={`text-center font-display text-xl font-bold ${c.text}`}>
                            {s.points}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {standings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-white/25 py-8 text-sm">
                          Enter results on the Fixtures page to see standings.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Qualifiers summary */}
      {qualifiersPerPool > 0 && pools.some((_, pi) => (poolStandings[pi]?.length ?? 0) > 0) && (
        <div className="mt-8 glass-card rounded-xl p-5">
          <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">
            Pool Qualifiers → Knockout Stage
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pools.map((pool, pi) => {
              const standings = poolStandings[pi] ?? [];
              const c = poolColors[pi] ?? poolColors[0];
              return standings.slice(0, qualifiersPerPool).map((s, rank) => (
                <div
                  key={s.teamId}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: `${c.bg},0.12)`,
                    border: `1px solid ${c.border},0.3)`,
                  }}
                  data-testid={`card-qualifier-${pool.id}-${rank}`}
                >
                  <div className="text-white/35 text-[10px] uppercase tracking-widest mb-1">
                    {pool.name} · {rank + 1}{rank === 0 ? 'st' : rank === 1 ? 'nd' : rank === 2 ? 'rd' : 'th'}
                  </div>
                  <div className="text-white font-bold text-sm truncate">{s.teamName}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${c.text}`}>{s.points} pts</div>
                </div>
              ));
            })}
          </div>
        </div>
      )}
    </div>
  );
}
