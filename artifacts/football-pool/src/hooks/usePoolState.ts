import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Team, Match, Standing, Pool, LeagueSettings, QualifierCount, KnockoutMatch, ResolvedKOMatch,
  getPools, makeTeams, generateAllMatches, calculateStandings,
  generateKnockoutStructure, resolveKnockout,
} from '@/lib/poolLogic';

const DEFAULT_SETTINGS: LeagueSettings = { poolCount: 2, teamsPerPool: 4, legs: 1 };
const DEFAULT_QUALIFIERS: QualifierCount = 4;

function defaultPoolNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Pool ${String.fromCharCode(65 + i)}`);
}

function mergeMatches(newMatches: Match[], prevMatches: Match[]): Match[] {
  return newMatches.map(nm => {
    const ex = prevMatches.find(pm => pm.id === nm.id);
    if (ex) return { ...nm, homeGoals: ex.homeGoals, awayGoals: ex.awayGoals, date: ex.date, matchNumber: ex.matchNumber };
    return nm;
  });
}

function load<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}

export function usePoolState() {
  const [settings, setSettings] = useState<LeagueSettings>(() =>
    load('fp3_settings', DEFAULT_SETTINGS)
  );

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = load<Team[] | null>('fp3_teams', null);
    return saved ?? makeTeams(DEFAULT_SETTINGS.poolCount, DEFAULT_SETTINGS.teamsPerPool);
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = load<Match[] | null>('fp3_matches', null);
    if (saved) return saved;
    const t = makeTeams(DEFAULT_SETTINGS.poolCount, DEFAULT_SETTINGS.teamsPerPool);
    return generateAllMatches(t, DEFAULT_SETTINGS.legs, DEFAULT_SETTINGS.poolCount);
  });

  const [qualifiers, setQualifiers] = useState<QualifierCount>(() =>
    load('fp3_qualifiers', DEFAULT_QUALIFIERS)
  );

  const [koMatches, setKoMatches] = useState<KnockoutMatch[]>(() =>
    load('fp3_ko', generateKnockoutStructure(DEFAULT_QUALIFIERS))
  );

  const [poolNames, setPoolNames] = useState<string[]>(() =>
    load('fp3_poolNames', defaultPoolNames(DEFAULT_SETTINGS.poolCount))
  );

  // Refs to avoid stale closures in callbacks
  const settingsRef = useRef(settings);
  const teamsRef    = useRef(teams);
  const matchesRef  = useRef(matches);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { teamsRef.current    = teams;    }, [teams]);
  useEffect(() => { matchesRef.current  = matches;  }, [matches]);

  // Persistence
  useEffect(() => { localStorage.setItem('fp3_settings',   JSON.stringify(settings));  }, [settings]);
  useEffect(() => { localStorage.setItem('fp3_teams',      JSON.stringify(teams));     }, [teams]);
  useEffect(() => { localStorage.setItem('fp3_matches',    JSON.stringify(matches));   }, [matches]);
  useEffect(() => { localStorage.setItem('fp3_qualifiers', JSON.stringify(qualifiers));}, [qualifiers]);
  useEffect(() => { localStorage.setItem('fp3_ko',         JSON.stringify(koMatches)); }, [koMatches]);
  useEffect(() => { localStorage.setItem('fp3_poolNames',  JSON.stringify(poolNames)); }, [poolNames]);

  // Derived
  const pools: Pool[] = useMemo(
    () => getPools(settings.poolCount, poolNames),
    [settings.poolCount, poolNames]
  );

  const poolStandings: Standing[][] = useMemo(() =>
    pools.map(pool => {
      const poolTeams   = teams.filter(t => t.poolId === pool.id);
      const poolMatches = matches.filter(m => m.poolId === pool.id);
      return calculateStandings(poolTeams, poolMatches);
    }),
    [pools, teams, matches]
  );

  const resolvedBracket: ResolvedKOMatch[] = useMemo(
    () => resolveKnockout(koMatches, poolStandings, qualifiers),
    [koMatches, poolStandings, qualifiers]
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  const updateTeamName = useCallback((id: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const updateMatch = useCallback((id: string, updates: Partial<Match>) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const updatePoolCount = useCallback((newCount: number) => {
    const s = settingsRef.current;
    const prevTeams = teamsRef.current;
    const prevMatches = matchesRef.current;

    // Build new team list: reuse existing pools, create fresh new ones
    const newTeams: Team[] = [];
    for (let p = 0; p < newCount; p++) {
      const poolId = `pool-${p}`;
      const letter = String.fromCharCode(65 + p);
      const existing = prevTeams.filter(t => t.poolId === poolId);
      if (existing.length >= s.teamsPerPool) {
        newTeams.push(...existing.slice(0, s.teamsPerPool));
      } else {
        const extended = [...existing];
        while (extended.length < s.teamsPerPool) {
          const idx = extended.length;
          extended.push({ id: `${poolId}-t${idx + 1}`, name: `Pool ${letter} Team ${idx + 1}`, poolId });
        }
        newTeams.push(...extended);
      }
    }

    const newMatches = generateAllMatches(newTeams, s.legs, newCount);
    setTeams(newTeams);
    setSettings(prev => ({ ...prev, poolCount: newCount }));
    setMatches(mergeMatches(newMatches, prevMatches));
    // Preserve existing names, pad with defaults for new pools
    setPoolNames(prev => {
      const extended = [...prev];
      while (extended.length < newCount) {
        extended.push(`Pool ${String.fromCharCode(65 + extended.length)}`);
      }
      return extended.slice(0, newCount);
    });
  }, []);

  const updateTeamsPerPool = useCallback((newTPP: number) => {
    const s = settingsRef.current;
    const prevTeams = teamsRef.current;
    const prevMatches = matchesRef.current;

    const newTeams: Team[] = [];
    for (let p = 0; p < s.poolCount; p++) {
      const poolId = `pool-${p}`;
      const letter = String.fromCharCode(65 + p);
      const existing = prevTeams.filter(t => t.poolId === poolId);
      if (newTPP <= existing.length) {
        newTeams.push(...existing.slice(0, newTPP));
      } else {
        const extended = [...existing];
        while (extended.length < newTPP) {
          const idx = extended.length;
          extended.push({ id: `${poolId}-t${idx + 1}`, name: `Pool ${letter} Team ${idx + 1}`, poolId });
        }
        newTeams.push(...extended);
      }
    }

    const newMatches = generateAllMatches(newTeams, s.legs, s.poolCount);
    setTeams(newTeams);
    setSettings(prev => ({ ...prev, teamsPerPool: newTPP }));
    setMatches(mergeMatches(newMatches, prevMatches));
  }, []);

  const updateLegs = useCallback((newLegs: number) => {
    const s = settingsRef.current;
    const newMatches = generateAllMatches(teamsRef.current, newLegs, s.poolCount);
    setSettings(prev => ({ ...prev, legs: newLegs }));
    setMatches(mergeMatches(newMatches, matchesRef.current));
  }, []);

  const updateKoMatch = useCallback((id: string, updates: Partial<KnockoutMatch>) => {
    setKoMatches(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const updateQualifiers = useCallback((q: QualifierCount) => {
    setQualifiers(q);
    setKoMatches(generateKnockoutStructure(q));
  }, []);

  const updatePoolName = useCallback((poolIndex: number, name: string) => {
    setPoolNames(prev => {
      const next = [...prev];
      next[poolIndex] = name;
      return next;
    });
  }, []);

  return {
    settings,
    teams,
    matches,
    pools,
    poolStandings,
    qualifiers,
    resolvedBracket,
    updateTeamName,
    updateMatch,
    updatePoolCount,
    updateTeamsPerPool,
    updateLegs,
    updateKoMatch,
    updateQualifiers,
    updatePoolName,
  };
}
