import { Platform } from 'react-native';

export const colors = {
  background: '#F5F6FB',
  card: '#FFFFFF',
  text: '#1D2136',
  muted: '#7C8299',
  border: '#E6E8F2',
  accent: '#5B5BD6',
  accentSoft: '#ECECFB',
  success: '#22C55E',
  successSoft: '#E7F9EE',
  error: '#EF4444',
  errorSoft: '#FDECEC',
};

/** Une teinte par catégorie, du plus clair (Débutant) au plus foncé (Expert). */
export const levelColors = ['#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#3730A3'];

export const shadow = Platform.select({
  web: { boxShadow: '0 12px 32px rgba(40, 44, 90, 0.12)' },
  default: {
    shadowColor: '#282C5A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
}) as object;

/** Le pilote d'animation natif n'existe pas sur le web. */
export const NATIVE_DRIVER = Platform.OS !== 'web';
