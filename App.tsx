import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { Colors, ThemeProvider, useStyles, useTheme } from './src/theme';
import { useProgress } from './src/useProgress';

type Tab = 'home' | 'learn' | 'quiz' | 'stats';

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'learn', label: 'Cartes', icon: 'copy' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle' },
  { id: 'stats', label: 'Progrès', icon: 'trending-up' },
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
  const [tab, setTab] = useState<Tab>('home');
  const { progress, answer, reset } = useProgress();
  // Changer la clé après une réinitialisation repart sur un nouveau paquet de cartes.
  const [resets, setResets] = useState(0);

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
            <View style={[styles.screen, tab !== 'learn' && styles.hidden]}>
              <LearnScreen key={resets} progress={progress} onAnswer={answer} />
            </View>
            <View style={[styles.screen, tab !== 'quiz' && styles.hidden]}>
              <QuizScreen key={resets} progress={progress} onAnswer={answer} />
            </View>
            {tab === 'home' && (
              <View style={styles.screen}>
                <HomeScreen progress={progress} onOpen={setTab} />
              </View>
            )}
            {tab === 'stats' && (
              <View style={styles.screen}>
                <StatsScreen
                  progress={progress}
                  onReset={() => {
                    reset();
                    setResets((n) => n + 1);
                  }}
                />
              </View>
            )}
          </>
        )}

        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map(({ id, label, icon }) => {
            const active = tab === id;
            const color = active ? colors.accent : colors.muted;
            return (
              <Pressable
                key={id}
                style={styles.tab}
                onPress={() => setTab(id)}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={active ? icon : (`${icon}-outline` as typeof icon)} size={22} color={color} />
                <Text style={[styles.tabLabel, { color }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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
      paddingTop: 8,
    },
    tab: { flex: 1, alignItems: 'center', gap: 2 },
    tabLabel: { fontSize: 11, fontWeight: '600' },
  });
