import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

const light = {
  background: '#F7F9FC',
  card: '#FFFFFF',
  text: '#0B1020',
  muted: '#64748B',
  border: '#E2E8F0',
  track: '#EDF1F7',
  accent: '#3B82F6',
  accentSoft: '#E8F1FF',
  onAccent: '#FFFFFF',
  success: '#16A34A',
  successSoft: '#EAFBF0',
  error: '#EF4444',
  errorSoft: '#FEF0F0',
  warning: '#F59E0B',
};

export type Colors = typeof light;

const dark: Colors = {
  background: '#04060F',
  card: '#15161B',
  text: '#E8EAF2',
  muted: '#8B90A0',
  border: '#25272F',
  track: '#24262E',
  accent: '#9B5CF6',
  accentSoft: '#231A38',
  onAccent: '#120B24',
  success: '#22C55E',
  successSoft: '#0B2217',
  error: '#F05252',
  errorSoft: '#2A1217',
  warning: '#FB923C',
};

/** Une couleur par catégorie, de Débutant à Expert. */
export const levelColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

/** Le pilote d'animation natif n'existe pas sur le web. */
export const NATIVE_DRIVER = Platform.OS !== 'web';

export function cardShadow(isDark: boolean): object {
  if (isDark) return {};
  return Platform.select({
    web: { boxShadow: '0 10px 28px rgba(15, 23, 42, 0.10)' },
    default: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
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
