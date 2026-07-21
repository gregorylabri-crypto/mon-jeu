/* ============================================================
   CONFIG — Les Mémoires d'Arzacq (moteur 3D, v2)
   ============================================================ */
const CONFIG = {
  PLAYER_NAME: "William",
  VILLAGE_NAME: "Arzacq-Arraziguet",

  // Déplacement à pied
  WALK_SPEED: 6.0,
  RUN_SPEED: 12.0,
  TURN_LERP: 0.2,
  GRAVITY: -26,
  JUMP: 9.5,

  // À cheval
  HORSE_WALK: 9,
  HORSE_RUN: 20,

  // Escalade
  CLIMB_SPEED: 9,

  // Caméra 3e personne
  CAM_DIST: 8,
  CAM_HEIGHT: 3.4,
  CAM_MIN_PITCH: -0.5,
  CAM_MAX_PITCH: 0.9,
  MOUSE_SENS: 0.0026,
  TOUCH_LOOK_SENS: 0.005,

  // Interactions
  SYNC_RANGE: 7,
  FRAGMENT_RANGE: 2.8,
  TALK_RANGE: 5,
  MOUNT_RANGE: 4.5,
  CLIMB_RANGE: 4,

  // Ambiance (crépuscule doré)
  FOG_COLOR: 0xe0b070,
  FOG_DENSITY: 0.0017,
};
