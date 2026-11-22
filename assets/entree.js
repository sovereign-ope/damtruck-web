/* =========================================================================
   DAM TRUCK — Entrée & bande-annonce (page d'accueil uniquement)
   0. Pré-générique : « Entrer avec le son » / « sans le son » (le son
      exige un geste de l'utilisateur ; démarrage muet automatique après 8 s).
   1. Plongée depuis l'espace : horizon terrestre → carte du Maroc → Jorf Lasfar.
   2. Titres « Casablanca. / 30 machines. / Une seule exigence. » + plans du film.
   3. « DAM TRUCK » rempli de film → signature → ouverture sur l'image.
   4. Porte d'entrée (choix du visiteur).
   Même durée à chaque entrée (≈ 41 s), toujours passable (bouton, Échap).
   Bande-son : audio/trailer-ar.m4a (voix arabe + musique, calée sur ce
   minutage) ; après la bande-son, nappe grave synthétisée sur la porte.
   ========================================================================= */
(() => {
  const D = document, html = D.documentElement;
  if (!D.body.hasAttribute("data-entree")) return;
  const start = () => window.DTMain && window.DTMain.start();
  if (!html.classList.contains("entree-pending")) { start(); return; }

  const T = (s, v) => (window.I18N ? window.I18N.t(s, v) : s);
  const store = (k, v, local) => { try { const st = local ? localStorage : sessionStorage; if (v === undefined) return st.getItem(k); st.setItem(k, v); } catch (e) { return null; } };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
  // Bande-son du trailer (voix khaleeji + musique). Vide = projection muette.
  // Quand les vrais enregistrements arrivent : "audio/trailer.m4a".
  // Bande-son du trailer. Vide = projection muette (son du chantier disponible sur le site).
  // Quand la musique sous licence / composition originale arrive : "audio/trailer.m4a".
  const TRACK = "audio/trailer-continu.mp3"; // un seul morceau continu, composé par ElevenLabs Music sur ces repères (trailer/music_entree.mjs) ; ancien montage en 7 morceaux : audio/trailer.mp3
  const TRACK_START = 0;

  // Personalised trailer: damtruck.com/?pour=SOGEA → "Préparé pour SOGEA"
  let pour = "";
  try {
    const q = new URLSearchParams(location.search).get("pour");
    if (q) { pour = q.replace(/[^\p{L}\p{N} &'.-]/gu, "").trim().slice(0, 32); if (pour) store("dtPour", pour); }
    else pour = store("dtPour") || "";
  } catch (e) {}
  // greeting by the hour in Casablanca, and Ramadan Moubarak during the holy month
  const casaHour = (() => { try { return +new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Casablanca" }).format(new Date()); } catch (e) { return new Date().getHours(); } })();
  const ramadan = /[?&]ramadan=1/.test(location.search) || (() => { try { return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric" }).formatToParts(new Date()).find((p) => p.type === "month").value === "9"; } catch (e) { return false; } })();
  const salam = ramadan ? "رمضان مبارك" : casaHour >= 5 && casaHour < 12 ? "صباح الخير" : "مساء الخير";
  const salamFr = ramadan ? T("Ramadan Moubarak") : casaHour >= 5 && casaHour < 12 ? T("Bonjour") : T("Bonsoir");
  // short vibrations on Android, only after the visitor has interacted
  const buzz = (p) => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) {} };

  /* ------------------------------------------------------------- markup */
  const el = D.createElement("div");
  el.className = "entree";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "DAM TRUCK");
  el.innerHTML = `
    <div class="entree__stage">
      <video class="entree__vid" muted playsinline loop preload="auto" poster="images/reel-poster.jpg"><source src="images/reel.mp4" type="video/mp4"></video>
      <div class="entree__mask" aria-hidden="true"><div class="entree__word"><span class="entree__d">D</span>AM <wbr>TRUCK</div></div>
      <i class="entree__sweep" aria-hidden="true"></i>
      <i class="entree__flash" aria-hidden="true"></i><i class="entree__flare" aria-hidden="true"></i>
      <div class="entree__logo" aria-hidden="true"><img src="images/logo-mark-light.png" alt=""></div>
      <div class="entree__tag" aria-hidden="true"><i class="entree__rule"></i><span class="entree__tagline">${T("Concassage · Criblage · Matériel TP")}</span><span class="entree__place">${pour ? T("Préparé pour {n}", { n: pour }) : T("Casablanca — Maroc")}</span></div>
      <div class="entree__veil"></div>
      <div class="entree__space" aria-hidden="true">
        <div class="space__stars"></div>
        <div class="space__earth"></div>
        <svg class="space__map" viewBox="0 0 526 562"><path class="space__coast" d="M367.2 11.2 C368.3 10.8 371.7 9.8 373.8 9.0 C375.9 8.2 378.1 5.9 379.5 6.5 C381.0 7.1 381.5 10.5 382.4 12.6 C383.3 14.7 383.1 16.8 384.9 19.1 C386.7 21.3 389.8 23.7 392.8 25.9 C395.9 28.1 399.2 30.7 403.0 32.0 C406.7 33.4 411.0 34.1 415.0 33.8 C419.0 33.6 423.0 30.9 426.7 30.6 C430.5 30.3 433.3 32.2 437.2 32.0 C441.1 31.9 446.4 31.3 449.9 29.9 C453.3 28.5 456.0 23.1 457.5 23.8 C458.9 24.4 456.5 31.4 458.4 33.5 C460.3 35.6 464.9 35.5 468.9 36.0 C472.8 36.5 479.4 36.3 481.5 36.4 L492.6 45.0 L494.8 61.2 L498.0 84.6 L506.9 119.5 L516.4 127.8 L511.6 144.0 L475.2 141.1 L457.8 154.8 L434.6 160.2 L434.0 187.2 L408.7 199.8 L378.6 223.2 L345.3 234.7 L310.5 241.9 L276.6 265.7 L276.6 303.5 L276.6 363.6 L171.1 363.6 L171.1 455.4 L137.8 473.4 L137.8 531.7 L14.3 531.7 L11.1 550.8 C11.6 548.4 12.4 545.0 14.3 536.4 C16.1 527.8 18.1 512.0 22.2 500.4 C26.2 488.8 34.0 477.2 38.0 468.0 C42.1 458.8 41.6 455.0 45.9 446.4 C50.2 437.8 57.7 426.2 63.4 417.6 C69.0 409.0 74.4 405.8 79.2 396.0 C84.0 386.2 86.2 370.1 91.9 360.0 C97.5 349.9 106.5 343.0 112.5 336.6 C118.4 330.2 121.7 329.5 126.7 322.2 C131.7 314.9 133.8 300.3 141.9 293.8 C150.0 287.2 164.4 286.8 174.2 283.7 C184.0 280.6 191.5 280.5 199.6 275.4 C207.7 270.3 216.8 259.5 221.8 253.8 C226.8 248.1 225.8 247.4 229.0 241.9 C232.3 236.4 237.7 227.8 240.8 221.4 C243.8 215.0 247.6 208.6 247.1 204.5 C246.6 200.3 239.1 201.1 237.9 196.9 C236.7 192.8 239.5 185.4 240.1 180.0 C240.8 174.6 240.0 170.4 241.7 165.2 C243.4 160.0 247.4 154.2 250.3 149.4 C253.1 144.6 255.5 141.7 258.5 136.8 C261.5 131.9 264.5 125.6 267.7 120.6 C270.9 115.6 275.1 110.3 277.5 107.3 C279.9 104.2 278.5 104.4 282.0 102.6 C285.4 100.8 292.9 98.6 297.8 96.5 C302.6 94.3 307.1 91.7 310.5 90.0 C313.8 88.3 313.3 89.3 317.4 86.8 C321.5 84.2 330.2 78.4 334.5 74.9 C338.8 71.4 340.1 71.0 342.8 66.2 C345.4 61.5 347.8 52.5 350.1 46.8 C352.3 41.1 354.4 36.8 356.1 32.8 C357.8 28.7 358.9 26.7 360.2 23.0 C361.5 19.4 363.1 13.2 363.7 11.2 Z"/><circle class="space__casa" cx="310.8" cy="91.1" r="2"/><g class="space__pin" transform="translate(277.5 107.3)"><circle class="space__ring" r="2.4"/><circle class="space__ring space__ring--2" r="2.4"/><circle class="space__dot" r="1.6"/></g></svg>
        <div class="space__hud"><span data-coord>00.0000° N · 0.0000° W</span><b>${T("Jorf Lasfar")} · ${T("Maroc")}</b></div>
      </div>
      <div class="entree__beam" aria-hidden="true"></div>
      <canvas class="entree__dust" aria-hidden="true"></canvas>
      <img class="entree__rosette" src="images/guilloche-rosette.svg" alt="" aria-hidden="true">
      <div class="entree__card" aria-live="polite"><span></span></div>
      <div class="entree__pre">
        <i class="pre__scan" aria-hidden="true"></i>
        <div class="pre__hud" aria-hidden="true">
          <span class="pre__c pre__c--tl">DAM TRUCK<small>Casablanca · Maroc</small></span>
          <span class="pre__c pre__c--tr">${T("Concassage · Criblage")}<small>${T("Matériel TP")}</small></span>
          <span class="pre__c pre__c--bl">33.5731° N · 7.5898° W<small>${T("Siège · Sidi Bernoussi")}</small></span>
          <span class="pre__c pre__c--br">${T("Stations mobiles")}<small>${T("Partout au Maroc")}</small></span>
        </div>
        <img class="pre__logo" src="images/logo-light.png" alt="DAM TRUCK">
        <i class="pre__rule" aria-hidden="true"></i>
        <div class="pre__load" aria-hidden="true"><i><b></b></i><span>${T("Préparation de la projection")}</span></div>
        <p class="pre__sub">${T(TRACK ? "Une expérience en son et en image" : "Une expérience cinématographique")}</p>
        <div class="pre__btns">${TRACK
          ? `<button class="pre__play" type="button" data-pre="1"><i aria-hidden="true"></i>${T("Entrer avec le son")}</button>
          <button class="pre__mute" type="button" data-pre="0">${T("Entrer sans le son")}</button>`
          : `<button class="pre__play" type="button" data-pre="0"><i aria-hidden="true"></i>${T("Lancer la projection")}</button>`}
        </div>
        <p class="pre__hint">${TRACK ? T("Casque recommandé") + " · " : ""}<span data-pre-count></span></p>
      </div>
      <div class="entree__gate">
        <div class="gate__center">
          <span class="gate__salam${ramadan ? " is-ramadan" : ""}">${ramadan ? '<svg class="gate__moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 0 1 15.5 3.2z"/></svg>' : ""}<b lang="ar" dir="rtl">${salam}</b><i>${salamFr}</i></span>
          <span class="gate__eyebrow">${pour ? T("Bienvenue, {n}", { n: pour }) : T("Bienvenue chez DAM TRUCK")}</span>
          <h2 class="gate__title">${T("Que cherchez-vous ?").replace(/ ([?!:])/g, "\u00a0$1")}</h2>
          <div class="gate__choices">
            <a class="gate__choice" href="concassage.html#chantier" data-go>
              <span class="gate__no">I</span>
              <span class="gate__txt"><b>${T("J'ai un projet")}</b><small>${T("Concassage & criblage sur votre chantier")}</small></span>
              <i class="gate__arrow" aria-hidden="true">→</i>
            </a>
            <a class="gate__choice" href="machines.html" data-go>
              <span class="gate__no">II</span>
              <span class="gate__txt"><b>${T("Je cherche une machine")}</b><small>${T("Vente, achat & sourcing Europe")}</small></span>
              <i class="gate__arrow" aria-hidden="true">→</i>
            </a>
          </div>
          <button class="gate__enter" type="button" data-enter>${T("Découvrir DAM TRUCK")} <span aria-hidden="true">↓</span></button>
        </div>
        <div class="gate__foot">
          <div class="gate__stats">
            <div><b>30</b><span>${T("Machines")}</span></div>
            ${window.DT && DT.TONNAGE && DT.TONNAGE.show !== false ? `<div><b data-gate-tonnes>—</b><span>${T("Tonnes concassées")}</span></div>` : ""}
            <div><b>${(window.DT && DT.REFERENCES || []).length}</b><span>${T("Clients de référence")}</span></div>
          </div>
          <span class="gate__loc">Casablanca · 33.5731° N · 7.5898° W</span>
        </div>
      </div>
    </div>
    <div class="entree__bars" aria-hidden="true"><i></i><i></i></div>
    <div class="entree__ui">
      <span class="entree__brand"><img src="images/logo-mark-light.png" alt="">DAM TRUCK</span>
      <span class="entree__tools">
        <button class="entree__sound" type="button" aria-pressed="false"><i aria-hidden="true"></i><span>${T("Son")}</span></button>
        <button class="entree__skip" type="button">${T("Passer l'intro")} <span aria-hidden="true">→</span></button>
      </span>
    </div>`;
  D.body.prepend(el);
  const $ = (s) => el.querySelector(s);
  const vid = $(".entree__vid"), card = $(".entree__card span"), mask = $(".entree__mask"), word = $(".entree__word");
  vid.muted = true;

  // live tonnage on the gate
  const tEl = $("[data-gate-tonnes]");
  if (window.DTTonnes && tEl) { const upd = () => (tEl.textContent = fmt(window.DTTonnes())); upd(); setInterval(upd, 2000); }

  /* -------------------------------------------------------------- sound */
  const Snd = {
    ctx: null, master: null, on: false, drone: null,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0; this.master.connect(this.ctx.destination);
    },
    noise(dur) {
      const c = this.ctx, b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(); s.buffer = b; return s;
    },
    boom() {
      return; // score comes from the soundtrack file now
      if (!this.ctx || !this.on) return;
      const c = this.ctx, t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.8);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 2.3);
      const n = this.noise(1), f = c.createBiquadFilter(), ng = c.createGain();
      f.type = "lowpass"; f.frequency.value = 380;
      ng.gain.setValueAtTime(0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      n.connect(f).connect(ng).connect(this.master); n.start(t);
    },
    riser(dur) {
      return; // score comes from the soundtrack file now
      if (!this.ctx || !this.on) return;
      const c = this.ctx, t = c.currentTime, n = this.noise(dur), f = c.createBiquadFilter(), g = c.createGain();
      f.type = "bandpass"; f.Q.value = 3; f.frequency.setValueAtTime(180, t); f.frequency.exponentialRampToValueAtTime(3200, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f).connect(g).connect(this.master); n.start(t);
    },
    droneOn() {
      return; // nappe grave coupée (2026-11-13, Ihab) : la porte reste silencieuse après « Forbidden Echoes »
      if (!this.ctx || this.drone) return;
      const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain();
      f.type = "lowpass"; f.frequency.value = 140; g.gain.value = 0.0001;
      lfo.frequency.value = 0.08; lg.gain.value = 60; lfo.connect(lg).connect(f.frequency); lfo.start();
      const os = [55, 55.4, 82.4].map((fr) => { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.connect(f); o.start(); return o; });
      f.connect(g).connect(this.master);
      g.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 3);
      this.drone = { g, os, lfo };
    },
    set(on) {
      this.init(); if (!this.ctx) return;
      this.on = on;
      if (on) { this.ctx.resume(); this.droneOn(); }
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(on ? 0.55 : 0, this.ctx.currentTime + 2.5);
    },
    fadeOut() {
      if (!this.ctx) return;
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.4);
      setTimeout(() => { try { this.ctx.close(); } catch (e) {} }, 1600);
    },
  };
  // the trailer soundtrack (voice-over + score), timed to the timeline below
  const track = TRACK ? new Audio(TRACK) : null;
  if (track) track.preload = "auto";
  let t0 = 0, soundOn = false;
  const elapsed = () => (t0 ? (performance.now() - t0) / 1000 : 0);
  if (track) track.addEventListener("ended", () => { if (soundOn) Snd.set(true); });
  function setSound(on) {
    if (!track) return;
    soundOn = on;
    sBtn.setAttribute("aria-pressed", on);
    if (on) {
      const e = elapsed();
      if (t0 && e < (track.duration || 35) - 0.5) { try { track.currentTime = TRACK_START + e; } catch (err) {} track.volume = 1; track.play().catch(() => {}); }
      else if (t0) Snd.set(true);
    } else { track.pause(); Snd.set(false); }
  }
  function fadeTrack() {
    if (!track) return;
    const v0 = track.volume, s0 = performance.now();
    (function f() { const p = Math.min(1, (performance.now() - s0) / 1200); track.volume = Math.max(0, v0 * (1 - p)); if (p < 1) requestAnimationFrame(f); else track.pause(); })();
    Snd.fadeOut();
  }
  const sBtn = $(".entree__sound");
  if (!TRACK) sBtn.hidden = true;
  sBtn.addEventListener("click", () => setSound(sBtn.getAttribute("aria-pressed") !== "true"));

  /* --------------------------------------------------------- gold dust */
  const cv = $(".entree__dust"), ctx2 = cv.getContext("2d");
  let parts = [], dustOn = !reduce, raf = 0;
  function sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = innerWidth < 700 ? 55 : 130;
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 0.4 + Math.random() * 1.6,
      vx: 0.05 + Math.random() * 0.25, vy: -0.05 - Math.random() * 0.18, a: 0.15 + Math.random() * 0.6, p: Math.random() * 6.28,
    }));
  }
  function dust() {
    ctx2.clearRect(0, 0, innerWidth, innerHeight);
    ctx2.globalCompositeOperation = "lighter";
    parts.forEach((q) => {
      q.x += q.vx; q.y += q.vy; q.p += 0.02;
      if (q.x > innerWidth + 5) q.x = -5; if (q.y < -5) q.y = innerHeight + 5;
      const a = q.a * (0.6 + 0.4 * Math.sin(q.p));
      ctx2.fillStyle = `rgba(226,196,140,${a.toFixed(3)})`;
      ctx2.beginPath(); ctx2.arc(q.x, q.y, q.r, 0, 6.283); ctx2.fill();
    });
    if (dustOn) raf = requestAnimationFrame(dust);
  }
  sizeCanvas();
  addEventListener("resize", sizeCanvas);
  if (!reduce) dust();

  /* ----------------------------------------------------------- torch */
  if (fine && !reduce) {
    el.addEventListener("mousemove", (e) => {
      el.style.setProperty("--mx", e.clientX + "px");
      el.style.setProperty("--my", e.clientY + "px");
    });
  }

  /* ------------------------------------------------------------ timeline */
  const timers = [];
  const at = (s, fn) => timers.push(setTimeout(fn, s * 1000));
  const showCard = (txt, cls = "") => {
    card.className = cls; card.textContent = txt;
    card.parentElement.classList.remove("is-out"); card.parentElement.classList.add("is-in");
    if (!cls) { pulse("is-flare", 1500); pulse("is-shake", 500); }
    if (!cls) buzz(40);
    Snd.boom();
  };
  const hideCard = () => { card.parentElement.classList.remove("is-in"); card.parentElement.classList.add("is-out"); };
  const shot = (t) => {
    el.classList.add("is-shot");
    try { vid.currentTime = t; } catch (e) {}
    vid.play().catch(() => {});
  };
  const unshot = () => el.classList.remove("is-shot");
  const pulse = (cls, ms) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
  // a fast flash-cut montage through the newest footage
  const burst = (times, step) => times.forEach((tt, i) => at(i * step, () => { shot(tt); pulse("is-flash", 240); if (i % 2 === 0) buzz(15); }));

  // Final act (≈12 s): the name fills with film in a slow push-in, a gold
  // rule and signature line settle under it, then the name opens onto the
  // full film, which holds for a breath before the gate appears.
  function revealWord(delay) {
    at(delay, () => {
      el.classList.add("is-mask");
      try { vid.currentTime = 12.4; } catch (e) {}
      vid.play().catch(() => {});
      Snd.riser(4);
    });
    at(delay + 4.2, () => { el.classList.add("is-tag"); Snd.boom(); });
    at(delay + 8.2, () => {
      // expand from the stem of the "D" so the white fills the screen
      const r = $(".entree__d").getBoundingClientRect();
      const w = word.getBoundingClientRect();
      word.style.transformOrigin = `${r.left - w.left + r.width * 0.16}px ${r.top - w.top + r.height * 0.52}px`;
      el.classList.add("is-expand");
      buzz([30, 60, 30, 60, 120]);
      Snd.riser(2.2);
    });
    at(delay + 10.7, () => { el.classList.add("is-full"); Snd.boom(); });
    at(delay + 12.4, openGate);
  }

  let gateOpen = false;
  function openGate() {
    if (gateOpen) return;
    gateOpen = true;
    timers.forEach(clearTimeout);
    hideCard(); unshot();
    el.classList.remove("is-pre", "is-space", "is-map", "is-zoom", "is-mask", "is-expand", "is-tag", "is-full");
    el.classList.add("is-gate");
    vid.play().catch(() => {});
    store("dtSeen", "1", true);
    $(".entree__skip").innerHTML = `${T("Entrer")} <span aria-hidden="true">→</span>`;
    setTimeout(() => { const b = $(".gate__choice"); b && b.focus({ preventScroll: true }); }, 900);
  }

  function enterSite() {
    store("dtGate", "1");
    el.classList.add("is-leaving");
    fadeTrack();
    html.classList.remove("entree-pending");
    setTimeout(start, 500);
    setTimeout(() => dispatchEvent(new Event("dt:entered")), 1200);
    setTimeout(() => { dustOn = false; cancelAnimationFrame(raf); el.remove(); }, 1500);
  }

  $("[data-enter]").addEventListener("click", enterSite);
  el.querySelectorAll("[data-go]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    store("dtGate", "1"); store("dtIntro", "1"); store("dtNav", "1");
    el.classList.add("is-leaving");
    fadeTrack();
    setTimeout(() => (location.href = a.href), 650);
  }));
  $(".entree__skip").addEventListener("click", () => { if (gateOpen) return enterSite(); if (!started) run(false); openGate(); });
  D.addEventListener("keydown", function k(e) {
    if (!D.body.contains(el)) return D.removeEventListener("keydown", k);
    if (e.key === "Escape") { if (gateOpen) return enterSite(); if (!started) run(false); openGate(); }
  });
  // scrolling / swiping on the gate also enters
  let wheelLock = false;
  el.addEventListener("wheel", (e) => { if (gateOpen && e.deltaY > 30 && !wheelLock) { wheelLock = true; enterSite(); } }, { passive: true });

  if (reduce) { openGate(); return; }

  // coordinates scramble towards Jorf Lasfar
  function coords() {
    const c = $("[data-coord]"), s0 = performance.now();
    (function f() {
      const p = Math.min(1, (performance.now() - s0) / 1800), e = 1 - Math.pow(1 - p, 3);
      c.textContent = `${(33.12 * e).toFixed(4)}° N · ${(8.64 * e).toFixed(4)}° W`;
      if (p < 1) requestAnimationFrame(f);
    })();
  }

  // the full trailer, identical on every entry (cues match the soundtrack)
  let started = false;
  function run(withSound) {
    if (started) return;
    started = true;
    clearInterval(countdown);
    el.classList.remove("is-pre");
    t0 = performance.now();
    if (withSound && track) { soundOn = true; sBtn.setAttribute("aria-pressed", "true"); Snd.init(); track.currentTime = TRACK_START; track.play().catch(() => {}); }
    // the visitor's choice carries on into the site (site sound, phone tilt)
    try { localStorage.setItem("dtSound", withSound ? "1" : "0"); } catch (e) {}
    if (window.DTSound) window.DTSound.on = !!withSound;
    if (window.DTAskTilt) window.DTAskTilt();
    vid.play().then(() => vid.pause()).catch(() => {}); // unlock video on iOS
    el.classList.add("is-space");
    at(1.2, () => el.classList.add("is-map"));
    at(4.4, () => { el.classList.add("is-zoom"); coords(); });
    at(5.0, () => showCard(pour ? T("DAM TRUCK présente — pour {n}", { n: pour }) : T("DAM TRUCK présente"), "is-small"));
    at(6.8, () => { hideCard(); el.classList.remove("is-space", "is-map", "is-zoom"); });
    at(7.4, () => showCard(T("Casablanca.")));
    at(9.1, hideCard);
    at(9.3, () => shot(0.5));
    at(10.9, unshot);
    at(11.2, () => showCard(T("30 machines.")));
    at(12.9, hideCard);
    at(13.1, () => shot(4.5));
    at(14.7, unshot);
    at(14.9, () => showCard(T("Une seule exigence.")));
    at(16.6, hideCard);
    at(16.8, () => shot(8.3));
    at(18.3, unshot);
    // new footage (reel 23.2 s →): gravel, the team, then a flash-cut montage
    at(18.5, () => showCard(T("Au millimètre.")));
    at(20.2, hideCard);
    at(20.4, () => shot(27.4));
    at(22.0, unshot);
    at(22.2, () => showCard(T("Notre flotte.")));
    at(23.9, hideCard);
    at(24.1, () => shot(23.9));
    at(25.6, () => burst([34.4, 31.2, 41.4, 38.2, 44.6, 28.0], 0.42));
    at(28.2, unshot);
    revealWord(28.4);
  }

  // pre-roll: choose sound (a click is required for audio); silent start after 8 s
  el.classList.add("is-pre");
  let left = 8;
  const cEl = $("[data-pre-count]");
  const tick = () => { cEl.textContent = T("Projection dans {n} s", { n: left }); if (left-- <= 0) run(false); };
  let countdown = 0;
  setTimeout(() => { if (started) return; tick(); countdown = setInterval(tick, 1000); }, reduce ? 0 : 4400);
  el.querySelectorAll("[data-pre]").forEach((b) => b.addEventListener("click", () => run(b.dataset.pre === "1")));
  setTimeout(() => { const b = $(".pre__play"); b && b.focus({ preventScroll: true }); }, 4500);
})();
