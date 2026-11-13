import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WORDS } from '../data/words';
import { LEVELS, Progress, computeStats, dayKey, dayStreak } from '../logic/engine';
import { Colors, useStyles, useTheme } from '../theme';

export const DAILY_GOAL = 20;

export type View_ = 'home' | 'learn' | 'quiz' | 'stats' | 'categories' | 'profile' | 'challenge';

type Props = {
  name: string;
  progress: Progress;
  onOpen: (view: View_) => void;
  onSettings: () => void;
};

const LEVEL_ICONS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; soft: string }[] = [
  { icon: 'sprout', color: '#16A34A', soft: '#DCFCE7' },
  { icon: 'leaf', color: '#0D9488', soft: '#CCFBF1' },
  { icon: 'image-filter-hdr', color: '#2563EB', soft: '#DBEAFE' },
  { icon: 'crown-outline', color: '#9333EA', soft: '#F3E8FF' },
  { icon: 'trophy-outline', color: '#EA580C', soft: '#FFEDD5' },
];

export function HomeScreen({ name, progress, onOpen, onSettings }: Props) {
  const { colors, dark } = useTheme();
  const styles = useStyles(makeStyles);
  const stats = computeStats(WORDS, progress);
  const today = progress.days[dayKey(new Date())] ?? 0;
  const todayPercent = Math.round((today / DAILY_GOAL) * 100);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Bonjour{name ? `, ${name}` : ''} ! 👋
          </Text>
          <Text style={styles.subtitle}>Continuons votre apprentissage</Text>
        </View>
        <Pressable onPress={onSettings} accessibilityRole="button" accessibilityLabel="Réglages" hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={colors.muted} />
        </Pressable>
        <View style={styles.flame} accessibilityLabel={`Série de ${dayStreak(progress)} jours`}>
          <Ionicons name="flame-outline" size={28} color="#1F1300" />
          <View style={styles.flameBadge}>
            <Text style={styles.flameText}>{dayStreak(progress)}</Text>
          </View>
        </View>
      </View>

      <LinearGradient
        colors={[colors.heroFrom, colors.heroTo]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.hero}
      >
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.heroTitle}>Progrès du jour</Text>
            <Text style={styles.heroText}>
              {today} mot{today > 1 ? 's' : ''} révisé{today > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.heroRing}>
            <Text style={styles.heroPercent}>{todayPercent}%</Text>
          </View>
        </View>
        <View style={styles.heroTrack}>
          <View style={[styles.heroFill, { width: `${Math.min(100, todayPercent)}%` }]} />
        </View>
      </LinearGradient>

      <View style={styles.panel}>
        <View style={styles.inline}>
          <MaterialCommunityIcons name="brain" size={24} color={colors.accent} />
          <Text style={styles.panelTitle}>Commencer une révision</Text>
        </View>
        <Text style={styles.caption}>Révisez votre vocabulaire avec des cartes interactives</Text>
        <Pressable
          onPress={() => onOpen('learn')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.primaryText}>Commencer maintenant</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <View style={styles.inline}>
          <Ionicons name="trending-up" size={22} color={colors.success} />
          <Text style={styles.panelTitle}>Vos progrès</Text>
        </View>
        <View style={styles.numbers}>
          <Number value={`${stats.seen}`} label="Mots vus" color={colors.accent} />
          <Number value={`${stats.successRate}%`} label="Précision" color={colors.success} />
          <Number value={`${progress.sessions}`} label="Sessions" color={colors.text} />
        </View>
      </View>

      <Text style={styles.section}>Catégories</Text>
      {LEVELS.map((level, i) => {
        const { total, improved } = stats.perStart[i];
        const look = LEVEL_ICONS[i];
        return (
          <Pressable
            key={level}
            onPress={() => onOpen('learn')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.panel, styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: dark ? `${look.color}26` : look.soft }]}>
              <MaterialCommunityIcons name={look.icon} size={24} color={look.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{level}</Text>
              <Text style={styles.caption}>
                {improved}/{total} mots
              </Text>
            </View>
            <View style={[styles.rowPercent, { backgroundColor: dark ? `${look.color}26` : look.soft }]}>
              <Text style={[styles.rowPercentText, { color: look.color }]}>
                {Math.round((improved / total) * 100)}%
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        );
      })}

      <Text style={styles.section}>Actions rapides</Text>
      <Link icon="book-open-variant" title="Statistiques détaillées" text="Suivez vos progrès en détail" onPress={() => onOpen('stats')} />
      <Link icon="school-outline" title="Mots à apprendre" text="Choisissez vos catégories préférées" onPress={() => onOpen('categories')} />
      <Link icon="help-circle-outline" title="Quiz" text="Écrivez la traduction de 10 mots" onPress={() => onOpen('quiz')} />
      <Link
        icon="account-group-outline"
        title="Défis entre amis"
        text="Classement en ligne et duels de vocabulaire"
        onPress={() => onOpen('profile')}
      />
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

function Link(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  text: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const disabled = !props.onPress;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.panel, styles.row, (disabled || pressed) && { opacity: disabled ? 0.45 : 0.7 }]}
    >
      <MaterialCommunityIcons name={props.icon} size={34} color={disabled ? colors.muted : colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{props.title}</Text>
        <Text style={styles.caption}>{props.text}</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontSize: 23, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 16, color: c.muted, marginTop: 2 },
    flame: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: c.flame,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flameBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      paddingHorizontal: 6,
      backgroundColor: '#16A34A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    flameText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    hero: { borderRadius: 18, padding: 26, gap: 18, marginTop: 6 },
    heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    heroText: { color: '#FFFFFF', fontSize: 17, marginTop: 2 },
    heroRing: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 6,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroPercent: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
    heroTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
    heroFill: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    section: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: 10 },
    panel: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 10,
    },
    panelTitle: { fontSize: 22, fontWeight: '800', color: c.text },
    caption: { fontSize: 15, color: c.muted },
    primary: {
      marginTop: 6,
      height: 48,
      borderRadius: 10,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: { color: c.onAccent, fontWeight: '700', fontSize: 16 },
    numbers: { flexDirection: 'row', marginTop: 4 },
    number: { flex: 1, alignItems: 'center', gap: 2 },
    numberValue: { fontSize: 28, fontWeight: '800' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    rowIcon: { width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    rowPercent: {
      minWidth: 42,
      height: 42,
      borderRadius: 21,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowPercentText: { fontSize: 13, fontWeight: '800' },
  });
