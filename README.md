# Memorize

Application mobile (iPhone et Android) pour mémoriser du vocabulaire anglais avec des cartes à swiper.

## Fonctionnement

- **Accueil** : progrès du jour, bouton pour commencer une révision, résumé des progrès, catégories de niveau et actions rapides.
- **Cartes** : sessions de 20 cartes. Un mot français s'affiche ; on touche la carte pour la retourner et voir la traduction anglaise (avec prononciation audio), puis on swipe à droite si on avait raison, à gauche sinon. Les boutons Correct / Incorrect font la même chose.
- **Quiz** : 10 mots français dont il faut écrire la traduction anglaise, avec 3 vies.
- **Progrès** : objectif de la semaine, série quotidienne, statistiques générales, précision, badges, catégories de révision.
- **Mots à apprendre** : choix des thèmes à réviser (Aliments, Vêtements, Véhicules, Infrastructures, Vocabulaire général).
- **Catégories de niveau** : chaque mot appartient à un niveau, tiré avec une probabilité fixe — Débutant 40 %, Novice 30 %, Intermédiaire 15 %, Avancé 10 %, Expert 5 %. Une bonne réponse (carte ou quiz) fait monter le mot d'une catégorie, une mauvaise le fait descendre.
- **Réglages** (roue crantée) : prénom, mode clair / sombre / système, réinitialisation.
- La progression est sauvegardée sur l'appareil ; l'application fonctionne hors ligne et sans compte.

## Lancer l'application

```bash
npm install
npx expo start
```

Scanner ensuite le QR code avec l'application **Expo Go** (App Store / Google Play) pour ouvrir l'app sur son téléphone. `npm run web` l'ouvre dans un navigateur.

## Publier sur les stores

Les builds iOS et Android se font dans le cloud avec EAS, sans Mac ni Android Studio :

```bash
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform all
```

Il faut un compte Expo, un compte Apple Developer (99 $/an) et un compte Google Play Console (25 $ une fois). Les identifiants de l'app (`com.nezox78.memorize`) se changent dans `app.json`.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/data/words.ts` | Les 496 mots, classés par niveau de départ et par thème |
| `src/logic/engine.ts` | Tirage pondéré, montée / descente de catégorie, statistiques |
| `src/useProgress.ts` | Chargement et sauvegarde de la progression (AsyncStorage) |
| `src/theme.tsx` | Couleurs des thèmes clair et sombre |
| `src/components/SwipeCard.tsx` | Carte : retournement, swipe, animations |
| `src/components/SettingsModal.tsx` | Réglages : prénom, apparence, réinitialisation |
| `src/screens/` | Écrans Accueil, Cartes, Quiz, Progrès et choix des thèmes |
