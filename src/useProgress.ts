import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EMPTY_PROGRESS, Progress, Word, applyAnswer } from './logic/engine';

const PROGRESS_KEY = 'memorize.progress.v1';
const SETTINGS_KEY = 'memorize.settings.v2';

/** Progression de l'utilisateur, chargée puis sauvegardée sur l'appareil. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress | null>(null);
  // Référence à jour même quand deux mises à jour se suivent dans le même rendu.
  const latest = useRef<Progress>(EMPTY_PROGRESS);

  useEffect(() => {
    AsyncStorage.getItem(PROGRESS_KEY)
      .then((raw) => (raw ? { ...EMPTY_PROGRESS, ...JSON.parse(raw) } : EMPTY_PROGRESS))
      .catch(() => EMPTY_PROGRESS)
      .then((loaded) => {
        latest.current = loaded;
        setProgress(loaded);
      });
  }, []);

  const update = useCallback((change: (current: Progress) => Progress) => {
    const next = change(latest.current);
    latest.current = next;
    setProgress(next);
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const answer = useCallback(
    (word: Word, correct: boolean) => update((p) => applyAnswer(p, word, correct)),
    [update],
  );

  /** Fin d'une session de cartes, ou d'un quiz (avec son score). */
  const finishSession = useCallback(
    (quizScore?: number) =>
      update((p) => ({
        ...p,
        sessions: p.sessions + 1,
        quizBest: Math.max(p.quizBest, quizScore ?? 0),
      })),
    [update],
  );

  const reset = useCallback(() => update(() => EMPTY_PROGRESS), [update]);

  return { progress, answer, finishSession, reset };
}

/** `selected` : catégories de mots cochées (noms de tables de la base). */
export type Settings = { name: string; selected: string[] };

const DEFAULT_SETTINGS: Settings = { name: '', selected: [] };

/** Prénom et catégories de mots cochées, sauvegardés sur l'appareil. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const change = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { settings, loaded, change };
}
