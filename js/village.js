/* ============================================================
   VILLAGE 3D — reconstitution fidèle d'Arzacq-Arraziguet.
   D'après la géographie réelle (bastide) :
   - Place de la République TRIANGULAIRE et allongée, bordée de
     galeries couvertes ("couverts") sur ses deux longs côtés ;
   - Halle centrale (séparait marché au grain / au sel) ;
   - Église Saint-Pierre à la pointe nord ;
   - Motte féodale (le "castet") à l'ouest ;
   - Lavoir en fer à cheval ; tour Peich ;
   - Lac d'Arzacq & base de loisirs au nord.
   Renvoie { spawn, colliders, viewpoints, fragments, climbs, water }.
   ============================================================ */

/* ---------- Textures procédurales ---------- */
const Tex = {
  _c(w, h, draw) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  },
  grass() {
    return this._c(256, 256, (g, w, h) => {
      g.fillStyle = "#586b34"; g.fillRect(0, 0, w, h);
      const sh = ["#657a3c", "#4e5f2d", "#728544", "#465428", "#6f8340"];
      for (let i = 0; i < 6000; i++) { g.fillStyle = sh[i % sh.length]; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); }
    });
  },
  field(crop) {
    return this._c(128, 128, (g, w, h) => {
      const base = crop === "mais" ? "#93801f" : crop === "ble" ? "#bda24a" : crop === "tournesol" ? "#8a7d2a" : "#657a38";
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(0,0,0,0.16)"; g.lineWidth = 2;
      for (let y = 5; y < h; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      if (crop === "mais") { g.fillStyle = "#c9b23e"; for (let x = 6; x < w; x += 14) for (let y = 6; y < h; y += 16) g.fillRect(x, y, 3, 6); }
    });
  },
  road() {
    return this._c(128, 128, (g, w, h) => {
      g.fillStyle = "#6a5d4c"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { g.fillStyle = ["#7a6b57", "#584c3d", "#82725c"][i % 3]; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
  },
  bearnWall(shutter) {
    return this._c(256, 256, (g, w, h) => {
      g.fillStyle = "#efe6d3"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = "rgba(150,130,100,0.22)"; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      g.strokeStyle = "#7d2a1e"; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12);
      g.beginPath();
      g.moveTo(w / 2, 6); g.lineTo(w / 2, h - 6);
      g.moveTo(6, h / 2); g.lineTo(w - 6, h / 2);
      g.moveTo(6, 6); g.lineTo(w - 6, h - 6);
      g.moveTo(w - 6, 6); g.lineTo(6, h - 6);
      g.stroke();
      const win = (x, y) => {
        g.fillStyle = "#2b3138"; g.fillRect(x, y, 40, 46);
        g.fillStyle = "#9db8c6"; g.fillRect(x + 4, y + 4, 32, 38);
        g.fillStyle = shutter || "#3f6b4a"; g.fillRect(x - 9, y, 8, 46); g.fillRect(x + 41, y, 8, 46);
      };
      win(44, 150); win(176, 150);
    });
  },
  stone() {
    return this._c(256, 256, (g, w, h) => {
      g.fillStyle = "#b7aa90"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(120,105,80,0.25)"; g.fillRect(Math.random() * w, Math.random() * h, 4, 3); }
      g.strokeStyle = "rgba(80,70,52,0.5)"; g.lineWidth = 2;
      for (let y = 0; y < h; y += 26) for (let x = 0; x < w; x += 40) g.strokeRect(x + (Math.floor(y / 26) % 2) * 20 - 40, y, 40, 26);
    });
  },
  roof(color) {
    return this._c(128, 128, (g, w, h) => {
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 2;
      for (let y = 8; y < h; y += 12) for (let x = 0; x < w; x += 18) { g.beginPath(); g.arc(x + (Math.floor(y / 12) % 2) * 9, y, 9, 0, Math.PI); g.stroke(); }
    });
  },
  pavement() {
    return this._c(256, 256, (g, w, h) => {
      g.fillStyle = "#8f8570"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 200; i++) { g.fillStyle = "rgba(120,110,92,0.4)"; g.fillRect(Math.random() * w, Math.random() * h, 5, 4); }
      g.strokeStyle = "rgba(60,55,45,0.55)"; g.lineWidth = 2;
      for (let y = 0; y < h; y += 24) for (let x = 0; x < w; x += 24) g.strokeRect(x, y, 24, 24);
    });
  },
};

const VILLAGE = {
  build(scene) {
    const D = { spawn: new THREE.Vector3(0, 0, 40), colliders: [], viewpoints: [], fragments: [], climbs: [], water: [], decor: [] };
    const std = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0, ...o });
    const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };

    // --- Sol herbe ---
    const grass = rep(Tex.grass(), 80, 80);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), std(grass));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    // --- Champs ---
    [[-120, -40, 70, 60, "mais"], [110, -60, 80, 70, "ble"], [-140, 60, 70, 80, "prairie"],
     [130, 70, 80, 70, "tournesol"], [-90, 130, 90, 60, "mais"], [70, 150, 90, 70, "ble"],
     [150, -140, 90, 80, "prairie"]].forEach(([x, z, w, d, c]) => {
      const ft = rep(Tex.field(c), w / 6, d / 6);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std(ft));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); m.receiveShadow = true; scene.add(m);
    });

    // --- Routes ---
    const roadTex = Tex.road();
    const road = (x, z, w, d, rot = 0) => {
      const t = rep(roadTex.clone(), w / 8, d / 8); t.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std(t));
      m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.03, z); m.receiveShadow = true; scene.add(m);
    };
    road(0, 40, 12, 130);        // axe de la place (sud)
    road(38, -110, 12, 120);     // vers le lac (nord)
    road(-60, 0, 120, 10);       // vers la basse-ville / motte (ouest)
    road(60, 10, 90, 10);        // est

    // === Helpers ===
    const wallTex = Tex.bearnWall(), stoneTex = Tex.stone();
    const roofMesh = (x, y, z, w, d, h, color, rotY = 0) => {
      const rt = rep(Tex.roof(color), w / 3, d / 3);
      const hw = w / 2, hd = d / 2;
      const v = [-hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd, -hw, h, 0, hw, h, 0];
      const faces = [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [1, 2, 5], [3, 0, 4]];
      const pos = []; faces.forEach(f => f.forEach(i => pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2])));
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, std(rt, { roughness: 0.85 }));
      m.position.set(x, y, z); m.rotation.y = rotY; m.castShadow = true; m.receiveShadow = true; scene.add(m);
    };
    const building = (x, z, w, d, wh, rh, roofColor, tex, shutter) => {
      const t = rep((tex || Tex.bearnWall(shutter)).clone(), Math.max(1, w / 6), 1); t.needsUpdate = true;
      const walls = new THREE.Mesh(new THREE.BoxGeometry(w, wh, d), std(t));
      walls.position.set(x, wh / 2, z); walls.castShadow = walls.receiveShadow = true; scene.add(walls);
      roofMesh(x, wh, z, w + 1.4, d + 1.4, rh, roofColor);
      D.colliders.push({ x, z, hw: w / 2 + 0.4, hd: d / 2 + 0.4 });
      return walls;
    };

    // ============ PLACE DE LA RÉPUBLIQUE (triangle allongé) ============
    // Trapèze : large au sud, se resserrant vers l'église au nord.
    const S = { xl: -22, xr: 22, z: 58 };   // sud (large)
    const N = { xl: -7, xr: 7, z: -58 };    // nord (étroit)
    const shape = new THREE.Shape();
    shape.moveTo(S.xl, S.z); shape.lineTo(S.xr, S.z); shape.lineTo(N.xr, N.z); shape.lineTo(N.xl, N.z); shape.closePath();
    const pavGeo = new THREE.ShapeGeometry(shape);
    const pav = rep(Tex.pavement(), 8, 20);
    const place = new THREE.Mesh(pavGeo, std(pav));
    place.rotation.x = -Math.PI / 2; place.position.y = 0.05; place.receiveShadow = true; scene.add(place);

    // Galeries couvertes (couverts) le long des 2 côtés obliques
    const gallery = (ax, az, bx, bz) => {
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      const n = Math.floor(len / 5), ux = dx / len, uz = dz / len;
      const ang = Math.atan2(dx, dz);
      for (let i = 0; i <= n; i++) {
        const px = ax + ux * i * 5, pz = az + uz * i * 5;
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.6, 0.9), std(stoneTex));
        pil.position.set(px, 2.3, pz); pil.castShadow = true; scene.add(pil);
      }
      // bandeau + toit incliné de la galerie
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, len), std(stoneTex));
      beam.position.set((ax + bx) / 2, 4.8, (az + bz) / 2); beam.rotation.y = ang; beam.castShadow = true; scene.add(beam);
      const gr = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, len), std(rep(Tex.roof("#8a3a24"), 1, len / 3)));
      gr.position.set((ax + bx) / 2 + Math.cos(ang) * 1.4, 5.4, (az + bz) / 2 - Math.sin(ang) * 1.4);
      gr.rotation.y = ang; gr.rotation.z = -0.18; gr.castShadow = true; scene.add(gr);
    };
    gallery(S.xl - 1, S.z, N.xl - 1, N.z);
    gallery(S.xr + 1, S.z, N.xr + 1, N.z);

    // Maisons alignées derrière les couverts (façades de la bastide)
    const roofCols = ["#8a3a24", "#a04d24", "#7d3120", "#94411f", "#6f2f1e"];
    let hi = 0;
    for (let i = 0; i < 7; i++) {
      const z = 46 - i * 15;
      const t = i / 7;
      const xoff = 26 - t * 12;
      building(-xoff - 4, z, 11, 9, 7, 4, roofCols[hi++ % 5], null, ["#3f6b4a", "#7d2a1e", "#2f4a6b"][i % 3]);
      building(xoff + 4, z, 11, 9, 7, 4, roofCols[hi++ % 5], null, ["#7d2a1e", "#3f6b4a", "#6b4a2f"][i % 3]);
    }

    // Halle centrale (marché au grain / au sel)
    const halleZ = 4;
    for (let i = -2; i <= 2; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6, 0.9), std(stoneTex));
      p.position.set(i * 5, 3, halleZ); p.castShadow = true; scene.add(p);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6, 0.9), std(stoneTex));
      p2.position.set(i * 5, 3, halleZ + 8); p2.castShadow = true; scene.add(p2);
    }
    roofMesh(0, 6, halleZ + 4, 26, 14, 3.5, "#7d3120");
    D.colliders.push({ x: 0, z: halleZ + 4, hw: 12, hd: 6 });

    // ============ ÉGLISE SAINT-PIERRE (pointe nord) ============
    const chX = 0, chZ = -74;
    building(chX, chZ, 15, 24, 10, 6, "#5a4a3a", stoneTex);
    // clocher accolé au flanc EST de la nef (base accessible)
    const twX = chX + 12, twZ = chZ + 2;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(8, 30, 8), std(stoneTex));
    tower.position.set(twX, 15, twZ); tower.castShadow = true; scene.add(tower);
    D.colliders.push({ x: twX, z: twZ, hw: 4.4, hd: 4.4 });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(6, 11, 4), std(Tex.stone(), { color: 0x4a5560, roughness: 0.7 }));
    spire.position.set(twX, 35.5, twZ); spire.rotation.y = Math.PI / 4; spire.castShadow = true; scene.add(spire);
    const cv = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.3), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    cv.position.set(twX, 42.5, twZ); scene.add(cv);
    const ch2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    ch2.position.set(twX, 42.7, twZ); scene.add(ch2);
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.6, 22), new THREE.MeshStandardMaterial({ color: 0xf6efdd, emissive: 0x332a12, emissiveIntensity: 0.4 }));
    clock.position.set(twX + 4.05, 22, twZ); clock.rotation.y = Math.PI / 2; scene.add(clock);
    // point d'escalade du clocher (côté est, accessible)
    D.climbs.push({ x: twX + 4.6, z: twZ, topY: 31, name: "Clocher Saint-Pierre" });

    // ============ MOTTE FÉODALE (le castet) — ouest ============
    const mottX = -78, mottZ = 6;
    const mound = new THREE.Mesh(new THREE.CylinderGeometry(14, 20, 10, 24), std(rep(Tex.grass(), 6, 6)));
    mound.position.set(mottX, 5, mottZ); mound.castShadow = mound.receiveShadow = true; scene.add(mound);
    const ruin = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.6, 12, 12, 1, true), std(stoneTex, { side: THREE.DoubleSide }));
    ruin.position.set(mottX, 16, mottZ); ruin.castShadow = true; scene.add(ruin);
    D.colliders.push({ x: mottX, z: mottZ, hw: 18, hd: 18 });

    // ============ LAVOIR en fer à cheval — sud-ouest ============
    const lavX = -44, lavZ = 46;
    const lavRoof = new THREE.Mesh(new THREE.TorusGeometry(5, 1.1, 8, 20, Math.PI * 1.4), std(Tex.roof("#7d3120")));
    lavRoof.rotation.x = Math.PI / 2; lavRoof.position.set(lavX, 3.2, lavZ); lavRoof.castShadow = true; scene.add(lavRoof);
    const lavWater = new THREE.Mesh(new THREE.CircleGeometry(4, 20), new THREE.MeshStandardMaterial({ color: 0x3a7ca5, transparent: true, opacity: 0.85, roughness: 0.15 }));
    lavWater.rotation.x = -Math.PI / 2; lavWater.position.set(lavX, 0.15, lavZ); scene.add(lavWater);

    // ============ TOUR PEICH ============
    const peX = -20, peZ = -18;
    const peich = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 6), std(stoneTex));
    peich.position.set(peX, 9, peZ); peich.castShadow = true; scene.add(peich);
    roofMesh(peX, 18, peZ, 7, 7, 4, "#5a4a3a");
    D.colliders.push({ x: peX, z: peZ, hw: 3.4, hd: 3.4 });
    D.climbs.push({ x: peX, z: peZ + 3.2, topY: 18, name: "Tour Peich" });

    // ============ MAISON DU JAMBON DE BAYONNE (musée) ============
    const jamX = 34, jamZ = 34;
    building(jamX, jamZ, 16, 12, 7, 3.5, "#7d3120", stoneTex);
    for (let i = -2; i <= 2; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 7, 12), std(stoneTex)); c.position.set(jamX + i * 3.4, 3.5, jamZ - 6.4); c.castShadow = true; scene.add(c); }

    // ============ MAIRIE (drapeau) ============
    const maX = -34, maZ = 30;
    building(maX, maZ, 14, 10, 8.5, 4, "#5a4a3a", stoneTex);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 8), new THREE.MeshStandardMaterial({ color: 0x555 }));
    pole.position.set(maX, 13.5, maZ - 4); scene.add(pole);
    [[0x0055a4, -1], [0xffffff, 0], [0xef4135, 1]].forEach(([c, o]) => {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.8), new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide }));
      f.position.set(maX + 0.5 + o, 15.4, maZ - 4); scene.add(f);
    });

    // ============ LAC D'ARZACQ + BASE DE LOISIRS (nord) ============
    const lkX = 40, lkZ = -140, lkR = 34;
    const lake = new THREE.Mesh(new THREE.CircleGeometry(lkR, 48), new THREE.MeshStandardMaterial({ color: 0x2f6d8c, transparent: true, opacity: 0.92, roughness: 0.1, metalness: 0.35 }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(lkX, 0.06, lkZ); scene.add(lake);
    D.water.push({ x: lkX, z: lkZ, r: lkR, mesh: lake });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.95 });
    const bX = lkX - 30, bZ = lkZ + 4;
    [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].forEach(([dx, dz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.8, 18, 0.8), woodMat); l.position.set(bX + dx, 9, bZ + dz); l.castShadow = true; scene.add(l); });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), woodMat); deck.position.set(bX, 18, bZ); deck.castShadow = true; scene.add(deck);
    D.colliders.push({ x: bX, z: bZ, hw: 3.5, hd: 3.5 });
    D.climbs.push({ x: bX, z: bZ + 3, topY: 18, name: "Belvédère du Lac" });

    // ============ ARBRES ============
    const trunk = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 1 });
    const leaf1 = new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 1 });
    const leaf2 = new THREE.MeshStandardMaterial({ color: 0x4c7d38, roughness: 1 });
    [[-14, 20], [16, 24], [-50, -6], [46, -4], [-16, 66], [58, 60], [-64, 40], [70, -30],
     [-30, -40], [26, 70], [90, 40], [-96, -20], [10, -100], [64, -120], [-40, 90]].forEach(([x, z]) => {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 8), trunk); tr.position.set(x, 2.5, z); tr.castShadow = true; scene.add(tr);
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(3.4, 7, 9), leaf1); c1.position.set(x, 7.5, z); c1.castShadow = true; scene.add(c1);
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5, 9), leaf2); c2.position.set(x, 10.5, z); c2.castShadow = true; scene.add(c2);
      D.colliders.push({ x, z, hw: 1, hd: 1 });
    });

    // ============ MONTAGNES (Pyrénées) ============
    const mtn = new THREE.MeshStandardMaterial({ color: 0x445471, roughness: 1, fog: true });
    const snow = new THREE.MeshStandardMaterial({ color: 0xeaf0f7, roughness: 0.8, fog: true });
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2, r = 300 + Math.random() * 40, h = 55 + Math.random() * 70;
      const m = new THREE.Mesh(new THREE.ConeGeometry(34 + Math.random() * 22, h, 5), mtn);
      m.position.set(Math.cos(a) * r, h / 2 - 6, Math.sin(a) * r); scene.add(m);
      if (h > 90) { const s = new THREE.Mesh(new THREE.ConeGeometry(12, h * 0.28, 5), snow); s.position.set(m.position.x, h - h * 0.14 - 6, m.position.z); scene.add(s); }
    }

    // ============ POINTS DE VUE (synchronisation) ============
    const addVP = (id, name, x, z, y, fact) => {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 70, 18, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.set(x, 35, z); scene.add(beam);
      D.viewpoints.push({ id, name, pos: new THREE.Vector3(x, y, z), fact, synced: false, beam });
    };
    addVP("eglise", "Église Saint-Pierre & son clocher", chX, chZ + 16, 16, "La bastide d'Arzacq rayonne autour de son église Saint-Pierre. Du haut du clocher, tout le Béarn se dévoile.");
    addVP("place", "Place de la République", 0, 30, 6, "La grande place triangulaire à couverts : cœur de la bastide, marché depuis le Moyen Âge.");
    addVP("motte", "La Motte féodale (le Castet)", mottX + 20, mottZ, 12, "Sur cette motte se dressait le château du XIe siècle, à l'origine du village.");
    addVP("mairie", "La Mairie", maX, maZ + 8, 12, "La mairie d'Arzacq-Arraziguet, au service des Arzacquois.");
    addVP("belvedere", "Belvédère du Lac", bX, bZ - 6, 16, "Le lac d'Arzacq et sa base de loisirs : baignade, pédalos et grands ciels du Sud-Ouest.");

    // ============ FRAGMENTS DE MÉMOIRE ============
    [[-28, 30], [28, 20], [0, -30], [-60, 12], [40, -50], [70, 60], [-40, 70], [55, 6], [-70, -34], [30, -110]]
      .forEach(([x, z], i) => {
        const g = new THREE.Group();
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.75),
          new THREE.MeshStandardMaterial({ color: 0x7fe0ff, emissive: 0x39c6ff, emissiveIntensity: 2.2, roughness: 0.25 }));
        const halo = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), new THREE.MeshBasicMaterial({ color: 0x9fe9ff, transparent: true, opacity: 0.22, depthWrite: false }));
        g.add(core, halo); g.position.set(x, 1.7, z); scene.add(g);
        D.fragments.push({ id: i, mesh: g, collected: false });
      });

    return D;
  },
};
