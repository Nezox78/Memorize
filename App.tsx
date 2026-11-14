import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsModal } from './src/components/SettingsModal';
import { Word, computeStats, dayStreak, pickWord } from './src/logic/engine';
import { Challenge, DuelWord, submitChallengeScore, syncStats } from './src/online/api';
import { useAccount } from './src/online/useAccount';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { HomeScreen, View_ } from './src/screens/HomeScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { LevelScreen } from './src/screens/LevelScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { Colors, ThemeProvider, useStyles, useTheme } from './src/theme';
import { useProgress, useSettings } from './src/useProgress';
import { WordsProvider, tableOf, useWords } from './src/words';

const TABS: { id: View_; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'home', label: 'Accueil', icon: 'home-outline' },
  { id: 'learn', label: 'Cartes', icon: 'copy-outline' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
  { id: 'stats', label: 'Progrès', icon: 'trending-up-outline' },
  { id: 'profile', label: 'Profil', icon: 'person-outline' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WordsProvider>
          <Root />
        </WordsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  const styles = useStyles(makeStyles);
  const [view, setView] = useState<View_>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Niveau dont on affiche les mots, et écran vers lequel revenir.
  const [levelView, setLevelView] = useState<{ level: number; from: View_ }>({ level: 0, from: 'home' });
  const openLevel = (level: number) => {
    setLevelView({ level, from: view });
    setView('level');
  };
  const { progress, answer, finishSession, reset } = useProgress();
  const { settings, loaded, change } = useSettings();
  const { words: downloadedWords, ready } = useWords();
  // Mots à réviser : ceux des catégories cochées. Les autres gardent leur niveau, sans être tirés.
  const pool = useMemo(
    () => downloadedWords.filter((word) => settings.selected.includes(tableOf(word))),
    [downloadedWords, settings.selected],
  );
  const WORDS = pool;

  // Premier lancement : on commence par le choix des catégories.
  const [welcomed, setWelcomed] = useState(false);
  useEffect(() => {
    if (welcomed || !loaded || !ready) return;
    setWelcomed(true);
    if (settings.selected.length === 0) setView('categories');
  }, [welcomed, loaded, ready, settings.selected.length]);
  const account = useAccount();
  const [duel, setDuel] = useState<{ id: string; opponent: string; words: Word[] } | null>(null);

  // Publie les statistiques locales pour le classement, peu après chaque changement.
  const { userId, refreshProfile } = account;
  const xp = (progress?.correct ?? 0) * 10;
  useEffect(() => {
    if (!userId || !progress) return;
    const timer = setTimeout(() => {
      syncStats(userId, {
        xp,
        words_learned: computeStats(WORDS, progress).learned,
        streak: dayStreak(progress),
      })
        .then(refreshProfile)
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, xp, refreshProfile]);

  const drawDuelWords = () => {
    const drawn: DuelWord[] = [];
    const size = Math.min(10, pool.length);
    while (drawn.length < size) {
      const { id, french, english, theme } = pickWord(pool, progress!, drawn.map((word) => word.id));
      drawn.push({ id, french, english, theme });
    }
    return drawn;
  };

  const playDuel = (challenge: Challenge) => {
    const words: Word[] = challenge.words.map((word) => ({ ...word, level: 0 }));
    if (!words.length) return;
    const other = challenge.challenger_id === userId ? challenge.opponent : challenge.challenger;
    setDuel({ id: challenge.id, opponent: other?.username ?? 'Joueur', words });
    setView('challenge');
  };

  const finishDuel = (score: number) => {
    if (!duel) return;
    finishSession();
    submitChallengeScore(duel.id, score).catch(() =>
      Alert.alert('Score non envoyé', 'Vérifiez votre connexion, puis rejouez le défi.'),
    );
  };
  // Changer la clé après une réinitialisation repart sur un nouveau paquet de cartes.
  const [resets, setResets] = useState(0);

  const deckKey = `${resets}-${settings.selected.join(',')}-${pool.length}`;
  // Un mot de défi ne change de niveau que s'il fait partie des mots de l'utilisateur.
  const answerDuel = (word: Word, correct: boolean) => {
    if (pool.some((item) => item.id === word.id)) answer(word, correct);
  };
  const home = () => setView('home');

  return (
    <View style={styles.root}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={[styles.app, { paddingTop: insets.top }]}>
        {progress === null ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            {pool.length === 0 ? (
              (view === 'learn' || view === 'quiz') && (
                <View style={[styles.screen, styles.loading, { padding: 32, gap: 14 }]}>
                  <Ionicons name="albums-outline" size={44} color={colors.muted} />
                  <Text style={styles.emptyTitle}>Aucun mot à réviser</Text>
                  <Text style={styles.emptyText}>
                    Cochez au moins une catégorie de mots pour la télécharger sur votre téléphone.
                  </Text>
                  <Pressable onPress={() => setView('categories')} accessibilityRole="button" style={styles.emptyButton}>
                    <Text style={styles.emptyButtonText}>Choisir mes catégories</Text>
                  </Pressable>
                </View>
              )
            ) : (
              <>
                {/* Cartes et Quiz restent montés pour conserver la partie en cours. */}
                <View style={[styles.screen, view !== 'learn' && styles.hidden]}>
                  <LearnScreen
                    key={deckKey}
                    words={pool}
                    progress={progress}
                    onAnswer={answer}
                    onFinish={() => finishSession()}
                    onBack={home}
                    onSettings={() => setSettingsOpen(true)}
                  />
                </View>
                <View style={[styles.screen, view !== 'quiz' && styles.hidden]}>
                  <QuizScreen
                    key={deckKey}
                    words={pool}
                    progress={progress}
                    onAnswer={answer}
                    onFinish={finishSession}
                    onBack={home}
                  />
                </View>
              </>
            )}
            {view === 'home' && (
              <View style={styles.screen}>
                <HomeScreen
                  name={settings.name.trim()}
                  words={pool}
                  progress={progress}
                  onOpen={setView}
                  onOpenLevel={openLevel}
                  onSettings={() => setSettingsOpen(true)}
                />
              </View>
            )}
            {view === 'profile' && (
              <View style={styles.screen}>
                <ProfileScreen account={account} drawWords={drawDuelWords} onPlay={playDuel} />
              </View>
            )}
            {view === 'challenge' && duel && (
              <View style={styles.screen}>
                <QuizScreen
                  key={duel.id}
                  words={pool}
                  progress={progress}
                  onAnswer={answerDuel}
                  onFinish={finishDuel}
                  onBack={() => setView('profile')}
                  challenge={duel}
                />
              </View>
            )}
            {view === 'stats' && (
              <View style={styles.screen}>
                <StatsScreen words={pool} progress={progress} onBack={home} onOpenLevel={openLevel} />
              </View>
            )}
            {view === 'level' && (
              <View style={styles.screen}>
                <LevelScreen
                  level={levelView.level}
                  words={pool}
                  progress={progress}
                  onBack={() => setView(levelView.from)}
                />
              </View>
            )}
            {view === 'categories' && (
              <View style={styles.screen}>
                <CategoriesScreen
                  selected={settings.selected}
                  onChange={(selected) => change({ selected })}
                  onStart={() => setView('learn')}
                  onBack={home}
                />
              </View>
            )}
          </>
        )}

        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {TABS.map(({ id, label, icon }) => {
            const active =
              view === id || (id === 'home' && (view === 'categories' || (view === 'level' && levelView.from === 'home'))) ||
              (id === 'stats' && view === 'level' && levelView.from === 'stats') || (id === 'profile' && view === 'challenge');
            const color = active ? colors.highlight : colors.muted;
            return (
              <Pressable
                key={id}
                style={styles.tab}
                onPress={() => setView(id)}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={icon} size={26} color={color} />
                <Text style={[styles.tabLabel, { color }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SettingsModal
        visible={settingsOpen}
        name={settings.name}
        onName={(name) => change({ name })}
        onReset={() => {
          reset();
          setResets((n) => n + 1);
        }}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background, alignItems: 'center' },
    // Largeur plafonnée pour rester agréable sur tablette et sur le web.
    app: { flex: 1, width: '100%', maxWidth: 520 },
    screen: { flex: 1 },
    hidden: { display: 'none' },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: c.text },
    emptyText: { fontSize: 15, lineHeight: 22, color: c.muted, textAlign: 'center' },
    emptyButton: {
      height: 48,
      paddingHorizontal: 22,
      borderRadius: 10,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyButtonText: { color: c.onAccent, fontWeight: '700', fontSize: 15 },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.card,
      paddingTop: 10,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4 },
    tabLabel: { fontSize: 12, fontWeight: '600' },
  });
