# VocabSwipe

Application mobile (iPhone et Android) pour mémoriser du vocabulaire anglais avec des cartes à swiper.

## Fonctionnement

- **Catégories de mots** : les mots viennent de la base en ligne, rangés par catégorie (Animaux, Sport, Pays/Continents…). L'utilisateur coche celles qu'il veut apprendre ; elles sont alors téléchargées sur le téléphone, et l'app fonctionne ensuite hors ligne.
- **Niveaux** : chaque mot téléchargé arrive en **Débutant** (catégorie 1). Une bonne réponse le fait monter d'un niveau (Novice, Intermédiaire, Avancé, Expert), une mauvaise le fait descendre ; il ne descend pas sous Débutant ni ne dépasse Expert. Chaque mot garde toujours sa catégorie et son niveau, même si sa catégorie est décochée.
- **Tirage** : chaque niveau a une probabilité d'apparition — Débutant 40 %, Novice 30 %, Intermédiaire 15 %, Avancé 10 %, Expert 5 %.
- **Cartes** : sessions de 20 cartes. Le mot français s'affiche ; un tap retourne la carte (et la re-retourne), avec la prononciation en voix anglaise. Swipe à droite si on avait raison, à gauche sinon, que la traduction ait été affichée ou non.
- **Quiz** : 10 mots français dont il faut écrire la traduction anglaise, avec 3 vies.
- **Progrès** : objectif de la semaine, série quotidienne, statistiques, précision, badges, répartition par niveau.
- **Profil** : compte, classement en ligne et défis entre amis.
- **Réglages** (roue crantée) : prénom, mode clair / sombre / système, réinitialisation.

## Lancer l'application

```bash
npm install
npx expo start
```

Scanner ensuite le QR code avec l'application **Expo Go** (App Store / Google Play) pour ouvrir l'app sur son téléphone. `npm run web` l'ouvre dans un navigateur.

## Mode en ligne : mots, comptes, classement, défis

L'application est reliée à un projet [Supabase](https://supabase.com) ; son adresse et sa clé publique sont dans `.env` (valeurs publiques par conception, embarquées dans l'app).

- **Mots** : chaque table publique `mots_anglais_*` (colonnes `french`, `english`, `theme`) est une catégorie. La fonction `word_categories()` les liste : ajouter une table de ce nom suffit pour qu'elle apparaisse dans l'app. Les catégories déjà téléchargées sont rafraîchies à chaque lancement.
- **Comptes** : inscription avec pseudo, email et mot de passe, depuis l'onglet **Profil**.
- **Classement** : 10 XP par bonne réponse (cartes et quiz), publiés automatiquement quand on est connecté.
- **Défis** : on saisit le pseudo d'un ami, les deux joueurs traduisent les mêmes 10 mots, le meilleur score gagne.

La progression de chaque mot reste sur le téléphone. Les tables `profiles` et `challenges` et leurs règles d'accès sont décrites dans `supabase/migrations/`. La progression (niveau de chaque mot) reste sur le téléphone.

## Publier sur les stores

Les builds iOS et Android se font dans le cloud avec EAS, sans Mac ni Android Studio :

```bash
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform all
```

Il faut un compte Expo, un compte Apple Developer (99 $/an) et un compte Google Play Console (25 $ une fois). Les identifiants de l'app (`com.nezox78.vocabswipe`) se changent dans `app.json`.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/words.tsx` | Catégories de la base, téléchargement des mots et copie locale |
| `src/speak.ts` | Prononciation avec une voix anglaise |
| `src/logic/engine.ts` | Tirage pondéré, montée / descente de catégorie, statistiques |
| `src/useProgress.ts` | Chargement et sauvegarde de la progression (AsyncStorage) |
| `src/theme.tsx` | Couleurs des thèmes clair et sombre |
| `src/components/SwipeCard.tsx` | Carte : retournement, swipe, animations |
| `src/components/SettingsModal.tsx` | Réglages : prénom, apparence, réinitialisation |
| `src/screens/` | Écrans Accueil, Cartes, Quiz, Progrès, Profil et choix des thèmes |
| `src/online/` | Client Supabase, compte, classement et défis |
| `supabase/migrations/` | Tables, règles d'accès et fonctions de la base en ligne |
