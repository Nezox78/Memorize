import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsModal } from './src/components/SettingsModal';
import { WORDS } from './src/data/words';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { HomeScreen, View_ } from './src/screens/HomeScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { Colors, ThemeProvider, useStyles, useTheme } from './src/theme';
import { useProgress, useSettings } from './src/useProgress';

const TABS: { id: View_; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'home', label: 'Accueil', icon: 'home-outline' },
  { id: 'learn', label: 'Cartes', icon: 'copy-outline' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
  { id: 'stats', label: 'Progrès', icon: 'trending-up-outline' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
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
  const { progress, answer, finishSession, reset } = useProgress();
  const { settings, change } = useSettings();
  // Changer la clé après une réinitialisation repart sur un nouveau paquet de cartes.
  const [resets, setResets] = useState(0);

  // Mots des thèmes choisis ; tous les mots si aucun thème n'est sélectionné.
  const pool = useMemo(() => {
    const chosen = WORDS.filter((word) => settings.themes.includes(word.theme));
    return chosen.length ? chosen : WORDS;
  }, [settings.themes]);
  const deckKey = `${resets}-${settings.themes.join(',')}`;
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
            {view === 'home' && (
              <View style={styles.screen}>
                <HomeScreen
                  name={settings.name.trim()}
                  progress={progress}
                  onOpen={setView}
                  onSettings={() => setSettingsOpen(true)}
                />
              </View>
            )}
            {view === 'stats' && (
              <View style={styles.screen}>
                <StatsScreen progress={progress} onBack={home} />
              </View>
            )}
            {view === 'categories' && (
              <View style={styles.screen}>
                <CategoriesScreen
                  selected={settings.themes}
                  onChange={(themes) => change({ themes })}
                  onStart={() => setView('learn')}
                  onBack={home}
                />
              </View>
            )}
          </>
        )}

        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {TABS.map(({ id, label, icon }) => {
            const active = view === id || (id === 'home' && view === 'categories');
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
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.card,
      paddingTop: 10,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4 },
    tabLabel: { fontSize: 13, fontWeight: '600' },
  });
