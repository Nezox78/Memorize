import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Challenge, Profile, createChallenge, fetchChallenges, fetchLeaderboard } from '../online/api';
import { Account } from '../online/useAccount';
import { Colors, useStyles, useTheme } from '../theme';

type Props = {
  account: Account;
  /** Tire les mots d'un nouveau défi (versions françaises). */
  drawWords: () => string[];
  onPlay: (challenge: Challenge) => void;
};

export function ProfileScreen({ account, drawWords, onPlay }: Props) {
  const styles = useStyles(makeStyles);

  let body;
  if (!account.configured) body = <NotConfigured />;
  else if (!account.ready) body = <ActivityIndicator style={{ marginTop: 40 }} />;
  else if (!account.userId) body = <AuthForm account={account} />;
  else body = <Online account={account} drawWords={drawWords} onPlay={onPlay} />;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profil</Text>
      {body}
    </ScrollView>
  );
}

function NotConfigured() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.panel}>
      <Ionicons name="cloud-offline-outline" size={32} color={colors.muted} />
      <Text style={styles.panelTitle}>Mode en ligne non configuré</Text>
      <Text style={styles.caption}>
        Les comptes, le classement et les défis ont besoin d'un serveur. Renseignez l'adresse et la clé du projet
        Supabase dans le fichier .env (voir le README), puis relancez l'application.
      </Text>
      <Text style={styles.caption}>L'apprentissage, lui, fonctionne entièrement hors ligne.</Text>
    </View>
  );
}

function AuthForm({ account }: { account: Account }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    if (mode === 'in') {
      const error = await account.signIn(email, password);
      if (error) setMessage({ text: error });
    } else {
      const result = await account.signUp(email, password, username);
      if (result.error) setMessage({ text: result.error });
      else if (result.confirm) {
        setMessage({ text: 'Compte créé ! Confirmez votre adresse via le lien reçu par email, puis connectez-vous.', ok: true });
        setMode('in');
      }
    }
    setBusy(false);
  };

  const ready = email.trim() && password && (mode === 'in' || username.trim());

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{mode === 'in' ? 'Connexion' : 'Créer un compte'}</Text>
      <Text style={styles.caption}>
        Un compte permet d'apparaître au classement et de défier vos amis. Vos mots restent sur votre téléphone.
      </Text>

      <View style={styles.segments}>
        {(['in', 'up'] as const).map((id) => (
          <Pressable
            key={id}
            onPress={() => {
              setMode(id);
              setMessage(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === id }}
            style={[styles.segment, mode === id && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, mode === id && { color: colors.onAccent }]}>
              {id === 'in' ? 'Connexion' : 'Inscription'}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'up' && (
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Pseudo"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          style={styles.input}
        />
      )}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Adresse email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        placeholderTextColor={colors.muted}
        secureTextEntry
        onSubmitEditing={submit}
        style={styles.input}
      />

      {message && (
        <Text style={[styles.message, { color: message.ok ? colors.success : colors.error }]}>{message.text}</Text>
      )}

      <Pressable
        onPress={submit}
        disabled={!ready || busy}
        accessibilityRole="button"
        style={[styles.primary, (!ready || busy) && { opacity: 0.4 }]}
      >
        <Text style={styles.primaryText}>{mode === 'in' ? 'Se connecter' : "S'inscrire"}</Text>
      </Pressable>
    </View>
  );
}

function Online({ account, drawWords, onPlay }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const me = account.userId!;
  const [tab, setTab] = useState<'board' | 'duels'>('board');
  const [board, setBoard] = useState<Profile[] | null>(null);
  const [duels, setDuels] = useState<Challenge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [friend, setFriend] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profiles, challenges] = await Promise.all([fetchLeaderboard(), fetchChallenges()]);
      setBoard(profiles);
      setDuels(challenges);
      setError(null);
    } catch {
      setError('Impossible de charger les données. Vérifiez votre connexion.');
    }
  }, []);

  useEffect(() => {
    load();
    account.refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const challengeFriend = async () => {
    if (busy || !friend.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createChallenge(me, friend, drawWords());
      setFriend('');
      onPlay(created);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const rank = board ? board.findIndex((profile) => profile.id === me) + 1 : 0;
  const waiting = duels?.filter((duel) => myScore(duel, me) === null).length ?? 0;

  return (
    <>
      <View style={[styles.panel, styles.identity]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(account.profile?.username ?? '?').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle}>{account.profile?.username ?? '…'}</Text>
          <Text style={styles.caption}>
            {account.profile?.xp ?? 0} XP{rank ? ` · ${rank}${rank === 1 ? 'er' : 'e'} au classement` : ''}
          </Text>
        </View>
        <Pressable onPress={load} accessibilityRole="button" accessibilityLabel="Actualiser" hitSlop={10}>
          <Ionicons name="refresh" size={22} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.segments}>
        {(['board', 'duels'] as const).map((id) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === id }}
            style={[styles.segment, tab === id && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, tab === id && { color: colors.onAccent }]}>
              {id === 'board' ? 'Classement' : `Défis${waiting ? ` (${waiting})` : ''}`}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={[styles.message, { color: colors.error }]}>{error}</Text>}

      {tab === 'board' ? (
        <View style={styles.panel}>
          <View style={styles.inline}>
            <Ionicons name="trophy-outline" size={22} color={colors.accent} />
            <Text style={styles.panelTitle}>Classement</Text>
          </View>
          {board === null ? (
            <ActivityIndicator />
          ) : (
            board.map((profile, i) => (
              <View key={profile.id} style={[styles.rankRow, profile.id === me && styles.rankMe]}>
                <Text style={styles.rank}>{['🥇', '🥈', '🥉'][i] ?? i + 1}</Text>
                <Text style={styles.rankName} numberOfLines={1}>
                  {profile.username}
                  {profile.id === me ? ' (vous)' : ''}
                </Text>
                <Text style={styles.rankXp}>{profile.xp} XP</Text>
              </View>
            ))
          )}
          <Text style={styles.caption}>10 XP par bonne réponse, aux cartes comme au quiz.</Text>
        </View>
      ) : (
        <>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Défier un ami</Text>
            <Text style={styles.caption}>
              Vous traduisez tous les deux les mêmes 10 mots : le meilleur score l'emporte.
            </Text>
            <TextInput
              value={friend}
              onChangeText={setFriend}
              placeholder="Pseudo de votre ami"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={challengeFriend}
              style={styles.input}
            />
            <Pressable
              onPress={challengeFriend}
              disabled={busy || !friend.trim()}
              accessibilityRole="button"
              style={[styles.primary, (busy || !friend.trim()) && { opacity: 0.4 }]}
            >
              <Text style={styles.primaryText}>Lancer le défi</Text>
            </Pressable>
          </View>

          {duels === null ? (
            <ActivityIndicator />
          ) : duels.length === 0 ? (
            <Text style={[styles.caption, { textAlign: 'center' }]}>Aucun défi pour l'instant.</Text>
          ) : (
            duels.map((duel) => <Duel key={duel.id} duel={duel} me={me} onPlay={() => onPlay(duel)} />)
          )}
        </>
      )}

      <Pressable onPress={account.signOut} accessibilityRole="button" style={styles.signOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>
    </>
  );
}

const myScore = (duel: Challenge, me: string) =>
  duel.challenger_id === me ? duel.challenger_score : duel.opponent_score;

function Duel({ duel, me, onPlay }: { duel: Challenge; me: string; onPlay: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const iStarted = duel.challenger_id === me;
  const other = (iStarted ? duel.opponent : duel.challenger)?.username ?? 'Joueur';
  const mine = myScore(duel, me);
  const theirs = iStarted ? duel.opponent_score : duel.challenger_score;

  let status: string;
  let color = colors.muted;
  if (mine === null) status = iStarted ? 'À vous de jouer' : `${other} vous a défié`;
  else if (theirs === null) status = `En attente de ${other} · vous : ${mine}/10`;
  else {
    status = `${mine} – ${theirs} · ${mine > theirs ? 'Victoire' : mine < theirs ? 'Défaite' : 'Égalité'}`;
    color = mine > theirs ? colors.success : mine < theirs ? colors.error : colors.muted;
  }

  return (
    <View style={[styles.panel, styles.duel]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.duelName}>{other}</Text>
        <Text style={[styles.caption, { color, fontWeight: '600' }]}>{status}</Text>
      </View>
      {mine === null && (
        <Pressable onPress={onPlay} accessibilityRole="button" accessibilityLabel={`Jouer contre ${other}`} style={styles.play}>
          <Text style={styles.primaryText}>Jouer</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 14 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    panel: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 12,
    },
    panelTitle: { fontSize: 19, fontWeight: '800', color: c.text },
    caption: { fontSize: 14, lineHeight: 20, color: c.muted },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    segments: { flexDirection: 'row', backgroundColor: c.track, borderRadius: 10, padding: 4 },
    segment: { flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    segmentActive: { backgroundColor: c.accent },
    segmentText: { fontSize: 14, fontWeight: '700', color: c.muted },
    input: {
      height: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 16,
      fontSize: 16,
      color: c.text,
    },
    message: { fontSize: 14, fontWeight: '600' },
    primary: { height: 48, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: c.onAccent, fontWeight: '700', fontSize: 15 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: c.onAccent, fontSize: 22, fontWeight: '800' },
    rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
    rankMe: { backgroundColor: c.accentSoft },
    rank: { width: 30, fontSize: 16, fontWeight: '800', color: c.muted, textAlign: 'center' },
    rankName: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text },
    rankXp: { fontSize: 15, fontWeight: '700', color: c.accent },
    duel: { flexDirection: 'row', alignItems: 'center' },
    duelName: { fontSize: 17, fontWeight: '700', color: c.text },
    play: { height: 42, paddingHorizontal: 20, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    signOut: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    signOutText: { color: c.error, fontWeight: '600', fontSize: 15 },
  });
