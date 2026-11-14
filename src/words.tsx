import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Word } from './logic/engine';
import { supabase } from './online/supabase';

/** Une catégorie de mots = une table "mots_anglais_*" de la base en ligne. */
export type Category = { table: string; theme: string; count: number };

type StoredWord = { french: string; english: string; theme: string };
/** Mots téléchargés sur l'appareil, par table. */
type Library = Record<string, StoredWord[]>;

const CATALOG_KEY = 'memorize.catalog.v1';
const LIBRARY_KEY = 'memorize.library.v1';

/** Utilisées si la liste des catégories ne peut pas être lue et qu'aucune copie n'existe. */
const KNOWN_TABLES: Category[] = [
  { table: 'mots_anglais_animaux', theme: 'Animaux', count: 0 },
  { table: 'mots_anglais_pays_continents', theme: 'Pays/Continents', count: 0 },
  { table: 'mots_anglais_sport', theme: 'Sport', count: 0 },
];

async function fetchCatalog(): Promise<Category[]> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.rpc('word_categories');
  if (error) throw new Error(error.message);
  return (data as { table_name: string; theme: string | null; words: number }[])
    .filter((row) => row.words > 0)
    .map((row) => ({ table: row.table_name, theme: row.theme?.trim() || row.table_name, count: row.words }));
}

async function fetchWords(category: Category): Promise<StoredWord[]> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.from(category.table).select('french, english, theme');
  if (error) throw new Error(error.message);
  return (data as { french: string | null; english: string | null; theme: string | null }[]).flatMap((row) => {
    const french = row.french?.trim();
    const english = row.english?.trim();
    return french && english ? [{ french, english, theme: row.theme?.trim() || category.theme }] : [];
  });
}

/** Chaque mot garde sa catégorie, et démarre en Débutant (niveau 0). */
function toWords(library: Library): Word[] {
  return Object.entries(library).flatMap(([table, items]) =>
    items.map((item) => ({ id: `${table}:${item.french}`, level: 0, ...item })),
  );
}

type WordsValue = {
  /** Catégories proposées par la base. */
  catalog: Category[];
  /** Tous les mots téléchargés sur l'appareil, toutes catégories confondues. */
  words: Word[];
  /** Tables dont les mots sont sur l'appareil. */
  downloaded: string[];
  /** False tant que la copie locale n'a pas été lue. */
  ready: boolean;
  /** Télécharge les mots d'une catégorie. Renvoie false si c'est impossible (hors ligne). */
  download: (table: string) => Promise<boolean>;
};

const WordsContext = createContext<WordsValue>({
  catalog: [],
  words: [],
  downloaded: [],
  ready: false,
  download: async () => false,
});

/**
 * Les mots viennent de la base en ligne et sont enregistrés sur l'appareil,
 * catégorie par catégorie, quand l'utilisateur les coche. L'app fonctionne
 * ensuite hors ligne ; les catégories déjà téléchargées sont rafraîchies au lancement.
 */
export function WordsProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Category[]>([]);
  const [library, setLibrary] = useState<Library>({});
  const [ready, setReady] = useState(false);
  const state = useRef({ catalog, library });
  state.current = { catalog, library };

  const store = useCallback((table: string, items: StoredWord[]) => {
    const next = { ...state.current.library, [table]: items };
    state.current.library = next;
    setLibrary(next);
    AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const download = useCallback(
    async (table: string) => {
      const category = state.current.catalog.find((item) => item.table === table);
      if (!category) return false;
      try {
        const items = await fetchWords(category);
        if (!items.length) return false;
        store(table, items);
        return true;
      } catch {
        // Hors ligne : une copie déjà présente sur l'appareil reste utilisable.
        return Boolean(state.current.library[table]?.length);
      }
    },
    [store],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let savedCatalog: Category[] = KNOWN_TABLES;
      let savedLibrary: Library = {};
      try {
        const [rawCatalog, rawLibrary] = await Promise.all([
          AsyncStorage.getItem(CATALOG_KEY),
          AsyncStorage.getItem(LIBRARY_KEY),
        ]);
        if (rawCatalog) savedCatalog = JSON.parse(rawCatalog);
        if (rawLibrary) savedLibrary = JSON.parse(rawLibrary);
      } catch {
        // Copie locale illisible : on repart de la base.
      }
      if (cancelled) return;
      state.current = { catalog: savedCatalog, library: savedLibrary };
      setCatalog(savedCatalog);
      setLibrary(savedLibrary);
      setReady(true);

      try {
        const fresh = await fetchCatalog();
        if (cancelled || !fresh.length) return;
        state.current.catalog = fresh;
        setCatalog(fresh);
        AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(fresh)).catch(() => {});
        // Récupère les mots ajoutés depuis la dernière fois dans les catégories déjà téléchargées.
        for (const table of Object.keys(savedLibrary)) {
          const category = fresh.find((item) => item.table === table);
          if (!category) continue;
          const items = await fetchWords(category);
          if (cancelled) return;
          if (items.length) store(table, items);
        }
      } catch {
        // Hors ligne : la copie locale suffit.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const value = useMemo(
    () => ({ catalog, words: toWords(library), downloaded: Object.keys(library), ready, download }),
    [catalog, library, ready, download],
  );
  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords() {
  return useContext(WordsContext);
}

/** Table d'origine d'un mot, d'après son identifiant. */
export function tableOf(word: Word): string {
  return word.id.slice(0, word.id.indexOf(':'));
}
