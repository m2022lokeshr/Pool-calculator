import { usePoolState } from '@/hooks/usePoolState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StandingsPage() {
  const { standings } = usePoolState();

  const finalistCount = Math.min(2, standings.length);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-lg">Points Table</h1>
        <p className="text-white/55">Live standings updated automatically. Top 2 qualify for the knockout stage.</p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="border-b border-white/10 p-4" style={{ background: 'rgba(34,197,94,0.10)' }}>
          <h2 className="font-display text-2xl font-bold text-primary tracking-wide">League Standings</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader style={{ background: 'rgba(255,255,255,0.04)' }}>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-12 text-center text-white/50 font-semibold">Pos</TableHead>
                <TableHead className="font-bold text-white/70">Team</TableHead>
                <TableHead className="text-center w-12 text-white/50" title="Played">P</TableHead>
                <TableHead className="text-center w-12 text-white/50" title="Won">W</TableHead>
                <TableHead className="text-center w-12 text-white/50" title="Drawn">D</TableHead>
                <TableHead className="text-center w-12 text-white/50" title="Lost">L</TableHead>
                <TableHead className="text-center w-12 text-white/50" title="Goals For">GF</TableHead>
                <TableHead className="text-center w-12 text-white/50" title="Goals Against">GA</TableHead>
                <TableHead className="text-center w-16 font-bold text-white/60" title="Goal Difference">GD</TableHead>
                <TableHead className="text-center w-16 font-display text-lg text-primary">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s, idx) => {
                const isFinalist = idx < finalistCount;
                return (
                  <TableRow
                    key={s.teamId}
                    className={`border-white/8 transition-all ${isFinalist ? 'finalist-row' : 'hover:bg-white/5'}`}
                    data-testid={`row-standing-${s.teamId}`}
                  >
                    <TableCell className="text-center font-bold text-white/50">{idx + 1}</TableCell>
                    <TableCell className="font-bold text-white">
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.teamName}
                        {isFinalist && <span className="finalist-badge">🏆 Finalist</span>}
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
                    <TableCell className="text-center font-display text-xl text-primary font-bold">{s.points}</TableCell>
                  </TableRow>
                );
              })}
              {standings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-white/30 py-12 text-sm">
                    Enter match results on the Fixtures page to see standings.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Finalist callout */}
      {standings.length >= 2 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {standings.slice(0, finalistCount).map((s, i) => (
            <div
              key={s.teamId}
              className="rounded-xl p-4 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                border: '1px solid rgba(74,222,128,0.3)',
                boxShadow: '0 0 20px rgba(34,197,94,0.08)',
              }}
              data-testid={`card-finalist-${i + 1}`}
            >
              <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
                {i === 0 ? '1st Place · Pool Finalist' : '2nd Place · Pool Finalist'}
              </div>
              <div className="text-white font-bold text-lg">{s.teamName}</div>
              <div className="text-primary text-sm font-semibold mt-1">{s.points} pts</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
