import { supabase } from './supabase';

export type Profile = { id: string; username: string; xp: number; words_learned: number; streak: number };

export type Challenge = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  words: string[];
  challenger_score: number | null;
  opponent_score: number | null;
  created_at: string;
  challenger: { username: string } | null;
  opponent: { username: string } | null;
};

const PROFILE_COLUMNS = 'id, username, xp, words_learned, streak';
const CHALLENGE_COLUMNS =
  '*, challenger:profiles!challenges_challenger_id_fkey(username), opponent:profiles!challenges_opponent_id_fkey(username)';

function client() {
  if (!supabase) throw new Error("Le mode en ligne n'est pas configuré.");
  return supabase;
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await client().from('profiles').select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const { data, error } = await client().from('profiles').select('id').ilike('username', escapeLike(username)).limit(1);
  if (error) throw new Error(error.message);
  return data.length > 0;
}

export async function fetchLeaderboard(): Promise<Profile[]> {
  const { data, error } = await client()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('xp', { ascending: false })
    .order('username')
    .limit(50);
  if (error) throw new Error(error.message);
  return data;
}

/** Publie les statistiques locales pour le classement. */
export async function syncStats(id: string, stats: Pick<Profile, 'xp' | 'words_learned' | 'streak'>) {
  const { error } = await client()
    .from('profiles')
    .update({ ...stats, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await client()
    .from('challenges')
    .select(CHALLENGE_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return data as Challenge[];
}

export async function createChallenge(me: string, opponentUsername: string, words: string[]): Promise<Challenge> {
  const { data: found, error: lookupError } = await client()
    .from('profiles')
    .select('id')
    .ilike('username', escapeLike(opponentUsername.trim()))
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (!found) throw new Error(`Aucun joueur ne s'appelle « ${opponentUsername.trim()} ».`);
  if (found.id === me) throw new Error('Vous ne pouvez pas vous défier vous-même.');

  const { data, error } = await client()
    .from('challenges')
    .insert({ challenger_id: me, opponent_id: found.id, words })
    .select(CHALLENGE_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Challenge;
}

export async function submitChallengeScore(challenge: string, score: number) {
  const { error } = await client().rpc('submit_challenge_score', { challenge, score });
  if (error) throw new Error(error.message);
}

/** `ilike` sert de comparaison insensible à la casse : on neutralise ses jokers. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
