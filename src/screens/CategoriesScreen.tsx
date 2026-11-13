import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ALL_THEMES, THEMES, WORDS } from '../data/words';
import { ThemeId } from '../logic/engine';
import { Colors, themeColors, useStyles, useTheme } from '../theme';

const ICONS: Record<ThemeId, keyof typeof MaterialCommunityIcons.glyphMap> = {
  food: 'food-apple-outline',
  clothes: 'tshirt-crew-outline',
  vehicles: 'car-outline',
  places: 'office-building-outline',
  general: 'book-open-variant',
};

type Props = {
  selected: ThemeId[];
  onChange: (themes: ThemeId[]) => void;
  onStart: () => void;
  onBack: () => void;
};

export function CategoriesScreen({ selected, onChange, onStart, onBack }: Props) {
  const { colors, dark } = useTheme();
  const styles = useStyles(makeStyles);
  const count = selected.length;

  const toggle = (id: ThemeId) =>
    onChange(selected.includes(id) ? selected.filter((theme) => theme !== id) : [...selected, id]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour" hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Choisissez vos catégories</Text>
          <Text style={styles.subtitle}>Sélectionnez les types de mots que vous souhaitez réviser</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {THEMES.map((theme) => {
          const look = themeColors[theme.id];
          const active = selected.includes(theme.id);
          const words = WORDS.filter((word) => word.theme === theme.id).length;
          return (
            <Pressable
              key={theme.id}
              onPress={() => toggle(theme.id)}
              accessibilityRole="checkbox"
              accessibilityLabel={theme.name}
              accessibilityState={{ checked: active }}
              style={[
                styles.row,
                active && {
                  backgroundColor: dark ? `${look.main}1F` : look.soft,
                  borderColor: dark ? `${look.main}66` : look.line,
                },
              ]}
            >
              <MaterialCommunityIcons name={ICONS[theme.id]} size={30} color={look.main} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{theme.name}</Text>
                <Text style={styles.caption} numberOfLines={2}>
                  {theme.text} {words} mots
                </Text>
              </View>
              <Ionicons
                name={active ? 'checkmark-circle-outline' : 'ellipse-outline'}
                size={30}
                color={active ? look.main : colors.border}
              />
            </Pressable>
          );
        })}

        <View style={styles.count}>
          <Text style={styles.caption}>
            <Text style={styles.countNumber}>{count}</Text> catégorie{count > 1 ? 's' : ''} sélectionnée
            {count > 1 ? 's' : ''}
          </Text>
        </View>

        <Pressable
          onPress={onStart}
          disabled={count === 0}
          accessibilityRole="button"
          style={[styles.primary, count === 0 && { opacity: 0.4 }]}
        >
          <Text style={styles.primaryText}>Commencer à réviser</Text>
          <Text style={styles.primaryCount}>
            ({count} catégorie{count > 1 ? 's' : ''})
          </Text>
        </Pressable>

        <View style={styles.pair}>
          <Pressable onPress={() => onChange(ALL_THEMES)} accessibilityRole="button" style={styles.outline}>
            <Text style={styles.outlineText}>Tout sélectionner</Text>
          </Pressable>
          <Pressable onPress={() => onChange([])} accessibilityRole="button" style={styles.outline}>
            <Text style={styles.outlineText}>Tout désélectionner</Text>
          </Pressable>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>💡  Conseil</Text>
          <Text style={styles.tipText}>
            Commencez par une ou deux catégories pour des sessions plus ciblées, puis ajoutez progressivement
            d'autres thèmes pour diversifier votre vocabulaire.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 18,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 18,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    title: { fontSize: 24, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 15, color: c.muted, marginTop: 6 },
    content: { padding: 16, paddingBottom: 28, gap: 14 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    rowTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    caption: { fontSize: 15, color: c.muted },
    count: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: 'center',
    },
    countNumber: { fontWeight: '800', color: c.text },
    primary: {
      height: 58,
      borderRadius: 12,
      backgroundColor: c.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    primaryText: { color: c.onAccent, fontWeight: '700', fontSize: 18 },
    primaryCount: { color: c.onAccent, fontWeight: '600', fontSize: 15, opacity: 0.85 },
    pair: { flexDirection: 'row', gap: 10 },
    outline: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineText: { color: c.text, fontWeight: '700', fontSize: 15 },
    tip: {
      padding: 22,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      gap: 10,
    },
    tipTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    tipText: { fontSize: 15, lineHeight: 22, color: c.muted },
  });
