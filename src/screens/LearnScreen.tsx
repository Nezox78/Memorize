import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackCard, SwipeCard, SwipeCardHandle } from '../components/SwipeCard';
import { WORDS } from '../data/words';
import { LEVELS, MAX_LEVEL, Progress, Word, levelOf, pickWord } from '../logic/engine';
import { Colors, NATIVE_DRIVER, useStyles, useTheme } from '../theme';

type Props = {
  progress: Progress;
  onAnswer: (word: Word, correct: boolean) => void;
};

type Feedback = { correct: boolean; text: string };

export function LearnScreen({ progress, onAnswer }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [deck, setDeck] = useState(() => {
    const current = pickWord(WORDS, progress);
    return { current, next: pickWord(WORDS, progress, [current.french]), turn: 0 };
  });
  const [revealed, setRevealed] = useState(false);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [session, setSession] = useState({ correct: 0, wrong: 0 });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const card = useRef<SwipeCardHandle>(null);

  const cardWidth = Math.min(area.width - 40, 400);
  const cardHeight = Math.min(area.height - 36, 460);
  const answered = session.correct + session.wrong;

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
    setSession((s) => ({ correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));
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
        <Text style={styles.title}>Cartes</Text>
        <Text style={styles.subtitle}>Carte {answered + 1}</Text>
      </View>

      <View style={styles.feedbackRow}>
        {feedback && (
          <Animated.View
            style={[
              styles.feedback,
              { backgroundColor: feedback.correct ? colors.successSoft : colors.errorSoft, opacity: feedbackOpacity },
            ]}
          >
            <Text style={[styles.feedbackText, { color: feedback.correct ? colors.success : colors.error }]}>
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
          text="Incorrect"
          icon="close"
          color={colors.error}
          soft={colors.errorSoft}
          disabled={!revealed}
          onPress={() => card.current?.swipe(false)}
        />
        <ActionButton
          label="Bonne réponse"
          text="Correct"
          icon="checkmark"
          color={colors.success}
          soft={colors.successSoft}
          disabled={!revealed}
          onPress={() => card.current?.swipe(true)}
        />
      </View>

      <View style={styles.session}>
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
        <Text style={styles.sessionText}>{session.correct}</Text>
        <View style={[styles.dot, { backgroundColor: colors.error, marginLeft: 12 }]} />
        <Text style={styles.sessionText}>{session.wrong}</Text>
        <Text style={styles.sessionRate}>
          Précision : {answered ? Math.round((session.correct / answered) * 100) : 0} %
        </Text>
      </View>
    </View>
  );
}

function ActionButton(props: {
  label: string;
  text: string;
  icon: 'close' | 'checkmark';
  color: string;
  soft: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: props.soft, opacity: props.disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={props.icon} size={20} color={props.color} />
      <Text style={[styles.actionText, { color: props.color }]}>{props.text}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 14, color: c.muted, fontWeight: '600' },
    feedbackRow: { height: 42, alignItems: 'center', justifyContent: 'center' },
    feedback: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
    feedbackText: { fontWeight: '700', fontSize: 13 },
    deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
    action: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    actionText: { fontSize: 16, fontWeight: '700' },
    session: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 20,
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    sessionText: { color: c.text, fontWeight: '700', fontSize: 14 },
    sessionRate: { marginLeft: 'auto', color: c.muted, fontSize: 14 },
  });
