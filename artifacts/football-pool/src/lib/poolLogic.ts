export interface Team {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  matchNumber: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  leg: number;
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

export interface LeagueSettings {
  teamCount: number;
  legs: number;
}

export type QualifierCount = 2 | 4 | 8;

export interface KnockoutMatch {
  id: string;
  round: number;  // highest = first round (QF), 1 = Final
  slot: number;   // 0-indexed within round
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface ResolvedKOMatch {
  id: string;
  round: number;
  slot: number;
  homeTeam: Standing | null;
  awayTeam: Standing | null;
  homeGoals: number | null;
  awayGoals: number | null;
  winner: Standing | null;
}

// Standard bracket seeds for N qualifiers.
// Each pair = [homeIdx, awayIdx] into sorted standings.
function getBracketSeeds(qualifiers: QualifierCount): number[] {
  if (qualifiers === 2) return [0, 1];
  if (qualifiers === 4) return [0, 3, 1, 2];
  return [0, 7, 3, 4, 1, 6, 2, 5];
}

export function generateRoundRobinMatches(teams: Team[], legs: number): Match[] {
  const n = teams.length;
  if (n < 2) return [];
  const matches: Match[] = [];
  let idx = 0;
  for (let leg = 1; leg <= legs; leg++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        idx++;
        // Swap home/away on even legs for home-and-away format
        const [hi, ai] = leg % 2 === 1 ? [i, j] : [j, i];
        matches.push({
          id: `m-${leg}-${i}-${j}`,
          matchNumber: String(idx),
          date: '',
          homeTeamId: teams[hi].id,
          awayTeamId: teams[ai].id,
          homeGoals: null,
          awayGoals: null,
          leg,
        });
      }
    }
  }
  return matches;
}

export function calculateStandings(teams: Team[], matches: Match[]): Standing[] {
  const map = new Map<string, Standing>();
  teams.forEach(t =>
    map.set(t.id, {
      teamId: t.id, teamName: t.name,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
    })
  );

  matches.forEach(m => {
    if (m.homeGoals === null || m.awayGoals === null) return;
    const h = map.get(m.homeTeamId);
    const a = map.get(m.awayTeamId);
    if (!h || !a) return;
    h.played++; a.played++;
    h.gf += m.homeGoals; h.ga += m.awayGoals;
    a.gf += m.awayGoals; a.ga += m.homeGoals;
    if (m.homeGoals > m.awayGoals) { h.won++; h.points += 3; a.lost++; }
    else if (m.homeGoals < m.awayGoals) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; h.points++; a.drawn++; a.points++; }
  });

  const result = Array.from(map.values());
  result.forEach(s => { s.gd = s.gf - s.ga; });
  result.sort((a, b) =>
    b.points !== a.points ? b.points - a.points :
    b.gd !== a.gd ? b.gd - a.gd :
    b.gf - a.gf
  );
  return result;
}

export function generateKnockoutStructure(qualifiers: QualifierCount): KnockoutMatch[] {
  const totalRounds = Math.log2(qualifiers);
  const matches: KnockoutMatch[] = [];
  for (let r = totalRounds; r >= 1; r--) {
    const count = Math.pow(2, r - 1);
    for (let s = 0; s < count; s++) {
      matches.push({ id: `ko-r${r}-s${s}`, round: r, slot: s, homeGoals: null, awayGoals: null });
    }
  }
  return matches;
}

export function resolveKnockout(
  koMatches: KnockoutMatch[],
  standings: Standing[],
  qualifiers: QualifierCount
): ResolvedKOMatch[] {
  const totalRounds = Math.log2(qualifiers);
  const seeds = getBracketSeeds(qualifiers);
  const byKey = new Map<string, KnockoutMatch>(
    koMatches.map(m => [`${m.round}-${m.slot}`, m])
  );
  const resolved = new Map<string, ResolvedKOMatch>();

  // Process from first round (QF) down to Final
  for (let r = totalRounds; r >= 1; r--) {
    const matchesInRound = Math.pow(2, r - 1);
    for (let s = 0; s < matchesInRound; s++) {
      const key = `${r}-${s}`;
      const raw = byKey.get(key);
      if (!raw) continue;

      let homeTeam: Standing | null = null;
      let awayTeam: Standing | null = null;

      if (r === totalRounds) {
        homeTeam = standings[seeds[s * 2]] ?? null;
        awayTeam = standings[seeds[s * 2 + 1]] ?? null;
      } else {
        homeTeam = resolved.get(`${r + 1}-${s * 2}`)?.winner ?? null;
        awayTeam = resolved.get(`${r + 1}-${s * 2 + 1}`)?.winner ?? null;
      }

      let winner: Standing | null = null;
      if (raw.homeGoals !== null && raw.awayGoals !== null && homeTeam && awayTeam) {
        if (raw.homeGoals > raw.awayGoals) winner = homeTeam;
        else if (raw.awayGoals > raw.homeGoals) winner = awayTeam;
      }

      resolved.set(key, { id: raw.id, round: r, slot: s, homeTeam, awayTeam, homeGoals: raw.homeGoals, awayGoals: raw.awayGoals, winner });
    }
  }

  return Array.from(resolved.values()).sort((a, b) =>
    a.round !== b.round ? b.round - a.round : a.slot - b.slot
  );
}

export function getRoundLabel(round: number, totalRounds: number): string {
  if (round === 1) return 'Final';
  if (round === 2) return 'Semi-Finals';
  if (round === 3) return 'Quarter-Finals';
  return `Round of ${Math.pow(2, round)}`;
}

export function getMatchLabel(round: number, slot: number, totalRounds: number): string {
  const roundLabel = getRoundLabel(round, totalRounds);
  if (round === 1) return 'Final';
  const count = Math.pow(2, round - 1);
  if (count === 1) return roundLabel;
  return `${roundLabel.replace('-Finals', '')} ${slot + 1}`;
}
