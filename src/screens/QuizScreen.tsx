import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { WORDS } from '../data/words';
import { Progress, Word, pickWord } from '../logic/engine';
import { Colors, useStyles, useTheme } from '../theme';

const QUESTIONS = 10;

type Props = {
  progress: Progress;
  onAnswer: (word: Word, correct: boolean) => void;
};

/** « To Eat  » et « eat » sont acceptés pour « to eat ». */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/^to /, '');
}

export function QuizScreen({ progress, onAnswer }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [word, setWord] = useState(() => pickWord(WORDS, progress));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0, streak: 0 });

  const finished = index >= QUESTIONS;

  const check = () => {
    if (result !== null || !input.trim()) return;
    const correct = normalize(input) === normalize(word.english);
    setResult(correct);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
      streak: correct ? s.streak + 1 : 0,
    }));
    onAnswer(word, correct);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setWord(pickWord(WORDS, progress, [word.french]));
    setInput('');
    setResult(null);
  };

  const restart = () => {
    setIndex(0);
    setScore({ correct: 0, wrong: 0, streak: 0 });
    setWord(pickWord(WORDS, progress, [word.french]));
    setInput('');
    setResult(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Quiz</Text>
          <Text style={styles.subtitle}>
            {finished ? 'Terminé' : `Question ${index + 1} / ${QUESTIONS}`}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(Math.min(index + (result !== null ? 1 : 0), QUESTIONS) / QUESTIONS) * 100}%` }]} />
        </View>

        {finished ? (
          <View style={styles.panel}>
            <Text style={styles.label}>Votre score</Text>
            <Text style={styles.word}>
              {score.correct} / {QUESTIONS}
            </Text>
            <Pressable onPress={restart} accessibilityRole="button" style={styles.primary}>
              <Text style={styles.primaryText}>Rejouer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.label}>Écrivez la traduction en anglais</Text>
            <Text style={styles.word} adjustsFontSizeToFit numberOfLines={2}>
              {word.french}
            </Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={result === null}
              placeholder="Tapez votre réponse…"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={check}
              style={[
                styles.input,
                result === true && { borderColor: colors.success },
                result === false && { borderColor: colors.error },
              ]}
            />
            {result !== null && (
              <View style={[styles.verdict, { backgroundColor: result ? colors.successSoft : colors.errorSoft }]}>
                <Ionicons
                  name={result ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={result ? colors.success : colors.error}
                />
                <Text style={[styles.verdictText, { color: result ? colors.success : colors.error }]}>
                  {result ? 'Bonne réponse !' : `Réponse : ${word.english}`}
                </Text>
              </View>
            )}
            <Pressable
              onPress={result === null ? check : next}
              disabled={result === null && !input.trim()}
              accessibilityRole="button"
              style={[styles.primary, result === null && !input.trim() && { opacity: 0.4 }]}
            >
              <Text style={styles.primaryText}>
                {result === null ? 'Vérifier' : index + 1 === QUESTIONS ? 'Voir le score' : 'Suivant'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.tiles}>
          <Tile value={score.correct} label="Correct" color={colors.success} soft={colors.successSoft} />
          <Tile value={score.wrong} label="Incorrect" color={colors.error} soft={colors.errorSoft} />
          <Tile value={score.streak} label="Série" color={colors.accent} soft={colors.accentSoft} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Tile({ value, label, color, soft }: { value: number; label: string; color: string; soft: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.tile, { backgroundColor: soft }]}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 16 },
    header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 14, color: c.muted, fontWeight: '600' },
    track: { height: 8, borderRadius: 4, backgroundColor: c.track, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4, backgroundColor: c.accent },
    panel: {
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 14,
      alignItems: 'stretch',
    },
    label: { fontSize: 14, color: c.muted, textAlign: 'center' },
    word: { fontSize: 32, fontWeight: '800', color: c.text, textAlign: 'center' },
    input: {
      height: 50,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 16,
      fontSize: 16,
      color: c.text,
    },
    verdict: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
    verdictText: { fontWeight: '700', fontSize: 14, flex: 1 },
    primary: { height: 48, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: c.onAccent, fontWeight: '700', fontSize: 15 },
    tiles: { flexDirection: 'row', gap: 10 },
    tile: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    tileValue: { fontSize: 24, fontWeight: '800' },
    tileLabel: { fontSize: 13, fontWeight: '600' },
  });
