import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { LEVELS, Word } from '../logic/engine';
import { NATIVE_DRIVER, colors, levelColors, shadow } from '../theme';

export type SwipeCardHandle = {
  /** Déclenche le swipe par programme (boutons ✓ / ✗). */
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
        shadow,
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
            <Text style={styles.tintMark}>✔</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: colors.error, opacity: noOpacity }]}>
            <Text style={styles.tintMark}>✘</Text>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
}

/** Carte suivante, visible en retrait derrière la carte active. */
export function BackCard({ word, level, width, height }: Pick<Props, 'word' | 'level' | 'width' | 'height'>) {
  return (
    <View style={[styles.card, styles.backCard, { width, height }]}>
      <View style={styles.content}>
        <CardFace word={word} level={level} revealed={false} />
      </View>
    </View>
  );
}

function CardFace({ word, level, revealed }: { word: Word; level: number; revealed: boolean }) {
  return (
    <>
      <View style={[styles.badge, { backgroundColor: levelColors[level] }]}>
        <Text style={styles.badgeText}>{LEVELS[level]}</Text>
      </View>

      <View style={styles.center}>
        {revealed ? (
          <>
            <Text style={styles.small}>{word.french}</Text>
            <Text style={[styles.main, styles.english]} adjustsFontSizeToFit numberOfLines={2}>
              {word.english}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.small}>Comment dit-on en anglais…</Text>
            <Text style={styles.main} adjustsFontSizeToFit numberOfLines={2}>
              {word.french}
            </Text>
          </>
        )}
      </View>

      <Text style={styles.hint}>
        {revealed ? 'Tu avais la bonne réponse ? Swipe →  ·  Sinon ←' : 'Touche la carte pour voir la traduction'}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  backCard: {
    transform: [{ scale: 0.94 }, { translateY: 18 }],
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  center: { alignItems: 'center', alignSelf: 'stretch', gap: 12 },
  small: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  main: { fontSize: 40, fontWeight: '800', color: colors.text, textAlign: 'center' },
  english: { color: colors.accent },
  hint: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  tint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tintMark: { fontSize: 96, color: '#FFFFFF', fontWeight: '800' },
});
