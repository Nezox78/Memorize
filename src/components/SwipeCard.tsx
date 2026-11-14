import { Ionicons } from '@expo/vector-icons';
import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { LEVELS, Word } from '../logic/engine';
import { speakEnglish } from '../speak';
import { Colors, NATIVE_DRIVER, cardShadow, useStyles, useTheme } from '../theme';

export type SwipeCardHandle = {
  /** Déclenche le swipe par programme (boutons Correct / Incorrect). */
  swipe: (correct: boolean) => void;
};

type Props = {
  word: Word;
  level: number;
  width: number;
  height: number;
  onSwiped: (correct: boolean) => void;
  ref?: Ref<SwipeCardHandle>;
};

export function SwipeCard({ word, level, width, height, onSwiped, ref }: Props) {
  const { colors, dark } = useTheme();
  const styles = useStyles(makeStyles);
  const [revealed, setRevealed] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const flip = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  // Le PanResponder est créé une seule fois : il lit l'état courant via cette ref.
  const live = useRef({ flipping: false, locked: false, width, onSwiped });
  live.current.width = width;
  live.current.onSwiped = onSwiped;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 7, useNativeDriver: NATIVE_DRIVER }).start();
  }, [enter]);

  // Chaque tap retourne la carte : elle se referme sur sa tranche, change de face, puis se rouvre.
  const flipCard = () => {
    if (live.current.flipping || live.current.locked) return;
    live.current.flipping = true;
    Animated.timing(flip, { toValue: 0, duration: 130, useNativeDriver: NATIVE_DRIVER }).start(() => {
      setRevealed((shown) => !shown);
      live.current.flipping = false;
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
    swipe: (correct) => fling(correct),
  }));

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !live.current.locked && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        pan.setValue({ x: g.dx, y: g.dy * 0.3 });
      },
      onPanResponderRelease: (_, g) => {
        const far = Math.abs(g.dx) > live.current.width * 0.3;
        const fast = Math.abs(g.vx) > 0.8 && Math.abs(g.dx) > 40;
        if (far || fast) fling(g.dx > 0, g.vy);
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
        onPress={flipCard}
        accessibilityRole="button"
        accessibilityLabel={
          revealed
            ? `${word.french}, en anglais : ${word.english}`
            : `${word.french}. Toucher pour afficher la traduction`
        }
      >
        <CardFace word={word} level={level} revealed={revealed} />
      </Pressable>

      {revealed ? (
        <Pressable
          onPress={() => speakEnglish(word.english)}
          accessibilityRole="button"
          accessibilityLabel="Écouter la prononciation"
          hitSlop={12}
          style={styles.corner}
        >
          <Ionicons name="volume-medium-outline" size={24} color={colors.accent} />
        </Pressable>
      ) : (
        <View pointerEvents="none" style={[styles.corner, styles.flipIcon]}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </View>
      )}

      <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: colors.success, opacity: yesOpacity }]}>
        <Ionicons name="checkmark" size={110} color="#FFFFFF" />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: colors.error, opacity: noOpacity }]}>
        <Ionicons name="close" size={110} color="#FFFFFF" />
      </Animated.View>
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
  const styles = useStyles(makeStyles);
  return (
    <>
      <Text style={styles.language}>{revealed ? 'Traduction anglaise' : 'Mot français'}</Text>
      <Text style={styles.main} adjustsFontSizeToFit numberOfLines={2}>
        {revealed ? word.english : word.french}
      </Text>
      <Text style={styles.hint}>{revealed ? 'Tapez pour revoir le mot français' : 'Tapez pour voir la traduction'}</Text>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{LEVELS[level]}</Text>
      </View>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      borderRadius: 16,
      backgroundColor: c.card,
      borderWidth: 1.5,
      borderColor: c.border,
      overflow: 'hidden',
    },
    backCard: { transform: [{ scale: 0.95 }, { translateY: 14 }], opacity: 0.5 },
    content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
    language: { fontSize: 16, color: c.muted },
    main: { fontSize: 40, fontWeight: '800', color: c.text, textAlign: 'center' },
    hint: { fontSize: 18, color: c.muted, textAlign: 'center' },
    pill: {
      marginTop: 6,
      backgroundColor: c.accentSoft,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 999,
    },
    pillText: { color: c.accent, fontSize: 13, fontWeight: '600' },
    corner: { position: 'absolute', right: 22, bottom: 22 },
    flipIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.flip,
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
