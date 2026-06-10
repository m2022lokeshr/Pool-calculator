export interface Team {
  id: string;
  pool: 'A' | 'B';
  name: string;
}

export interface Match {
  id: string;
  pool: 'A' | 'B';
  matchNumber: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface Standing {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export function calculateStandings(teams: Team[], matches: Match[], pool: 'A' | 'B'): Standing[] {
  const poolTeams = teams.filter(t => t.pool === pool);
  const poolMatches = matches.filter(m => m.pool === pool && m.homeGoals !== null && m.awayGoals !== null);

  const standingsMap = new Map<string, Standing>();

  poolTeams.forEach(t => {
    standingsMap.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    });
  });

  poolMatches.forEach(m => {
    const home = standingsMap.get(m.homeTeamId);
    const away = standingsMap.get(m.awayTeamId);

    if (!home || !away) return;
    if (m.homeGoals === null || m.awayGoals === null) return;

    home.played += 1;
    away.played += 1;

    home.gf += m.homeGoals;
    home.ga += m.awayGoals;
    away.gf += m.awayGoals;
    away.ga += m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.homeGoals < m.awayGoals) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      home.points += 1;
      away.drawn += 1;
      away.points += 1;
    }
  });

  const standings = Array.from(standingsMap.values());

  standings.forEach(s => {
    s.gd = s.gf - s.ga;
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  return standings;
}
