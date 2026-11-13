import { useCallback, useEffect, useState } from 'react';

import { Profile, fetchProfile, isUsernameTaken } from './api';
import { supabase } from './supabase';

export type Account = ReturnType<typeof useAccount>;

function translate(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email ou mot de passe incorrect.';
  if (/already registered/i.test(message)) return 'Un compte existe déjà avec cet email.';
  if (/password should be at least/i.test(message)) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (/valid email|invalid format/i.test(message)) return "Cette adresse email n'est pas valide.";
  if (/email not confirmed/i.test(message)) return "Confirmez d'abord votre adresse email (lien reçu par mail).";
  if (/network|fetch/i.test(message)) return 'Connexion impossible. Vérifiez votre accès à Internet.';
  return message;
}

/** Compte en ligne : session Supabase et profil public du joueur. */
export function useAccount() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setUserId(data.session?.user.id ?? null))
      .finally(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return setProfile(null);
    try {
      setProfile(await fetchProfile(userId));
    } catch {
      // Hors ligne : on garde le dernier profil connu.
    }
  }, [userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  /** Renvoie un message d'erreur, ou null si tout s'est bien passé. */
  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Le mode en ligne n'est pas configuré.";
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? translate(error.message) : null;
  }, []);

  /** Renvoie { error } ou { confirm: true } si un email de confirmation a été envoyé. */
  const signUp = useCallback(
    async (email: string, password: string, username: string): Promise<{ error?: string; confirm?: boolean }> => {
      if (!supabase) return { error: "Le mode en ligne n'est pas configuré." };
      const name = username.trim();
      if (!/^[\p{L}\p{N}_-]{3,20}$/u.test(name)) {
        return { error: 'Le pseudo doit faire 3 à 20 caractères (lettres, chiffres, - et _).' };
      }
      try {
        if (await isUsernameTaken(name)) return { error: 'Ce pseudo est déjà pris.' };
      } catch (e) {
        return { error: translate((e as Error).message) };
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: name } },
      });
      if (error) return { error: translate(error.message) };
      return { confirm: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return { configured: Boolean(supabase), ready, userId, profile, refreshProfile, signIn, signUp, signOut };
}
