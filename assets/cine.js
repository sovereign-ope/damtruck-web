/* =========================================================================
   DAM TRUCK — effets cinéma (toutes les pages)
   1. Son du chantier : ambiance + bruitages enregistrés sur nos machines
      (audio/ambiance.m4a, sfx-concasseur.m4a, sfx-gravier.m4a). Coupé par
      défaut ; un bouton l'active, le choix est mémorisé (dtSound).
   2. Inclinaison du téléphone : les panneaux du film et la poussière suivent.
   3. Poussière dorée sur le film d'accueil, repoussée par le doigt / la souris.
   4. « DAM TRUCK » du pied de page se remplit de gravier au fil du défilement.
   5. Sceau de cire sur la demande de devis (window.DTSeal).
   ========================================================================= */
(() => {
  const D = document, html = D.documentElement;
  const T = (s, v) => (window.I18N ? window.I18N.t(s, v) : s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const buzz = (p) => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) {} };

  /* --------------------------------------------- Ramadan Moubarak (site-wide) */
  const ramadan = /[?&]ramadan=1/.test(location.search) || (() => { try { return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric" }).formatToParts(new Date()).find((p) => p.type === "month").value === "9"; } catch (e) { return false; } })();
  if (ramadan) {
    html.classList.add("is-ramadan");
    const name = D.querySelector(".brand__name");
    if (name) name.insertAdjacentHTML("afterend", `<span class="brand__ramadan" title="${T("Ramadan Moubarak")}" aria-label="${T("Ramadan Moubarak")}"><svg viewBox="0 0 24 24"><path d="M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 0 1 15.5 3.2z"/></svg></span>`);
  }

  /* ------------------------------------------------------------ 1. sound */
  const Sound = {
    on: store("dtSound") === "1",
    amb: null, fx: {},
    load() {
      if (this.amb) return;
      this.amb = new Audio("audio/ambiance.m4a"); this.amb.loop = true; this.amb.volume = 0;
      ["concasseur", "gravier"].forEach((k) => { const a = new Audio(`audio/sfx-${k}.m4a`); a.preload = "auto"; this.fx[k] = a; });
    },
    fade(a, to, ms = 1200) {
      const v0 = a.volume, s0 = performance.now();
      (function f() { const p = Math.min(1, (performance.now() - s0) / ms); a.volume = v0 + (to - v0) * p; if (p < 1) requestAnimationFrame(f); else if (to === 0) a.pause(); })();
    },
    ambOn() {
      if (!this.on || D.hidden || html.classList.contains("entree-pending")) return;
      this.load(); this.amb.play().then(() => this.fade(this.amb, 0.16)).catch(() => {});
    },
    set(on) {
      this.on = on; store("dtSound", on ? "1" : "0");
      btn && btn.setAttribute("aria-pressed", on);
      if (on) { this.ambOn(); this.play("gravier", 0.5); } else if (this.amb) this.fade(this.amb, 0, 500);
    },
    play(k, vol = 0.7) {
      if (!this.on) return;
      this.load(); const a = this.fx[k]; if (!a) return;
      try { a.currentTime = 0; a.volume = vol; a.play().catch(() => {}); } catch (e) {}
    },
  };
  window.DTSound = Sound;

  // floating sound switch (equaliser bars)
  const btn = D.createElement("button");
  btn.type = "button"; btn.className = "snd";
  btn.setAttribute("aria-pressed", Sound.on);
  btn.setAttribute("aria-label", T("Son du chantier"));
  btn.innerHTML = `<i aria-hidden="true"><b></b><b></b><b></b><b></b></i><span>${T("Son du chantier")}</span>`;
  D.body.appendChild(btn);
  btn.addEventListener("click", () => Sound.set(!Sound.on));
  // browsers start audio only after a gesture: the first tap / key resumes the ambiance
  const wake = () => { Sound.ambOn(); askTilt(); D.removeEventListener("pointerdown", wake); D.removeEventListener("keydown", wake); };
  D.addEventListener("pointerdown", wake); D.addEventListener("keydown", wake);
  D.addEventListener("visibilitychange", () => { if (!Sound.amb) return; if (D.hidden) Sound.fade(Sound.amb, 0, 300); else Sound.ambOn(); });
  addEventListener("dt:entered", () => Sound.ambOn());
  // the crusher answers when a visitor picks a door
  D.addEventListener("click", (e) => { if (e.target.closest(".door, .gate__choice, .cta .btn--ink, .cine .btn--gold")) Sound.play("concasseur", 0.8); });

  /* ------------------------------------------------------------- 2. tilt */
  let tiltAsked = false;
  function askTilt() {
    if (tiltAsked || reduce) return; tiltAsked = true;
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") DOE.requestPermission().then((r) => r === "granted" && listenTilt()).catch(() => {});
    else listenTilt();
  }
  window.DTAskTilt = askTilt;
  let tx = 0, ty = 0;
  function listenTilt() {
    let base = null;
    addEventListener("deviceorientation", (e) => {
      if (e.beta == null) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      tx = Math.max(-1, Math.min(1, (e.gamma - base.g) / 18));
      ty = Math.max(-1, Math.min(1, (e.beta - base.b) / 18));
      html.style.setProperty("--tilt-x", tx.toFixed(3));
      html.style.setProperty("--tilt-y", ty.toFixed(3));
    });
  }
  // touch screens without a permission prompt (Android) can listen straight away
  if (!reduce && matchMedia("(pointer: coarse)").matches && !(window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission)) { tiltAsked = true; listenTilt(); }

  /* ------------------------------------------------------------- 3. dust */
  const hero = D.querySelector(".cine");
  if (hero && !reduce) {
    const cv = D.createElement("canvas"); cv.className = "cine__dust"; cv.setAttribute("aria-hidden", "true");
    hero.appendChild(cv);
    const c = cv.getContext("2d");
    let W = 0, H = 0, parts = [], px = -999, py = -999, run = false, raf = 0;
    const size = () => {
      const r = hero.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = W < 700 ? 70 : 160;
      parts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.9, vx: 0.15 + Math.random() * 0.45, vy: -0.08 + Math.random() * 0.12, ox: 0, oy: 0, a: 0.12 + Math.random() * 0.5, p: Math.random() * 6.3 }));
    };
    const move = (e) => { const r = hero.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; px = t.clientX - r.left; py = t.clientY - r.top; };
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("touchmove", move, { passive: true });
    hero.addEventListener("pointerleave", () => { px = py = -999; });
    function frame() {
      c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = "lighter";
      for (const q of parts) {
        q.x += q.vx * q.z + tx * 0.6 * q.z; q.y += q.vy * q.z + ty * 0.4 * q.z; q.p += 0.015;
        const dx = q.x - px, dy = q.y - py, d2 = dx * dx + dy * dy;
        if (d2 < 16000) { const f = (1 - d2 / 16000) * 3.2; q.ox += (dx / Math.sqrt(d2 + 1)) * f; q.oy += (dy / Math.sqrt(d2 + 1)) * f; }
        q.ox *= 0.94; q.oy *= 0.94;
        if (q.x > W + 10) q.x = -10; if (q.x < -10) q.x = W + 10; if (q.y < -10) q.y = H + 10; if (q.y > H + 10) q.y = -10;
        const a = q.a * (0.55 + 0.45 * Math.sin(q.p));
        c.fillStyle = `rgba(226,196,140,${a.toFixed(3)})`;
        c.beginPath(); c.arc(q.x + q.ox, q.y + q.oy, q.z * 1.5, 0, 6.283); c.fill();
      }
      if (run) raf = requestAnimationFrame(frame);
    }
    size(); addEventListener("resize", size);
    new IntersectionObserver((en) => { run = en[0].isIntersecting; cancelAnimationFrame(raf); if (run) raf = requestAnimationFrame(frame); }).observe(hero);
  }

  /* ---------------------------------------------- 4. gravel fills the name */
  const big = D.querySelector(".footer__big");
  if (big) {
    big.setAttribute("data-text", big.textContent.trim());
    big.classList.add("is-gravel");
    let full = false;
    const upd = () => {
      const max = D.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 1;
      big.style.setProperty("--fill", (p * 100).toFixed(1) + "%");
      if (p > 0.995 && !full) { full = true; big.classList.add("is-full"); Sound.play("gravier", 0.6); buzz(30); }
      else if (p < 0.97 && full) { full = false; big.classList.remove("is-full"); }
    };
    addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
  }

  /* ------------------------------------- letterbox on the film chapters */
  if (!reduce) {
    const io = new IntersectionObserver((en) => en.forEach((e) => e.target.classList.toggle("is-letterbox", e.isIntersecting)), { threshold: 0.35 });
    D.querySelectorAll(".qfilm, .scrub__stage").forEach((s) => {
      s.insertAdjacentHTML("beforeend", '<i class="cine-bars cine-bars--t" aria-hidden="true"></i><i class="cine-bars cine-bars--b" aria-hidden="true"></i>');
      io.observe(s);
    });
  }

  /* --------------------------------------- 6. tonnes people can picture */
  const cmp = D.querySelector("[data-cmp]");
  if (cmp && window.DTTonnes && D.contains(cmp) && !(window.DT && DT.TONNAGE && DT.TONNAGE.show === false)) {
    const nf = (n) => new Intl.NumberFormat(html.lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));
    // reference weights, rounded: semi-trailer load 25 t · Eiffel Tower ≈ 10 100 t ·
    // football pitch (105 × 68 m) under 1 m of gravel ≈ 11 400 t · 1 km of road base (7 m × 30 cm) ≈ 4 000 t
    const SAYS = [
      (t) => T("= {n} semi-remorques pleines", { n: nf(t / 25) }),
      (t) => T("= {n} fois le poids de la tour Eiffel", { n: nf(t / 10100) }),
      (t) => T("= {n} terrains de football couverts d'un mètre de gravier", { n: nf(t / 11400) }),
      (t) => T("= la couche de base de {n} km de route", { n: nf(t / 4000) }),
    ];
    let i = 0;
    const say = () => {
      cmp.classList.remove("is-in"); void cmp.offsetWidth;
      cmp.textContent = SAYS[i++ % SAYS.length](window.DTTonnes());
      cmp.classList.add("is-in");
    };
    say(); setInterval(say, 5500);
  }

  /* ------------------------------- quote form: city chosen on the home map */
  const lieu = D.getElementById("lieu");
  if (lieu) {
    let v = null; try { v = sessionStorage.getItem("dtLieu"); sessionStorage.removeItem("dtLieu"); } catch (e) {}
    if (v && !lieu.value) { lieu.value = v; lieu.dispatchEvent(new Event("input", { bubbles: true })); }
  }

  /* ------------------------------------------------------- 5. wax seal */
  window.DTSeal = (then, wait = 1300) => {
    if (reduce) { then && then(); return; }
    D.querySelectorAll(".seal-fx").forEach((n) => n.remove());
    const s = D.createElement("div"); s.className = "seal-fx"; s.setAttribute("aria-hidden", "true");
    s.innerHTML = `<div class="seal-fx__wax"><img src="images/logo-mark-light.png" alt=""><span>${T("Demande scellée")}</span></div>`;
    D.body.appendChild(s);
    setTimeout(() => { buzz([20, 40, 90]); Sound.play("concasseur", 0.9); }, 380);
    setTimeout(() => s.classList.add("is-out"), wait + 400);
    setTimeout(() => s.remove(), wait + 1200);
    const card = D.querySelector(".dossier, [data-dossier]");
    if (card) card.classList.add("is-sealed");
    if (then) setTimeout(then, wait);
  };
})();
