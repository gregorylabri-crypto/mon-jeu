/* ============================================================
   LES MÉMOIRES D'ARZACQ — moteur principal (Three.js)
   ============================================================ */
(function () {
  const canvas = document.getElementById("game");

  /* ---------- Renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  /* ---------- Scène, brouillard, ciel ---------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(CONFIG.FOG_COLOR, 0.0028);

  // Ciel dégradé (grande sphère intérieure)
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 8; skyCanvas.height = 256;
  const sg = skyCanvas.getContext("2d");
  const grad = sg.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#2a3c63");
  grad.addColorStop(0.55, "#8a6a7a");
  grad.addColorStop(0.8, "#e8a95a");
  grad.addColorStop(1, "#f6c86a");
  sg.fillStyle = grad; sg.fillRect(0, 0, 8, 256);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(360, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  scene.add(sky);

  /* ---------- Lumières (crépuscule doré) ---------- */
  scene.add(new THREE.HemisphereLight(0x9fb6e0, 0x4a3a26, 0.35));
  const sun = new THREE.DirectionalLight(0xffca7a, 2.9);
  sun.position.set(-90, 48, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffd9a8, 0.12));

  /* ---------- Caméra ---------- */
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 800);

  /* ---------- Monde + héros ---------- */
  const world = VILLAGE.build(scene);
  const player = Player.build(scene);
  player.group.position.copy(world.spawn);
  let facing = 0;              // orientation actuelle du perso
  sun.target = player.group;

  /* ---------- Entrées ---------- */
  const keys = {};
  let yaw = Math.PI, pitch = 0.35;
  let pointerLocked = false;

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE") trySync();
    if (e.code === "Space") e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });

  canvas.addEventListener("click", () => {
    if (!cine.active) canvas.requestPointerLock();
  });
  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === canvas;
    hint.style.display = pointerLocked ? "none" : "";
  });
  document.addEventListener("mousemove", (e) => {
    if (!pointerLocked) return;
    yaw -= e.movementX * CONFIG.MOUSE_SENS;
    pitch -= e.movementY * CONFIG.MOUSE_SENS;
    pitch = Math.max(CONFIG.CAM_MIN_PITCH, Math.min(CONFIG.CAM_MAX_PITCH, pitch));
  });

  // Contrôles tactiles (joystick simple) — pour mobile
  const touch = { active: false, dx: 0, dy: 0 };
  const stick = document.getElementById("stick");
  if (stick) {
    let ox = 0, oy = 0;
    stick.addEventListener("touchstart", (e) => {
      touch.active = true; ox = e.touches[0].clientX; oy = e.touches[0].clientY;
    }, { passive: true });
    stick.addEventListener("touchmove", (e) => {
      touch.dx = (e.touches[0].clientX - ox) / 40;
      touch.dy = (e.touches[0].clientY - oy) / 40;
    }, { passive: true });
    stick.addEventListener("touchend", () => { touch.active = false; touch.dx = touch.dy = 0; });
  }

  /* ---------- État de jeu ---------- */
  let syncedCount = 0, fragCount = 0;
  const TOTAL_VP = world.viewpoints.length;
  const TOTAL_FR = world.fragments.length;
  let nearVP = null;
  let won = false;

  /* ---------- HUD (éléments DOM) ---------- */
  const hud = {
    vp: document.getElementById("hud-vp"),
    fr: document.getElementById("hud-fr"),
    obj: document.getElementById("hud-obj"),
  };
  const prompt = document.getElementById("prompt");
  const hint = document.getElementById("hint");
  const cineUI = document.getElementById("cine");
  const cineName = document.getElementById("cine-name");
  const cineFact = document.getElementById("cine-fact");
  const markersBox = document.getElementById("markers");

  // Marqueurs d'objectifs (un div par point de vue)
  world.viewpoints.forEach((vp) => {
    const el = document.createElement("div");
    el.className = "marker";
    el.innerHTML = `<span class="m-ico">◈</span><span class="m-dist"></span>`;
    markersBox.appendChild(el);
    vp.marker = el;
  });

  function updateHUD() {
    hud.vp.textContent = `${syncedCount}/${TOTAL_VP}`;
    hud.fr.textContent = `${fragCount}/${TOTAL_FR}`;
  }
  updateHUD();

  /* ---------- Synchronisation (cinématique) ---------- */
  const cine = { active: false, t: 0, dur: 5.2, vp: null };

  function trySync() {
    if (cine.active || !nearVP || nearVP.synced) return;
    cine.active = true; cine.t = 0; cine.vp = nearVP;
    if (pointerLocked) document.exitPointerLock();
    prompt.classList.remove("show");
  }

  function finishSync(vp) {
    vp.synced = true;
    vp.beam.material.color.setHex(0x8affc0);
    vp.beam.material.opacity = 0.12;
    syncedCount++;
    updateHUD();
    checkWin();
  }

  function checkWin() {
    if (syncedCount === TOTAL_VP && fragCount === TOTAL_FR && !won) {
      won = true;
      document.getElementById("win").classList.add("show");
      document.getElementById("win-score").textContent =
        `${TOTAL_VP} points de vue · ${TOTAL_FR} fragments`;
    }
  }
  document.getElementById("win-btn").onclick = () => location.reload();

  /* ---------- Collisions (AABB dans le plan XZ) ---------- */
  const R = 1.0;
  function resolve(pos) {
    for (let it = 0; it < 2; it++) {
      for (const c of world.colliders) {
        const minx = c.x - c.hw - R, maxx = c.x + c.hw + R;
        const minz = c.z - c.hd - R, maxz = c.z + c.hd + R;
        if (pos.x > minx && pos.x < maxx && pos.z > minz && pos.z < maxz) {
          const dl = pos.x - minx, dr = maxx - pos.x;
          const dt = pos.z - minz, db = maxz - pos.z;
          const m = Math.min(dl, dr, dt, db);
          if (m === dl) pos.x = minx;
          else if (m === dr) pos.x = maxx;
          else if (m === dt) pos.z = minz;
          else pos.z = maxz;
        }
      }
    }
    // rester dans le lac interdit (repousser hors de l'eau)
    const lx = 105, lz = 55, lr = 30 + R;
    const ddx = pos.x - lx, ddz = pos.z - lz;
    const d = Math.hypot(ddx, ddz);
    if (d < lr) { pos.x = lx + (ddx / d) * lr; pos.z = lz + (ddz / d) * lr; }
  }

  /* ---------- Boucle ---------- */
  const clock = new THREE.Clock();
  const _v = new THREE.Vector3();

  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    if (cine.active) updateCine(dt);
    else updatePlay(dt);

    // fragments : rotation + halo
    world.fragments.forEach((f) => {
      if (f.collected) return;
      f.mesh.rotation.y += dt * 1.6;
      f.mesh.position.y = 1.6 + Math.sin(t * 2 + f.id) * 0.25;
    });
    // faisceaux lumineux qui ondulent
    world.viewpoints.forEach((vp) => {
      vp.beam.material.opacity = (vp.synced ? 0.1 : 0.18) + Math.sin(t * 2 + vp.pos.x) * 0.05;
    });

    updateMarkers();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function updatePlay(dt) {
    // direction voulue relative à la caméra
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    let mx = 0, mz = 0;
    if (keys.KeyW || keys.ArrowUp) { mx += fwd.x; mz += fwd.z; }
    if (keys.KeyS || keys.ArrowDown) { mx -= fwd.x; mz -= fwd.z; }
    if (keys.KeyA || keys.ArrowLeft) { mx -= right.x; mz -= right.z; }
    if (keys.KeyD || keys.ArrowRight) { mx += right.x; mz += right.z; }
    if (touch.active) { mx += fwd.x * -touch.dy + right.x * touch.dx; mz += fwd.z * -touch.dy + right.z * touch.dx; }

    const moving = mx * mx + mz * mz > 0.001;
    const running = keys.ShiftLeft || keys.ShiftRight;
    const speed = running ? CONFIG.RUN_SPEED : CONFIG.WALK_SPEED;

    const pos = player.group.position;
    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      pos.x += mx * speed * dt;
      pos.z += mz * speed * dt;
      resolve(pos);
      // orienter le perso vers son déplacement (lerp d'angle)
      const target = Math.atan2(mx, mz);
      let diff = target - facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      facing += diff * CONFIG.TURN_LERP;
      player.group.rotation.y = facing;
    }

    // saut / gravité
    if ((keys.Space) && player.onGround) { player.vel.y = CONFIG.JUMP; player.onGround = false; }
    player.vel.y += CONFIG.GRAVITY * dt;
    pos.y += player.vel.y * dt;
    if (pos.y <= 0) { pos.y = 0; player.vel.y = 0; player.onGround = true; }

    Player.animate(player, moving, speed, dt);

    // caméra 3e personne
    const cp = pitch;
    const camDist = CONFIG.CAM_DIST;
    const cx = pos.x - Math.sin(yaw) * camDist * Math.cos(cp);
    const cz = pos.z - Math.cos(yaw) * camDist * Math.cos(cp);
    const cy = pos.y + CONFIG.CAM_HEIGHT + camDist * Math.sin(cp);
    camera.position.set(cx, Math.max(0.6, cy), cz);
    camera.lookAt(pos.x, pos.y + 2, pos.z);

    // proximité des points de vue et des fragments
    nearVP = null;
    for (const vp of world.viewpoints) {
      if (vp.synced) continue;
      const d = Math.hypot(pos.x - vp.pos.x, pos.z - vp.pos.z);
      if (d < CONFIG.SYNC_RANGE) { nearVP = vp; break; }
    }
    if (nearVP && !won) {
      prompt.classList.add("show");
      prompt.querySelector(".p-name").textContent = nearVP.name;
    } else prompt.classList.remove("show");

    for (const f of world.fragments) {
      if (f.collected) continue;
      if (Math.hypot(pos.x - f.mesh.position.x, pos.z - f.mesh.position.z) < CONFIG.FRAGMENT_RANGE) {
        f.collected = true; f.mesh.visible = false; fragCount++;
        toast(`Fragment de mémoire  ${fragCount}/${TOTAL_FR}`);
        updateHUD(); checkWin();
      }
    }

    // objectif courant affiché
    if (nearVP) hud.obj.textContent = `Synchroniser : ${nearVP.name}`;
    else if (syncedCount < TOTAL_VP) hud.obj.textContent = "Rejoins un point de vue en hauteur (◈)";
    else hud.obj.textContent = "Récupère les derniers fragments de mémoire";
  }

  /* ---------- Cinématique de synchronisation ---------- */
  function updateCine(dt) {
    cine.t += dt;
    const vp = cine.vp;
    const k = cine.t / cine.dur;
    // courbe montée/maintien/descente
    let f;
    if (k < 0.28) f = ease(k / 0.28);
    else if (k < 0.75) f = 1;
    else f = 1 - ease((k - 0.75) / 0.25);

    // point de gameplay (derrière le perso)
    const pos = player.group.position;
    const gx = pos.x - Math.sin(yaw) * CONFIG.CAM_DIST;
    const gz = pos.z - Math.cos(yaw) * CONFIG.CAM_DIST;
    const gy = pos.y + CONFIG.CAM_HEIGHT;

    // point d'observation aérien qui tourne autour du sommet
    const orbit = cine.t * 0.45;
    const vr = 38;
    const ax = vp.pos.x + Math.cos(orbit) * vr;
    const az = vp.pos.z + Math.sin(orbit) * vr;
    const ay = vp.pos.y + 28;

    camera.position.set(
      gx + (ax - gx) * f,
      gy + (ay - gy) * f,
      gz + (az - gz) * f
    );
    const lookX = pos.x + (vp.pos.x - pos.x) * f;
    const lookY = pos.y + 2 + (vp.pos.y - pos.y - 2) * f;
    const lookZ = pos.z + (vp.pos.z - pos.z) * f;
    camera.lookAt(lookX, lookY, lookZ);

    // UI cinématique
    if (k > 0.2 && k < 0.85) {
      cineUI.classList.add("show");
      cineName.textContent = vp.name;
      cineFact.textContent = vp.fact;
    } else cineUI.classList.remove("show");

    // valider à mi-parcours
    if (!vp.synced && k > 0.35) finishSync(vp);

    if (cine.t >= cine.dur) {
      cine.active = false;
      cineUI.classList.remove("show");
    }
  }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  /* ---------- Marqueurs d'objectifs à l'écran ---------- */
  function updateMarkers() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    world.viewpoints.forEach((vp) => {
      const el = vp.marker;
      if (vp.synced) { el.style.display = "none"; return; }
      _v.set(vp.pos.x, vp.pos.y + 2, vp.pos.z).project(camera);
      const behind = _v.z > 1;
      let x = (_v.x * 0.5 + 0.5) * w;
      let y = (-_v.y * 0.5 + 0.5) * h;
      if (behind) { x = w - x; y = h - 10; }
      x = Math.max(24, Math.min(w - 24, x));
      y = Math.max(60, Math.min(h - 40, y));
      const d = player.group.position.distanceTo(vp.pos);
      el.style.display = "flex";
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.querySelector(".m-dist").textContent = Math.round(d) + " m";
    });
  }

  /* ---------- Petit toast ---------- */
  let toastTimer = null;
  const toastEl = document.getElementById("toast");
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  /* ---------- Resize ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  /* ---------- Démarrage ---------- */
  window.START_GAME = function () {
    resize();
    clock.start();
    frame();
  };

  // Hook de test (debug uniquement)
  window.__game = {
    tp: (x, z) => player.group.position.set(x, 0, z),
    setYaw: (y, p) => { yaw = y; if (p !== undefined) pitch = p; },
    sync: trySync,
    state: () => ({ synced: syncedCount, frag: fragCount, near: nearVP && nearVP.name, cine: cine.active }),
  };
})();
