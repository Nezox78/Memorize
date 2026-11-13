import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackCard, SwipeCard, SwipeCardHandle } from '../components/SwipeCard';
import { CircleButton, Header, ProgressBar } from '../components/ui';
import { Progress, Word, levelOf, pickWord } from '../logic/engine';
import { Colors, useStyles, useTheme } from '../theme';

export const SESSION_LENGTH = 20;

type Props = {
  /** Mots des thèmes choisis par l'utilisateur. */
  words: Word[];
  progress: Progress;
  onAnswer: (word: Word, correct: boolean) => void;
  onFinish: () => void;
  onBack: () => void;
  onSettings: () => void;
};

export function LearnScreen({ words, progress, onAnswer, onFinish, onBack, onSettings }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [deck, setDeck] = useState(() => {
    const current = pickWord(words, progress);
    return { current, next: pickWord(words, progress, [current.french]), turn: 0 };
  });
  const [revealed, setRevealed] = useState(false);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [session, setSession] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  const card = useRef<SwipeCardHandle>(null);

  const cardWidth = Math.min(area.width - 40, 420);
  const cardHeight = Math.min(area.height - 30, 440);
  const answered = session.correct + session.wrong;
  const accuracy = answered ? Math.round((session.correct / answered) * 100) : 0;

  const finish = () => {
    if (answered > 0) onFinish();
    setFinished(true);
  };

  const restart = () => {
    setSession({ correct: 0, wrong: 0 });
    setRevealed(false);
    setFinished(false);
  };

  const handleSwiped = (correct: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
    }
    onAnswer(deck.current, correct);
    setSession((s) => ({ correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));

    // Le mot suivant est déjà tiré ; on prépare celui d'après en évitant les deux à l'écran.
    setRevealed(false);
    setDeck((d) => ({
      current: d.next,
      next: pickWord(words, progress, [d.current.french, d.next.french]),
      turn: d.turn + 1,
    }));
    if (answered + 1 >= SESSION_LENGTH) finish();
  };

  const header = (
    <>
      <Header
        title="Flashcards"
        subtitle={`${Math.min(answered + 1, SESSION_LENGTH)} / ${SESSION_LENGTH}`}
        onBack={onBack}
        right={<CircleButton icon="settings-outline" label="Réglages" onPress={onSettings} />}
      />
      <View style={styles.bar}>
        <ProgressBar percent={(answered / SESSION_LENGTH) * 100} color={colors.highlight} />
      </View>
    </>
  );

  if (finished) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Session terminée</Text>
          <Text style={styles.summaryScore}>{accuracy}%</Text>
          <Text style={styles.summaryLabel}>
            {session.correct} correct{session.correct > 1 ? 's' : ''} · {session.wrong} incorrect
            {session.wrong > 1 ? 's' : ''}
          </Text>
          <Pressable onPress={restart} accessibilityRole="button" style={styles.primary}>
            <Text style={styles.primaryText}>Nouvelle session</Text>
          </Pressable>
          <Pressable onPress={onBack} accessibilityRole="button" style={styles.outline}>
            <Text style={styles.outlineText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}

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
          background={colors.answerWrongBg}
          color={colors.answerWrongText}
          disabled={!revealed}
          onPress={() => card.current?.swipe(false)}
        />
        <ActionButton
          label="Bonne réponse"
          text="Correct"
          icon="checkmark"
          background={colors.answerRightBg}
          color={colors.answerRightText}
          disabled={!revealed}
          onPress={() => card.current?.swipe(true)}
        />
      </View>

      <Pressable onPress={finish} accessibilityRole="button" style={[styles.outline, styles.finish]}>
        <Text style={styles.outlineText}>Terminer la session</Text>
      </Pressable>

      <View style={styles.session}>
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
        <Text style={styles.sessionText}>{session.correct}</Text>
        <View style={[styles.dot, { backgroundColor: colors.error, marginLeft: 14 }]} />
        <Text style={styles.sessionText}>{session.wrong}</Text>
        <Text style={styles.sessionRate}>Précision: {accuracy}%</Text>
      </View>
    </View>
  );
}

function ActionButton(props: {
  label: string;
  text: string;
  icon: 'close' | 'checkmark';
  background: string;
  color: string;
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
        { backgroundColor: props.background, opacity: props.disabled ? 0.45 : pressed ? 0.75 : 1 },
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
    bar: { paddingHorizontal: 20 },
    deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    actions: { flexDirection: 'row', gap: 16, paddingHorizontal: 20 },
    action: {
      flex: 1,
      height: 50,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    actionText: { fontSize: 16, fontWeight: '700' },
    outline: {
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    outlineText: { color: c.text, fontWeight: '700', fontSize: 15 },
    finish: { marginHorizontal: 20, marginTop: 14 },
    session: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginVertical: 14,
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    sessionText: { color: c.text, fontWeight: '600', fontSize: 15 },
    sessionRate: { marginLeft: 'auto', color: c.muted, fontSize: 15 },
    summary: {
      margin: 20,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: 'center',
      gap: 12,
    },
    summaryLabel: { fontSize: 16, color: c.muted },
    summaryScore: { fontSize: 52, fontWeight: '800', color: c.success },
    primary: {
      marginTop: 8,
      height: 48,
      borderRadius: 10,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    primaryText: { color: c.onAccent, fontWeight: '700', fontSize: 15 },
  });
