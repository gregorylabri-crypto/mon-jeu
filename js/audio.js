/* ============================================================
   AUDIO — musique d'ambiance + bruitages 100% générés
   (Web Audio API, aucun fichier externe, hors-ligne).
   Doit être initialisé sur un geste utilisateur (clic "Jouer").
   ============================================================ */
const AUDIO = {
  ctx: null, master: null, musicBus: null, sfxBus: null, ambBus: null,
  muted: false, started: false,

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.32; this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.55; this.sfxBus.connect(this.master);
      this.ambBus = this.ctx.createGain(); this.ambBus.gain.value = 0.28; this.ambBus.connect(this.master);
      // petite réverbération partagée (convolution sur bruit)
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this._impulse(1.6, 2.4);
      this.reverbBus = this.ctx.createGain(); this.reverbBus.gain.value = 0.5;
      this.reverb.connect(this.reverbBus); this.reverbBus.connect(this.master);
    } catch (e) { this.ctx = null; }
  },

  resume() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },

  _impulse(dur, decay) {
    const rate = this.ctx.sampleRate, len = rate * dur;
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  },

  _noiseBuffer(dur) {
    const rate = this.ctx.sampleRate, len = rate * dur, buf = this.ctx.createBuffer(1, len, rate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  },

  // note simple avec enveloppe
  _tone(freq, t0, dur, type = "sine", gain = 0.3, bus = null, glideTo = null) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.06, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },

  _noise(t0, dur, freq, q, gain = 0.3, bus = null) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource(); src.buffer = this._noiseBuffer(dur + 0.05);
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(bus || this.sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.05);
  },

  /* ---------- MUSIQUE d'ambiance (pad + arpège) ---------- */
  startMusic() {
    if (!this.ctx || this.started) return; this.started = true;
    // progression douce en Ré majeur : D - Bm - G - A
    const chords = [
      [146.83, 220.00, 293.66], // D
      [123.47, 246.94, 293.66], // Bm
      [98.00, 196.00, 293.66],  // G
      [110.00, 220.00, 277.18], // A
    ];
    const arpNotes = [587.33, 659.25, 440.00, 493.88, 587.33, 880.00];
    let idx = 0, arpI = 0;
    const barLen = 4.0;
    const scheduleBar = () => {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + 0.05;
      const ch = chords[idx % chords.length];
      // pad : 2 oscillateurs détunés par note, filtre passe-bas, longue enveloppe
      ch.forEach((f) => {
        [0, 3].forEach((det) => {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lp = this.ctx.createBiquadFilter();
          o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det;
          lp.type = "lowpass"; lp.frequency.value = 900;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.12, t0 + 1.0);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + barLen);
          o.connect(lp); lp.connect(g); g.connect(this.musicBus);
          o.start(t0); o.stop(t0 + barLen + 0.1);
        });
      });
      // arpège cloche (2 notes par mesure)
      for (let k = 0; k < 2; k++) {
        const tt = t0 + k * (barLen / 2) + 0.2;
        this._tone(arpNotes[arpI % arpNotes.length], tt, 1.2, "triangle", 0.10, this.reverb);
        arpI++;
      }
      idx++;
      this._musicTimer = setTimeout(scheduleBar, barLen * 1000);
    };
    scheduleBar();
    // lit de vent (bruit filtré très doux)
    const wind = this.ctx.createBufferSource(); wind.buffer = this._noiseBuffer(4); wind.loop = true;
    const wf = this.ctx.createBiquadFilter(); wf.type = "lowpass"; wf.frequency.value = 500;
    const wg = this.ctx.createGain(); wg.gain.value = 0.06;
    wind.connect(wf); wf.connect(wg); wg.connect(this.ambBus); wind.start();
    // chants d'oiseaux aléatoires
    const bird = () => {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + 0.05, base = 1800 + Math.random() * 1200;
      for (let i = 0; i < 2 + (Math.random() * 2 | 0); i++) this._tone(base + i * 120, t0 + i * 0.08, 0.09, "sine", 0.05, this.ambBus, base + 300);
      this._birdTimer = setTimeout(bird, 4000 + Math.random() * 8000);
    };
    this._birdTimer = setTimeout(bird, 3000);
  },

  /* ---------- BRUITAGES ---------- */
  _t() { return this.ctx ? this.ctx.currentTime + 0.01 : 0; },
  step(run) { if (!this.ctx) return; this._noise(this._t(), 0.09, run ? 220 : 150, 1.2, run ? 0.25 : 0.18); },
  hoof() { if (!this.ctx) return; const t = this._t(); this._noise(t, 0.06, 180, 2, 0.22); this._noise(t + 0.09, 0.05, 140, 2, 0.16); },
  jump() { if (!this.ctx) return; this._tone(300, this._t(), 0.18, "square", 0.16, null, 620); },
  land() { if (!this.ctx) return; const t = this._t(); this._tone(120, t, 0.14, "sine", 0.22); this._noise(t, 0.1, 200, 1, 0.15); },
  collect() { if (!this.ctx) return; const t = this._t(); [659.25, 880, 1174.66].forEach((f, i) => this._tone(f, t + i * 0.07, 0.35, "triangle", 0.16, this.reverb)); },
  sync() { if (!this.ctx) return; const t = this._t(); [293.66, 369.99, 440, 587.33].forEach((f, i) => this._tone(f, t + i * 0.03, 1.6, "sine", 0.14, this.reverb)); },
  talk() { if (!this.ctx) return; this._tone(520 + Math.random() * 80, this._t(), 0.08, "square", 0.09); },
  click() { if (!this.ctx) return; this._noise(this._t(), 0.04, 1200, 3, 0.12); },
  mount() { if (!this.ctx) return; this._tone(392, this._t(), 0.5, "sawtooth", 0.12, this.reverb, 523); },
  win() { if (!this.ctx) return; const t = this._t(); [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this._tone(f, t + i * 0.12, 0.9, "triangle", 0.18, this.reverb)); },
  splash() { if (!this.ctx) return; this._noise(this._t(), 0.3, 800, 0.7, 0.2); },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    return this.muted;
  },
};

window.AUDIO = AUDIO;
