import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, themeLook, useStyles, useTheme } from '../theme';
import { useWords } from '../words';

const ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Animaux: 'paw-outline',
  Sport: 'soccer',
  'Pays/Continents': 'earth',
  Aliments: 'food-apple-outline',
  Vêtements: 'tshirt-crew-outline',
  Véhicules: 'car-outline',
};

const TEXTS: Record<string, string> = {
  Animaux: 'Animaux domestiques, sauvages, de la ferme…',
  Sport: 'Disciplines, équipements, compétitions…',
  'Pays/Continents': 'Pays, continents, régions du monde…',
};

type Props = {
  /** Tables cochées. */
  selected: string[];
  onChange: (tables: string[]) => void;
  onStart: () => void;
  onBack: () => void;
};

export function CategoriesScreen({ selected, onChange, onStart, onBack }: Props) {
  const { colors, dark } = useTheme();
  const styles = useStyles(makeStyles);
  const { catalog, downloaded, download } = useWords();
  const [busy, setBusy] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const count = selected.length;

  // Cocher une catégorie télécharge ses mots sur l'appareil ; ils arrivent en Débutant.
  const check = async (tables: string[]) => {
    setError(null);
    setBusy((current) => [...current, ...tables]);
    const done: string[] = [];
    for (const table of tables) {
      if (await download(table)) done.push(table);
    }
    setBusy((current) => current.filter((table) => !tables.includes(table)));
    if (done.length < tables.length) {
      setError('Téléchargement impossible. Vérifiez votre connexion à Internet, puis réessayez.');
    }
    return done;
  };

  const toggle = async (table: string) => {
    if (busy.includes(table)) return;
    if (selected.includes(table)) return onChange(selected.filter((item) => item !== table));
    const done = await check([table]);
    if (done.length) onChange([...selected, table]);
  };

  const selectAll = async () => {
    const missing = catalog.map((item) => item.table).filter((table) => !selected.includes(table));
    const done = await check(missing);
    onChange([...selected, ...done]);
  };

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
        {catalog.map((category, index) => {
          const look = themeLook(category.theme, index);
          const active = selected.includes(category.table);
          const loading = busy.includes(category.table);
          const onDevice = downloaded.includes(category.table);
          return (
            <Pressable
              key={category.table}
              onPress={() => toggle(category.table)}
              accessibilityRole="checkbox"
              accessibilityLabel={category.theme}
              aria-checked={active}
              accessibilityState={{ busy: loading }}
              style={[
                styles.row,
                active && {
                  backgroundColor: dark ? `${look.main}1F` : look.soft,
                  borderColor: dark ? `${look.main}66` : look.line,
                },
              ]}
            >
              <MaterialCommunityIcons name={ICONS[category.theme] ?? 'tag-outline'} size={30} color={look.main} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{category.theme}</Text>
                <Text style={styles.caption} numberOfLines={2}>
                  {TEXTS[category.theme] ?? 'Mots à apprendre…'}
                </Text>
                <Text style={[styles.status, { color: onDevice ? look.main : colors.muted }]}>
                  {loading
                    ? 'Téléchargement…'
                    : `${category.count ? `${category.count} mots` : 'Mots'} · ${onDevice ? 'sur cet appareil' : 'à télécharger'}`}
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator color={look.main} />
              ) : (
                <Ionicons
                  name={active ? 'checkmark-circle-outline' : 'ellipse-outline'}
                  size={30}
                  color={active ? look.main : colors.border}
                />
              )}
            </Pressable>
          );
        })}

        {error && <Text style={styles.error}>{error}</Text>}

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
          <Pressable onPress={selectAll} accessibilityRole="button" style={styles.outline}>
            <Text style={styles.outlineText}>Tout sélectionner</Text>
          </Pressable>
          <Pressable onPress={() => onChange([])} accessibilityRole="button" style={styles.outline}>
            <Text style={styles.outlineText}>Tout désélectionner</Text>
          </Pressable>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>💡  Conseil</Text>
          <Text style={styles.tipText}>
            Cocher une catégorie télécharge ses mots sur votre téléphone : ils arrivent tous en « Débutant » et
            montent d'un niveau à chaque bonne réponse. Décocher une catégorie ne fait pas perdre le niveau de ses
            mots.
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
    status: { fontSize: 13, fontWeight: '600', marginTop: 4 },
    error: { color: c.error, fontSize: 14, fontWeight: '600', textAlign: 'center' },
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
