import type { ContestMembership, LeagueMessage } from '@/lib/types';

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function normalizeContestMemberships(rows: unknown): ContestMembership[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const r = row as {
      contest_id: string;
      role: 'admin' | 'member';
      joined_at?: string;
      contests?: ContestMembership['contests'] | ContestMembership['contests'][];
    };
    return {
      contest_id: r.contest_id,
      role: r.role,
      joined_at: r.joined_at,
      contests: firstRelation(r.contests),
    };
  });
}

export function normalizeMessages(rows: unknown): LeagueMessage[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const r = row as LeagueMessage & {
      users?: LeagueMessage['users'] | LeagueMessage['users'][];
      contests?: LeagueMessage['contests'] | LeagueMessage['contests'][];
    };
    return {
      ...r,
      users: firstRelation(r.users),
      contests: firstRelation(r.contests),
    };
  });
}
