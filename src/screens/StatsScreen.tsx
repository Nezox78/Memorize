import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WORDS } from '../data/words';
import { LEVELS, Progress, WEIGHTS, computeStats } from '../logic/engine';
import { colors, levelColors } from '../theme';

type Props = { progress: Progress; onReset: () => void };

export function StatsScreen({ progress, onReset }: Props) {
  const stats = computeStats(WORDS, progress);
  const biggest = Math.max(...stats.perLevel, 1);

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
      <Text style={styles.title}>Statistiques</Text>

      <View style={styles.panel}>
        <View style={styles.rowBetween}>
          <Text style={styles.panelTitle}>Progression globale</Text>
          <Text style={styles.percent}>{stats.globalProgress} %</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${stats.globalProgress}%`, backgroundColor: colors.accent }]} />
        </View>
        <Text style={styles.caption}>
          Objectif : les {stats.total} mots en Expert · {stats.seen} déjà vus
        </Text>
      </View>

      <View style={styles.tiles}>
        <Tile value={`${stats.learned}`} label="Mots appris" detail="arrivés en Expert" />
        <Tile
          value={stats.successRate === null ? '—' : `${stats.successRate} %`}
          label="Taux de réussite"
          detail={`${stats.answers} réponse${stats.answers > 1 ? 's' : ''}`}
        />
        <Tile value={`${progress.streak}`} label="Série en cours" detail="bonnes réponses d'affilée" />
        <Tile value={`${progress.bestStreak}`} label="Meilleure série" detail="record personnel" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Répartition des mots</Text>
        {LEVELS.map((name, i) => (
          <View key={name} style={styles.levelRow}>
            <View style={styles.rowBetween}>
              <Text style={styles.levelName}>{name}</Text>
              <Text style={styles.caption}>
                {stats.perLevel[i]} mots · {WEIGHTS[i]} % des tirages
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${(stats.perLevel[i] / biggest) * 100}%`, backgroundColor: levelColors[i] },
                ]}
              />
            </View>
          </View>
        ))}
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

function Tile({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.caption}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  percent: { fontSize: 16, fontWeight: '800', color: colors.accent },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  caption: { fontSize: 12, color: colors.muted },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 2,
  },
  tileValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  tileLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  levelRow: { gap: 6 },
  levelName: { fontSize: 14, fontWeight: '600', color: colors.text },
  reset: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  resetText: { color: colors.error, fontWeight: '600', fontSize: 14 },
});
