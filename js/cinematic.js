/* ============================================================
   CINÉMATIQUE D'INTRODUCTION
   Espace → Terre → zoom sur la France → Pyrénées-Atlantiques →
   plan du village → point d'atterrissage, puis passage au 3D
   où William atterrit.
   Dessinée sur un canvas 2D en surimpression (fiable, hors-ligne).
   ============================================================ */
const Cinematic = {
  start(canvas, hooks) {
    const ctx = canvas.getContext("2d");
    let W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    // étoiles
    const stars = [];
    for (let i = 0; i < 260; i++) stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.3, tw: Math.random() * 6 });

    // Contour approximatif de la France métropolitaine (normalisé 0..1)
    const FR = [[0.42,0.05],[0.55,0.08],[0.60,0.04],[0.66,0.10],[0.72,0.22],[0.70,0.30],[0.80,0.34],
      [0.86,0.46],[0.80,0.55],[0.84,0.66],[0.78,0.74],[0.66,0.80],[0.55,0.84],[0.40,0.86],
      [0.30,0.80],[0.34,0.70],[0.24,0.64],[0.14,0.60],[0.10,0.50],[0.18,0.42],[0.12,0.32],
      [0.20,0.24],[0.30,0.20],[0.28,0.10]];
    // Pyrénées-Atlantiques (sud-ouest)
    const PA = [0.30, 0.82];

    const phases = [
      { name: "space", dur: 3.0 },
      { name: "france", dur: 3.2 },
      { name: "village", dur: 3.2 },
      { name: "fade", dur: 1.6 },
    ];
    let phase = 0, t = 0, total = 0, landed = false, finished = false;
    const started = performance.now();

    const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    const lerp = (a, b, k) => a + (b - a) * k;

    function drawEarth(cx, cy, R, zoom) {
      // atmosphère
      const atm = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
      atm.addColorStop(0, "rgba(120,180,255,0.35)"); atm.addColorStop(1, "rgba(120,180,255,0)");
      ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, 7); ctx.fill();
      // océan
      const oc = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R);
      oc.addColorStop(0, "#3a7bd5"); oc.addColorStop(0.7, "#1e4f8a"); oc.addColorStop(1, "#0a2a52");
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
      ctx.fillStyle = oc; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      // continents stylisés (blobs verts)
      ctx.fillStyle = "#4f8a3a";
      const blobs = [[-0.1, -0.25, 0.5, 0.35], [0.15, 0.25, 0.45, 0.5], [-0.55, 0.1, 0.35, 0.6], [0.5, -0.4, 0.4, 0.3], [0.2, -0.05, 0.3, 0.25]];
      blobs.forEach(([bx, by, bw, bh]) => { ctx.beginPath(); ctx.ellipse(cx + bx * R, cy + by * R, bw * R * 0.5, bh * R * 0.5, bx, 0, 7); ctx.fill(); });
      // ombre (terminateur)
      const sh = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      sh.addColorStop(0, "rgba(0,0,10,0)"); sh.addColorStop(0.6, "rgba(0,0,10,0)"); sh.addColorStop(1, "rgba(0,0,20,0.6)");
      ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }

    function drawFrance(alpha, zoom, focus) {
      ctx.save(); ctx.globalAlpha = alpha;
      const cx = W / 2, cy = H / 2, sc = Math.min(W, H) * 0.6 * zoom;
      // recentrer sur le point focus (0..1) quand on zoome
      const ox = cx - (focus[0] - 0.5) * sc * (zoom - 1) - sc / 2;
      const oy = cy - (focus[1] - 0.5) * sc * (zoom - 1) - sc / 2;
      const px = p => [ox + p[0] * sc, oy + p[1] * sc];
      // terre/mer douce derrière
      ctx.fillStyle = "#12203a"; ctx.fillRect(0, 0, W, H);
      // hexagone France
      ctx.beginPath(); FR.forEach((p, i) => { const [x, y] = px(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
      const gr = ctx.createLinearGradient(0, oy, 0, oy + sc);
      gr.addColorStop(0, "#8fbf6a"); gr.addColorStop(1, "#5f9a48");
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = "#2f4a2a"; ctx.lineWidth = 2; ctx.stroke();
      // pin Pyrénées-Atlantiques
      const [pxp, pyp] = px(PA);
      ctx.fillStyle = "#e23b3b";
      ctx.beginPath(); ctx.arc(pxp, pyp, 8 * Math.min(2, zoom), 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(pxp, pyp + 22 * Math.min(2, zoom)); ctx.lineTo(pxp - 8 * Math.min(2, zoom), pyp); ctx.lineTo(pxp + 8 * Math.min(2, zoom), pyp); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    function drawVillageMap(alpha) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = "#dfe4d0"; ctx.fillRect(0, 0, W, H);
      // léger grain
      const cx = W / 2, cy = H / 2, s = Math.min(W, H) / 300;
      ctx.translate(cx, cy); ctx.scale(s, s);
      // routes
      ctx.strokeStyle = "#c9b98f"; ctx.lineWidth = 14; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(30, -140); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-120, 0); ctx.lineTo(90, 20); ctx.stroke();
      // place triangulaire
      ctx.fillStyle = "#bcae87"; ctx.beginPath(); ctx.moveTo(-22, 58); ctx.lineTo(22, 58); ctx.lineTo(7, -58); ctx.lineTo(-7, -58); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#8a7d55"; ctx.lineWidth = 2; ctx.stroke();
      // église (croix)
      ctx.strokeStyle = "#5a4a3a"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(0, -95); ctx.moveTo(-7, -88); ctx.lineTo(7, -88); ctx.stroke();
      // lac
      ctx.fillStyle = "#5fa3c4"; ctx.beginPath(); ctx.ellipse(40, -150, 30, 22, 0, 0, 7); ctx.fill();
      // maisons (petits carrés)
      ctx.fillStyle = "#b06a44";
      for (let i = 0; i < 7; i++) { const z = 46 - i * 15, xo = 30 - (i / 7) * 12; ctx.fillRect(-xo - 8, z - 4, 8, 8); ctx.fillRect(xo, z - 4, 8, 8); }
      // marqueur d'atterrissage (sur le spawn ~ 0,40)
      const pulse = 6 + Math.sin(t * 6) * 3;
      ctx.fillStyle = "rgba(226,59,59,0.25)"; ctx.beginPath(); ctx.arc(0, 40, pulse + 8, 0, 7); ctx.fill();
      ctx.fillStyle = "#e23b3b"; ctx.beginPath(); ctx.arc(0, 40, 5, 0, 7); ctx.fill();
      ctx.restore();

      // libellés
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#3a3a2a"; ctx.textAlign = "center";
      ctx.font = "bold " + Math.round(Math.min(W, H) * 0.05) + "px Georgia, serif";
      ctx.fillText("ARZACQ-ARRAZIGUET", W / 2, H * 0.16);
      ctx.font = Math.round(Math.min(W, H) * 0.022) + "px system-ui";
      ctx.fillStyle = "#6a5a3a";
      ctx.fillText("Béarn · Pyrénées-Atlantiques", W / 2, H * 0.16 + Math.min(W, H) * 0.04);
      ctx.fillStyle = "#c0392b";
      ctx.fillText("● Point d'atterrissage de William", W / 2, H * 0.88);
      ctx.globalAlpha = 1;
    }

    function frame() {
      if (finished) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - (frame._last || now)) / 1000); frame._last = now;
      t += dt; total += dt;
      const ph = phases[phase];

      ctx.clearRect(0, 0, W, H);
      // fond spatial
      ctx.fillStyle = "#05060d"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      stars.forEach(s => { const a = 0.4 + 0.6 * Math.abs(Math.sin(total * 1.5 + s.tw)); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;

      const k = Math.min(1, t / ph.dur);

      if (ph.name === "space") {
        const R = Math.min(W, H) * lerp(0.28, 0.5, ease(k));
        drawEarth(W / 2, H / 2, R, 1);
        subtitle("Quelque part sur la Terre…", 1 - Math.max(0, (k - 0.7) / 0.3));
      } else if (ph.name === "france") {
        // la Terre s'efface, la France apparaît et on zoome vers le sud-ouest
        drawEarth(W / 2, H / 2, Math.min(W, H) * 0.5, 1);
        const zoom = lerp(1, 3.4, ease(k));
        const focus = [lerp(0.5, PA[0], ease(k)), lerp(0.5, PA[1], ease(k))];
        drawFrance(Math.min(1, k * 1.6), zoom, focus);
        subtitle("France · Béarn", Math.min(1, k * 1.6) * (1 - Math.max(0, (k - 0.75) / 0.25)));
      } else if (ph.name === "village") {
        drawVillageMap(Math.min(1, k * 1.5));
      } else if (ph.name === "fade") {
        drawVillageMap(1);
        if (!landed && hooks.onLand) { landed = true; hooks.onLand(); }
        // fondu du calque vers la scène 3D
        canvas.style.opacity = String(1 - ease(k));
      }

      if (k >= 1) {
        phase++; t = 0;
        if (phase >= phases.length) { finish(); return; }
      }
      Cinematic._raf = requestAnimationFrame(frame);
    }

    function subtitle(txt, a) {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = "#eaf2ff"; ctx.textAlign = "center";
      ctx.font = Math.round(Math.min(W, H) * 0.03) + "px Georgia, serif";
      ctx.fillText(txt, W / 2, H * 0.9); ctx.restore();
    }

    function finish() {
      if (finished) return; finished = true;
      cancelAnimationFrame(Cinematic._raf);
      canvas.style.display = "none";
      if (!landed && hooks.onLand) hooks.onLand();
      if (hooks.onDone) hooks.onDone();
    }

    this.skip = () => {
      if (!landed && hooks.onLand) { landed = true; hooks.onLand(); }
      // fondu rapide
      let a = parseFloat(canvas.style.opacity || "1");
      const fade = () => { a -= 0.08; canvas.style.opacity = String(Math.max(0, a)); if (a > 0) requestAnimationFrame(fade); else finish(); };
      cancelAnimationFrame(Cinematic._raf); fade();
    };

    Cinematic._raf = requestAnimationFrame(frame);
  },
};
