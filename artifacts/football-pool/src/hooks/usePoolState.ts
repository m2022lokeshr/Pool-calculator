import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Team, Match, Standing, LeagueSettings, QualifierCount, KnockoutMatch,
  generateRoundRobinMatches, calculateStandings,
  generateKnockoutStructure, resolveKnockout, ResolvedKOMatch,
} from '@/lib/poolLogic';

const DEFAULT_SETTINGS: LeagueSettings = { teamCount: 8, legs: 1 };
const DEFAULT_QUALIFIERS: QualifierCount = 2;

function makeTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
  }));
}

function mergeMatches(newMatches: Match[], prevMatches: Match[]): Match[] {
  return newMatches.map(nm => {
    const ex = prevMatches.find(pm => pm.id === nm.id);
    if (ex) return { ...nm, homeGoals: ex.homeGoals, awayGoals: ex.awayGoals, date: ex.date, matchNumber: ex.matchNumber };
    return nm;
  });
}

export function usePoolState() {
  const [settings, setSettings] = useState<LeagueSettings>(() => {
    try { const s = localStorage.getItem('fp2_settings'); return s ? JSON.parse(s) : DEFAULT_SETTINGS; }
    catch { return DEFAULT_SETTINGS; }
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const s = localStorage.getItem('fp2_teams');
      return s ? JSON.parse(s) : makeTeams(DEFAULT_SETTINGS.teamCount);
    } catch { return makeTeams(DEFAULT_SETTINGS.teamCount); }
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const s = localStorage.getItem('fp2_matches');
      if (s) return JSON.parse(s);
      const t = makeTeams(DEFAULT_SETTINGS.teamCount);
      return generateRoundRobinMatches(t, DEFAULT_SETTINGS.legs);
    } catch {
      const t = makeTeams(DEFAULT_SETTINGS.teamCount);
      return generateRoundRobinMatches(t, DEFAULT_SETTINGS.legs);
    }
  });

  const [qualifiers, setQualifiers] = useState<QualifierCount>(() => {
    try { const s = localStorage.getItem('fp2_qualifiers'); return s ? JSON.parse(s) : DEFAULT_QUALIFIERS; }
    catch { return DEFAULT_QUALIFIERS; }
  });

  const [koMatches, setKoMatches] = useState<KnockoutMatch[]>(() => {
    try {
      const s = localStorage.getItem('fp2_ko');
      return s ? JSON.parse(s) : generateKnockoutStructure(DEFAULT_QUALIFIERS);
    } catch { return generateKnockoutStructure(DEFAULT_QUALIFIERS); }
  });

  // Refs for use inside callbacks without stale closures
  const teamsRef = useRef(teams);
  const settingsRef = useRef(settings);
  const matchesRef = useRef(matches);
  useEffect(() => { teamsRef.current = teams; }, [teams]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { matchesRef.current = matches; }, [matches]);

  // Persist
  useEffect(() => { localStorage.setItem('fp2_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('fp2_teams', JSON.stringify(teams)); }, [teams]);
  useEffect(() => { localStorage.setItem('fp2_matches', JSON.stringify(matches)); }, [matches]);
  useEffect(() => { localStorage.setItem('fp2_qualifiers', JSON.stringify(qualifiers)); }, [qualifiers]);
  useEffect(() => { localStorage.setItem('fp2_ko', JSON.stringify(koMatches)); }, [koMatches]);

  const standings = useMemo(() => calculateStandings(teams, matches), [teams, matches]);

  const resolvedBracket: ResolvedKOMatch[] = useMemo(
    () => resolveKnockout(koMatches, standings, qualifiers),
    [koMatches, standings, qualifiers]
  );

  const updateTeamName = useCallback((id: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const updateMatch = useCallback((id: string, updates: Partial<Match>) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const updateTeamCount = useCallback((newCount: number) => {
    const prev = teamsRef.current;
    let newTeams: Team[];
    if (newCount > prev.length) {
      newTeams = [
        ...prev,
        ...Array.from({ length: newCount - prev.length }, (_, i) => ({
          id: `team-${prev.length + i + 1}`,
          name: `Team ${prev.length + i + 1}`,
        })),
      ];
    } else {
      newTeams = prev.slice(0, newCount);
    }
    const newMatches = generateRoundRobinMatches(newTeams, settingsRef.current.legs);
    setTeams(newTeams);
    setSettings(s => ({ ...s, teamCount: newCount }));
    setMatches(mergeMatches(newMatches, matchesRef.current));
  }, []);

  const updateLegs = useCallback((newLegs: number) => {
    const newMatches = generateRoundRobinMatches(teamsRef.current, newLegs);
    setSettings(s => ({ ...s, legs: newLegs }));
    setMatches(mergeMatches(newMatches, matchesRef.current));
  }, []);

  const updateKoMatch = useCallback((id: string, updates: Partial<KnockoutMatch>) => {
    setKoMatches(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const updateQualifiers = useCallback((q: QualifierCount) => {
    setQualifiers(q);
    setKoMatches(generateKnockoutStructure(q));
  }, []);

  return {
    settings,
    teams,
    matches,
    standings,
    qualifiers,
    resolvedBracket,
    updateTeamName,
    updateMatch,
    updateTeamCount,
    updateLegs,
    updateKoMatch,
    updateQualifiers,
  };
}
