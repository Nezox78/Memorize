import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

import type { ThemeId } from './logic/engine';

const light = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0B1220',
  muted: '#64748B',
  border: '#E2E8F0',
  track: '#F1F5F9',
  /** Fond des boutons ronds (retour, réglages). */
  chip: '#F1F5F9',
  /** Couleur principale : boutons, liens, chiffres mis en avant. */
  accent: '#3B82F6',
  accentSoft: '#EFF6FF',
  onAccent: '#FFFFFF',
  /** Onglet actif et barre de progression des cartes. */
  highlight: '#16A34A',
  success: '#16A34A',
  successSoft: '#F0FDF4',
  error: '#EF4444',
  errorSoft: '#FEF2F2',
  /** Boutons Correct / Incorrect : pleins en clair, teintés en sombre. */
  answerWrongBg: '#EF4444',
  answerWrongText: '#FFFFFF',
  answerRightBg: '#16A34A',
  answerRightText: '#FFFFFF',
  flame: '#FBBF24',
  flip: '#FB923C',
  heroFrom: '#16A34A',
  heroTo: '#3B82F6',
  weekFrom: '#FBBF24',
  weekTo: '#FB923C',
};

export type Colors = typeof light;

const dark: Colors = {
  background: '#02040C',
  card: '#141518',
  text: '#E5E7EB',
  muted: '#9CA3AF',
  border: '#26272D',
  track: '#25262C',
  chip: '#1C1D22',
  accent: '#9B5CF6',
  accentSoft: '#211A33',
  onAccent: '#150B2B',
  highlight: '#9B5CF6',
  success: '#22C55E',
  successSoft: '#0A1F17',
  error: '#F05252',
  errorSoft: '#1F1218',
  answerWrongBg: '#1F1218',
  answerWrongText: '#F05252',
  answerRightBg: '#0A1F17',
  answerRightText: '#22C55E',
  flame: '#FBBF24',
  flip: '#FB923C',
  heroFrom: '#7C3AED',
  heroTo: '#A855F7',
  weekFrom: '#F59E0B',
  weekTo: '#F97316',
};

/** Une couleur par catégorie de révision, de Débutant à Expert. */
export const levelColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

/** Couleurs des thèmes de mots (texte, fond et bordure en clair). */
const themeColors: Record<ThemeId, { main: string; soft: string; line: string }> = {
  food: { main: '#16A34A', soft: '#F0FDF4', line: '#BBF7D0' },
  clothes: { main: '#9333EA', soft: '#FAF5FF', line: '#E9D5FF' },
  vehicles: { main: '#2563EB', soft: '#EFF6FF', line: '#BFDBFE' },
  places: { main: '#EA580C', soft: '#FFF7ED', line: '#FED7AA' },
  general: { main: '#0D9488', soft: '#F0FDFA', line: '#99F6E4' },
};

const extraThemeColors = [
  { main: '#DC2626', soft: '#FEF2F2', line: '#FECACA' },
  { main: '#CA8A04', soft: '#FEFCE8', line: '#FEF08A' },
  { main: '#DB2777', soft: '#FDF2F8', line: '#FBCFE8' },
  { main: '#4F46E5', soft: '#EEF2FF', line: '#C7D2FE' },
];

/** Couleurs d'un thème ; les thèmes inconnus piochent dans une palette de secours. */
export function themeLook(id: ThemeId, index: number) {
  return themeColors[id] ?? extraThemeColors[index % extraThemeColors.length];
}

/** Le pilote d'animation natif n'existe pas sur le web. */
export const NATIVE_DRIVER = Platform.OS !== 'web';

export function cardShadow(isDark: boolean): object {
  if (isDark) return {};
  return Platform.select({
    web: { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.10)' },
    default: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
  }) as object;
}

export type Mode = 'system' | 'light' | 'dark';

type Theme = { colors: Colors; dark: boolean; mode: Mode; setMode: (mode: Mode) => void };

const STORAGE_KEY = 'memorize.theme.v1';
const ThemeContext = createContext<Theme>({ colors: light, dark: false, mode: 'system', setMode: () => {} });

/** Thème clair / sombre : suit le téléphone par défaut, ou le choix de l'utilisateur. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const value = useMemo(
    () => ({ colors: isDark ? dark : light, dark: isDark, mode, setMode }),
    [isDark, mode, setMode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Styles recalculés uniquement quand le thème change. `factory` doit être stable. */
export function useStyles<T>(factory: (colors: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
