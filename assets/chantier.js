/* =========================================================================
   DAM TRUCK — « Votre chantier en accéléré » (page Concassage)
   Volume + roche + fraction → des semaines de production en ~10 secondes :
   le soleil se lève et se couche, la station tourne, le stock monte, les
   camions partent. Durée = volume ÷ rendement journalier (data.js : rateMin
   / rateMax, modifiables) × coefficient de dureté de la roche. À la fin,
   un bouton remplit le formulaire de devis.
   ========================================================================= */
(() => {
  const root = document.querySelector("[data-acc]");
  if (!root) return;
  const DT = window.DT || {};
  const T = (s, v) => (window.I18N ? window.I18N.t(s, v) : String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v ? v[k] : "")));
  const nf = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
  const $ = (s) => root.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // same log scale as the quote form's volume slider
  const VMIN = 1000, VMAX = 500000;
  const toVol = (p) => { const v = VMIN * Math.pow(VMAX / VMIN, p / 100); const s = v < 10000 ? 500 : v < 100000 ? 1000 : 5000; return Math.round(v / s) * s; };
  const toPos = (v) => (100 * Math.log(v / VMIN)) / Math.log(VMAX / VMIN);
  const vr = $("#acc-vol"), volEl = $("[data-acc-vol]");
  let vol = 20000;
  vr.value = toPos(vol);
  const showVol = () => (volEl.textContent = T("{v} t", { v: nf(vol) }));
  vr.addEventListener("input", () => { vol = toVol(+vr.value); showVol(); });
  showVol();
  const pick = (sel) => sel.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; sel.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === b)); });
  pick($("[data-acc-rock]")); pick($("[data-acc-frac]"));
  const chosen = (sel) => $(`${sel} .chip[aria-pressed="true"]`);

  /* --------------------------------------------------------------- scene */
  const cv = $("[data-acc-cv]"), c = cv.getContext("2d");
  let W = 0, H = 0;
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`;
  const SKY = { night: [[6, 7, 11], [14, 15, 22]], dawn: [[38, 30, 44], [196, 124, 70]], day: [[58, 84, 112], [196, 178, 150]] };
  const stars = Array.from({ length: 70 }, () => [Math.random(), Math.random() * 0.55, Math.random() * 1.2 + 0.3]);
  let trucks = [], dust = [];

  // light: 0 night → 1 full day, from the time of day (0..1)
  const light = (tod) => Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (tod - 0.22) / 0.56))));
  function draw(tod, pile, running) {
    const g = H * 0.8, L = light(tod), dawn = Math.max(0, 1 - Math.abs(L - 0.25) * 4) * (L < 0.6 ? 1 : 0);
    // sky
    const top = mix(mix(SKY.night[0], SKY.day[0], L), SKY.dawn[0], dawn * 0.5), bot = mix(mix(SKY.night[1], SKY.day[1], L), SKY.dawn[1], dawn * 0.7);
    const sky = c.createLinearGradient(0, 0, 0, g); sky.addColorStop(0, rgb(top)); sky.addColorStop(1, rgb(bot));
    c.fillStyle = sky; c.fillRect(0, 0, W, g);
    // stars at night
    c.fillStyle = `rgba(255,244,220,${(1 - L) * 0.8})`;
    for (const s of stars) { c.beginPath(); c.arc(s[0] * W, s[1] * H, s[2], 0, 6.283); c.fill(); }
    // sun / moon on an arc
    const ang = Math.PI * (1 - ((tod + 0.75) % 1) * 2 + 1), sx = W * 0.5 + Math.cos(Math.PI * (tod * 2 - 0.5)) * W * 0.42, sy = g - Math.sin(Math.PI * (tod * 2 - 0.5)) * H * 0.62;
    if (L > 0.02) { const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 60); sg.addColorStop(0, "rgba(255,226,160,.95)"); sg.addColorStop(0.25, "rgba(255,200,120,.5)"); sg.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 60, 0, 6.283); c.fill(); }
    else { c.fillStyle = "rgba(236,230,217,.85)"; c.beginPath(); c.arc(W * 0.78, H * 0.18, 9, 0, 6.283); c.fill(); }
    void ang;
    // distant hills + ground
    c.fillStyle = rgb(mix([12, 11, 10], [92, 74, 52], L * 0.8));
    c.beginPath(); c.moveTo(0, g); for (let x = 0; x <= W; x += 20) c.lineTo(x, g - 18 - Math.sin(x * 0.011) * 14 - Math.sin(x * 0.031) * 6); c.lineTo(W, g); c.fill();
    const gr = c.createLinearGradient(0, g, 0, H); gr.addColorStop(0, rgb(mix([24, 20, 15], [150, 120, 84], L))); gr.addColorStop(1, rgb(mix([10, 9, 8], [92, 72, 48], L)));
    c.fillStyle = gr; c.fillRect(0, g, W, H - g);
    // the station silhouette (R6: hopper, body, inclined after-screen conveyor) in gold-lit black
    const k = Math.min(W / 900, H / 420), ox = W * 0.12, base = g;
    const P = (x, y) => [ox + x * k, base - y * k];
    c.fillStyle = rgb(mix([18, 17, 16], [40, 34, 26], L)); c.strokeStyle = `rgba(215,189,134,${0.35 + 0.4 * (1 - L)})`; c.lineWidth = 1.2;
    const poly = (pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...P(...p)) : c.moveTo(...P(...p)))); c.closePath(); c.fill(); c.stroke(); };
    poly([[40, 0], [330, 0], [330, 26], [40, 26]]);                              // chassis + tracks
    poly([[20, 52], [150, 52], [140, 26], [30, 26]]);                             // feeder
    poly([[0, 96], [170, 96], [150, 52], [20, 52]]);                              // hopper
    poly([[150, 26], [150, 66], [170, 72], [330, 72], [330, 26]]);                 // crusher body
    poly([[190, 72], [190, 104], [300, 104], [300, 72]]);                          // power pack
    poly([[320, 22], [560, 132], [566, 120], [330, 8]]);                          // rear conveyor
    poly([[380, 62], [500, 117], [486, 150], [366, 95]]);                          // after-screen (inclined)
    // working lights at night
    if (L < 0.35 && running) { c.fillStyle = "rgba(255,214,140,.9)"; [[160, 100], [300, 108], [540, 134]].forEach((p) => { const q = P(...p); c.beginPath(); c.arc(q[0], q[1], 2.4, 0, 6.283); c.fill(); }); }
    // stockpile under the conveyor head
    const hx = P(566, 0)[0] + 14 * k, ph = (20 + pile * 150) * k, pw = (40 + pile * 260) * k;
    const pg = c.createLinearGradient(0, base - ph, 0, base); pg.addColorStop(0, rgb(mix([60, 52, 42], [214, 196, 160], L))); pg.addColorStop(1, rgb(mix([34, 30, 24], [150, 128, 96], L)));
    c.fillStyle = pg; c.beginPath(); c.moveTo(hx - pw, base); c.quadraticCurveTo(hx - pw * 0.25, base - ph * 1.05, hx, base - ph); c.quadraticCurveTo(hx + pw * 0.25, base - ph * 1.05, hx + pw, base); c.fill();
    // falling material + dust while running
    if (running) {
      const head = P(566, 126);
      c.strokeStyle = rgb(mix([90, 80, 64], [200, 182, 146], L)); c.lineWidth = 2.2 * k;
      c.beginPath(); c.moveTo(head[0] + 6, head[1]); c.quadraticCurveTo(head[0] + 14 * k, (head[1] + base - ph) / 2, hx, base - ph); c.stroke();
      if (Math.random() < 0.5) dust.push({ x: P(160, 70)[0], y: P(160, 70)[1], r: 6, a: 0.25 });
    }
    dust = dust.filter((d) => (d.a -= 0.004) > 0);
    for (const d of dust) { d.y -= 0.3; d.x += 0.4; d.r += 0.3; c.fillStyle = `rgba(196,170,128,${d.a * (0.3 + L)})`; c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill(); }
    // trucks driving off with loads
    for (const t of trucks) {
      t.x += t.v; const y = base + 6;
      c.fillStyle = rgb(mix([20, 19, 18], [200, 160, 40], L * 0.9));
      c.fillRect(t.x, y - 16 * k, 46 * k, 12 * k); c.fillRect(t.x + 46 * k, y - 20 * k, 14 * k, 16 * k);
      c.fillStyle = "#111"; [8, 30, 52].forEach((wx) => { c.beginPath(); c.arc(t.x + wx * k, y - 3 * k, 4 * k, 0, 6.283); c.fill(); });
      if (L < 0.3) { c.fillStyle = "rgba(255,220,150,.9)"; c.fillRect(t.x + 60 * k, y - 10 * k, 3, 3); }
    }
    trucks = trucks.filter((t) => t.x < W + 80);
  }

  /* ------------------------------------------------------------ the run */
  const hudDay = $("[data-acc-day]"), hudTons = $("[data-acc-tons]"), res = $("[data-acc-result]");
  let raf = 0, running = false, idleT = 0.32;
  function idle() { draw(idleT, 0.15, false); }
  function run() {
    cancelAnimationFrame(raf);
    res.hidden = true;
    const rock = chosen("[data-acc-rock]"), kHard = +(rock ? rock.dataset.k : 1);
    const rMin = (DT.rateMin || 1200) * kHard, rMax = (DT.rateMax || 1800) * kHard, rate = (rMin + rMax) / 2;
    const days = Math.max(1, Math.ceil(vol / rate)), dMin = Math.max(1, Math.ceil(vol / rMax)), dMax = Math.max(dMin, Math.ceil(vol / rMin));
    const truckLoads = Math.ceil(vol / 25);
    const dur = reduce ? 0 : Math.min(12000, 5000 + days * 300), t0 = performance.now();
    running = true; trucks = []; let lastTruck = 0;
    if (window.DTSound) window.DTSound.play("concasseur", 0.6);
    const step = (now) => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1, dayF = p * days;
      const tod = (dayF % 1) * 0.9 + 0.05; // each day: dawn → dusk → night
      draw(tod, Math.min(1, p * 1.05), p < 1);
      hudDay.textContent = Math.min(days, Math.floor(dayF) + 1);
      hudTons.textContent = nf(vol * p);
      if (now - lastTruck > Math.max(160, dur / Math.min(60, truckLoads)) && p < 1) { lastTruck = now; trucks.push({ x: W * 0.62, v: 2.4 + Math.random() * 1.2 }); }
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        running = false; idleT = tod;
        hudDay.textContent = days; hudTons.textContent = nf(vol);
        $("[data-acc-days]").textContent = dMin === dMax ? T("≈ {n} jours de production", { n: dMin }) : T("{a} à {b} jours de production", { a: dMin, b: dMax });
        $("[data-acc-trucks]").textContent = nf(truckLoads);
        res.hidden = false;
        if (window.DTSound) window.DTSound.play("gravier", 0.5);
        const settle = () => { draw(idleT, 1, false); if (!res.hidden) raf = requestAnimationFrame(settle); };
        raf = requestAnimationFrame(settle);
      }
    };
    raf = requestAnimationFrame(step);
  }
  $("[data-acc-go]").addEventListener("click", run);

  // hand the choice to the quote form below (same chips, same log slider)
  $("[data-acc-devis]").addEventListener("click", () => {
    const press = (group, v) => { const b = document.querySelector(`[data-group="${group}"] [data-v="${v}"]`); if (b && b.getAttribute("aria-pressed") !== "true") b.click(); };
    const rock = chosen("[data-acc-rock]"), fr = chosen("[data-acc-frac]");
    if (rock) press("materiau", rock.dataset.v);
    if (fr) press("fractions", fr.dataset.v);
    const v = document.getElementById("volume");
    if (v) { v.value = toPos(vol); v.dispatchEvent(new Event("input", { bubbles: true })); }
  });

  size(); idle();
  addEventListener("resize", () => { size(); if (!running) draw(idleT, res.hidden ? 0.15 : 1, false); });
})();
