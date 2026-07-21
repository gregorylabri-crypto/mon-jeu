/* ============================================================
   VILLAGE 3D — reconstitution stylisée d'Arzacq-Arraziguet.
   Construit toute la géométrie et renvoie les données de jeu :
   { spawn, colliders, viewpoints, fragments }
   ============================================================ */

/* ---------- Fabrique de textures (canvas -> THREE.Texture) ---------- */
const Tex = {
  _make(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  },

  grass() {
    return this._make(256, 256, (g, w, h) => {
      g.fillStyle = "#5c6b3a"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) {
        const shades = ["#6b7d41", "#54622f", "#77883f", "#4c5a2e"];
        g.fillStyle = shades[i % shades.length];
        g.fillRect(Math.random() * w, Math.random() * h, 2, 3);
      }
    });
  },

  field(crop) {
    return this._make(128, 128, (g, w, h) => {
      const base = crop === "mais" ? "#8a7a2e" : crop === "ble" ? "#b39a4a" : "#6b7d3f";
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 2;
      for (let y = 6; y < h; y += 10) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    });
  },

  road() {
    return this._make(128, 128, (g, w, h) => {
      g.fillStyle = "#5a5148"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 700; i++) {
        g.fillStyle = ["#6b6156", "#4c443c", "#736657"][i % 3];
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    });
  },

  // Mur de maison béarnaise : crépi clair + colombages rouge sang de bœuf
  bearnWall() {
    return this._make(256, 256, (g, w, h) => {
      g.fillStyle = "#efe6d4"; g.fillRect(0, 0, w, h);
      // salissures
      for (let i = 0; i < 300; i++) {
        g.fillStyle = "rgba(160,140,110,0.25)";
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      g.strokeStyle = "#7d2a1e"; g.lineWidth = 12;
      g.strokeRect(6, 6, w - 12, h - 12);
      g.beginPath();
      g.moveTo(w / 2, 6); g.lineTo(w / 2, h - 6);
      g.moveTo(6, 40); g.lineTo(w - 6, 40);
      g.moveTo(6, h - 40); g.lineTo(w - 6, h - 40);
      g.moveTo(6, 6); g.lineTo(w - 6, h - 6);
      g.stroke();
      // fenêtres à volets
      const win = (x, y) => {
        g.fillStyle = "#2b3138"; g.fillRect(x, y, 40, 46);
        g.fillStyle = "#8ea9b8"; g.fillRect(x + 4, y + 4, 32, 38);
        g.fillStyle = "#7d2a1e"; g.fillRect(x - 8, y, 8, 46); g.fillRect(x + 40, y, 8, 46);
      };
      win(40, 150); win(176, 150);
    });
  },

  stone() {
    return this._make(256, 256, (g, w, h) => {
      g.fillStyle = "#b9ac93"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(90,80,60,0.5)"; g.lineWidth = 2;
      for (let y = 0; y < h; y += 26) {
        for (let x = 0; x < w; x += 40) {
          const off = (Math.floor(y / 26) % 2) * 20;
          g.strokeRect(x + off - 40, y, 40, 26);
        }
      }
    });
  },

  roofTiles(color) {
    return this._make(128, 128, (g, w, h) => {
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(0,0,0,0.28)"; g.lineWidth = 2;
      for (let y = 8; y < h; y += 12) {
        for (let x = 0; x < w; x += 18) {
          g.beginPath(); g.arc(x + (Math.floor(y / 12) % 2) * 9, y, 9, 0, Math.PI); g.stroke();
        }
      }
    });
  },

  pavement() {
    return this._make(256, 256, (g, w, h) => {
      g.fillStyle = "#8f8571"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(60,55,45,0.6)"; g.lineWidth = 2;
      for (let y = 0; y < h; y += 22)
        for (let x = 0; x < w; x += 22)
          g.strokeRect(x, y, 22, 22);
    });
  },
};

/* ---------- Construction du village ---------- */
const VILLAGE = {
  build(scene) {
    const data = { spawn: new THREE.Vector3(6, 0, 26), colliders: [], viewpoints: [], fragments: [] };
    const mat = (map, opts = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0, ...opts });

    // --- SOL général (grande dalle d'herbe) ---
    const grassTex = Tex.grass();
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(60, 60);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      mat(grassTex)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- CHAMPS (patchs colorés autour du bourg) ---
    const fieldDefs = [
      [-90, -70, 60, 44, "mais"], [70, -80, 70, 50, "ble"],
      [-110, 40, 55, 60, "prairie"], [95, 60, 64, 54, "mais"],
      [-70, 95, 60, 40, "ble"],
    ];
    fieldDefs.forEach(([x, z, w, d, crop]) => {
      const ft = Tex.field(crop);
      ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(w / 6, d / 6);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(ft));
      f.rotation.x = -Math.PI / 2; f.position.set(x, 0.02, z); f.receiveShadow = true;
      scene.add(f);
    });

    // --- ROUTES (croix beige au sol) ---
    const roadTex = Tex.road();
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    const addRoad = (x, z, w, d) => {
      const rt = roadTex.clone(); rt.needsUpdate = true; rt.repeat.set(w / 8, d / 8);
      const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(rt));
      r.rotation.x = -Math.PI / 2; r.position.set(x, 0.03, z); r.receiveShadow = true;
      scene.add(r);
    };
    addRoad(0, 0, 8, 180);   // axe nord-sud
    addRoad(0, 0, 180, 8);   // axe est-ouest
    addRoad(45, -30, 8, 70); // vers l'église
    addRoad(70, 40, 90, 8);  // vers le lac

    // === Helpers de bâtiments ===================================
    const wallTex = Tex.bearnWall();
    const stoneTex = Tex.stone();

    // Toit à deux pentes (prisme)
    const addRoof = (x, y, z, w, d, h, color, rotY = 0) => {
      const rt = Tex.roofTiles(color);
      rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(w / 3, d / 3);
      const geo = new THREE.BufferGeometry();
      const hw = w / 2, hd = d / 2;
      // 6 sommets : base rectangle + faîte
      const v = [
        -hw, 0, -hd,  hw, 0, -hd,  hw, 0, hd,  -hw, 0, hd, // base
        -hw, h, 0,    hw, h, 0,                            // faîte
      ];
      // 2 pentes + 2 pignons triangulaires
      const faces = [
        [0, 1, 5], [0, 5, 4],       // -z
        [2, 3, 4], [2, 4, 5],       // +z
        [1, 2, 5],                  // pignon +x
        [3, 0, 4],                  // pignon -x
      ];
      const pos = []; const flat = [];
      faces.forEach(f => f.forEach(i => { pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); }));
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: rt, roughness: 0.85 }));
      m.position.set(x, y, z); m.rotation.y = rotY;
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
    };

    // Bâtiment générique : boîte + toit + collider
    const addBuilding = (x, z, w, d, wallH, roofH, roofColor, texture) => {
      const t = (texture || wallTex).clone(); t.needsUpdate = true;
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, w / 6), 1);
      const walls = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), mat(t));
      walls.position.set(x, wallH / 2, z);
      walls.castShadow = true; walls.receiveShadow = true;
      scene.add(walls);
      addRoof(x, wallH, z, w + 1.2, d + 1.2, roofH, roofColor);
      data.colliders.push({ x, z, hw: w / 2 + 0.4, hd: d / 2 + 0.4 });
      return walls;
    };

    // Maisons béarnaises réparties dans le bourg
    const roofColors = ["#8a3a24", "#a04d24", "#7d3120", "#94411f"];
    const houses = [
      [-22, -14, 10, 8], [-40, 6, 11, 9], [-24, 20, 9, 8],
      [22, 20, 10, 8], [40, 8, 11, 9], [26, -12, 9, 8],
      [-14, 40, 10, 8], [16, 42, 9, 8], [-46, -22, 10, 9],
      [46, 30, 10, 8], [-30, -40, 9, 8], [30, -40, 10, 8],
    ];
    houses.forEach(([x, z, w, d], i) =>
      addBuilding(x, z, w, d, 6.5, 4, roofColors[i % roofColors.length]));

    // === LIEUX EMBLÉMATIQUES ====================================

    // --- Place à arcades (bastide) : pavement + galerie d'arches ---
    const pav = Tex.pavement(); pav.wrapS = pav.wrapT = THREE.RepeatWrapping; pav.repeat.set(6, 6);
    const square = new THREE.Mesh(new THREE.PlaneGeometry(38, 26), mat(pav));
    square.rotation.x = -Math.PI / 2; square.position.set(0, 0.04, 0); square.receiveShadow = true;
    scene.add(square);
    const archMat = mat(stoneTex);
    const buildArcade = (zPos) => {
      for (let i = -3; i <= 3; i++) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 5, 1.1), archMat);
        pillar.position.set(i * 5, 2.5, zPos); pillar.castShadow = true; scene.add(pillar);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(34, 1.2, 2), archMat);
      lintel.position.set(0, 5.3, zPos); lintel.castShadow = true; scene.add(lintel);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(35, 0.6, 4.5), mat(Tex.roofTiles("#8a3a24")));
      roof.position.set(0, 6.1, zPos + (zPos > 0 ? 1.4 : -1.4)); roof.castShadow = true; scene.add(roof);
    };
    buildArcade(-13); buildArcade(13);
    // fontaine centrale
    const fountain = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 1, 20), archMat);
    fountain.position.set(0, 0.5, 0); fountain.castShadow = true; scene.add(fountain);
    const waterTop = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.2, 20),
      new THREE.MeshStandardMaterial({ color: 0x3a7ca5, transparent: true, opacity: 0.85, roughness: 0.2 }));
    waterTop.position.set(0, 1, 0); scene.add(waterTop);

    // --- Église Saint-Pierre + clocher (POINT DE VUE principal) ---
    const churchX = 45, churchZ = -52;
    addBuilding(churchX, churchZ, 14, 22, 9, 6, "#5a4a3a", stoneTex); // nef
    // clocher
    const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 26, 7), mat(stoneTex));
    tower.position.set(churchX, 13, churchZ - 13); tower.castShadow = true; scene.add(tower);
    data.colliders.push({ x: churchX, z: churchZ - 13, hw: 4, hd: 4 });
    // flèche
    const spire = new THREE.Mesh(new THREE.ConeGeometry(5, 9, 4),
      new THREE.MeshStandardMaterial({ color: 0x3d4b57, roughness: 0.7 }));
    spire.position.set(churchX, 30.5, churchZ - 13); spire.rotation.y = Math.PI / 4;
    spire.castShadow = true; scene.add(spire);
    // croix
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x222 }));
    crossV.position.set(churchX, 36.4, churchZ - 13); scene.add(crossV);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x222 }));
    crossH.position.set(churchX, 36.6, churchZ - 13); scene.add(crossH);
    // horloge
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshStandardMaterial({ color: 0xf5f0e0 }));
    clock.position.set(churchX, 20, churchZ - 13 + 3.55); scene.add(clock);

    // --- Maison du Jambon de Bayonne (musée à colonnade) ---
    const jamX = -45, jamZ = -18;
    addBuilding(jamX, jamZ, 16, 12, 7, 3.5, "#7d3120", stoneTex);
    for (let i = -2; i <= 2; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 7, 12), mat(stoneTex));
      col.position.set(jamX + i * 3.4, 3.5, jamZ + 6.4); col.castShadow = true; scene.add(col);
    }

    // --- Mairie (avec drapeau, POINT DE VUE) ---
    const mairieX = -18, mairieZ = -40;
    addBuilding(mairieX, mairieZ, 14, 10, 8.5, 4, "#5a4a3a", stoneTex);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 8), new THREE.MeshStandardMaterial({ color: 0x555 }));
    pole.position.set(mairieX, 13.5, mairieZ + 4); scene.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    flag.position.set(mairieX + 1.6, 15.5, mairieZ + 4); scene.add(flag);

    // --- Halle du marché ---
    const halleX = 0, halleZ = 46;
    for (let i = -2; i <= 2; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 0.8), mat(stoneTex));
      p.position.set(i * 5, 3, halleZ); p.castShadow = true; scene.add(p);
    }
    const halleRoof = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 12), mat(Tex.roofTiles("#a04d24")));
    halleRoof.position.set(0, 6.2, halleZ); halleRoof.castShadow = true; scene.add(halleRoof);
    data.colliders.push({ x: halleX, z: halleZ, hw: 12, hd: 5 });

    // --- Lac + belvédère en bois (POINT DE VUE) ---
    const lakeX = 105, lakeZ = 55;
    const lake = new THREE.Mesh(new THREE.CircleGeometry(30, 40),
      new THREE.MeshStandardMaterial({ color: 0x2f6d8c, transparent: true, opacity: 0.9, roughness: 0.15, metalness: 0.2 }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(lakeX, 0.05, lakeZ); scene.add(lake);
    lake.userData.isWater = true;
    // belvédère (tour d'observation en bois)
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
    const belvX = lakeX - 26, belvZ = lakeZ - 8;
    [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([dx, dz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 16, 0.8), woodMat);
      leg.position.set(belvX + dx, 8, belvZ + dz); leg.castShadow = true; scene.add(leg);
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 7), woodMat);
    deck.position.set(belvX, 16, belvZ); deck.castShadow = true; scene.add(deck);
    data.colliders.push({ x: belvX, z: belvZ, hw: 3, hd: 3 });

    // === ARBRES (low-poly) ======================================
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 1 });
    const treeSpots = [
      [-12, 8], [14, -6], [-34, 30], [34, 34], [-8, 54], [58, 48],
      [-58, 12], [60, -10], [-16, -28], [20, 60], [80, 40], [-70, -40],
    ];
    treeSpots.forEach(([x, z]) => {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4, 7), trunkMat);
      tr.position.set(x, 2, z); tr.castShadow = true; scene.add(tr);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 6, 8), leafMat);
      cone.position.set(x, 6.5, z); cone.castShadow = true; scene.add(cone);
      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(2.3, 4.5, 8), leafMat);
      cone2.position.set(x, 9, z); cone2.castShadow = true; scene.add(cone2);
      data.colliders.push({ x, z, hw: 1, hd: 1 });
    });

    // === MONTAGNES lointaines (silhouette des Pyrénées) =========
    const mtnMat = new THREE.MeshStandardMaterial({ color: 0x4a5a75, roughness: 1, fog: false });
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 240 + Math.random() * 30;
      const h = 40 + Math.random() * 60;
      const m = new THREE.Mesh(new THREE.ConeGeometry(30 + Math.random() * 20, h, 5), mtnMat);
      m.position.set(Math.cos(a) * r, h / 2 - 5, Math.sin(a) * r);
      scene.add(m);
    }

    // === POINTS DE VUE (synchronisation) ========================
    const addViewpoint = (id, name, x, z, y, fact) => {
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 60, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
      );
      beam.position.set(x, 30, z); scene.add(beam);
      data.viewpoints.push({ id, name, pos: new THREE.Vector3(x, y, z), fact, synced: false, beam });
    };
    addViewpoint("eglise", "Église Saint-Pierre & son clocher", churchX, churchZ + 15, 16,
      "Ancienne bastide, Arzacq s'organise autour de son église Saint-Pierre. Son clocher est le point le plus haut du bourg.");
    addViewpoint("mairie", "Place de la Mairie", mairieX, mairieZ + 9, 12,
      "La mairie d'Arzacq-Arraziguet, cœur administratif du village des Arzacquois.");
    addViewpoint("belvedere", "Belvédère du Lac", belvX, belvZ - 6, 15,
      "Le lac d'Arzacq et sa base de loisirs : baignade, pédalos et grands ciels du Sud-Ouest.");
    addViewpoint("place", "Place à arcades", 0, 7, 6,
      "Les couverts de la bastide : sous les arcades se tenaient les marchés depuis le Moyen Âge.");
    addViewpoint("jambon", "Maison du Jambon de Bayonne", jamX, jamZ + 11, 7,
      "Arzacq abrite la Maison du Jambon de Bayonne, musée dédié à la fierté gastronomique de la région.");

    // === FRAGMENTS DE MÉMOIRE (à collecter) =====================
    const fragSpots = [
      [-30, 0], [30, 0], [0, 28], [-52, -30], [52, -30],
      [78, 28], [0, 62], [-40, 46], [60, 20], [-64, 24],
    ];
    fragSpots.forEach(([x, z], i) => {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.7),
        new THREE.MeshStandardMaterial({ color: 0x7fe0ff, emissive: 0x2aa8d8, emissiveIntensity: 1.4, roughness: 0.3 }));
      const halo = new THREE.Mesh(new THREE.OctahedronGeometry(1.1),
        new THREE.MeshBasicMaterial({ color: 0x8fe6ff, transparent: true, opacity: 0.18, depthWrite: false }));
      g.add(core); g.add(halo);
      g.position.set(x, 1.6, z);
      scene.add(g);
      data.fragments.push({ id: i, mesh: g, collected: false });
    });

    return data;
  },
};
