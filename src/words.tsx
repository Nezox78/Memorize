import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { THEMES as BUILTIN_THEMES, WORDS as BUILTIN_WORDS } from './data/words';
import { LEVELS, Word } from './logic/engine';
import { supabase } from './online/supabase';

/** Tables de mots de la base en ligne. Colonnes : french, english, theme (et category, facultative). */
const WORD_TABLES = ['mots_anglais_animaux', 'mots_anglais_sport', 'mots_anglais_pays_continents'];

const CACHE_KEY = 'memorize.remoteWords.v1';

type RemoteWord = { french: string; english: string; theme: string; level: number };
export type ThemeInfo = { id: string; name: string; text: string };

const THEME_TEXTS: Record<string, string> = {
  Animaux: 'Animaux domestiques, sauvages, de la ferme…',
  Sport: 'Disciplines, équipements, compétitions…',
  'Pays/Continents': 'Pays, continents, régions du monde…',
};

type Row = { french?: string | null; english?: string | null; theme?: string | null; category?: string | null };

function toRemoteWords(rows: Row[], fallbackTheme: string): RemoteWord[] {
  return rows.flatMap((row) => {
    const french = row.french?.trim();
    const english = row.english?.trim();
    if (!french || !english) return [];
    // Sans colonne "category", un mot démarre en Débutant.
    const level = LEVELS.findIndex((name) => name.toLowerCase() === row.category?.trim().toLowerCase());
    return [{ french, english, theme: row.theme?.trim() || fallbackTheme, level: Math.max(level, 0) }];
  });
}

async function downloadWords(): Promise<RemoteWord[]> {
  if (!supabase) return [];
  const client = supabase;
  const tables = await Promise.all(
    WORD_TABLES.map(async (table) => {
      const { data, error } = await client.from(table).select('*');
      if (error) throw new Error(error.message);
      return toRemoteWords(data as Row[], table);
    }),
  );
  return tables.flat();
}

/** Fusionne les mots intégrés à l'app et ceux de la base : la base l'emporte en cas de doublon. */
function merge(remote: RemoteWord[]): { words: Word[]; themes: ThemeInfo[] } {
  const byKey = new Map(BUILTIN_WORDS.map((word) => [word.french.toLowerCase(), word]));
  const themes: ThemeInfo[] = [];
  for (const item of remote) {
    const key = item.french.toLowerCase();
    const existing = byKey.get(key);
    // Un mot déjà intégré garde sa clé et son niveau, pour ne pas perdre la progression.
    byKey.set(
      key,
      existing
        ? { ...existing, english: item.english, theme: item.theme }
        : { french: item.french, english: item.english, level: item.level, theme: item.theme },
    );
    if (!themes.some((theme) => theme.id === item.theme)) {
      themes.push({ id: item.theme, name: item.theme, text: THEME_TEXTS[item.theme] ?? 'Mots de la base en ligne…' });
    }
  }
  return { words: [...byKey.values()], themes: [...themes, ...BUILTIN_THEMES] };
}

const WordsContext = createContext(merge([]));

/**
 * Fournit les mots à toute l'app. Ils sont lus sur l'appareil (mots intégrés +
 * dernière copie téléchargée), puis rafraîchis depuis la base quand il y a du réseau.
 */
export function WordsProvider({ children }: { children: ReactNode }) {
  const [remote, setRemote] = useState<RemoteWord[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && !cancelled) setRemote(JSON.parse(cached));
      } catch {
        // Copie locale illisible : on attend le téléchargement.
      }
      try {
        const fresh = await downloadWords();
        if (cancelled || !fresh.length) return;
        setRemote(fresh);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      } catch {
        // Hors ligne : on garde la copie locale.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => merge(remote), [remote]);
  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords() {
  return useContext(WordsContext);
}
