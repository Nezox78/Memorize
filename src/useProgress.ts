import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { EMPTY_PROGRESS, Progress, Word, applyAnswer } from './logic/engine';

const STORAGE_KEY = 'memorize.progress.v1';

/** Progression de l'utilisateur, chargée puis sauvegardée sur l'appareil. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setProgress(raw ? { ...EMPTY_PROGRESS, ...JSON.parse(raw) } : EMPTY_PROGRESS))
      .catch(() => setProgress(EMPTY_PROGRESS));
  }, []);

  const update = useCallback((next: Progress) => {
    setProgress(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const answer = useCallback(
    (word: Word, correct: boolean) => {
      if (progress) update(applyAnswer(progress, word, correct));
    },
    [progress, update],
  );

  const reset = useCallback(() => update(EMPTY_PROGRESS), [update]);

  return { progress, answer, reset };
}
