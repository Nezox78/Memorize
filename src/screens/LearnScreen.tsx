import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackCard, SwipeCard, SwipeCardHandle } from '../components/SwipeCard';
import { WORDS } from '../data/words';
import { LEVELS, MAX_LEVEL, Progress, Word, levelOf, pickWord } from '../logic/engine';
import { NATIVE_DRIVER, colors } from '../theme';

type Props = {
  progress: Progress;
  onAnswer: (word: Word, correct: boolean) => void;
};

type Feedback = { correct: boolean; text: string };

export function LearnScreen({ progress, onAnswer }: Props) {
  const [deck, setDeck] = useState(() => {
    const current = pickWord(WORDS, progress);
    return { current, next: pickWord(WORDS, progress, [current.french]), turn: 0 };
  });
  const [revealed, setRevealed] = useState(false);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const card = useRef<SwipeCardHandle>(null);

  const cardWidth = Math.min(area.width - 48, 380);
  const cardHeight = Math.min(area.height - 40, 480);

  const handleSwiped = (correct: boolean) => {
    const word = deck.current;
    const before = levelOf(word, progress);
    const after = Math.max(0, Math.min(MAX_LEVEL, before + (correct ? 1 : -1)));

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
    }

    onAnswer(word, correct);
    setFeedback({
      correct,
      text:
        after === before
          ? `« ${word.french} » reste en ${LEVELS[after]}`
          : `« ${word.french} » ${correct ? '↑' : '↓'} ${LEVELS[after]}`,
    });
    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 500,
      delay: 1400,
      useNativeDriver: NATIVE_DRIVER,
    }).start();

    // Le mot suivant est déjà tiré ; on prépare celui d'après en évitant les deux à l'écran.
    setRevealed(false);
    setDeck((d) => ({
      current: d.next,
      next: pickWord(WORDS, progress, [d.current.french, d.next.french]),
      turn: d.turn + 1,
    }));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Apprendre</Text>
        <View style={styles.streak}>
          <Text style={styles.streakText}>Série : {progress.streak}</Text>
        </View>
      </View>

      <View style={styles.feedbackRow}>
        {feedback && (
          <Animated.View
            style={[
              styles.feedback,
              { backgroundColor: feedback.correct ? colors.successSoft : colors.errorSoft, opacity: feedbackOpacity },
            ]}
          >
            <Text style={[styles.feedbackText, { color: feedback.correct ? '#15803D' : '#B91C1C' }]}>
              {feedback.text}
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.deck} onLayout={(e) => setArea(e.nativeEvent.layout)}>
        {area.width > 0 && (
          <>
            <BackCard
              key={`back-${deck.turn}`}
              word={deck.next}
              level={levelOf(deck.next, progress)}
              width={cardWidth}
              height={cardHeight}
            />
            <SwipeCard
              key={deck.turn}
              ref={card}
              word={deck.current}
              level={levelOf(deck.current, progress)}
              width={cardWidth}
              height={cardHeight}
              onReveal={() => setRevealed(true)}
              onSwiped={handleSwiped}
            />
          </>
        )}
      </View>

      <View style={styles.actions}>
        <ActionButton
          label="Mauvaise réponse"
          symbol="✘"
          color={colors.error}
          disabled={!revealed}
          onPress={() => card.current?.swipe(false)}
        />
        <ActionButton
          label="Bonne réponse"
          symbol="✔"
          color={colors.success}
          disabled={!revealed}
          onPress={() => card.current?.swipe(true)}
        />
      </View>
    </View>
  );
}

function ActionButton(props: { label: string; symbol: string; color: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.action,
        { borderColor: props.color, opacity: props.disabled ? 0.3 : 1 },
        pressed && { backgroundColor: props.color, transform: [{ scale: 0.94 }] },
      ]}
    >
      {({ pressed }) => <Text style={[styles.actionSymbol, { color: pressed ? '#FFFFFF' : props.color }]}>{props.symbol}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  streak: { backgroundColor: colors.accentSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  streakText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  feedbackRow: { height: 44, alignItems: 'center', justifyContent: 'center' },
  feedback: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  feedbackText: { fontWeight: '700', fontSize: 13 },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingVertical: 18 },
  action: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSymbol: { fontSize: 28, fontWeight: '800' },
});
