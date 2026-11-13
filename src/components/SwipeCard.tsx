import { Ionicons } from '@expo/vector-icons';
import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { LEVELS, Word } from '../logic/engine';
import { Colors, NATIVE_DRIVER, cardShadow, levelColors, useStyles, useTheme } from '../theme';

export type SwipeCardHandle = {
  /** Déclenche le swipe par programme (boutons Correct / Incorrect). */
  swipe: (correct: boolean) => void;
};

type Props = {
  word: Word;
  level: number;
  width: number;
  height: number;
  onReveal: () => void;
  onSwiped: (correct: boolean) => void;
  ref?: Ref<SwipeCardHandle>;
};

export function SwipeCard({ word, level, width, height, onReveal, onSwiped, ref }: Props) {
  const { colors, dark } = useTheme();
  const styles = useStyles(makeStyles);
  const [revealed, setRevealed] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const flip = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  // Le PanResponder est créé une seule fois : il lit l'état courant via cette ref.
  const live = useRef({ revealed, locked: false, width, onSwiped });
  live.current.revealed = revealed;
  live.current.width = width;
  live.current.onSwiped = onSwiped;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 7, useNativeDriver: NATIVE_DRIVER }).start();
  }, [enter]);

  // La carte se referme sur sa tranche, change de face, puis se rouvre.
  const reveal = () => {
    if (live.current.revealed || live.current.locked) return;
    live.current.revealed = true;
    Animated.timing(flip, { toValue: 0, duration: 130, useNativeDriver: NATIVE_DRIVER }).start(() => {
      setRevealed(true);
      onReveal();
      Animated.spring(flip, { toValue: 1, friction: 6, useNativeDriver: NATIVE_DRIVER }).start();
    });
  };

  const fling = (correct: boolean, velocityY = 0) => {
    if (live.current.locked) return;
    live.current.locked = true;
    Animated.timing(pan, {
      toValue: { x: (correct ? 1 : -1) * live.current.width * 1.6, y: velocityY * 80 },
      duration: 240,
      useNativeDriver: NATIVE_DRIVER,
    }).start(() => live.current.onSwiped(correct));
  };

  const springBack = () =>
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: NATIVE_DRIVER }).start();

  useImperativeHandle(ref, () => ({
    swipe: (correct) => {
      if (live.current.revealed) fling(correct);
    },
  }));

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !live.current.locked && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        // Tant que la traduction est cachée, la carte résiste au swipe.
        const free = live.current.revealed;
        pan.setValue({ x: free ? g.dx : g.dx * 0.2, y: free ? g.dy * 0.3 : 0 });
      },
      onPanResponderRelease: (_, g) => {
        const far = Math.abs(g.dx) > live.current.width * 0.3;
        const fast = Math.abs(g.vx) > 0.8 && Math.abs(g.dx) > 40;
        if (live.current.revealed && (far || fast)) fling(g.dx > 0, g.vy);
        else springBack();
      },
      onPanResponderTerminate: springBack,
    }),
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-14deg', '0deg', '14deg'],
  });
  const yesOpacity = pan.x.interpolate({ inputRange: [0, width * 0.25], outputRange: [0, 1], extrapolate: 'clamp' });
  const noOpacity = pan.x.interpolate({ inputRange: [-width * 0.25, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const enterScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.card,
        cardShadow(dark),
        { width, height },
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }, { scale: enterScale }, { scaleX: flip }] },
      ]}
    >
      <Pressable
        style={styles.content}
        onPress={reveal}
        accessibilityRole="button"
        accessibilityLabel={
          revealed
            ? `${word.french}, en anglais : ${word.english}`
            : `${word.french}. Toucher pour afficher la traduction`
        }
      >
        <CardFace word={word} level={level} revealed={revealed} />
      </Pressable>

      {/* Le retour vert / rouge n'apparaît qu'une fois la traduction révélée. */}
      {revealed && (
        <>
          <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: colors.success, opacity: yesOpacity }]}>
            <Ionicons name="checkmark" size={110} color="#FFFFFF" />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: colors.error, opacity: noOpacity }]}>
            <Ionicons name="close" size={110} color="#FFFFFF" />
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
}

/** Carte suivante, visible en retrait derrière la carte active. */
export function BackCard({ word, level, width, height }: Pick<Props, 'word' | 'level' | 'width' | 'height'>) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.card, styles.backCard, { width, height }]}>
      <View style={styles.content}>
        <CardFace word={word} level={level} revealed={false} />
      </View>
    </View>
  );
}

function CardFace({ word, level, revealed }: { word: Word; level: number; revealed: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <>
      <View style={styles.badge}>
        <View style={[styles.dot, { backgroundColor: levelColors[level] }]} />
        <Text style={styles.badgeText}>{LEVELS[level]}</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.language}>{revealed ? 'ENGLISH' : 'FRANÇAIS'}</Text>
        <Text style={[styles.main, revealed && { color: colors.accent }]} adjustsFontSizeToFit numberOfLines={2}>
          {revealed ? word.english : word.french}
        </Text>
        {revealed && <Text style={styles.small}>{word.french}</Text>}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>
          {revealed ? 'Swipe à droite si tu savais, à gauche sinon' : 'Touche la carte pour la retourner'}
        </Text>
        {!revealed && (
          <View style={styles.flipIcon}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          </View>
        )}
      </View>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      borderRadius: 24,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    backCard: { transform: [{ scale: 0.94 }, { translateY: 16 }], opacity: 0.6 },
    content: { flex: 1, padding: 22, alignItems: 'center', justifyContent: 'space-between' },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: c.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    badgeText: { color: c.accent, fontSize: 12, fontWeight: '700' },
    center: { alignItems: 'center', alignSelf: 'stretch', gap: 10 },
    language: { fontSize: 12, letterSpacing: 1.5, color: c.muted, fontWeight: '600' },
    main: { fontSize: 38, fontWeight: '800', color: c.text, textAlign: 'center' },
    small: { fontSize: 16, color: c.muted, textAlign: 'center' },
    footer: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', minHeight: 40 },
    hint: { flex: 1, fontSize: 13, color: c.muted },
    flipIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.warning,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tint: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
