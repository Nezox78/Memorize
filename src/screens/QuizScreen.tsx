import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header, ProgressBar } from '../components/ui';
import { Progress, Word, pickWord } from '../logic/engine';
import { Colors, useStyles, useTheme } from '../theme';

const QUESTIONS = 10;
const LIVES = 3;

type Props = {
  words: Word[];
  progress: Progress;
  onAnswer: (word: Word, correct: boolean) => void;
  onFinish: (score: number) => void;
  onBack: () => void;
  /** Défi entre amis : liste de mots imposée, sans vies. */
  challenge?: { words: Word[]; opponent: string };
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

export function QuizScreen({ words, progress, onAnswer, onFinish, onBack, challenge }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [index, setIndex] = useState(0);
  const [drawn, setWord] = useState(() => pickWord(words, progress));
  const total = challenge ? challenge.words.length : QUESTIONS;
  const word = challenge ? challenge.words[Math.min(index, total - 1)] : drawn;
  const [input, setInput] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0, streak: 0 });
  const [finished, setFinished] = useState(false);

  const lives = challenge ? LIVES : LIVES - score.wrong;
  const lastQuestion = index + 1 === total || (result === false && lives <= 0);

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
    if (lastQuestion) {
      onFinish(score.correct);
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setWord(pickWord(words, progress, [word.french]));
    setInput('');
    setResult(null);
  };

  const restart = () => {
    setIndex(0);
    setScore({ correct: 0, wrong: 0, streak: 0 });
    setWord(pickWord(words, progress, [word.french]));
    setInput('');
    setResult(null);
    setFinished(false);
  };

  const answered = index + (result !== null ? 1 : 0);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={challenge ? `Défi contre ${challenge.opponent}` : 'Quiz'}
        subtitle={finished ? 'Terminé' : `Question ${index + 1} / ${total}`}
        onBack={onBack}
        right={
          challenge ? null : <View style={styles.lives} accessibilityLabel={`${Math.max(lives, 0)} vies restantes`}>
            <Ionicons name="heart-outline" size={26} color={colors.error} />
            <Text style={styles.livesText}>{Math.max(lives, 0)}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ProgressBar percent={(answered / total) * 100} color={colors.accent} />

        {finished ? (
          <View style={styles.panel}>
            <Text style={styles.label}>
              {challenge ? 'Défi terminé' : lives <= 0 ? 'Plus de vies !' : 'Quiz terminé'}
            </Text>
            <Text style={styles.word}>
              {score.correct} / {total}
            </Text>
            <Pressable onPress={challenge ? onBack : restart} accessibilityRole="button" style={styles.primary}>
              <Text style={styles.primaryText}>{challenge ? 'Voir mes défis' : 'Rejouer'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.label}>Écrivez la traduction</Text>
            <Text style={styles.word} adjustsFontSizeToFit numberOfLines={2}>
              {word.french}
            </Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={result === null}
              placeholder="Tapez votre réponse..."
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
                {result === null ? 'Vérifier' : lastQuestion ? 'Voir le score' : 'Suivant'}
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
    content: { paddingHorizontal: 20, paddingBottom: 28, gap: 22 },
    lives: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    livesText: { fontSize: 18, fontWeight: '800', color: c.text },
    panel: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 24,
      gap: 16,
      alignItems: 'stretch',
    },
    label: { fontSize: 16, color: c.muted, textAlign: 'center' },
    word: { fontSize: 36, fontWeight: '800', color: c.text, textAlign: 'center' },
    input: {
      height: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingHorizontal: 18,
      fontSize: 17,
      color: c.text,
    },
    verdict: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
    verdictText: { fontWeight: '700', fontSize: 15, flex: 1 },
    primary: { height: 48, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: c.onAccent, fontWeight: '700', fontSize: 16 },
    tiles: { flexDirection: 'row', gap: 16 },
    tile: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    tileValue: { fontSize: 28, fontWeight: '800' },
    tileLabel: { fontSize: 15, fontWeight: '500' },
  });
