import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WORDS } from '../data/words';
import { Progress, computeStats, dayKey, dayStreak } from '../logic/engine';
import { Colors, Mode, useStyles, useTheme } from '../theme';

export const DAILY_GOAL = 20;

type Props = {
  progress: Progress;
  onOpen: (tab: 'learn' | 'quiz' | 'stats') => void;
};

const MODES: { id: Mode; label: string }[] = [
  { id: 'system', label: 'Système' },
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
];

export function HomeScreen({ progress, onOpen }: Props) {
  const { colors, dark, mode, setMode } = useTheme();
  const styles = useStyles(makeStyles);
  const stats = computeStats(WORDS, progress);
  const today = progress.days[dayKey(new Date())] ?? 0;
  const todayPercent = Math.min(100, Math.round((today / DAILY_GOAL) * 100));

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bonjour ! 👋</Text>
          <Text style={styles.subtitle}>Continuons votre apprentissage</Text>
        </View>
        <Pressable
          onPress={() => setMode(dark ? 'light' : 'dark')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.text} />
        </Pressable>
        <View style={styles.flame} accessibilityLabel={`Série de ${dayStreak(progress)} jours`}>
          <Ionicons name="flame" size={18} color="#FFFFFF" />
          <Text style={styles.flameText}>{dayStreak(progress)}</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.heroTitle}>Progrès du jour</Text>
            <Text style={styles.heroText}>
              {today} carte{today > 1 ? 's' : ''} sur {DAILY_GOAL}
            </Text>
          </View>
          <View style={styles.heroRing}>
            <Text style={styles.heroPercent}>{todayPercent}%</Text>
          </View>
        </View>
        <View style={styles.heroTrack}>
          <View style={[styles.heroFill, { width: `${todayPercent}%` }]} />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Commencer une révision</Text>
        <Text style={styles.caption}>Révisez votre vocabulaire avec des cartes à swiper</Text>
        <Pressable
          onPress={() => onOpen('learn')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.primaryText}>Commencer maintenant</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Vos progrès</Text>
        <View style={styles.numbers}>
          <Number value={`${stats.seen}`} label="Mots vus" color={colors.accent} />
          <Number
            value={stats.successRate === null ? '—' : `${stats.successRate}%`}
            label="Précision"
            color={colors.success}
          />
          <Number value={`${stats.learned}`} label="Mots appris" color={colors.text} />
        </View>
      </View>

      <Link icon="help-circle-outline" title="Quiz" text="Écrivez la traduction de 10 mots" onPress={() => onOpen('quiz')} />
      <Link
        icon="stats-chart-outline"
        title="Statistiques détaillées"
        text="Suivez vos progrès en détail"
        onPress={() => onOpen('stats')}
      />

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Apparence</Text>
        <View style={styles.segments}>
          {MODES.map(({ id, label }) => (
            <Pressable
              key={id}
              onPress={() => setMode(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === id }}
              style={[styles.segment, mode === id && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, mode === id && { color: colors.onAccent }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Number({ value, label, color }: { value: string; label: string; color: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.number}>
      <Text style={[styles.numberValue, { color }]}>{value}</Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

function Link(props: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.panel, styles.link, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={props.icon} size={28} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.linkTitle}>{props.title}</Text>
        <Text style={styles.caption}>{props.text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 15, color: c.muted, marginTop: 2 },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flame: {
      height: 42,
      paddingHorizontal: 12,
      borderRadius: 21,
      backgroundColor: c.warning,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    flameText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    hero: { backgroundColor: c.accent, borderRadius: 20, padding: 20, gap: 16 },
    heroTitle: { color: c.onAccent, fontSize: 18, fontWeight: '800' },
    heroText: { color: c.onAccent, fontSize: 14, marginTop: 2, opacity: 0.9 },
    heroRing: {
      width: 62,
      height: 62,
      borderRadius: 31,
      borderWidth: 5,
      borderColor: c.onAccent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroPercent: { color: c.onAccent, fontWeight: '800', fontSize: 14 },
    heroTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
    heroFill: { height: 8, borderRadius: 4, backgroundColor: c.onAccent },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    panel: {
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 10,
    },
    panelTitle: { fontSize: 18, fontWeight: '800', color: c.text },
    caption: { fontSize: 13, color: c.muted },
    primary: {
      marginTop: 4,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: { color: c.onAccent, fontWeight: '700', fontSize: 15 },
    numbers: { flexDirection: 'row' },
    number: { flex: 1, alignItems: 'center', gap: 2 },
    numberValue: { fontSize: 26, fontWeight: '800' },
    link: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    linkTitle: { fontSize: 16, fontWeight: '700', color: c.text },
    segments: { flexDirection: 'row', backgroundColor: c.track, borderRadius: 12, padding: 4 },
    segment: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    segmentActive: { backgroundColor: c.accent },
    segmentText: { fontSize: 13, fontWeight: '700', color: c.muted },
  });
