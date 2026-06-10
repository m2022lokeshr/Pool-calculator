import { usePoolState } from '@/hooks/usePoolState';
import { Team, Match, Standing } from '@/lib/poolLogic';

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch {
    return dateStr;
  }
}

function PrintFixturesTable({ matches, teams, pool }: { matches: Match[]; teams: Team[]; pool: string }) {
  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name ?? id;
  const poolMatches = matches.filter(m => m.pool === pool);

  return (
    <div className="print-section">
      <h3 className="print-pool-title">Pool {pool} — Fixtures</h3>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th style={{ width: '22%' }}>Date & Time</th>
            <th style={{ width: '28%' }}>Home Team</th>
            <th style={{ width: '10%', textAlign: 'center' }}>Score</th>
            <th style={{ width: '28%' }}>Away Team</th>
            <th style={{ width: '7%', textAlign: 'center' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {poolMatches.map((m) => {
            const played = m.homeGoals !== null && m.awayGoals !== null;
            const result = played
              ? m.homeGoals! > m.awayGoals!
                ? 'H'
                : m.homeGoals! < m.awayGoals!
                ? 'A'
                : 'D'
              : '';
            return (
              <tr key={m.id}>
                <td>{m.matchNumber}</td>
                <td>{formatDate(m.date)}</td>
                <td style={{ fontWeight: played && m.homeGoals! > m.awayGoals! ? 700 : 400 }}>
                  {getTeamName(m.homeTeamId)}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}>
                  {played ? `${m.homeGoals} – ${m.awayGoals}` : '— : —'}
                </td>
                <td style={{ fontWeight: played && m.awayGoals! > m.homeGoals! ? 700 : 400 }}>
                  {getTeamName(m.awayTeamId)}
                </td>
                <td style={{ textAlign: 'center', fontSize: '10px', color: '#555' }}>{result}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PrintStandingsTable({ standings, pool }: { standings: Standing[]; pool: string }) {
  return (
    <div className="print-section">
      <h3 className="print-pool-title">Pool {pool} — Standings</h3>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '6%', textAlign: 'center' }}>Pos</th>
            <th style={{ width: '26%' }}>Team</th>
            <th style={{ width: '7%', textAlign: 'center' }}>P</th>
            <th style={{ width: '7%', textAlign: 'center' }}>W</th>
            <th style={{ width: '7%', textAlign: 'center' }}>D</th>
            <th style={{ width: '7%', textAlign: 'center' }}>L</th>
            <th style={{ width: '8%', textAlign: 'center' }}>GF</th>
            <th style={{ width: '8%', textAlign: 'center' }}>GA</th>
            <th style={{ width: '10%', textAlign: 'center' }}>GD</th>
            <th style={{ width: '10%', textAlign: 'center' }}>Pts</th>
            <th style={{ width: '4%' }}></th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => {
            const isFirst = idx === 0;
            return (
              <tr key={s.teamId} style={isFirst ? { background: '#e8f5e9', fontWeight: 700 } : {}}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td>{s.teamName}</td>
                <td style={{ textAlign: 'center' }}>{s.played}</td>
                <td style={{ textAlign: 'center' }}>{s.won}</td>
                <td style={{ textAlign: 'center' }}>{s.drawn}</td>
                <td style={{ textAlign: 'center' }}>{s.lost}</td>
                <td style={{ textAlign: 'center' }}>{s.gf}</td>
                <td style={{ textAlign: 'center' }}>{s.ga}</td>
                <td style={{ textAlign: 'center' }}>{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '15px' }}>{s.points}</td>
                <td style={{ textAlign: 'center', fontSize: '11px' }}>{isFirst ? '🏆' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PrintExport() {
  const { teams, matches, standingsA, standingsB } = usePoolState();

  const finalistA = standingsA[0]?.teamName ?? '—';
  const finalistB = standingsB[0]?.teamName ?? '—';
  const printDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

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
          <h2 className="print-section-heading">Fixtures</h2>
          <PrintFixturesTable matches={matches} teams={teams} pool="A" />
          <PrintFixturesTable matches={matches} teams={teams} pool="B" />

          <div className="print-page-break" />

          <h2 className="print-section-heading">Standings</h2>
          <PrintStandingsTable standings={standingsA} pool="A" />
          <PrintStandingsTable standings={standingsB} pool="B" />

          <div className="print-finalists">
            <div className="print-finalists-title">🏆 Finals Qualification</div>
            <div className="print-finalists-row">
              <div className="print-finalist-box">
                <div className="print-finalist-label">Pool A Finalist</div>
                <div className="print-finalist-name">{finalistA}</div>
              </div>
              <div className="print-finalist-vs">VS</div>
              <div className="print-finalist-box">
                <div className="print-finalist-label">Pool B Finalist</div>
                <div className="print-finalist-name">{finalistB}</div>
              </div>
            </div>
          </div>

          <div className="print-footer">
            Printed from POOLCALC · {printDate}
          </div>
        </div>
      </div>
    </>
  );
}
