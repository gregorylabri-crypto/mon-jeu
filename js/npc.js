/* ============================================================
   PNJ & ANIMAUX + dialogues
   Personnages : Monsieur le Maire (écharpe tricolore), son
   Malinois "Filou", "Madame Coquelicot" et ses filles
   "Framboise" & "Myrtille", le cheval "Caramel", la brebis
   "Nuage" et le canard "Coin-Coin".
   ============================================================ */

const NPC = {
  _mat(c, r = 0.9) { return new THREE.MeshStandardMaterial({ color: c, roughness: r }); },

  // Humain stylisé low-poly
  _human(opt) {
    const g = new THREE.Group();
    const skin = this._mat(opt.skin || 0xe8b48a);
    const robe = this._mat(opt.robe);
    const hairM = this._mat(opt.hair || 0x3a2a1a);
    const s = opt.scale || 1;

    // corps (robe/pantalon conique)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * s, 0.62 * s, 1.5 * s, 12), robe);
    body.position.y = 0.9 * s; body.castShadow = true; g.add(body);
    // tête
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32 * s, 14, 14), skin);
    head.position.y = 1.95 * s; head.castShadow = true; g.add(head);
    // cheveux
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.35 * s, 14, 14, 0, Math.PI * 2, 0, Math.PI * (opt.longHair ? 0.75 : 0.55)), hairM);
    hair.position.y = 2.0 * s; g.add(hair);
    if (opt.pigtails) {
      [-0.34, 0.34].forEach(dx => { const pt = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 8, 8), hairM); pt.position.set(dx * s, 1.9 * s, 0); g.add(pt); });
    }
    // yeux
    [-0.12, 0.12].forEach(dx => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 8, 8), this._mat(0x222)); e.position.set(dx * s, 1.97 * s, 0.28 * s); g.add(e); });
    // bras
    const armG = new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 1.1 * s, 8);
    const aL = new THREE.Mesh(armG, robe); aL.position.set(-0.55 * s, 1.05 * s, 0); aL.castShadow = true; g.add(aL);
    const aR = new THREE.Mesh(armG, robe); aR.position.set(0.55 * s, 1.05 * s, 0); aR.castShadow = true; g.add(aR);

    if (opt.hat) { // chapeau/casquette du maire
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.34 * s, 0.36 * s, 0.2 * s, 12), this._mat(0x222));
      hat.position.y = 2.22 * s; g.add(hat);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 0.05 * s, 16), this._mat(0x222));
      brim.position.y = 2.12 * s; g.add(brim);
    }
    if (opt.sash) { // écharpe tricolore en diagonale
      const cols = [0x0055a4, 0xffffff, 0xef4135];
      cols.forEach((c, i) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.16 * s, 1.6 * s, 0.66 * s), this._mat(c, 0.6));
        band.position.set((i - 1) * 0.17 * s, 1.0 * s, 0.34 * s);
        band.rotation.z = 0.5; g.add(band);
      });
    }
    g.userData.arms = [aL, aR];
    return g;
  },

  _dog(color) { // Malinois
    const g = new THREE.Group();
    const body = this._mat(color || 0xb5762e);
    const black = this._mat(0x2a2018);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.3, 10), body);
    torso.rotation.z = Math.PI / 2; torso.position.y = 0.55; torso.castShadow = true; g.add(torso);
    const rump = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), body); rump.position.set(-0.55, 0.55, 0); g.add(rump);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), body); head.position.set(0.7, 0.72, 0); g.add(head);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 8), black); snout.rotation.z = -Math.PI / 2; snout.position.set(1.0, 0.66, 0); g.add(snout);
    [[-0.12], [0.12]].forEach(([dz]) => { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 6), black); ear.position.set(0.66, 0.98, dz); g.add(ear); });
    const legG = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 6);
    [[0.45, 0.28], [0.45, -0.28], [-0.35, 0.28], [-0.35, -0.28]].forEach(([x, z]) => { const l = new THREE.Mesh(legG, black); l.position.set(x, 0.27, z); l.castShadow = true; g.add(l); });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.6, 6), body); tail.position.set(-0.7, 0.7, 0); tail.rotation.z = 0.8; g.add(tail);
    g.userData.tail = tail;
    return g;
  },

  _horse(color) { // Caramel
    const g = new THREE.Group();
    const coat = this._mat(color || 0xa5703c);
    const dark = this._mat(0x3a2a1a);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.0, 12), coat);
    torso.rotation.z = Math.PI / 2; torso.position.y = 1.5; torso.castShadow = true; g.add(torso);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.1, 10), coat); neck.position.set(1.0, 2.0, 0); neck.rotation.z = -0.7; neck.castShadow = true; g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.45), coat); head.position.set(1.6, 2.35, 0); head.rotation.z = -0.3; g.add(head);
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.5), dark); mane.position.set(0.85, 2.15, 0); mane.rotation.z = -0.7; g.add(mane);
    const legG = new THREE.CylinderGeometry(0.14, 0.12, 1.5, 8);
    [[0.7, 0.35], [0.7, -0.35], [-0.7, 0.35], [-0.7, -0.35]].forEach(([x, z]) => { const l = new THREE.Mesh(legG, dark); l.position.set(x, 0.75, z); l.castShadow = true; g.add(l); });
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.0, 8), dark); tail.position.set(-1.05, 1.5, 0); tail.rotation.z = 0.9; g.add(tail);
    // selle
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 1.0), this._mat(0x5a2f1a)); saddle.position.set(0, 2.05, 0); g.add(saddle);
    g.userData.mountY = 2.35;
    return g;
  },

  _sheep() {
    const g = new THREE.Group();
    const wool = this._mat(0xf0ece2, 1); const face = this._mat(0x3a3a3a);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), wool); body.position.y = 0.8; body.scale.set(1.3, 1, 1); body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), face); head.position.set(0.8, 0.9, 0); g.add(head);
    [[0.5, 0.3], [0.5, -0.3], [-0.4, 0.3], [-0.4, -0.3]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6), face); l.position.set(x, 0.25, z); g.add(l); });
    return g;
  },

  _duck() {
    const g = new THREE.Group();
    const body = this._mat(0x3a7d3a); const beak = this._mat(0xe8a020);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), this._mat(0xd8d2c4)); torso.scale.set(1.4, 1, 1); torso.position.y = 0.3; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), body); head.position.set(0.35, 0.55, 0); g.add(head);
    const bk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), beak); bk.rotation.z = -Math.PI / 2; bk.position.set(0.55, 0.52, 0); g.add(bk);
    return g;
  },

  buildAll(scene) {
    const list = [];
    const add = (o) => { scene.add(o.group); list.push(o); return o; };

    // Monsieur le Maire
    const maire = this._human({ robe: 0x2b3a4a, skin: 0xe8b48a, hair: 0x5a5550, sash: true, hat: true });
    maire.position.set(6, 0, 24);
    const mMaire = add({ id: "maire", name: "Monsieur le Maire", kind: "human", group: maire, pos: maire.position,
      lines: [
        "Ah, William ! Bienvenue à Arzacq-Arraziguet, notre belle bastide.",
        "Tu vois cette grande place triangulaire ? Sous les couverts se tenaient les marchés depuis le Moyen Âge.",
        "Grimpe au clocher pour admirer tout le Béarn, mon garçon !",
        "Et surtout, dis bonjour à Filou, mon Malinois. Il t'adore déjà.",
      ] });

    // Filou — Malinois du maire (le suit)
    const filou = this._dog(0xc08a3a); filou.position.set(4, 0, 26);
    const mFilou = add({ id: "filou", name: "Filou (le Malinois)", kind: "animal", group: filou, pos: filou.position, follow: mMaire,
      lines: ["Ouaf ! Ouaf ! *remue la queue joyeusement*", "Filou tourne autour de toi… Il veut jouer !", "*pose sa patte sur ton pied* Grrr-ouaf ! (ça veut dire : « on est amis ! »)"] });

    // Madame Coquelicot
    const dame = this._human({ robe: 0xc0392b, skin: 0xf0c39a, hair: 0x4a2f1a, longHair: true, scale: 1.02 });
    dame.position.set(-10, 0, 12);
    add({ id: "dame", name: "Madame Coquelicot", kind: "human", group: dame, pos: dame.position,
      lines: [
        "Bonjour William ! Quelle belle journée sur la place, n'est-ce pas ?",
        "Mes deux filles, Framboise et Myrtille, jouent près de la halle. Va les voir !",
        "Si tu as faim, la Maison du Jambon de Bayonne est juste là-bas.",
      ] });

    // Framboise & Myrtille (les filles)
    const fram = this._human({ robe: 0xe84393, skin: 0xf0c39a, hair: 0x3a2a1a, pigtails: true, scale: 0.72 });
    fram.position.set(-4, 0, 8);
    add({ id: "framboise", name: "Framboise", kind: "human", group: fram, pos: fram.position,
      lines: ["Coucou William ! Tu veux jouer à cache-cache sous les arcades ?", "Ma sœur Myrtille court plus vite que moi… mais moi je grimpe mieux !", "Tu as vu le cheval Caramel ? Il est trop mignon !"] });
    const myr = this._human({ robe: 0x8e44ad, skin: 0xf0c39a, hair: 0x2a1f14, pigtails: true, scale: 0.68 });
    myr.position.set(-1, 0, 10);
    add({ id: "myrtille", name: "Myrtille", kind: "human", group: myr, pos: myr.position,
      lines: ["Hihi ! Attrape-moi si tu peux, William !", "Papi dit qu'un château se dressait sur la motte, là-bas à l'ouest.", "Nuage la brebis a encore mangé les fleurs… coquine !"] });

    // Caramel — le cheval (montable)
    const cheval = this._horse(0xb5793f); cheval.position.set(24, 0, 40);
    add({ id: "caramel", name: "Caramel (le cheval)", kind: "horse", group: cheval, pos: cheval.position, rideable: true,
      lines: ["Hiiii ! *Caramel gratte le sol du sabot* Il t'invite à monter (appuie sur MONTER).", "*Caramel hoche la tête* En selle, on ira bien plus vite !"] });
    this.horse = cheval;

    // Nuage — brebis
    const brebis = this._sheep(); brebis.position.set(-56, 0, 60);
    add({ id: "nuage", name: "Nuage (la brebis)", kind: "animal", group: brebis, pos: brebis.position, wander: true,
      lines: ["Bêêê… *Nuage te regarde avec de grands yeux doux*", "Bêê-bêê ! (traduction : « tu n'aurais pas un peu d'herbe fraîche ? »)"] });

    // Coin-Coin — canard près du lac
    const canard = this._duck(); canard.position.set(12, 0, -104);
    add({ id: "coincoin", name: "Coin-Coin (le canard)", kind: "animal", group: canard, pos: canard.position, wander: true,
      lines: ["Coin ! Coin ! *se dandine vers le lac*", "Coin-coin-coin ! (« l'eau du lac est parfaite aujourd'hui ! »)"] });

    this.list = list;
    return list;
  },

  update(list, dt, t, playerPos) {
    list.forEach((n, i) => {
      const g = n.group;
      // Filou suit le maire
      if (n.follow) {
        const target = n.follow.pos;
        const dx = target.x - 6 - g.position.x, dz = target.z + 3 - g.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.5) { g.position.x += (dx / d) * dt * 3; g.position.z += (dz / d) * dt * 3; g.rotation.y = Math.atan2(dx, dz); }
        if (n.group.userData.tail) n.group.userData.tail.rotation.x = Math.sin(t * 12) * 0.5;
      }
      // errance douce (brebis, canard)
      if (n.wander) {
        g.position.x += Math.sin(t * 0.5 + i) * dt * 0.6;
        g.rotation.y = Math.sin(t * 0.5 + i) * 0.5 + Math.PI / 2;
      }
      // léger balancement d'idle pour les humains
      if (n.kind === "human") { g.position.y = Math.sin(t * 1.5 + i) * 0.03; if (g.userData.arms) { g.userData.arms[0].rotation.x = Math.sin(t * 1.2 + i) * 0.12; g.userData.arms[1].rotation.x = -Math.sin(t * 1.2 + i) * 0.12; } }
      // orienter le PNJ vers le joueur s'il est proche
      if (playerPos && n.kind === "human") {
        const dx = playerPos.x - g.position.x, dz = playerPos.z - g.position.z;
        if (dx * dx + dz * dz < 60) g.rotation.y = Math.atan2(dx, dz);
      }
    });
  },
};
