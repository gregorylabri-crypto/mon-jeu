/* ============================================================
   CONFIG — Les Mémoires d'Arzacq (moteur 3D)
   Seul endroit à modifier pour personnaliser rapidement.
   ============================================================ */
const CONFIG = {
  PLAYER_NAME: "William",
  VILLAGE_NAME: "Arzacq-Arraziguet",

  // Déplacement (unités/seconde)
  WALK_SPEED: 6.5,
  RUN_SPEED: 12.5,
  TURN_LERP: 0.18,      // vitesse de rotation du perso vers sa direction
  GRAVITY: -26,
  JUMP: 9.5,

  // Caméra 3e personne
  CAM_DIST: 7.5,
  CAM_HEIGHT: 3.2,
  CAM_MIN_PITCH: -0.55,
  CAM_MAX_PITCH: 0.85,
  MOUSE_SENS: 0.0026,

  // Interactions
  SYNC_RANGE: 6.5,      // distance pour synchroniser un point de vue
  FRAGMENT_RANGE: 2.6,  // distance pour ramasser un fragment

  // Ambiance
  FOG_COLOR: 0xd8a15e,
  SKY_TOP: 0x2a3c63,
  SKY_BOT: 0xe8a95a,
};
