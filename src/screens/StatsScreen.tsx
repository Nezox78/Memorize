import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WORDS } from '../data/words';
import { LEVELS, Progress, WEIGHTS, computeStats, dayKey, dayStreak } from '../logic/engine';
import { Colors, levelColors, useStyles, useTheme } from '../theme';

type Props = { progress: Progress; onReset: () => void };

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Les 7 jours de la semaine en cours, du lundi au dimanche. */
function currentWeek(): string[] {
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return WEEK.map((_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return dayKey(day);
  });
}

export function StatsScreen({ progress, onReset }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const stats = computeStats(WORDS, progress);
  const week = currentWeek();

  const badges: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; earned: boolean }[] = [
    { icon: 'ribbon', label: 'Premier mot', color: '#F59E0B', earned: stats.answers >= 1 },
    { icon: 'flame', label: 'Série de 10', color: '#16A34A', earned: progress.bestStreak >= 10 },
    { icon: 'trophy', label: '100 réponses', color: '#3B82F6', earned: stats.answers >= 100 },
    { icon: 'star', label: 'Premier Expert', color: '#9B5CF6', earned: stats.learned >= 1 },
  ];

  const confirmReset = () => {
    const message = 'Tous les mots reviendront à leur catégorie de départ.';
    if (Platform.OS === 'web') {
      if (window.confirm(`Réinitialiser la progression ? ${message}`)) onReset();
      return;
    }
    Alert.alert('Réinitialiser la progression ?', message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réinitialiser', style: 'destructive', onPress: onReset },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Mes progrès</Text>

      <View style={styles.panel}>
        <View style={styles.rowBetween}>
          <Text style={styles.panelTitle}>Progression globale</Text>
          <Text style={[styles.strong, { color: colors.accent }]}>{stats.globalProgress} %</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${stats.globalProgress}%`, backgroundColor: colors.accent }]} />
        </View>
        <Text style={styles.caption}>
          Objectif : les {stats.total} mots en Expert · {stats.learned} appris · {stats.seen} déjà vus
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Précision</Text>
        <Text style={styles.big}>{stats.successRate === null ? '—' : `${stats.successRate}%`}</Text>
        <Text style={[styles.caption, { textAlign: 'center' }]}>de réponses correctes</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${stats.successRate ?? 0}%`, backgroundColor: colors.success }]} />
        </View>
        <View style={styles.rowBetween}>
          <Legend color={colors.success} text={`${progress.correct} correct${progress.correct > 1 ? 's' : ''}`} />
          <Legend color={colors.error} text={`${progress.wrong} incorrect${progress.wrong > 1 ? 's' : ''}`} />
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.rowBetween}>
          <Text style={styles.panelTitle}>Série quotidienne</Text>
          <View style={styles.inline}>
            <Ionicons name="flame" size={18} color={colors.warning} />
            <Text style={[styles.strong, { color: colors.warning }]}>{dayStreak(progress)}</Text>
          </View>
        </View>
        <View style={styles.week}>
          {week.map((key, i) => {
            const done = Boolean(progress.days[key]);
            return (
              <View key={key} style={styles.weekDay}>
                <Text style={styles.caption}>{WEEK[i]}</Text>
                <View style={[styles.weekDot, done && { backgroundColor: colors.success, borderColor: colors.success }]}>
                  {done && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </View>
            );
          })}
        </View>
        <Text style={styles.caption}>
          Meilleure série de bonnes réponses : {progress.bestStreak} · en cours : {progress.streak}
        </Text>
      </View>

      <Text style={styles.section}>Badges</Text>
      <View style={styles.badges}>
        {badges.map((badge) => (
          <View key={badge.label} style={[styles.badge, !badge.earned && { opacity: 0.35 }]}>
            <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? badge.color : colors.track }]}>
              <Ionicons name={badge.icon} size={26} color={badge.earned ? '#FFFFFF' : colors.muted} />
            </View>
            <Text style={styles.badgeLabel}>{badge.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Catégories de révision</Text>
      <View style={styles.panel}>
        {LEVELS.map((name, i) => {
          const share = Math.round((stats.perLevel[i] / stats.total) * 100);
          return (
            <View key={name} style={styles.level}>
              <View style={[styles.levelDot, { backgroundColor: levelColors[i] }]} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.levelName}>{name}</Text>
                  <Text style={styles.caption}>
                    {stats.perLevel[i]} mots · {share} %
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${share}%`, backgroundColor: levelColors[i] }]} />
                </View>
                <Text style={styles.caption}>{WEIGHTS[i]} % de chances d'apparition</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={confirmReset}
        accessibilityRole="button"
        style={({ pressed }) => [styles.reset, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.resetText}>Réinitialiser la progression</Text>
      </Pressable>
    </ScrollView>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.inline}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 14 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    section: { fontSize: 18, fontWeight: '800', color: c.text, marginTop: 6 },
    panel: {
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 12,
    },
    panelTitle: { fontSize: 17, fontWeight: '800', color: c.text },
    strong: { fontSize: 17, fontWeight: '800' },
    big: { fontSize: 44, fontWeight: '800', color: c.success, textAlign: 'center' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    track: { height: 8, borderRadius: 4, backgroundColor: c.track, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4 },
    caption: { fontSize: 12, color: c.muted },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, color: c.text },
    week: { flexDirection: 'row', justifyContent: 'space-between' },
    weekDay: { alignItems: 'center', gap: 6 },
    weekDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badges: { flexDirection: 'row', justifyContent: 'space-between' },
    badge: { alignItems: 'center', gap: 6, flex: 1 },
    badgeIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    badgeLabel: { fontSize: 11, color: c.text, fontWeight: '600', textAlign: 'center' },
    level: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    levelDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
    levelName: { fontSize: 15, fontWeight: '700', color: c.text },
    reset: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    resetText: { color: c.error, fontWeight: '600', fontSize: 14 },
  });
