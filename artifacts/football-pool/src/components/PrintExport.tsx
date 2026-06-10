import { usePoolState } from '@/hooks/usePoolState';
import { Standing, Match, Team, Pool, getRoundLabel, getMatchLabel, generatePoolSeeding } from '@/lib/poolLogic';

function fmt(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch { return dateStr; }
}

function PrintPoolFixtures({ pool, matches, teams }: { pool: Pool; matches: Match[]; teams: Team[] }) {
  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name ?? id;
  return (
    <div className="print-section">
      <h3 className="print-pool-title">{pool.name} — Fixtures</h3>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th style={{ width: '22%' }}>Date</th>
            <th style={{ width: '28%' }}>Home</th>
            <th style={{ width: '10%', textAlign: 'center' }}>Score</th>
            <th style={{ width: '28%' }}>Away</th>
            <th style={{ width: '7%', textAlign: 'center' }}>Res</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => {
            const played = m.homeGoals !== null && m.awayGoals !== null;
            const res = played
              ? m.homeGoals! > m.awayGoals! ? 'H' : m.homeGoals! < m.awayGoals! ? 'A' : 'D'
              : '';
            return (
              <tr key={m.id}>
                <td>{m.matchNumber}</td>
                <td>{fmt(m.date)}</td>
                <td style={{ fontWeight: played && m.homeGoals! > m.awayGoals! ? 700 : 400 }}>{getTeamName(m.homeTeamId)}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}>
                  {played ? `${m.homeGoals} – ${m.awayGoals}` : '— : —'}
                </td>
                <td style={{ fontWeight: played && m.awayGoals! > m.homeGoals! ? 700 : 400 }}>{getTeamName(m.awayTeamId)}</td>
                <td style={{ textAlign: 'center', fontSize: '10px', color: '#555' }}>{res}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PrintPoolStandings({ pool, standings, qualifiersPerPool }: { pool: Pool; standings: Standing[]; qualifiersPerPool: number }) {
  return (
    <div className="print-section">
      <h3 className="print-pool-title">{pool.name} — Standings</h3>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '5%', textAlign: 'center' }}>Pos</th>
            <th style={{ width: '26%' }}>Team</th>
            <th style={{ width: '7%', textAlign: 'center' }}>P</th>
            <th style={{ width: '7%', textAlign: 'center' }}>W</th>
            <th style={{ width: '7%', textAlign: 'center' }}>D</th>
            <th style={{ width: '7%', textAlign: 'center' }}>L</th>
            <th style={{ width: '8%', textAlign: 'center' }}>GF</th>
            <th style={{ width: '8%', textAlign: 'center' }}>GA</th>
            <th style={{ width: '8%', textAlign: 'center' }}>GD</th>
            <th style={{ width: '9%', textAlign: 'center' }}>Pts</th>
            <th style={{ width: '8%', textAlign: 'center' }}>Q</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => {
            const qualifies = idx < qualifiersPerPool;
            return (
              <tr key={s.teamId} style={qualifies ? { background: '#e8f5e9', fontWeight: 700 } : {}}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td>{s.teamName}</td>
                <td style={{ textAlign: 'center' }}>{s.played}</td>
                <td style={{ textAlign: 'center' }}>{s.won}</td>
                <td style={{ textAlign: 'center' }}>{s.drawn}</td>
                <td style={{ textAlign: 'center' }}>{s.lost}</td>
                <td style={{ textAlign: 'center' }}>{s.gf}</td>
                <td style={{ textAlign: 'center' }}>{s.ga}</td>
                <td style={{ textAlign: 'center' }}>{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px' }}>{s.points}</td>
                <td style={{ textAlign: 'center', fontSize: '11px' }}>{qualifies ? '✓' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PrintExport() {
  const { pools, teams, matches, poolStandings, resolvedBracket, qualifiers, settings } = usePoolState();

  const totalRounds   = Math.log2(qualifiers);
  const champion      = resolvedBracket.find(m => m.round === 1)?.winner ?? null;
  const qualifiersPerPool = Math.floor(qualifiers / settings.poolCount);
  const printDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const koRounds: { label: string; matches: typeof resolvedBracket }[] = [];
  for (let r = totalRounds; r >= 1; r--) {
    const rMatches = resolvedBracket.filter(m => m.round === r);
    if (rMatches.length) koRounds.push({ label: getRoundLabel(r, totalRounds), matches: rMatches });
  }

  const seededStandings = generatePoolSeeding(poolStandings, qualifiers);

  return (
    <>
      <button
        onClick={() => window.print()}
        data-testid="button-print-export"
        className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm text-white shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.95))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(74,222,128,0.4)',
          boxShadow: '0 4px 24px rgba(34,197,94,0.35), 0 2px 8px rgba(0,0,0,0.3)',
        }}
        title="Export as PDF"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print / Export PDF
      </button>

      <div className="print-only print-document">
        <div className="print-header">
          <div className="print-header-logo">⚽ POOLCALC</div>
          <div className="print-header-title">Tournament Report</div>
          <div className="print-header-date">Generated: {printDate}</div>
        </div>

        <div className="print-body">
          {/* Fixtures per pool */}
          <h2 className="print-section-heading">Pool Fixtures</h2>
          {pools.map(pool => (
            <PrintPoolFixtures
              key={pool.id}
              pool={pool}
              matches={matches.filter(m => m.poolId === pool.id)}
              teams={teams}
            />
          ))}

          <div className="print-page-break" />

          {/* Standings per pool */}
          <h2 className="print-section-heading">Pool Standings</h2>
          {pools.map((pool, pi) => (
            <PrintPoolStandings
              key={pool.id}
              pool={pool}
              standings={poolStandings[pi] ?? []}
              qualifiersPerPool={qualifiersPerPool}
            />
          ))}

          {/* Knockout */}
          {koRounds.length > 0 && (
            <>
              <div className="print-page-break" />
              <h2 className="print-section-heading">Knockout Stage</h2>

              {/* Seeding */}
              <div className="print-section">
                <h3 className="print-pool-title">Seeding</h3>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%', textAlign: 'center' }}>Seed</th>
                      <th style={{ width: '40%' }}>Team</th>
                      <th style={{ width: '30%' }}>Pool</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seededStandings.map((s, i) => (
                      <tr key={s.teamId}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>#{i + 1}</td>
                        <td>{s.teamName}</td>
                        <td>{pools.find(p => p.id === s.poolId)?.name ?? s.poolId}</td>
                        <td style={{ textAlign: 'center' }}>{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {koRounds.map(({ label, matches: rMatches }) => (
                <div key={label} className="print-section">
                  <h3 className="print-pool-title">{label}</h3>
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th style={{ width: '18%' }}>Match</th>
                        <th style={{ width: '34%' }}>Home Team</th>
                        <th style={{ width: '12%', textAlign: 'center' }}>Score</th>
                        <th style={{ width: '34%' }}>Away Team</th>
                        <th style={{ width: '2%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rMatches.map(m => {
                        const played = m.homeGoals !== null && m.awayGoals !== null;
                        return (
                          <tr key={m.id}>
                            <td>{getMatchLabel(m.round, m.slot, totalRounds)}</td>
                            <td style={{ fontWeight: m.winner?.teamId === m.homeTeam?.teamId ? 800 : 400 }}>
                              {m.homeTeam?.teamName ?? 'TBD'}
                            </td>
                            <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                              {played ? `${m.homeGoals} – ${m.awayGoals}` : '— : —'}
                            </td>
                            <td style={{ fontWeight: m.winner?.teamId === m.awayTeam?.teamId ? 800 : 400 }}>
                              {m.awayTeam?.teamName ?? 'TBD'}
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '11px' }}>{m.winner ? '✓' : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {champion && (
            <div className="print-finalists" style={{ marginTop: '20px' }}>
              <div className="print-finalists-title">🏆 Tournament Champion</div>
              <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 900, color: '#b45309' }}>
                {champion.teamName}
              </div>
            </div>
          )}

          {!champion && seededStandings.length >= 2 && (
            <div className="print-finalists">
              <div className="print-finalists-title">🏆 Finalists</div>
              <div className="print-finalists-row">
                <div className="print-finalist-box">
                  <div className="print-finalist-label">{seededStandings[0]?.poolId ? pools.find(p=>p.id===seededStandings[0]?.poolId)?.name : ''} 1st</div>
                  <div className="print-finalist-name">{seededStandings[0]?.teamName ?? '—'}</div>
                </div>
                <div className="print-finalist-vs">VS</div>
                <div className="print-finalist-box">
                  <div className="print-finalist-label">{seededStandings[1]?.poolId ? pools.find(p=>p.id===seededStandings[1]?.poolId)?.name : ''} 1st</div>
                  <div className="print-finalist-name">{seededStandings[1]?.teamName ?? '—'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="print-footer">Printed from POOLCALC · {printDate}</div>
        </div>
      </div>
    </>
  );
}
