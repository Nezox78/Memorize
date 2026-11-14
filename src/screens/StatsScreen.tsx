import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Header, ProgressBar } from '../components/ui';
import { LEVELS, Progress, Word, bestDayStreak, computeStats, currentWeek, dayStreak } from '../logic/engine';
import { Colors, levelColors, useStyles, useTheme } from '../theme';

export const WEEKLY_GOAL = 100;

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type Props = { words: Word[]; progress: Progress; onBack: () => void; onOpenLevel: (level: number) => void };

export function StatsScreen({ words, progress, onBack, onOpenLevel }: Props) {
  const { colors, dark } = useTheme();
  const styles = useStyles(makeStyles);
  const stats = computeStats(words, progress);
  const week = currentWeek();
  const weekCount = week.reduce((sum, key) => sum + (progress.days[key] ?? 0), 0);

  const badges: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; color: string; earned: boolean }[] = [
    { icon: 'medal-outline', label: 'Premier mot', color: '#FBBF24', earned: stats.answers >= 1 },
    { icon: 'fire', label: 'Série de 7', color: '#16A34A', earned: bestDayStreak(progress) >= 7 },
    { icon: 'brain', label: 'Quiz master', color: '#3B82F6', earned: progress.quizBest >= 8 },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Header title="Mes Progrès" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.weekFrom, colors.weekTo]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Cette semaine</Text>
          <Text style={styles.heroText}>
            <Text style={styles.heroNumber}>{weekCount}</Text>  mots révisés
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.heroSmall}>Objectif: {WEEKLY_GOAL} mots</Text>
            <Text style={styles.heroSmall}>{Math.round((weekCount / WEEKLY_GOAL) * 100)}% complété</Text>
          </View>
        </LinearGradient>

        <View style={styles.panel}>
          <View style={styles.rowBetween}>
            <Text style={styles.panelTitle}>Série quotidienne</Text>
            <View style={styles.inline}>
              <Ionicons name="flame-outline" size={24} color={colors.flame} />
              <Text style={[styles.panelTitle, { color: colors.flame }]}>{dayStreak(progress)}</Text>
            </View>
          </View>
          <View style={styles.week}>
            {week.map((key, i) => {
              const done = Boolean(progress.days[key]);
              return (
                <View key={key} style={styles.weekDay}>
                  <Text style={styles.caption}>{WEEK[i]}</Text>
                  <View style={[styles.weekDot, done && { backgroundColor: '#16A34A' }]}>
                    {done && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.inline}>
            <Ionicons name="trophy-outline" size={22} color={colors.accent} />
            <Text style={styles.panelTitle}>Statistiques générales</Text>
          </View>
          <View style={styles.numbers}>
            <View style={styles.number}>
              <Text style={[styles.numberValue, { color: colors.accent }]}>{stats.seen}</Text>
              <Text style={styles.caption}>Mots révisés</Text>
            </View>
            <View style={styles.number}>
              <Text style={[styles.numberValue, { color: colors.text }]}>{progress.sessions}</Text>
              <Text style={styles.caption}>Sessions</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.inline}>
            <MaterialCommunityIcons name="target" size={24} color={colors.success} />
            <Text style={styles.panelTitle}>Précision</Text>
          </View>
          <Text style={styles.big}>{stats.successRate}%</Text>
          <Text style={[styles.caption, { textAlign: 'center' }]}>de réponses correctes</Text>
          <ProgressBar percent={stats.successRate} color={colors.success} />
          <View style={styles.rowBetween}>
            <Legend color={colors.success} text={`${progress.correct} correct${progress.correct > 1 ? 's' : ''}`} />
            <Legend color={colors.error} text={`${progress.wrong} incorrect${progress.wrong > 1 ? 's' : ''}`} />
          </View>
        </View>

        <Text style={styles.section}>Badges obtenus</Text>
        <View style={styles.badges}>
          {badges.map((badge) => (
            <View key={badge.label} style={[styles.badge, !badge.earned && { opacity: 0.3 }]}>
              <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
                <MaterialCommunityIcons name={badge.icon} size={34} color="#FFFFFF" />
              </View>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Catégories de révision</Text>
        {LEVELS.map((name, i) => {
          const share = stats.total ? Math.round((stats.perLevel[i] / stats.total) * 100) : 0;
          return (
            <Pressable
              key={name}
              onPress={() => onOpenLevel(i)}
              accessibilityRole="button"
              accessibilityLabel={`Voir les mots de la catégorie ${name}`}
              style={({ pressed }) => [styles.level, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.levelIcon}>
                <LinearGradient
                  colors={['#FFFFFF', levelColors[i]]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.6, y: 0.7 }}
                  style={styles.levelBall}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.levelName}>{name}</Text>
                <Text style={styles.caption}>Catégorie {i + 1}</Text>
              </View>
              <Text style={styles.levelCount}>{stats.perLevel[i]} mots</Text>
              <View style={styles.levelBar}>
                <ProgressBar percent={share} color={levelColors[i]} />
              </View>
              <Text style={styles.levelPercent}>{share}%</Text>
              <Ionicons name="chevron-forward" size={16} color={dark ? colors.muted : '#475569'} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
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
    content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28, gap: 18 },
    hero: { borderRadius: 18, padding: 26, gap: 10 },
    heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    heroText: { color: '#FFFFFF', fontSize: 20 },
    heroNumber: { fontSize: 34, fontWeight: '800' },
    heroSmall: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
    section: { fontSize: 19, fontWeight: '800', color: c.text, marginTop: 4 },
    panel: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 22,
      gap: 14,
    },
    panelTitle: { fontSize: 19, fontWeight: '800', color: c.text },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    caption: { fontSize: 14, color: c.muted },
    week: { flexDirection: 'row', justifyContent: 'space-between' },
    weekDay: { alignItems: 'center', gap: 8 },
    weekDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.track,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numbers: { flexDirection: 'row' },
    number: { flex: 1, alignItems: 'center', gap: 2 },
    numberValue: { fontSize: 32, fontWeight: '800' },
    big: { fontSize: 52, fontWeight: '800', color: c.success, textAlign: 'center' },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontSize: 15, color: c.text },
    badges: { flexDirection: 'row', justifyContent: 'space-between' },
    badge: { alignItems: 'center', gap: 8, flex: 1 },
    badgeIcon: { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    badgeLabel: { fontSize: 14, color: c.text, fontWeight: '500', textAlign: 'center' },
    level: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    levelIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.track,
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelBall: { width: 20, height: 20, borderRadius: 10 },
    levelName: { fontSize: 16, fontWeight: '500', color: c.text },
    levelCount: { fontSize: 14, fontWeight: '500', color: c.text },
    levelBar: { width: 70 },
    levelPercent: { fontSize: 15, color: c.muted, width: 40, textAlign: 'right' },
  });
