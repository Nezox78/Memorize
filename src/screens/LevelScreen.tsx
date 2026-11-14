import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Header } from '../components/ui';
import { LEVELS, Progress, WEIGHTS, Word, levelOf } from '../logic/engine';
import { Colors, levelColors, useStyles } from '../theme';

type Props = {
  /** Index du niveau affiché (0 = Débutant … 4 = Expert). */
  level: number;
  /** Mots des catégories cochées. */
  words: Word[];
  progress: Progress;
  onBack: () => void;
};

/** Liste des mots actuellement rangés dans un niveau. */
export function LevelScreen({ level, words, progress, onBack }: Props) {
  const styles = useStyles(makeStyles);
  const inLevel = words
    .filter((word) => levelOf(word, progress) === level)
    .sort((a, b) => a.theme.localeCompare(b.theme, 'fr') || a.french.localeCompare(b.french, 'fr'));

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={LEVELS[level]}
        subtitle={`Catégorie ${level + 1} · ${inLevel.length} mot${inLevel.length > 1 ? 's' : ''}`}
        onBack={onBack}
      />
      <FlatList
        data={inLevel}
        keyExtractor={(word) => word.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.note}>
            À chaque carte, il y a {WEIGHTS[level]} % de chances que le mot vienne de ce niveau.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun mot dans ce niveau</Text>
            <Text style={styles.note}>
              {level === 0
                ? 'Cochez une catégorie de mots pour la télécharger : ses mots arriveront ici.'
                : 'Les mots montent ici à force de bonnes réponses.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: levelColors[level] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.french}>{item.french}</Text>
              <Text style={styles.english}>{item.english}</Text>
            </View>
            <Text style={styles.theme}>{item.theme}</Text>
          </View>
        )}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 28, gap: 10 },
    note: { fontSize: 14, lineHeight: 20, color: c.muted, textAlign: 'center', marginBottom: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    french: { fontSize: 16, fontWeight: '700', color: c.text },
    english: { fontSize: 15, color: c.accent, marginTop: 2 },
    theme: { fontSize: 12, fontWeight: '600', color: c.muted },
    empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  });
