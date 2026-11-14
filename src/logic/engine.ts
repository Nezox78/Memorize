export const LEVELS = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Expert'] as const;
export const MAX_LEVEL = LEVELS.length - 1;

/** Probabilité d'apparition (en %) de chaque catégorie, dans l'ordre de LEVELS. */
export const WEIGHTS = [40, 30, 15, 10, 5];

/** Identifiant d'un thème de mots (intégré à l'app ou venu de la base en ligne). */
export type ThemeId = string;

export type Word = {
  /** Identifiant stable : table d'origine + mot français. Sert de clé à la progression. */
  id: string;
  french: string;
  english: string;
  /** Niveau de départ : un mot téléchargé commence toujours en Débutant (0). */
  level: number;
  /** Catégorie de mots (Animaux, Sport…). */
  theme: ThemeId;
};

export type WordProgress = { level: number; correct: number; wrong: number };

export type Progress = {
  /** Niveau de chaque mot déjà joué, indexé par son identifiant. Jamais effacé. */
  words: Record<string, WordProgress>;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  /** Nombre de réponses données par jour (clé AAAA-MM-JJ, heure locale). */
  days: Record<string, number>;
  /** Sessions de cartes et quiz terminés. */
  sessions: number;
  /** Meilleur score obtenu à un quiz. */
  quizBest: number;
};

export const EMPTY_PROGRESS: Progress = {
  words: {},
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  days: {},
  sessions: 0,
  quizBest: 0,
};

export function dayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Les 7 jours de la semaine en cours, du lundi au dimanche. */
export function currentWeek(now: Date = new Date()): string[] {
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return dayKey(day);
  });
}

/** Nombre de jours consécutifs avec au moins une réponse (aujourd'hui ou hier inclus). */
export function dayStreak(progress: Progress, now: Date = new Date()): number {
  const cursor = new Date(now);
  if (!progress.days[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (progress.days[dayKey(cursor)]) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/** Plus longue suite de jours consécutifs jamais réalisée. */
export function bestDayStreak(progress: Progress): number {
  let best = 0;
  for (const key of Object.keys(progress.days)) {
    const [year, month, day] = key.split('-').map(Number);
    const cursor = new Date(year, month - 1, day);
    let run = 0;
    while (progress.days[dayKey(cursor)]) {
      run++;
      cursor.setDate(cursor.getDate() - 1);
    }
    best = Math.max(best, run);
  }
  return best;
}

export function levelOf(word: Word, progress: Progress): number {
  return progress.words[word.id]?.level ?? word.level;
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
    if (!exclude.includes(word.id)) buckets[levelOf(word, progress)].push(word);
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
export function applyAnswer(
  progress: Progress,
  word: Word,
  correct: boolean,
  day: string = dayKey(new Date()),
): Progress {
  const current = progress.words[word.id] ?? { level: word.level, correct: 0, wrong: 0 };
  const level = Math.max(0, Math.min(MAX_LEVEL, current.level + (correct ? 1 : -1)));
  const streak = correct ? progress.streak + 1 : 0;
  return {
    ...progress,
    words: {
      ...progress.words,
      [word.id]: {
        level,
        correct: current.correct + (correct ? 1 : 0),
        wrong: current.wrong + (correct ? 0 : 1),
      },
    },
    correct: progress.correct + (correct ? 1 : 0),
    wrong: progress.wrong + (correct ? 0 : 1),
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    days: { ...progress.days, [day]: (progress.days[day] ?? 0) + 1 },
  };
}

export type Stats = {
  total: number;
  answers: number;
  /** Taux de réussite en %, 0 tant qu'aucune réponse n'a été donnée. */
  successRate: number;
  /** Mots arrivés au niveau Expert. */
  learned: number;
  /** Mots déjà joués au moins une fois. */
  seen: number;
  /** Nombre de mots actuellement dans chaque catégorie. */
  perLevel: number[];
};

export function computeStats(words: Word[], progress: Progress): Stats {
  const perLevel = LEVELS.map(() => 0);
  let learned = 0;
  for (const word of words) {
    const level = levelOf(word, progress);
    perLevel[level]++;
    if (level === MAX_LEVEL) learned++;
  }
  const answers = progress.correct + progress.wrong;
  return {
    total: words.length,
    answers,
    successRate: answers ? Math.round((progress.correct / answers) * 100) : 0,
    learned,
    seen: words.filter((word) => progress.words[word.id]).length,
    perLevel,
  };
}
