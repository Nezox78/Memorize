import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, useStyles, useTheme } from '../theme';

/** Bouton rond gris (retour, réglages). */
export function CircleButton(props: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      style={({ pressed }) => [styles.circle, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={props.icon} size={20} color={colors.muted} />
    </Pressable>
  );
}

/** En-tête d'écran : retour à gauche, titre centré, action à droite. */
export function Header(props: { title: string; subtitle?: string; onBack: () => void; right?: ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.header}>
      <CircleButton icon="arrow-back" label="Retour" onPress={props.onBack} />
      <View style={styles.titles}>
        <Text style={styles.title}>{props.title}</Text>
        {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{props.right}</View>
    </View>
  );
}

export function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color }]} />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    circle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.chip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
    titles: { flex: 1, alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 14, color: c.muted, marginTop: 1 },
    right: { minWidth: 46, alignItems: 'flex-end' },
    track: { height: 8, borderRadius: 4, backgroundColor: c.track, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4 },
  });
