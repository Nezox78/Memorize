import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Mode, useStyles, useTheme } from '../theme';

const MODES: { id: Mode; label: string }[] = [
  { id: 'system', label: 'Système' },
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
];

type Props = {
  visible: boolean;
  name: string;
  onName: (name: string) => void;
  onReset: () => void;
  onClose: () => void;
};

export function SettingsModal({ visible, name, onName, onReset, onClose }: Props) {
  const { colors, mode, setMode } = useTheme();
  const styles = useStyles(makeStyles);

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer les réglages">
        <Pressable style={styles.sheet} onPress={() => {}} accessible={false}>
          <Text style={styles.title}>Réglages</Text>

          <Text style={styles.label}>Prénom</Text>
          <TextInput
            value={name}
            onChangeText={onName}
            placeholder="Votre prénom"
            placeholderTextColor={colors.muted}
            maxLength={20}
            style={styles.input}
          />

          <Text style={styles.label}>Apparence</Text>
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

          <Pressable onPress={confirmReset} accessibilityRole="button" style={styles.reset}>
            <Text style={styles.resetText}>Réinitialiser la progression</Text>
          </Pressable>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    sheet: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 420,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 22,
      gap: 10,
    },
    title: { fontSize: 22, fontWeight: '800', color: c.text, marginBottom: 4 },
    label: { fontSize: 14, fontWeight: '600', color: c.muted, marginTop: 6 },
    input: {
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 14,
      fontSize: 16,
      color: c.text,
    },
    segments: { flexDirection: 'row', backgroundColor: c.track, borderRadius: 10, padding: 4 },
    segment: { flex: 1, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    segmentActive: { backgroundColor: c.accent },
    segmentText: { fontSize: 14, fontWeight: '700', color: c.muted },
    reset: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
    resetText: { color: c.error, fontWeight: '600', fontSize: 15 },
    close: {
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: { color: c.text, fontWeight: '700', fontSize: 15 },
  });
