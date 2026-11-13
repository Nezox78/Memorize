import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LearnScreen } from './src/screens/LearnScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { colors } from './src/theme';
import { useProgress } from './src/useProgress';

type Tab = 'learn' | 'stats';

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'learn', label: 'Apprendre', icon: 'albums' },
  { id: 'stats', label: 'Statistiques', icon: 'stats-chart' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('learn');
  const { progress, answer, reset } = useProgress();
  // Changer la clé après une réinitialisation retire un nouveau paquet de cartes.
  const [resets, setResets] = useState(0);

  return (
    <View style={styles.root}>
      <View style={[styles.app, { paddingTop: insets.top }]}>
        {progress === null ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            {/* L'écran Apprendre reste monté pour conserver la carte en cours. */}
            <View style={[styles.screen, tab !== 'learn' && styles.hidden]}>
              <LearnScreen key={resets} progress={progress} onAnswer={answer} />
            </View>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  // Largeur plafonnée pour rester agréable sur tablette et sur le web.
  app: { flex: 1, width: '100%', maxWidth: 520 },
  screen: { flex: 1 },
  hidden: { display: 'none' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
