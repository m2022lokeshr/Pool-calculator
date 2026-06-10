import { useState, useEffect, useMemo, useCallback } from 'react';
import { Team, Match, calculateStandings } from '@/lib/poolLogic';

const DEFAULT_TEAMS_A: Team[] = [
  { id: 'A1', pool: 'A', name: 'Team A1' },
  { id: 'A2', pool: 'A', name: 'Team A2' },
  { id: 'A3', pool: 'A', name: 'Team A3' },
  { id: 'A4', pool: 'A', name: 'Team A4' },
];

const DEFAULT_TEAMS_B: Team[] = [
  { id: 'B1', pool: 'B', name: 'Team B1' },
  { id: 'B2', pool: 'B', name: 'Team B2' },
  { id: 'B3', pool: 'B', name: 'Team B3' },
  { id: 'B4', pool: 'B', name: 'Team B4' },
];

const generateMatches = (poolTeams: Team[], pool: 'A' | 'B'): Match[] => {
  const pairs = [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [1, 3], [2, 3]
  ];
  return pairs.map((pair, idx) => ({
    id: `${pool}-match-${idx + 1}`,
    pool,
    matchNumber: `${pool}${idx + 1}`,
    date: '',
    homeTeamId: poolTeams[pair[0]].id,
    awayTeamId: poolTeams[pair[1]].id,
    homeGoals: null,
    awayGoals: null,
  }));
};

const DEFAULT_TEAMS = [...DEFAULT_TEAMS_A, ...DEFAULT_TEAMS_B];
const DEFAULT_MATCHES = [
  ...generateMatches(DEFAULT_TEAMS_A, 'A'),
  ...generateMatches(DEFAULT_TEAMS_B, 'B'),
];

export function usePoolState() {
  const [teams, setTeams] = useState<Team[]>(() => {
    const stored = localStorage.getItem('footballPool_teams');
    return stored ? JSON.parse(stored) : DEFAULT_TEAMS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const stored = localStorage.getItem('footballPool_matches');
    return stored ? JSON.parse(stored) : DEFAULT_MATCHES;
  });

  useEffect(() => {
    localStorage.setItem('footballPool_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('footballPool_matches', JSON.stringify(matches));
  }, [matches]);

  const updateTeamName = useCallback((id: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const updateMatch = useCallback((id: string, updates: Partial<Match>) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const standingsA = useMemo(() => calculateStandings(teams, matches, 'A'), [teams, matches]);
  const standingsB = useMemo(() => calculateStandings(teams, matches, 'B'), [teams, matches]);

  return {
    teams,
    matches,
    updateTeamName,
    updateMatch,
    standingsA,
    standingsB,
  };
}
