/* =========================================================================
   DAM TRUCK — « Écrasez la roche » (mini-jeu de l'accueil)
   Glisser (ou toucher) un bloc → il tombe dans la trémie → les mâchoires
   l'écrasent (secousse, son, vibration) → le gravier sort sur le
   convoyeur et forme un stock. Après 3 blocs : écran de fin + devis.
   Tout est dessiné sur un canvas, sans image ni bibliothèque.
   ========================================================================= */
(() => {
  const root = document.querySelector("[data-jeu]");
  if (!root) return;
  const T = (s, v) => (window.I18N ? window.I18N.t(s, v) : String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v ? v[k] : "")));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = root.querySelector("canvas"), cx = cv.getContext("2d");
  const outBlocs = root.querySelector("[data-jeu-blocs]"), outT = root.querySelector("[data-jeu-t]");
  const end = root.querySelector("[data-jeu-end]"), endT = root.querySelector("[data-jeu-endt]");
  const TONNES_PER_ROCK = 4.2, TOTAL = 3;
  let W = 0, H = 0, dpr = 1;
  let rocks = [], gravel = [], dust = [], pile = 0, crushed = 0, crushing = null, shake = 0, t = 0, running = false;

  /* ---------- geometry (relative to canvas size) ---------- */
  const G = {};
  function layout() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = W < 560;
    G.cx = narrow ? W * 0.56 : W * 0.5;
    G.top = H * 0.2;                         // hopper rim
    G.hw = narrow ? W * 0.22 : Math.min(W * 0.16, 170); // hopper half width
    G.jawTop = H * 0.36; G.jawBot = H * 0.6; G.gap = Math.max(10, W * 0.012);
    G.belt = H * 0.74; G.beltX0 = G.cx - G.hw * 0.4; G.beltX1 = W * (narrow ? 0.9 : 0.8);
    G.ground = H * 0.94;
    G.rockR = narrow ? W * 0.07 : Math.min(W * 0.045, 46);
    // the waiting blocks sit on a ledge on the left
    rocks.forEach((k, i) => { if (k.state === "idle") { const p = home(i); k.x = p.x; k.y = p.y; } k.r = G.rockR * k.s; });
  }
  const home = (i) => ({ x: W < 560 ? W * 0.13 : W * 0.12 + i * G.rockR * 0.25, y: G.top + i * G.rockR * 2.35 + G.rockR * 0.6 });

  /* ---------- rocks ---------- */
  function makeRock(i) {
    const n = 8 + Math.floor(Math.random() * 3), pts = [];
    for (let k = 0; k < n; k++) pts.push(0.72 + Math.random() * 0.28);
    const s = 0.9 + Math.random() * 0.2, p = home(i);
    return { i, x: p.x, y: p.y, vx: 0, vy: 0, r: G.rockR * s, s, pts, rot: Math.random() * 6, vr: 0, state: "idle", tone: 120 + Math.random() * 40, life: 1 };
  }
  function reset() {
    rocks = [0, 1, 2].map(makeRock); gravel = []; dust = []; pile = 0; crushed = 0; crushing = null;
    end.hidden = true; root.classList.remove("is-done"); update();
  }
  function update() {
    outBlocs.textContent = `${crushed}/${TOTAL}`;
    outT.textContent = new Intl.NumberFormat(window.I18N ? window.I18N.locale : "fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(crushed * TONNES_PER_ROCK) + " t";
  }

  /* ---------- sound + vibration (only after a user gesture) ---------- */
  let ac = null;
  function crunch() {
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([25, 35, 25, 35, 25, 35, 70]); } catch (e) {}
    if (!root.querySelector("[data-jeu-son]").checked) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      ac.resume();
      const t0 = ac.currentTime;
      for (let k = 0; k < 7; k++) {
        const len = 0.12, b = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4);
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = b; f.type = "lowpass"; f.frequency.value = 600 + Math.random() * 1400; g.gain.value = 0.5;
        s.connect(f).connect(g).connect(ac.destination); s.start(t0 + k * 0.17 + Math.random() * 0.04);
      }
      const o = ac.createOscillator(), og = ac.createGain();
      o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(32, t0 + 0.9);
      og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.7, t0 + 0.02); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
      o.connect(og).connect(ac.destination); o.start(t0); o.stop(t0 + 1.2);
    } catch (e) {}
  }

  /* ---------- input: drag (mouse/finger) or tap ---------- */
  let drag = null, downAt = 0;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const hit = (p) => rocks.find((k) => k.state === "idle" && Math.hypot(p.x - k.x, p.y - k.y) < k.r * 1.15);
  cv.addEventListener("pointerdown", (e) => {
    const p = pos(e), k = hit(p);
    if (!k) return;
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    drag = { k, dx: p.x - k.x, dy: p.y - k.y, sx: p.x, sy: p.y };
    k.state = "drag"; downAt = performance.now();
    start();
  });
  cv.addEventListener("pointermove", (e) => {
    const p = pos(e);
    if (!drag) { cv.style.cursor = hit(p) ? "grab" : "default"; return; }
    drag.k.x = p.x - drag.dx; drag.k.y = p.y - drag.dy; cv.style.cursor = "grabbing";
  });
  const drop = (e) => {
    if (!drag) return;
    const k = drag.k, p = pos(e);
    const tap = performance.now() - downAt < 250 && Math.hypot(p.x - drag.sx, p.y - drag.sy) < 8;
    const inHopper = Math.abs(k.x - G.cx) < G.hw * 1.1 && k.y < G.jawTop;
    if (tap || inHopper) {
      // a tap sends the block flying into the hopper
      k.state = "fall";
      if (tap) { k.vx = (G.cx - k.x) / 34; k.vy = -9; } else { k.vx = 0; k.vy = 0; }
      k.vr = (Math.random() - 0.5) * 0.2;
    } else { k.state = "back"; }
    drag = null; cv.style.cursor = "default";
  };
  cv.addEventListener("pointerup", drop);
  cv.addEventListener("pointercancel", drop);

  /* ---------- simulation ---------- */
  function step() {
    t += 1;
    rocks.forEach((k) => {
      if (k.state === "back") {
        const p = home(k.i); k.x += (p.x - k.x) * 0.18; k.y += (p.y - k.y) * 0.18;
        if (Math.hypot(p.x - k.x, p.y - k.y) < 1) k.state = "idle";
      } else if (k.state === "fall") {
        k.vy += 0.55; k.x += k.vx; k.y += k.vy; k.rot += k.vr;
        // funnel walls of the hopper / jaws pull the block to the centre line
        if (k.y > G.top - k.r) { k.vx *= 0.9; k.x += (G.cx - k.x) * 0.12; }
        const stopY = G.jawTop + (G.jawBot - G.jawTop) * 0.35;
        if (k.y >= stopY) { k.y = stopY; k.state = "crush"; crushing = { k, t: 0 }; crunch(); }
      }
    });
    if (crushing) {
      const c = crushing, k = c.k; c.t += 1;
      shake = reduce ? 0 : 3.5;
      k.life = Math.max(0, 1 - c.t / 80);
      k.r = G.rockR * k.s * (0.35 + 0.65 * k.life);
      k.y = G.jawTop + (G.jawBot - G.jawTop) * (0.35 + 0.5 * (1 - k.life));
      if (c.t % 2 === 0) {
        for (let n = 0; n < 4; n++) gravel.push({ x: G.cx + (Math.random() - 0.5) * G.gap * 2, y: G.jawBot + 4, vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 1.5, r: 1.6 + Math.random() * 3.2, tone: 100 + Math.random() * 90, on: false, done: false });
        dust.push({ x: G.cx + (Math.random() - 0.5) * G.hw, y: G.jawTop + Math.random() * 40, r: 6 + Math.random() * 14, a: 0.35, vx: (Math.random() - 0.5) * 0.8, vy: -0.4 - Math.random() * 0.6 });
      }
      if (c.t > 80) { k.state = "gone"; crushing = null; crushed++; update(); if (crushed >= TOTAL) setTimeout(finish, 1800); }
    } else shake *= 0.8;
    gravel.forEach((g) => {
      if (g.done) return;
      if (!g.on) {
        g.vy += 0.4; g.x += g.vx; g.y += g.vy;
        if (g.y >= G.belt - g.r && g.x < G.beltX1) { g.y = G.belt - g.r; g.on = true; g.vy = 0; }
        if (g.x >= G.beltX1 && g.y >= G.ground - pileH(g.x) - g.r) { g.done = true; pile += 1; }
      } else {
        g.x += 2.4 + Math.random() * 0.4;
        if (g.x > G.beltX1) { g.on = false; g.vx = 1.6 + Math.random(); g.vy = -0.5; }
      }
    });
    dust.forEach((d) => { d.x += d.vx; d.y += d.vy; d.r += 0.35; d.a *= 0.965; });
    dust = dust.filter((d) => d.a > 0.02);
    if (gravel.length > 900) gravel = gravel.filter((g) => !g.done).concat(gravel.filter((g) => g.done).slice(-300));
  }
  // stockpile height at x (a cone growing with the gravel count)
  const pileH = (x) => { const peak = Math.min(H * 0.42, 6 + Math.sqrt(pile) * 7), cxp = G.beltX1 + 30, half = peak * 1.25; return Math.max(0, peak * (1 - Math.abs(x - cxp) / half)); };

  /* ---------- drawing ---------- */
  const gold = "#d7bd86", goldDim = "rgba(182,146,86,.55)";
  function rockPath(k) {
    cx.beginPath();
    k.pts.forEach((m, n) => { const a = k.rot + (n / k.pts.length) * Math.PI * 2, rr = k.r * m; const x = k.x + Math.cos(a) * rr, y = k.y + Math.sin(a) * rr * 0.86; n ? cx.lineTo(x, y) : cx.moveTo(x, y); });
    cx.closePath();
  }
  function draw() {
    cx.clearRect(0, 0, W, H);
    // blueprint grid
    cx.strokeStyle = "rgba(182,146,86,.06)"; cx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
    for (let y = 0; y < H; y += 32) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    // ground + pile
    cx.strokeStyle = goldDim; cx.beginPath(); cx.moveTo(0, G.ground); cx.lineTo(W, G.ground); cx.stroke();
    if (pile > 0) {
      const cxp = G.beltX1 + 30, peak = pileH(cxp), half = peak * 1.25;
      const g = cx.createLinearGradient(0, G.ground - peak, 0, G.ground); g.addColorStop(0, "#c9b48a"); g.addColorStop(1, "#5e5242");
      cx.fillStyle = g; cx.beginPath(); cx.moveTo(cxp - half, G.ground); cx.lineTo(cxp, G.ground - peak); cx.lineTo(cxp + half, G.ground); cx.closePath(); cx.fill();
    }
    // conveyor
    cx.save(); cx.translate(sx * 0.3, sy * 0.3);
    cx.strokeStyle = gold; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(G.beltX0, G.belt); cx.lineTo(G.beltX1, G.belt); cx.stroke();
    cx.lineWidth = 1; cx.strokeStyle = goldDim;
    const off = (t * 2.4) % 18;
    for (let x = G.beltX0 + off; x < G.beltX1; x += 18) { cx.beginPath(); cx.moveTo(x, G.belt + 3); cx.lineTo(x + 8, G.belt + 3); cx.stroke(); }
    [G.beltX0, G.beltX1].forEach((x) => { cx.beginPath(); cx.arc(x, G.belt + 6, 6, 0, 6.283); cx.stroke(); });
    cx.beginPath(); cx.moveTo(G.beltX0 + 30, G.belt + 12); cx.lineTo(G.beltX0 + 10, G.ground); cx.moveTo(G.beltX1 - 30, G.belt + 12); cx.lineTo(G.beltX1 - 10, G.ground); cx.stroke();
    cx.restore();
    // crusher body
    cx.save(); cx.translate(sx, sy);
    cx.strokeStyle = gold; cx.lineWidth = 2; cx.lineJoin = "round";
    // hopper
    cx.beginPath(); cx.moveTo(G.cx - G.hw * 1.35, G.top); cx.lineTo(G.cx - G.hw, G.jawTop); cx.moveTo(G.cx + G.hw * 1.35, G.top); cx.lineTo(G.cx + G.hw, G.jawTop); cx.stroke();
    // jaws (the right one moves while crushing)
    const swing = crushing ? Math.sin(t * 0.9) * G.gap * 0.9 : 0;
    cx.lineWidth = 3;
    cx.beginPath(); cx.moveTo(G.cx - G.hw, G.jawTop); cx.lineTo(G.cx - G.gap, G.jawBot); cx.stroke();
    cx.beginPath(); cx.moveTo(G.cx + G.hw + swing, G.jawTop); cx.lineTo(G.cx + G.gap + swing, G.jawBot); cx.stroke();
    // teeth
    cx.lineWidth = 1; cx.strokeStyle = goldDim;
    for (let n = 1; n < 6; n++) {
      const f = n / 6;
      const lx = G.cx - G.hw + (G.hw - G.gap) * f, ly = G.jawTop + (G.jawBot - G.jawTop) * f;
      const rx = G.cx + G.hw + swing - (G.hw - G.gap) * f;
      cx.beginPath(); cx.moveTo(lx, ly); cx.lineTo(lx + 7, ly - 3); cx.moveTo(rx, ly); cx.lineTo(rx - 7, ly - 3); cx.stroke();
    }
    // frame + flywheel
    cx.strokeStyle = goldDim; cx.lineWidth = 1.2;
    cx.strokeRect(G.cx - G.hw * 1.25, G.jawTop - 8, G.hw * 2.5, G.jawBot - G.jawTop + 26);
    const fw = G.cx + G.hw * 1.25 + 26;
    cx.beginPath(); cx.arc(fw, G.jawTop + 30, 22, 0, 6.283); cx.stroke();
    cx.beginPath(); const a = t * (crushing ? 0.3 : 0.04); cx.moveTo(fw, G.jawTop + 30); cx.lineTo(fw + Math.cos(a) * 22, G.jawTop + 30 + Math.sin(a) * 22); cx.stroke();
    // tracks
    cx.beginPath(); cx.roundRect ? cx.roundRect(G.cx - G.hw * 1.3, G.jawBot + 26, G.hw * 2.6, 16, 8) : cx.rect(G.cx - G.hw * 1.3, G.jawBot + 26, G.hw * 2.6, 16); cx.stroke();
    cx.restore();
    // label on the hopper
    cx.fillStyle = "rgba(236,230,217,.45)"; cx.font = "500 10px Jost, sans-serif"; cx.textAlign = "center";
    cx.fillText(T("TRÉMIE"), G.cx, G.top - 10);
    // gravel
    gravel.forEach((g) => { cx.fillStyle = `rgb(${g.tone + 30},${g.tone + 20},${g.tone})`; cx.beginPath(); cx.arc(g.x, g.y, g.r, 0, 6.283); cx.fill(); });
    // rocks
    rocks.forEach((k) => {
      if (k.state === "gone") return;
      const gr = cx.createRadialGradient(k.x - k.r * 0.3, k.y - k.r * 0.4, k.r * 0.1, k.x, k.y, k.r * 1.1);
      gr.addColorStop(0, `rgb(${k.tone + 70},${k.tone + 60},${k.tone + 40})`); gr.addColorStop(1, `rgb(${k.tone - 50},${k.tone - 55},${k.tone - 60})`);
      cx.fillStyle = gr; rockPath(k); cx.fill();
      cx.strokeStyle = "rgba(0,0,0,.35)"; cx.lineWidth = 1; cx.stroke();
      if (k.state === "crush") { cx.strokeStyle = "rgba(20,15,8,.7)"; for (let n = 0; n < 4; n++) { cx.beginPath(); cx.moveTo(k.x, k.y); cx.lineTo(k.x + Math.cos(n * 1.7) * k.r, k.y + Math.sin(n * 1.7) * k.r); cx.stroke(); } }
      if (k.state === "idle") { cx.fillStyle = gold; cx.font = "500 11px Jost, sans-serif"; cx.textAlign = "center"; cx.fillText(`${String(TONNES_PER_ROCK).replace(".", ",")} t`, k.x, k.y + k.r + 16); }
    });
    // dust
    dust.forEach((d) => { cx.fillStyle = `rgba(215,200,170,${d.a})`; cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.283); cx.fill(); });
    // hint arrow while nothing has been crushed
    if (!crushed && !crushing && !rocks.some((k) => k.state !== "idle")) {
      const k = rocks[0], p = 0.5 + 0.5 * Math.sin(t * 0.06);
      cx.strokeStyle = `rgba(215,189,134,${0.35 + 0.4 * p})`; cx.setLineDash([4, 6]); cx.lineWidth = 1.4;
      cx.beginPath(); cx.moveTo(k.x + k.r + 8, k.y - 4); cx.quadraticCurveTo((k.x + G.cx) / 2, G.top - H * 0.12, G.cx - 10, G.top + 6); cx.stroke(); cx.setLineDash([]);
    }
  }
  function loop() { if (!running) return; step(); draw(); requestAnimationFrame(loop); }
  function start() { if (running) return; running = true; loop(); }

  function finish() {
    root.classList.add("is-done");
    endT.textContent = new Intl.NumberFormat(window.I18N ? window.I18N.locale : "fr-FR", { minimumFractionDigits: 1 }).format(TOTAL * TONNES_PER_ROCK);
    end.hidden = false;
  }
  root.querySelector("[data-jeu-replay]").addEventListener("click", () => { reset(); });

  // run only while visible
  new IntersectionObserver((en) => {
    if (en[0].isIntersecting) { layout(); start(); } else running = false;
  }, { threshold: 0.15 }).observe(cv);
  addEventListener("resize", () => { layout(); if (!running) draw(); });
  layout(); reset(); draw();
})();
