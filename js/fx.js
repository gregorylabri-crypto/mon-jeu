/* ============================================================
   FX — vie & ambiance : oiseaux, poussière, lucioles, fumée,
   lanternes, herbe. Tout en géométrie/points (léger, hors-ligne).
   ============================================================ */
const FX = {
  build(scene, world) {
    const H = {};

    /* ---- Oiseaux qui tournoient ---- */
    H.birds = [];
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x2b2b30, side: THREE.DoubleSide, fog: true });
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Group();
      const wingGeo = new THREE.BufferGeometry();
      wingGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1.4, 0.2, -0.6, 1.4, 0.2, 0.6], 3));
      const wL = new THREE.Mesh(wingGeo, birdMat); const wR = new THREE.Mesh(wingGeo, birdMat); wR.scale.x = -1;
      b.add(wL, wR);
      b.userData = { r: 40 + Math.random() * 70, h: 45 + Math.random() * 30, cx: (Math.random() - 0.5) * 120, cz: -20 + (Math.random() - 0.5) * 120, sp: 0.15 + Math.random() * 0.12, ph: Math.random() * 7, wings: [wL, wR] };
      scene.add(b); H.birds.push(b);
    }

    /* ---- Poussière/pollen dans la lumière ---- */
    const dustN = 260, dpos = new Float32Array(dustN * 3);
    H.dustBase = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) {
      const x = (Math.random() - 0.5) * 190, y = Math.random() * 40, z = -20 + (Math.random() - 0.5) * 190;
      dpos[i * 3] = x; dpos[i * 3 + 1] = y; dpos[i * 3 + 2] = z;
      H.dustBase[i * 3] = x; H.dustBase[i * 3 + 1] = y; H.dustBase[i * 3 + 2] = z;
    }
    const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    H.dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffe9c0, size: 0.35, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    scene.add(H.dust);

    /* ---- Lucioles (près du lac & bas-fonds) ---- */
    const fN = 60, fpos = new Float32Array(fN * 3); H.fireBase = new Float32Array(fN * 3);
    for (let i = 0; i < fN; i++) {
      const near = Math.random() < 0.6;
      const cx = near ? 40 : (Math.random() - 0.5) * 140, cz = near ? -140 : -20 + (Math.random() - 0.5) * 140;
      const x = cx + (Math.random() - 0.5) * 40, y = 1 + Math.random() * 6, z = cz + (Math.random() - 0.5) * 40;
      fpos[i * 3] = x; fpos[i * 3 + 1] = y; fpos[i * 3 + 2] = z;
      H.fireBase[i * 3] = x; H.fireBase[i * 3 + 1] = y; H.fireBase[i * 3 + 2] = z;
    }
    const fGeo = new THREE.BufferGeometry(); fGeo.setAttribute("position", new THREE.BufferAttribute(fpos, 3));
    H.fire = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: 0xd8ff9a, size: 0.7, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(H.fire);

    /* ---- Fumée des cheminées ---- */
    const chimneys = [[-22, -14], [22, 20], [-34, 30], [34, 34]];
    const sN = chimneys.length * 14; const spos = new Float32Array(sN * 3); H.smokeInfo = [];
    for (let c = 0; c < chimneys.length; c++) for (let k = 0; k < 14; k++) {
      const i = c * 14 + k;
      spos[i * 3] = chimneys[c][0]; spos[i * 3 + 1] = 8 + k * 0.6; spos[i * 3 + 2] = chimneys[c][1];
      H.smokeInfo.push({ ox: chimneys[c][0], oz: chimneys[c][1], off: k / 14 });
    }
    const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute("position", new THREE.BufferAttribute(spos, 3));
    H.smoke = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xbfb6a8, size: 1.6, transparent: true, opacity: 0.28, depthWrite: false }));
    scene.add(H.smoke);

    /* ---- Lanternes chaudes (autour de la place) ---- */
    H.lanternPulse = [];
    const lanternPos = [[-18, 40], [18, 40], [-14, 10], [14, 10], [-10, -20], [10, -20]];
    lanternPos.forEach(([x, z], i) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 4, 6), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
      post.position.set(x, 2, z); post.castShadow = true; scene.add(post);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb347, emissiveIntensity: 2.4 }));
      glass.position.set(x, 4.2, z); scene.add(glass);
      H.lanternPulse.push(glass);
      if (i < 3) { const pl = new THREE.PointLight(0xffb060, 0.9, 22, 2); pl.position.set(x, 4.4, z); scene.add(pl); }
    });

    /* ---- Herbe (instanciée, sur les zones herbeuses) ---- */
    const bladeGeo = new THREE.ConeGeometry(0.12, 1.0, 4);
    bladeGeo.translate(0, 0.5, 0);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x5f8a3c, roughness: 1 });
    const N = 500; const grass = new THREE.InstancedMesh(bladeGeo, grassMat, N);
    const m = new THREE.Object3D(); let placed = 0;
    const onPlace = (x, z) => Math.abs(x) < 24 && z < 60 && z > -60;      // la place pavée
    const inWater = (x, z) => Math.hypot(x - 40, z + 140) < 36;
    let guard = 0;
    while (placed < N && guard++ < N * 6) {
      const x = (Math.random() - 0.5) * 240, z = (Math.random() - 0.5) * 240;
      if (onPlace(x, z) || inWater(x, z)) continue;
      m.position.set(x, 0, z); m.rotation.y = Math.random() * 7; const s = 0.6 + Math.random() * 0.9; m.scale.set(s, s, s);
      m.updateMatrix(); grass.setMatrixAt(placed++, m.matrix);
    }
    grass.count = placed; grass.castShadow = false; grass.receiveShadow = true; scene.add(grass);

    this.H = H;
    return H;
  },

  update(dt, t) {
    const H = this.H; if (!H) return;
    // oiseaux
    H.birds.forEach((b) => {
      const u = b.userData; const a = t * u.sp + u.ph;
      b.position.set(u.cx + Math.cos(a) * u.r, u.h + Math.sin(a * 1.7) * 3, u.cz + Math.sin(a) * u.r);
      b.rotation.y = -a + Math.PI / 2;
      const flap = Math.sin(t * 12 + u.ph) * 0.7;
      u.wings[0].rotation.z = flap; u.wings[1].rotation.z = -flap;
    });
    // poussière : dérive + remontée + recyclage
    const dp = H.dust.geometry.attributes.position.array, db = H.dustBase;
    for (let i = 0; i < dp.length; i += 3) {
      dp[i] = db[i] + Math.sin(t * 0.3 + i) * 2.5;
      dp[i + 1] += dt * 0.5; if (dp[i + 1] > 40) dp[i + 1] = 0;
      dp[i + 2] = db[i + 2] + Math.cos(t * 0.25 + i) * 2.5;
    }
    H.dust.geometry.attributes.position.needsUpdate = true;
    // lucioles : flottement + scintillement global
    const fp = H.fire.geometry.attributes.position.array, fb = H.fireBase;
    for (let i = 0; i < fp.length; i += 3) {
      fp[i] = fb[i] + Math.sin(t * 0.8 + i) * 1.4;
      fp[i + 1] = fb[i + 1] + Math.sin(t * 1.3 + i * 0.7) * 0.8;
      fp[i + 2] = fb[i + 2] + Math.cos(t * 0.9 + i) * 1.4;
    }
    H.fire.geometry.attributes.position.needsUpdate = true;
    H.fire.material.opacity = 0.55 + Math.sin(t * 3) * 0.35;
    // fumée : monte et se recycle
    const sp = H.smoke.geometry.attributes.position.array;
    H.smokeInfo.forEach((s, i) => {
      let y = sp[i * 3 + 1] + dt * 1.2;
      if (y > 22) y = 8;
      sp[i * 3 + 1] = y;
      sp[i * 3] = s.ox + Math.sin(t * 0.5 + s.off * 6) * (y - 8) * 0.15;
      sp[i * 3 + 2] = s.oz + Math.cos(t * 0.4 + s.off * 6) * (y - 8) * 0.15;
    });
    H.smoke.geometry.attributes.position.needsUpdate = true;
    // lanternes : léger scintillement
    H.lanternPulse.forEach((l, i) => { l.material.emissiveIntensity = 2.0 + Math.sin(t * 4 + i) * 0.5; });
  },
};

window.FX = FX;
