/* ============================================================
   LES MÉMOIRES D'ARZACQ — moteur principal (v2)
   Cinématique d'intro + atterrissage, PNJ & dialogues, cheval,
   escalade, points de vue, fragments, bloom, contrôles tactiles.
   ============================================================ */
(function () {
  const canvas = document.getElementById("game");

  /* ---------- Renderer + Bloom ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(CONFIG.FOG_COLOR, CONFIG.FOG_DENSITY);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1200);

  let composer = null, bloom = null;
  if (THREE.EffectComposer && THREE.UnrealBloomPass) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.55, 0.9);
    composer.addPass(bloom);
    // Étalonnage cinématique : vignette + chaleur + saturation
    if (THREE.ShaderPass) {
      const GradeShader = {
        uniforms: { tDiffuse: { value: null }, offset: { value: 1.05 }, darkness: { value: 1.15 }, warm: { value: 0.05 }, sat: { value: 1.12 } },
        vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: [
          "uniform sampler2D tDiffuse; uniform float offset; uniform float darkness; uniform float warm; uniform float sat; varying vec2 vUv;",
          "void main(){",
          "  vec4 c = texture2D(tDiffuse, vUv);",
          "  vec2 uv = (vUv - 0.5) * offset;",
          "  float v = clamp(1.0 - dot(uv, uv) * darkness, 0.0, 1.0);",
          "  vec3 col = c.rgb * mix(1.0, v, 0.85);",
          "  col.r += warm; col.b -= warm * 0.6;",
          "  float l = dot(col, vec3(0.299, 0.587, 0.114));",
          "  col = mix(vec3(l), col, sat);",
          "  gl_FragColor = vec4(col, c.a);",
          "}"
        ].join("\n"),
      };
      composer.addPass(new THREE.ShaderPass(GradeShader));
    }
  }

  /* ---------- Ciel ---------- */
  const skyC = document.createElement("canvas"); skyC.width = 8; skyC.height = 256;
  const sg = skyC.getContext("2d");
  const grad = sg.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#243a63"); grad.addColorStop(0.5, "#8f6a72"); grad.addColorStop(0.8, "#e8a95a"); grad.addColorStop(1, "#f8cc74");
  sg.fillStyle = grad; sg.fillRect(0, 0, 8, 256);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(skyC), side: THREE.BackSide, fog: false, depthWrite: false }));
  scene.add(sky);
  // soleil (disque lumineux — bloom)
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(24, 32), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false }));
  sunDisc.position.set(-260, 120, -300); sunDisc.lookAt(0, 0, 0); scene.add(sunDisc);

  /* ---------- Lumières ---------- */
  scene.add(new THREE.HemisphereLight(0x9fb6e0, 0x4a3a26, 0.4));
  const sun = new THREE.DirectionalLight(0xffca7a, 3.0);
  sun.position.set(-90, 70, -60); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 1, far: 400 });
  sun.shadow.bias = -0.0006; scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffe0b0, 0.14));

  /* ---------- Monde, joueur, PNJ ---------- */
  const world = VILLAGE.build(scene);
  const player = Player.build(scene);
  const npcs = NPC.buildAll(scene);
  const horse = NPC.horse;
  if (window.FX) FX.build(scene, world);
  sun.target = player.group;

  player.group.position.set(world.spawn.x, 0, world.spawn.z);
  let facing = Math.PI;

  /* ---------- Parachute (atterrissage) ---------- */
  let parachute = null;
  function makeParachute() {
    const g = new THREE.Group();
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.8, side: THREE.DoubleSide }));
    canopy.position.y = 5; g.add(canopy);
    const seg = new THREE.MeshStandardMaterial({ color: 0xf1f1f1, roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(4.02, 4, 6, i * Math.PI / 2, Math.PI / 4, 0, Math.PI / 2), seg); p.position.y = 5; g.add(p); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const line = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5, 4), new THREE.MeshBasicMaterial({ color: 0x333 })); line.position.set(Math.cos(a) * 2.6, 2.6, Math.sin(a) * 2.6); line.rotation.z = Math.cos(a) * 0.4; line.rotation.x = -Math.sin(a) * 0.4; g.add(line); }
    scene.add(g); return g;
  }

  /* ---------- État ---------- */
  let state = "intro";           // intro | landing | play | sync | climb | dialogue
  let mounted = false;
  let yaw = Math.PI, pitch = 0.32;
  let syncedCount = 0, fragCount = 0, won = false;
  const TOTAL_VP = world.viewpoints.length, TOTAL_FR = world.fragments.length;
  let nearVP = null, nearNPC = null, nearHorse = false, nearClimb = null;
  let landT = 0, stepAcc = 0;

  /* ---------- Entrées clavier + souris ---------- */
  const keys = {};
  let pointerLocked = false;
  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (state === "intro") return;
    if (e.code === "KeyE" || e.code === "Enter") doInteract();
    if (e.code === "KeyF") toggleMount();
    if (e.code === "KeyC") tryClimb();
    if (e.code === "Escape") closeDialogue();
    if (e.code === "Space") e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });
  canvas.addEventListener("click", () => { if (state !== "intro" && !isTouch()) canvas.requestPointerLock(); });
  document.addEventListener("pointerlockchange", () => { pointerLocked = document.pointerLockElement === canvas; });
  document.addEventListener("mousemove", (e) => {
    if (!pointerLocked) return;
    yaw -= e.movementX * CONFIG.MOUSE_SENS;
    pitch = Math.max(CONFIG.CAM_MIN_PITCH, Math.min(CONFIG.CAM_MAX_PITCH, pitch - e.movementY * CONFIG.MOUSE_SENS));
  });

  /* ---------- Contrôles tactiles ---------- */
  const touch = { mx: 0, mz: 0, stickId: null };
  function isTouch() { return matchMedia("(pointer: coarse)").matches; }
  const stick = document.getElementById("stick");
  const stickDot = document.querySelector(".stick-dot");
  if (stick) {
    const rectOf = () => stick.getBoundingClientRect();
    const setFrom = (cx, cy) => {
      const r = rectOf(); const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      const max = r.width / 2; const len = Math.hypot(dx, dy) || 1; const cl = Math.min(len, max);
      const ux = dx / len, uy = dy / len; touch.mx = ux * (cl / max); touch.mz = uy * (cl / max);
      if (stickDot) stickDot.style.transform = `translate(${ux * cl}px, ${uy * cl}px)`;
    };
    stick.addEventListener("touchstart", (e) => { touch.stickId = e.changedTouches[0].identifier; setFrom(e.changedTouches[0].clientX, e.changedTouches[0].clientY); e.preventDefault(); }, { passive: false });
    stick.addEventListener("touchmove", (e) => { for (const tt of e.changedTouches) if (tt.identifier === touch.stickId) setFrom(tt.clientX, tt.clientY); e.preventDefault(); }, { passive: false });
    const end = (e) => { for (const tt of e.changedTouches) if (tt.identifier === touch.stickId) { touch.stickId = null; touch.mx = touch.mz = 0; if (stickDot) stickDot.style.transform = ""; } };
    stick.addEventListener("touchend", end); stick.addEventListener("touchcancel", end);
  }
  // zone de caméra (moitié droite de l'écran)
  const lookZone = document.getElementById("lookzone");
  if (lookZone) {
    let lid = null, lx = 0, ly = 0;
    lookZone.addEventListener("touchstart", (e) => { const tt = e.changedTouches[0]; lid = tt.identifier; lx = tt.clientX; ly = tt.clientY; }, { passive: true });
    lookZone.addEventListener("touchmove", (e) => { for (const tt of e.changedTouches) if (tt.identifier === lid) { yaw -= (tt.clientX - lx) * CONFIG.TOUCH_LOOK_SENS; pitch = Math.max(CONFIG.CAM_MIN_PITCH, Math.min(CONFIG.CAM_MAX_PITCH, pitch - (tt.clientY - ly) * CONFIG.TOUCH_LOOK_SENS)); lx = tt.clientX; ly = tt.clientY; } }, { passive: true });
    lookZone.addEventListener("touchend", (e) => { for (const tt of e.changedTouches) if (tt.identifier === lid) lid = null; });
  }
  // boutons d'action tactiles
  const bind = (id, fn) => { const el = document.getElementById(id); if (!el) return; el.addEventListener("touchstart", (e) => { e.preventDefault(); fn(true); }, { passive: false }); el.addEventListener("touchend", (e) => { e.preventDefault(); fn(false); }); el.addEventListener("mousedown", () => fn(true)); el.addEventListener("mouseup", () => fn(false)); };
  bind("btnJump", (down) => { if (down) keys.Space = true; else keys.Space = false; });
  bind("btnRun", (down) => { keys.ShiftLeft = down; });
  bind("btnAction", (down) => { if (down) doInteract(); });
  bind("btnMount", (down) => { if (down) toggleMount(); });
  bind("btnClimb", (down) => { if (down) tryClimb(); });

  /* ---------- HUD ---------- */
  const hud = { vp: document.getElementById("hud-vp"), fr: document.getElementById("hud-fr"), obj: document.getElementById("hud-obj") };
  const prompt = document.getElementById("prompt");
  const cineUI = document.getElementById("cine"), cineName = document.getElementById("cine-name"), cineFact = document.getElementById("cine-fact");
  const markersBox = document.getElementById("markers");
  const dlg = document.getElementById("dialogue"), dlgName = document.getElementById("dlg-name"), dlgText = document.getElementById("dlg-text");
  world.viewpoints.forEach((vp) => { const el = document.createElement("div"); el.className = "marker"; el.innerHTML = `<span class="m-ico">◈</span><span class="m-dist"></span>`; markersBox.appendChild(el); vp.marker = el; });
  function updateHUD() { hud.vp.textContent = `${syncedCount}/${TOTAL_VP}`; hud.fr.textContent = `${fragCount}/${TOTAL_FR}`; }
  updateHUD();

  let toastTimer = null; const toastEl = document.getElementById("toast");
  function toast(m) { toastEl.textContent = m; toastEl.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400); }

  /* ---------- Dialogues ---------- */
  let dlgNpc = null, dlgLine = 0;
  function talk(npc) {
    dlgNpc = npc; dlgLine = 0; state = "dialogue";
    dlgName.textContent = npc.name; dlgText.textContent = npc.lines[0];
    if (window.AUDIO) AUDIO.talk();
    dlg.classList.add("show");
  }
  function advanceDialogue() {
    dlgLine++;
    if (dlgLine >= dlgNpc.lines.length) { closeDialogue(); return; }
    dlgText.textContent = dlgNpc.lines[dlgLine];
    if (window.AUDIO) AUDIO.talk();
  }
  function closeDialogue() { if (state !== "dialogue") return; dlg.classList.remove("show"); dlgNpc = null; state = mounted ? "play" : "play"; }

  /* ---------- Interaction contextuelle ---------- */
  function doInteract() {
    if (state === "dialogue") { advanceDialogue(); return; }
    if (state !== "play") return;
    if (nearNPC) { talk(nearNPC); return; }
    if (nearVP && !nearVP.synced) { startSync(nearVP); return; }
  }

  /* ---------- Monter / descendre du cheval ---------- */
  function toggleMount() {
    if (state !== "play") return;
    if (mounted) {
      mounted = false;
      const hp = horse.position;
      player.group.position.set(hp.x - Math.sin(facing) * 2.2, 0, hp.z - Math.cos(facing) * 2.2);
      toast("Tu descends de Caramel");
    } else if (nearHorse) {
      mounted = true; if (window.AUDIO) AUDIO.mount(); toast("En selle sur Caramel ! (MONTER pour descendre)");
    }
  }

  /* ---------- Escalade ---------- */
  let climbTarget = null, climbT = 0, climbStart = 0;
  function tryClimb() {
    if (state !== "play" || mounted || !nearClimb) return;
    climbTarget = nearClimb; climbT = 0; climbStart = player.group.position.y; state = "climb";
    player.group.position.x = climbTarget.x; player.group.position.z = climbTarget.z;
    facing = Math.atan2(climbTarget.x - player.group.position.x || 0, 1); // face au mur
    toast("Escalade : " + climbTarget.name);
  }

  /* ---------- Synchronisation (cinématique) ---------- */
  const cine = { active: false, t: 0, dur: 5.4, vp: null };
  function startSync(vp) { if (cine.active || vp.synced) return; cine.active = true; cine.t = 0; cine.vp = vp; state = "sync"; if (pointerLocked) document.exitPointerLock(); prompt.classList.remove("show"); }
  function finishSync(vp) { vp.synced = true; vp.beam.material.color.setHex(0x8affc0); syncedCount++; updateHUD(); if (window.AUDIO) AUDIO.sync(); checkWin(); }
  function checkWin() {
    if (syncedCount === TOTAL_VP && fragCount === TOTAL_FR && !won) {
      won = true;
      if (window.AUDIO) AUDIO.win();
      document.getElementById("win").classList.add("show");
      document.getElementById("win-score").textContent = `${TOTAL_VP} points de vue · ${TOTAL_FR} fragments`;
    }
  }
  document.getElementById("win-btn").onclick = () => location.reload();

  /* ---------- Collisions ---------- */
  const _pos = new THREE.Vector3();
  function collide(pos, R) {
    for (let it = 0; it < 2; it++) for (const c of world.colliders) {
      const minx = c.x - c.hw - R, maxx = c.x + c.hw + R, minz = c.z - c.hd - R, maxz = c.z + c.hd + R;
      if (pos.x > minx && pos.x < maxx && pos.z > minz && pos.z < maxz) {
        const dl = pos.x - minx, dr = maxx - pos.x, dt = pos.z - minz, db = maxz - pos.z, m = Math.min(dl, dr, dt, db);
        if (m === dl) pos.x = minx; else if (m === dr) pos.x = maxx; else if (m === dt) pos.z = minz; else pos.z = maxz;
      }
    }
    for (const w of world.water) { const dx = pos.x - w.x, dz = pos.z - w.z, d = Math.hypot(dx, dz), lr = w.r + R; if (d < lr) { pos.x = w.x + dx / d * lr; pos.z = w.z + dz / d * lr; } }
  }

  // La caméra est-elle bloquée à ce point (mur/bâtiment) ?
  function camBlocked(px, py, pz) {
    if (py < 0.4) return true;
    if (py > 13) return false;
    for (const c of world.colliders) {
      if (px > c.x - c.hw && px < c.x + c.hw && pz > c.z - c.hd && pz < c.z + c.hd) return true;
    }
    return false;
  }

  /* ---------- Boucle ---------- */
  const clock = new THREE.Clock();
  const _v = new THREE.Vector3();
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;

    // Pendant l'intro, le calque 2D couvre l'écran : on saute le rendu 3D
    // (coûteux) pour que la cinématique tourne à pleine vitesse.
    if (state === "intro") { updateIntro(t); requestAnimationFrame(frame); return; }

    if (state === "landing") updateLanding(dt);
    else if (state === "sync") updateSync(dt);
    else if (state === "climb") updateClimb(dt);
    else updatePlay(dt, t);

    // animations d'ambiance
    NPC.update(npcs, dt, t, player.group.position);
    if (window.FX) FX.update(dt, t);
    world.fragments.forEach((f) => { if (f.collected) return; f.mesh.rotation.y += dt * 1.8; f.mesh.position.y = 1.7 + Math.sin(t * 2 + f.id) * 0.28; });
    world.viewpoints.forEach((vp) => { vp.beam.material.opacity = (vp.synced ? 0.1 : 0.18) + Math.sin(t * 2 + vp.pos.x) * 0.05; });
    world.water.forEach((w) => { w.mesh.material.opacity = 0.9 + Math.sin(t * 1.5) * 0.03; });

    updateMarkers();
    composer ? composer.render() : renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  /* ---------- Intro : orbite aérienne ---------- */
  function updateIntro(t) {
    const R = 150, cx = 0, cz = -10;
    camera.position.set(cx + Math.cos(t * 0.15) * R, 90, cz + Math.sin(t * 0.15) * R);
    camera.lookAt(0, 8, -10);
    // William caché en l'air (prêt pour l'atterrissage)
    player.group.visible = false;
  }

  /* ---------- Démarrage de l'atterrissage ---------- */
  function startLanding() {
    if (state !== "intro") return;
    state = "landing"; landT = 0;
    player.group.visible = true;
    player.group.position.set(world.spawn.x, 70, world.spawn.z);
    facing = Math.PI; player.group.rotation.y = facing;
    parachute = makeParachute();
  }

  function updateLanding(dt) {
    landT += dt;
    const p = player.group.position;
    p.y = Math.max(0, 70 - landT * 26);
    p.x = world.spawn.x + Math.sin(landT * 1.5) * 1.2; // balancement
    if (parachute) { parachute.position.set(p.x, p.y, p.z); parachute.rotation.z = Math.sin(landT * 2) * 0.12; }
    Player.animate(player, "idle", 0, dt);
    // caméra qui suit la descente
    camera.position.set(p.x + 10, p.y + 6, p.z + 14);
    camera.lookAt(p.x, p.y + 2, p.z);
    if (p.y <= 0.01) {
      p.y = 0;
      if (parachute) { scene.remove(parachute); parachute = null; }
      state = "play";
      toast("Bienvenue à Arzacq-Arraziguet, William !");
    }
  }

  /* ---------- Jeu ---------- */
  function updatePlay(dt, t) {
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    let mx = 0, mz = 0;
    if (keys.KeyW || keys.KeyZ || keys.ArrowUp) { mx += fwd.x; mz += fwd.z; }
    if (keys.KeyS || keys.ArrowDown) { mx -= fwd.x; mz -= fwd.z; }
    if (keys.KeyA || keys.KeyQ || keys.ArrowLeft) { mx -= right.x; mz -= right.z; }
    if (keys.KeyD || keys.ArrowRight) { mx += right.x; mz += right.z; }
    if (touch.mx || touch.mz) { mx += right.x * touch.mx - fwd.x * touch.mz; mz += right.z * touch.mx - fwd.z * touch.mz; }

    const moving = mx * mx + mz * mz > 0.001;
    const running = keys.ShiftLeft || keys.ShiftRight;
    const speed = mounted ? (running ? CONFIG.HORSE_RUN : CONFIG.HORSE_WALK) : (running ? CONFIG.RUN_SPEED : CONFIG.WALK_SPEED);
    const target = mounted ? horse.position : player.group.position;

    // bruits de pas / sabots
    if (moving && (mounted || player.onGround)) {
      const interval = mounted ? (running ? 0.24 : 0.4) : (running ? 0.28 : 0.38);
      stepAcc += dt;
      if (stepAcc >= interval) { stepAcc = 0; if (window.AUDIO) (mounted ? AUDIO.hoof() : AUDIO.step(running)); }
    } else stepAcc = 0.99;

    if (moving) {
      const len = Math.hypot(mx, mz); mx /= len; mz /= len;
      target.x += mx * speed * dt; target.z += mz * speed * dt;
      collide(target, mounted ? 1.8 : 1.0);
      const tf = Math.atan2(mx, mz); let diff = tf - facing;
      while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
      facing += diff * CONFIG.TURN_LERP;
    }

    if (mounted) {
      horse.rotation.y = facing;
      player.group.position.set(horse.position.x, horse.userData.mountY - 0.6, horse.position.z);
      player.group.rotation.y = facing;
      Player.animate(player, "ride", speed, dt);
    } else {
      player.group.rotation.y = facing;
      // gravité / saut
      if (keys.Space && player.onGround) { player.vel.y = CONFIG.JUMP; player.onGround = false; if (window.AUDIO) AUDIO.jump(); }
      player.vel.y += CONFIG.GRAVITY * dt;
      player.group.position.y += player.vel.y * dt;
      if (player.group.position.y <= 0) { const wasAir = !player.onGround; player.group.position.y = 0; if (wasAir && player.vel.y < -3 && window.AUDIO) AUDIO.land(); player.vel.y = 0; player.onGround = true; }
      Player.animate(player, moving ? "move" : "idle", speed, dt);
    }

    // caméra 3e personne (avec collision : ne traverse plus les murs)
    const cp = target;
    const dist = mounted ? CONFIG.CAM_DIST + 4 : CONFIG.CAM_DIST;
    const baseY = (mounted ? 3.2 : cp.y) + CONFIG.CAM_HEIGHT;
    let offX = -Math.sin(yaw) * dist * Math.cos(pitch);
    let offZ = -Math.cos(yaw) * dist * Math.cos(pitch);
    let offY = dist * Math.sin(pitch);
    const L = Math.hypot(offX, offY, offZ), ux = offX / L, uy = offY / L, uz = offZ / L;
    let allowed = L;
    for (let d = 1.5; d < L; d += 0.6) {
      if (camBlocked(cp.x + ux * d, baseY + uy * d, cp.z + uz * d)) { allowed = Math.max(2.4, d - 0.6); break; }
    }
    camera.position.set(cp.x + ux * allowed, Math.max(1.0, baseY + uy * allowed), cp.z + uz * allowed);
    camera.lookAt(cp.x, (mounted ? 3.2 : cp.y + 2), cp.z);

    // proximités
    const pp = player.group.position;
    nearVP = null; let best = 1e9;
    for (const vp of world.viewpoints) { if (vp.synced) continue; const d = Math.hypot(pp.x - vp.pos.x, pp.z - vp.pos.z); if (d < CONFIG.SYNC_RANGE && d < best) { best = d; nearVP = vp; } }
    nearNPC = null; best = 1e9;
    for (const n of npcs) { const d = Math.hypot(pp.x - n.group.position.x, pp.z - n.group.position.z); if (d < CONFIG.TALK_RANGE && d < best && !(n.id === "caramel" && mounted)) { best = d; nearNPC = n; } }
    nearHorse = !mounted && Math.hypot(pp.x - horse.position.x, pp.z - horse.position.z) < CONFIG.MOUNT_RANGE;
    nearClimb = null; best = 1e9;
    if (!mounted) for (const c of world.climbs) { const d = Math.hypot(pp.x - c.x, pp.z - c.z); if (d < CONFIG.CLIMB_RANGE && d < best) { best = d; nearClimb = c; } }

    // fragments
    for (const f of world.fragments) { if (f.collected) continue; if (Math.hypot(pp.x - f.mesh.position.x, pp.z - f.mesh.position.z) < CONFIG.FRAGMENT_RANGE) { f.collected = true; f.mesh.visible = false; fragCount++; if (window.AUDIO) AUDIO.collect(); toast(`Fragment de mémoire  ${fragCount}/${TOTAL_FR}`); updateHUD(); checkWin(); } }

    // invite + objectif
    let pm = null;
    if (nearNPC) pm = { key: "E", txt: "Parler à " + nearNPC.name };
    else if (nearVP) pm = { key: "E", txt: "Synchroniser : " + nearVP.name };
    if (nearHorse && !mounted) pm = pm || { key: "F", txt: "Monter sur Caramel" };
    if (nearClimb) pm = pm || { key: "C", txt: "Grimper : " + nearClimb.name };
    if (pm) { prompt.classList.add("show"); prompt.querySelector(".key").textContent = pm.key; prompt.querySelector(".p-txt").textContent = pm.txt; }
    else prompt.classList.remove("show");

    if (nearVP) hud.obj.textContent = "Synchroniser : " + nearVP.name;
    else if (syncedCount < TOTAL_VP) hud.obj.textContent = "Rejoins un point de vue (◈) — grimpe, monte à cheval, explore !";
    else if (fragCount < TOTAL_FR) hud.obj.textContent = "Récupère les fragments de mémoire restants";
    else hud.obj.textContent = "Mémoire d'Arzacq complète ✦";
  }

  /* ---------- Escalade ---------- */
  function updateClimb(dt) {
    climbT += dt;
    const p = player.group.position;
    p.y = Math.min(climbTarget.topY, climbStart + climbT * CONFIG.CLIMB_SPEED);
    player.group.rotation.y = facing;
    Player.animate(player, "climb", 0, dt);
    camera.position.set(p.x - Math.sin(yaw) * 9, p.y + 3, p.z - Math.cos(yaw) * 9);
    camera.lookAt(p.x, p.y + 1, p.z);
    if (p.y >= climbTarget.topY) {
      // se hisser sur le sommet
      p.y = climbTarget.topY; p.z += 0.6; player.onGround = false; player.vel.y = 0;
      state = "play"; toast("Au sommet ! Vue imprenable ✦");
    }
  }

  /* ---------- Synchronisation cinématique ---------- */
  function updateSync(dt) {
    cine.t += dt; const vp = cine.vp, k = cine.t / cine.dur;
    let f; if (k < 0.28) f = ease(k / 0.28); else if (k < 0.75) f = 1; else f = 1 - ease((k - 0.75) / 0.25);
    const pp = player.group.position;
    const gx = pp.x - Math.sin(yaw) * CONFIG.CAM_DIST, gz = pp.z - Math.cos(yaw) * CONFIG.CAM_DIST, gy = pp.y + CONFIG.CAM_HEIGHT;
    const orbit = cine.t * 0.45, vr = 40;
    const ax = vp.pos.x + Math.cos(orbit) * vr, az = vp.pos.z + Math.sin(orbit) * vr, ay = vp.pos.y + 30;
    camera.position.set(gx + (ax - gx) * f, gy + (ay - gy) * f, gz + (az - gz) * f);
    camera.lookAt(pp.x + (vp.pos.x - pp.x) * f, pp.y + 2 + (vp.pos.y - pp.y - 2) * f, pp.z + (vp.pos.z - pp.z) * f);
    if (k > 0.2 && k < 0.85) { cineUI.classList.add("show"); cineName.textContent = vp.name; cineFact.textContent = vp.fact; } else cineUI.classList.remove("show");
    if (!vp.synced && k > 0.35) finishSync(vp);
    if (cine.t >= cine.dur) { cine.active = false; cineUI.classList.remove("show"); state = "play"; }
  }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  /* ---------- Marqueurs ---------- */
  function updateMarkers() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    world.viewpoints.forEach((vp) => {
      const el = vp.marker;
      if (vp.synced || state === "intro") { el.style.display = "none"; return; }
      _v.set(vp.pos.x, vp.pos.y + 2, vp.pos.z).project(camera);
      const behind = _v.z > 1; let x = (_v.x * 0.5 + 0.5) * w, y = (-_v.y * 0.5 + 0.5) * h;
      if (behind) { x = w - x; y = h - 12; }
      x = Math.max(24, Math.min(w - 24, x)); y = Math.max(64, Math.min(h - 48, y));
      el.style.display = "flex"; el.style.left = x + "px"; el.style.top = y + "px";
      el.querySelector(".m-dist").textContent = Math.round(player.group.position.distanceTo(vp.pos)) + " m";
    });
  }

  /* ---------- Resize ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
    if (bloom) bloom.setSize(w, h);
  }
  window.addEventListener("resize", resize);

  /* ---------- API ---------- */
  window.GAME = { startLanding };
  window.START_GAME = function () { resize(); clock.start(); frame(); };

  // Hook de test (debug)
  window.__game = {
    tp: (x, z) => { dlg.classList.remove("show"); dlgNpc = null; mounted = false; state = "play"; player.group.visible = true; player.group.position.set(x, 0, z); },
    setYaw: (y, p) => { yaw = y; if (p !== undefined) pitch = p; },
    land: startLanding, interact: doInteract, mount: toggleMount, climb: tryClimb,
    state: () => ({ st: state, synced: syncedCount, frag: fragCount, mounted, nearNPC: nearNPC && nearNPC.name, nearVP: nearVP && nearVP.name, nearHorse, nearClimb: nearClimb && nearClimb.name }),
  };
})();
