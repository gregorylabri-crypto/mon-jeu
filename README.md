# Les Mémoires d'Arzacq — un jeu 3D pour William

Jeu d'aventure/exploration **3D** dans le navigateur, dont le héros est **William**,
dans une reconstitution stylisée de son village, **Arzacq-Arraziguet** (Béarn,
Pyrénées-Atlantiques).

Inspiré de l'ambiance des jeux d'infiltration/aventure : personnage encapuchonné,
lumière crépusculaire, brouillard, montagnes au loin, et surtout le principe des
**points de vue à synchroniser** pour révéler la mémoire du village.

## 🎮 Comment jouer

Ouvre simplement **`index.html`** dans un navigateur récent (Chrome, Edge, Firefox).
Aucune installation, tout fonctionne **hors-ligne**.

| Action | Touches |
|--------|---------|
| Se déplacer | `Z Q S D` (ou `W A S D`) / flèches |
| Caméra | souris (clique d'abord pour la capturer) |
| Courir | `Maj` |
| Sauter | `Espace` |
| Synchroniser un point de vue | `E` (quand l'invite apparaît) |

Sur mobile/tablette, un **joystick tactile** apparaît en bas à gauche.

## 🎯 Objectif

1. **Synchroniser les 5 points de vue** (les faisceaux de lumière dorée `◈`) :
   l'église Saint-Pierre, la mairie, la place à arcades, la Maison du Jambon de
   Bayonne et le belvédère du lac. Chaque synchronisation déclenche une vue
   aérienne du village.
2. **Récupérer les 10 fragments de mémoire** (les cristaux bleus) éparpillés.

Quand tout est complété → **séquence terminée**, bravo !

## 🏘️ Le village reconstitué

Lieux réels d'Arzacq-Arraziguet présents dans le jeu :
- l'**église Saint-Pierre** et son clocher,
- la **place à arcades** (les « couverts » de l'ancienne bastide) et sa fontaine,
- la **Maison du Jambon de Bayonne** (le musée du village),
- la **mairie** (avec son drapeau),
- la **halle** du marché,
- le **lac d'Arzacq** et sa base de loisirs (avec belvédère),
- les **maisons béarnaises** à colombages rouge « sang de bœuf »,
- les **champs de maïs/blé** et les **Pyrénées** au loin.

## ✏️ Personnaliser

Tout se règle dans **`js/config.js`** :
- `PLAYER_NAME` : le prénom du héros (par défaut `William`),
- vitesses, sensibilité souris, distances d'interaction, couleurs d'ambiance…

## 🛠️ Structure du code

```
index.html           page + écran-titre + HUD
css/style.css        interface (HUD, cinématique, écran de victoire)
js/config.js         réglages
js/village.js        construction 3D du village + textures + données de jeu
js/player.js         le personnage (William) + animation
js/game.js           moteur : rendu, lumière, caméra, contrôles, objectifs
js/lib/three.min.js  moteur 3D Three.js (r128, licence MIT, embarqué)
```

## ⚖️ Note

Projet **personnel, non commercial**, inspiré du *genre* aventure/infiltration.
Il ne reprend aucune marque, aucun logo ni personnage de jeu existant.
Three.js est distribué sous licence MIT.
