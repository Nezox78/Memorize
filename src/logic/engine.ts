export const LEVELS = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Expert'] as const;
export const MAX_LEVEL = LEVELS.length - 1;

/** Probabilité d'apparition (en %) de chaque catégorie, dans l'ordre de LEVELS. */
export const WEIGHTS = [40, 30, 15, 10, 5];

export type Word = {
  french: string;
  english: string;
  /** Niveau de départ du mot (index dans LEVELS). */
  level: number;
};

export type WordProgress = { level: number; correct: number; wrong: number };

export type Progress = {
  /** Uniquement les mots déjà joués, indexés par leur version française. */
  words: Record<string, WordProgress>;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
};

export const EMPTY_PROGRESS: Progress = {
  words: {},
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
};

export function levelOf(word: Word, progress: Progress): number {
  return progress.words[word.french]?.level ?? word.level;
}

/**
 * Tire un mot : d'abord une catégorie selon WEIGHTS (les catégories vides
 * sont ignorées et les probabilités renormalisées), puis un mot au hasard
 * dans cette catégorie. `exclude` évite de reproposer les mots à l'écran.
 */
export function pickWord(
  words: Word[],
  progress: Progress,
  exclude: string[] = [],
  random: () => number = Math.random,
): Word {
  const buckets: Word[][] = LEVELS.map(() => []);
  for (const word of words) {
    if (!exclude.includes(word.french)) buckets[levelOf(word, progress)].push(word);
  }

  const total = buckets.reduce((sum, bucket, i) => sum + (bucket.length ? WEIGHTS[i] : 0), 0);
  if (total === 0) return words[Math.floor(random() * words.length)];

  let roll = random() * total;
  for (let i = 0; i < buckets.length; i++) {
    if (!buckets[i].length) continue;
    roll -= WEIGHTS[i];
    if (roll < 0) return buckets[i][Math.floor(random() * buckets[i].length)];
  }
  const last = buckets.filter((bucket) => bucket.length).pop()!;
  return last[Math.floor(random() * last.length)];
}

/** Bonne réponse : le mot monte d'une catégorie ; mauvaise : il descend d'une. */
export function applyAnswer(progress: Progress, word: Word, correct: boolean): Progress {
  const current = progress.words[word.french] ?? { level: word.level, correct: 0, wrong: 0 };
  const level = Math.max(0, Math.min(MAX_LEVEL, current.level + (correct ? 1 : -1)));
  const streak = correct ? progress.streak + 1 : 0;
  return {
    words: {
      ...progress.words,
      [word.french]: {
        level,
        correct: current.correct + (correct ? 1 : 0),
        wrong: current.wrong + (correct ? 0 : 1),
      },
    },
    correct: progress.correct + (correct ? 1 : 0),
    wrong: progress.wrong + (correct ? 0 : 1),
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
  };
}

export type Stats = {
  total: number;
  answers: number;
  /** Taux de réussite en %, ou null tant qu'aucune réponse n'a été donnée. */
  successRate: number | null;
  /** Mots amenés au niveau Expert par une bonne réponse. */
  learned: number;
  /** Mots déjà vus au moins une fois. */
  seen: number;
  /** Nombre de mots par catégorie. */
  perLevel: number[];
  /** Progression globale en % : chemin parcouru entre le départ et « tous les mots en Expert ». */
  globalProgress: number;
};

export function computeStats(words: Word[], progress: Progress): Stats {
  const perLevel = LEVELS.map(() => 0);
  let learned = 0;
  let gained = 0;
  let possible = 0;
  for (const word of words) {
    const level = levelOf(word, progress);
    perLevel[level]++;
    gained += level - word.level;
    possible += MAX_LEVEL - word.level;
    if (level === MAX_LEVEL && (progress.words[word.french]?.correct ?? 0) > 0) learned++;
  }
  const answers = progress.correct + progress.wrong;
  return {
    total: words.length,
    answers,
    successRate: answers ? Math.round((progress.correct / answers) * 100) : null,
    learned,
    seen: Object.keys(progress.words).length,
    perLevel,
    globalProgress: possible ? Math.max(0, Math.round((gained / possible) * 100)) : 0,
  };
}
