import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  Team, Match, Standing, Pool, LeagueSettings, QualifierCount, KnockoutMatch, ResolvedKOMatch,
  calculateStandings, generateKnockoutStructure, resolveKnockout,
} from '@/lib/poolLogic';

const DEFAULT_SETTINGS: LeagueSettings = { poolCount: 2, teamsPerPool: 4, legs: 1 };
const DEFAULT_QUALIFIERS: QualifierCount = 4;

type DbPool = {
  id: number | string;
  name: string | null;
};

type DbTeam = {
  id: number | string;
  name: string | null;
  pool_id: number | string;
};

type DbMatch = {
  id: number | string;
  match_number: number | string | null;
  date: string | null;
  home_team_id: number | string | null;
  away_team_id: number | string | null;
  home_goals: number | null;
  away_goals: number | null;
  leg?: number | null;
  pool_id: number | string;
};

type DbSettings = {
  pool_count?: number | null;
  teams_per_pool?: number | null;
  qualifier_count?: number | null;
  qualifiers?: number | null;
  legs?: number | null;
};

type DbKoMatch = {
  id?: number | string;
  match_id?: string | null;
  round: number;
  slot: number;
  home_goals: number | null;
  away_goals: number | null;
};

function toId(value: number | string | null | undefined): string {
  return value == null ? '' : String(value);
}

function asQualifier(value: number | null | undefined): QualifierCount {
  return value === 2 || value === 4 || value === 8 ? value : DEFAULT_QUALIFIERS;
}

function mapSettings(row: DbSettings | null): LeagueSettings {
  return {
    poolCount: row?.pool_count ?? DEFAULT_SETTINGS.poolCount,
    teamsPerPool: row?.teams_per_pool ?? DEFAULT_SETTINGS.teamsPerPool,
    legs: row?.legs ?? DEFAULT_SETTINGS.legs,
  };
}

function mapPool(row: DbPool): Pool {
  return {
    id: toId(row.id),
    name: row.name?.trim() || `Pool ${toId(row.id)}`,
  };
}

function mapTeam(row: DbTeam): Team {
  return {
    id: toId(row.id),
    name: row.name?.trim() || 'Team',
    poolId: toId(row.pool_id),
  };
}

function mapMatch(row: DbMatch): Match {
  return {
    id: toId(row.id),
    matchNumber: row.match_number == null ? '' : String(row.match_number),
    date: row.date ?? '',
    homeTeamId: toId(row.home_team_id),
    awayTeamId: toId(row.away_team_id),
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    leg: row.leg ?? 1,
    poolId: toId(row.pool_id),
  };
}

function matchNumberValue(match: Match): number {
  const value = Number(match.matchNumber);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function sortMatchesByNumber(matches: Match[]): Match[] {
  return [...matches].sort((a, b) =>
    matchNumberValue(a) - matchNumberValue(b) || a.id.localeCompare(b.id)
  );
}

function mapKoMatch(row: DbKoMatch): KnockoutMatch {
  return {
    id: row.match_id ?? `ko-r${row.round}-s${row.slot}`,
    round: row.round,
    slot: row.slot,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
  };
}

function mergeKoMatches(base: KnockoutMatch[], saved: KnockoutMatch[]): KnockoutMatch[] {
  return base.map(match => saved.find(savedMatch => savedMatch.id === match.id) ?? match);
}

function localKoKey(userId: string) {
  return `fp3_ko_${userId}`;
}

function localQualifierKey(userId: string) {
  return `fp3_qualifiers_${userId}`;
}

export function usePoolState() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<LeagueSettings>(DEFAULT_SETTINGS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [qualifiers, setQualifiers] = useState<QualifierCount>(DEFAULT_QUALIFIERS);
  const [koMatches, setKoMatches] = useState<KnockoutMatch[]>(() =>
    generateKnockoutStructure(DEFAULT_QUALIFIERS)
  );

  const refresh = useCallback(async (currentUserId: string) => {
    setIsLoading(true);

    const [
      { data: poolsData },
      { data: teamsData },
      { data: matchesData },
      { data: settingsData },
      koResult,
    ] = await Promise.all([
      supabase.from('pools').select('*').eq('user_id', currentUserId).order('id'),
      supabase.from('teams').select('*').eq('user_id', currentUserId).order('id'),
      supabase.from('matches').select('*').eq('user_id', currentUserId).order('match_number'),
      supabase.from('settings').select('*').eq('user_id', currentUserId).maybeSingle(),
      supabase.from('knockout_matches').select('*').eq('user_id', currentUserId),
    ]);

    const nextSettings = mapSettings(settingsData as DbSettings | null);
    const nextPools = ((poolsData ?? []) as DbPool[]).map(mapPool);
    const nextTeams = ((teamsData ?? []) as DbTeam[]).map(mapTeam);
    const nextMatches = sortMatchesByNumber(((matchesData ?? []) as DbMatch[]).map(mapMatch));
    const hasCompletedMatches = nextMatches.some(match =>
      match.homeGoals !== null && match.awayGoals !== null
    );
    const savedQualifier = Number(localStorage.getItem(localQualifierKey(currentUserId)));
    const nextQualifiers = asQualifier(
      (settingsData as DbSettings | null)?.qualifier_count ??
      (settingsData as DbSettings | null)?.qualifiers ??
      savedQualifier
    );
    const nextKoBase = generateKnockoutStructure(nextQualifiers);

    let savedKoMatches: KnockoutMatch[] = [];
    if (!koResult.error && koResult.data) {
      savedKoMatches = (koResult.data as DbKoMatch[]).map(mapKoMatch);
    } else {
      const saved = localStorage.getItem(localKoKey(currentUserId));
      savedKoMatches = saved ? JSON.parse(saved) : [];
    }

    if (!hasCompletedMatches) {
      savedKoMatches = [];
      localStorage.removeItem(localKoKey(currentUserId));
      await supabase
        .from('knockout_matches')
        .delete()
        .eq('user_id', currentUserId);
    }

    setPools(nextPools);
    setTeams(nextTeams);
    setMatches(nextMatches);
    setSettings(nextSettings);
    setQualifiers(nextQualifiers);
    setKoMatches(mergeKoMatches(nextKoBase, savedKoMatches));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const id = data.user?.id ?? null;
      setUserId(id);
      if (id) refresh(id);
      else setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      if (id) refresh(id);
      else {
        setPools([]);
        setTeams([]);
        setMatches([]);
        setKoMatches(generateKnockoutStructure(DEFAULT_QUALIFIERS));
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const channelName = `pool-state-${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pools', filter: `user_id=eq.${userId}` }, () => refresh(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `user_id=eq.${userId}` }, () => refresh(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user_id=eq.${userId}` }, () => refresh(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${userId}` }, () => refresh(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_matches', filter: `user_id=eq.${userId}` }, () => refresh(userId))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const poolStandings: Standing[][] = useMemo(() =>
    pools.map(pool => {
      const poolTeams = teams.filter(t => t.poolId === pool.id);
      const poolMatches = matches.filter(m => m.poolId === pool.id);
      return calculateStandings(poolTeams, poolMatches);
    }),
    [pools, teams, matches]
  );

  const resolvedBracket: ResolvedKOMatch[] = useMemo(
    () => resolveKnockout(koMatches, poolStandings, qualifiers),
    [koMatches, poolStandings, qualifiers]
  );

  const updateKoMatch = useCallback(async (id: string, updates: Partial<KnockoutMatch>) => {
    const current = koMatches.find(match => match.id === id);
    if (!current || !userId) return;

    const next = { ...current, ...updates };
    setKoMatches(prev => prev.map(match => match.id === id ? next : match));

    const { error } = await supabase.from('knockout_matches').upsert({
      user_id: userId,
      match_id: id,
      round: next.round,
      slot: next.slot,
      home_goals: next.homeGoals,
      away_goals: next.awayGoals,
    }, { onConflict: 'user_id,match_id' });

    if (error) {
      const saved = koMatches.map(match => match.id === id ? next : match);
      localStorage.setItem(localKoKey(userId), JSON.stringify(saved));
    }
  }, [koMatches, userId]);

  const updateQualifiers = useCallback(async (q: QualifierCount) => {
    if (!userId) return;

    const nextKoMatches = generateKnockoutStructure(q);
    setQualifiers(q);
    setKoMatches(nextKoMatches);
    localStorage.setItem(localQualifierKey(userId), String(q));
    localStorage.setItem(localKoKey(userId), JSON.stringify(nextKoMatches));

    const { error } = await supabase
      .from('settings')
      .update({ qualifier_count: q })
      .eq('user_id', userId);

    if (error) {
      await supabase
        .from('knockout_matches')
        .delete()
        .eq('user_id', userId);
      return;
    }

    await supabase
      .from('knockout_matches')
      .delete()
      .eq('user_id', userId);
  }, [userId]);

  return {
    isLoading,
    isSignedIn: Boolean(userId),
    settings,
    teams,
    matches,
    pools,
    poolStandings,
    qualifiers,
    resolvedBracket,
    updateKoMatch,
    updateQualifiers,
    refresh: userId ? () => refresh(userId) : undefined,
  };
}
