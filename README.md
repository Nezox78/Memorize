# Memorize

Application mobile (iPhone et Android) pour mémoriser du vocabulaire anglais avec des cartes à swiper.

## Fonctionnement

- **Apprendre** : un mot français s'affiche sur une carte. On touche la carte pour révéler la traduction anglaise, puis on swipe à droite (✔ je savais) ou à gauche (✘ je ne savais pas). Les deux boutons sous la carte font la même chose.
- **Catégories** : chaque mot appartient à un niveau, tiré avec une probabilité fixe — Débutant 40 %, Novice 30 %, Intermédiaire 15 %, Avancé 10 %, Expert 5 %.
- **Progression** : une bonne réponse fait monter le mot d'une catégorie, une mauvaise le fait descendre (bornes : Débutant et Expert).
- **Statistiques** : progression globale, mots appris, taux de réussite, séries, répartition par catégorie.
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
| `src/data/words.ts` | Les 417 mots, classés par catégorie de départ |
| `src/logic/engine.ts` | Tirage pondéré, montée / descente de catégorie, statistiques |
| `src/useProgress.ts` | Chargement et sauvegarde de la progression (AsyncStorage) |
| `src/components/SwipeCard.tsx` | Carte : révélation, swipe, animations |
| `src/screens/` | Écrans Apprendre et Statistiques |
