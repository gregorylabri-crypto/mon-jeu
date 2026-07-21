# Les Mémoires d'Arzacq — un jeu 3D pour William

Jeu d'aventure/exploration **3D** dans le navigateur, dont le héros est **William**,
dans une reconstitution fidèle de son village, **Arzacq-Arraziguet** (Béarn,
Pyrénées-Atlantiques). Ambiance moderne et cinématique, inspirée du genre
aventure/infiltration.

## 🎬 L'expérience

1. **Cinématique d'introduction** : vue depuis l'espace → zoom sur la Terre →
   la France → les Pyrénées-Atlantiques → le plan du village → **atterrissage**
   en parachute de William sur la grande place.
2. **Exploration libre** : parle aux habitants, monte à cheval, grimpe aux
   tours, synchronise les points de vue et récupère les fragments de mémoire.

## 🎮 Comment jouer

Ouvre **`index.html`** dans un navigateur récent (Chrome, Edge, Firefox).
Aucune installation, tout fonctionne **hors-ligne**.

| Action | Clavier | Tactile |
|--------|---------|---------|
| Se déplacer | `ZQSD` / flèches | joystick gauche |
| Caméra | souris (clic pour capturer) | glisser à droite |
| Courir | `Maj` | bouton **COURIR** |
| Sauter | `Espace` | bouton **SAUT** |
| Parler / agir / synchroniser | `E` | bouton **ACTION** |
| Monter / descendre de cheval | `F` | bouton **MONTER** |
| Grimper une tour | `C` | bouton **GRIMPER** |

Sur téléphone/tablette, une **manette tactile** s'affiche automatiquement
(joystick + boutons). Jouer en **paysage** est recommandé.

## 🎯 Objectifs

- **Synchroniser les 5 points de vue** (faisceaux dorés `◈`) : l'église
  Saint-Pierre, la place, la motte féodale, la mairie et le belvédère du lac.
  Chacun déclenche une vue aérienne cinématique.
- **Récupérer les 10 fragments de mémoire** (cristaux bleus).

Tout complété → **séquence terminée** !

## 🧑‍🤝‍🧑 Les habitants (avec surnoms mignons)

- **Monsieur le Maire** — avec son écharpe tricolore et son chapeau.
- **Filou** — son chien Malinois, qui le suit partout.
- **Madame Coquelicot** — et ses deux filles **Framboise** et **Myrtille**.
- **Caramel** — le cheval que l'on peut monter.
- **Nuage** — la brebis, et **Coin-Coin** — le canard du lac.

On peut **parler à tout le monde**, y compris aux animaux !

## 🏘️ Un village fidèle à la réalité

Reconstitution d'après la géographie réelle de la bastide :
- la **Place de la République**, triangulaire et allongée, bordée de ses
  **galeries couvertes** (les « couverts ») ;
- la **halle** centrale (marché au grain / au sel) ;
- l'**église Saint-Pierre** et son clocher (escaladable) ;
- la **motte féodale** (le « castet ») à l'ouest ;
- la **tour Peich** (escaladable) et le **lavoir** en fer à cheval ;
- la **Maison du Jambon de Bayonne** et la **mairie** ;
- le **lac d'Arzacq** et sa base de loisirs ;
- les **maisons béarnaises** à colombages, les champs et les **Pyrénées**.

## ✏️ Personnaliser

Réglages dans **`js/config.js`** : `PLAYER_NAME` (le héros), vitesses,
sensibilité caméra, distances d'interaction, ambiance.

## 🛠️ Structure

```
index.html            page, écran-titre, HUD, dialogues, manette tactile
css/style.css         interface
js/config.js          réglages
js/cinematic.js       cinématique d'intro (espace → village → atterrissage)
js/village.js         construction 3D fidèle du village + textures
js/npc.js             PNJ, animaux, cheval, dialogues
js/player.js          William (modèle + animations)
js/game.js            moteur : rendu + bloom, caméra, contrôles, objectifs
js/lib/               Three.js r128 (MIT) + post-traitement (bloom)
```

## ⚖️ Note

Projet **personnel, non commercial**, inspiré du *genre* aventure/infiltration ;
aucune marque, logo ou personnage tiers. Carte reconstituée à partir de la
géographie publique du village (esprit du lieu, non cadastral). Three.js est
distribué sous licence MIT.
