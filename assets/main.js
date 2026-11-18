/* =========================================================================
   DAM TRUCK — interactions
   ========================================================================= */
(() => {
  const D = document;
  const html = D.documentElement;
  html.classList.add("js");
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DT = window.DT || {};
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} },
  };
  // machines (achat / vente) → Mohammed Damnati ; concassage & criblage → Ihab Damnati
  const waNum = () => (/machines|inspection/.test(location.pathname) ? DT.waMachines : DT.wa) || DT.wa;
  const waLink = (msg) => `https://wa.me/${waNum()}?text=${encodeURIComponent(msg)}`;
  const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
  const T = (str, v) => (window.I18N ? window.I18N.t(str, v) : String(str).replace(/\{(\w+)\}/g, (_, k) => (v && k in v ? v[k] : "")));
  const LOC = (window.I18N && window.I18N.locale) || "fr-FR";
  const dash = (v) => (v === undefined || v === null || v === "" ? "—" : v);

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Compteur de tonnes « en direct » : base + cadence journalière (data.js → TONNAGE) */
  window.DTTonnes = () => {
    const c = DT.TONNAGE; if (!c || c.show === false) return 0;
    const t0 = new Date(c.since + "T00:00:00").getTime();
    return Math.floor(c.base + (Math.max(0, Date.now() - t0) / 86400000) * c.perDay);
  };

  /* ---------------------------------------------------------------- intro */
  const fromNav = store.get("dtNav") === "1";
  store.del("dtNav");
  let started = false;
  function start() {
    if (started) return;
    started = true;
    const c = $(".cine");
    if (c) c.classList.add("is-on");
    initReveals();
  }
  // Accueil : l'entrée (assets/entree.js) remplace l'intro et appelle start() à la sortie
  window.DTMain = { start };
  const gated = html.classList.contains("entree-pending");
  if (gated) {
    store.set("dtIntro", "1");
  } else if (!fromNav && !store.get("dtIntro") && !reduce && $("[data-intro]")) {
    store.set("dtIntro", "1");
    const el = D.createElement("div");
    el.className = "intro";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="intro__inner">
        <svg class="intro__mark" viewBox="0 0 48 48" fill="none">
          <defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7bd86"/><stop offset="1" stop-color="#8c6f3f"/></linearGradient></defs>
          <rect x="1.25" y="1.25" width="45.5" height="45.5" stroke="url(#ig)" stroke-width="1"/>
          <path d="M6 6 L42 6 L42 42 L6 42 Z" stroke="url(#ig)" stroke-width=".4" opacity=".6"/>
          <text x="24" y="31.5" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="15" letter-spacing="2" fill="url(#ig)">DT</text>
        </svg>
        <div class="intro__name">DAM TRUCK</div>
        <div class="intro__line"></div>
        <div class="intro__sub">Concassage · Criblage · Matériel TP</div>
      </div>`;
    D.body.appendChild(el);
    const exit = () => {
      if (el.classList.contains("is-exit")) return;
      el.classList.add("is-exit");
      setTimeout(start, 250);
      setTimeout(() => el.remove(), 1100);
    };
    setTimeout(exit, 2500);
    el.addEventListener("click", exit);
    D.addEventListener("keydown", function k(e) { if (e.key === "Escape" || e.key === "Enter") { exit(); D.removeEventListener("keydown", k); } });
  } else {
    store.set("dtIntro", "1");
    requestAnimationFrame(start);
  }

  /* ----------------------------------------------------------- page wipe */
  const wipe = D.createElement("div");
  wipe.className = "wipe" + (fromNav && !reduce ? " is-cover" : "");
  wipe.setAttribute("aria-hidden", "true");
  wipe.innerHTML = '<i class="wipe__half wipe__half--t"></i><i class="wipe__half wipe__half--b"></i><img class="wipe__logo" src="images/logo-mark-light.png" alt="">';
  // once open, the shutter leaves the page entirely (no layer can linger on screen)
  const parkWipe = () => setTimeout(() => { if (wipe.classList.contains("is-out")) wipe.classList.add("is-done"); }, 1200);
  if (!(fromNav && !reduce)) wipe.classList.add("is-done");
  D.body.appendChild(wipe);
  if (fromNav && !reduce) {
    let opened = false;
    const open = () => { if (opened) return; opened = true; wipe.classList.remove("is-cover"); wipe.classList.add("is-out"); parkWipe(); };
    requestAnimationFrame(() => requestAnimationFrame(open));
    setTimeout(open, 120); // fallback when animation frames are throttled
  }

  D.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || reduce) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return; // same page (hash links)
    e.preventDefault();
    store.set("dtNav", "1");
    wipe.classList.remove("is-out", "is-done");
    void wipe.offsetWidth;
    wipe.classList.add("is-in");
    setTimeout(() => (location.href = url.href), 560);
  });
  addEventListener("pageshow", (e) => { if (e.persisted) { wipe.className = "wipe is-done"; } });

  /* -------------------------------------------------------------- header */
  const header = $(".header");
  const darks = $$("[data-dark]");
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    if (header) {
      const mid = header.offsetHeight / 2;
      const overDark = darks.some((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
      header.classList.toggle("is-dark", overDark);
      header.classList.toggle("is-solid", y > 30);
      const hide = y > 320 && y > lastY + 2 && !html.classList.contains("menu-open") && !D.body.classList.contains("drawer-lock");
      if (hide) header.classList.add("is-hidden");
      else if (y < lastY - 2 || y < 320) header.classList.remove("is-hidden");
    }
    const wa = $(".wa-float");
    if (wa) wa.classList.toggle("is-on", y > 500);
    lastY = y;
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* --------------------------------------------------------- mobile menu */
  const toggle = $(".nav__toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = html.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open);
      D.body.style.overflow = open ? "hidden" : "";
    });
    $$(".mnav a").forEach((a) => a.addEventListener("click", () => { html.classList.remove("menu-open"); D.body.style.overflow = ""; }));
  }

  /* ------------------------------------------------------ kinetic titles */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = D.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(D.createTextNode(" ")); return; }
            const w = D.createElement("span"); w.className = "kw";
            const inner = D.createElement("span"); inner.className = "kw__i";
            inner.style.transitionDelay = (i++ * 0.07) + "s";
            inner.textContent = p; w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
  }
  $$(".kinetic").forEach(splitWords);

  /* ------------------------------------------------------------- reveals */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dur = 1800; const t0 = performance.now();
    const sup = el.querySelector("sup"); const supHTML = sup ? sup.outerHTML : "";
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.round(target * (1 - Math.pow(1 - p, 4)));
      el.innerHTML = fmt(v) + supHTML;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function initReveals() {
    const els = $$(".reveal, .img-reveal, .kinetic, .bcard-scene, [data-count]");
    if (!("IntersectionObserver" in window) || reduce) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const t = en.target;
        t.classList.add("is-in");
        if (t.dataset.count && !t.dataset.done) { t.dataset.done = 1; countUp(t); }
        io.unobserve(t);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  /* -------------------------------------------------- cursor & magnetic */
  if (fine && !reduce) {
    html.classList.add("has-cursor");
    const c = D.createElement("div"); c.className = "cursor";
    const d = D.createElement("div"); d.className = "cursor__dot";
    D.body.append(c, d);
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; d.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`; }, { passive: true });
    (function loop() {
      cx += (mx - cx) * 0.16; cy += (my - cy) * 0.16;
      c.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    D.addEventListener("mouseover", (e) => {
      const v = e.target.closest("[data-cursor='view']");
      c.classList.toggle("is-view", !!v);
      c.classList.toggle("is-hover", !v && !!e.target.closest("a, button, .chip, input, select, textarea, label"));
    });
    $$(".btn").forEach((b) => {
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("mouseleave", () => (b.style.transform = ""));
    });
  }

  /* ------------------------------------------------- hero video fallback */
  $$("video[data-bg]").forEach((v) => {
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
    v.addEventListener("error", () => v.remove(), true);
  });

  /* --------------------------------------------- hero film (3 panneaux) */
  const cine = $(".cine");
  if (cine) {
    const vids = $$("video[data-cine]", cine);
    const SRC = "images/reel.mp4";
    // Casablanca clock: after working hours the hero opens on the dusk shot
    const HRS = DT.HOURS || { start: 7, end: 19 };
    const casaHour = () => +new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Casablanca", hour: "2-digit", hour12: false }).format(new Date()) % 24;
    const night = () => { const h = casaHour(); return h < HRS.start || h >= HRS.end; };
    if (night()) { html.classList.add("is-night"); vids.forEach((v, i) => (v.dataset.offset = String(19.8 + i * 1.1))); }
    const rec = $(".cine__rec", cine);
    const clock = () => {
      const hm = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit" }).format(new Date());
      const n = night();
      html.classList.toggle("is-night", n);
      if (rec) rec.textContent = n ? T("{t} à Casablanca · reprise à {h}h00", { t: hm, h: HRS.start }) : T("{t} à Casablanca · stations en production", { t: hm });
    };
    clock(); setInterval(clock, 20000);
    const visible = (v) => getComputedStyle(v.parentElement).display !== "none";
    const arm = () => {
      vids.forEach((v) => {
        if (!visible(v) || v.dataset.armed) return;
        v.dataset.armed = "1";
        v.muted = true;
        if (!v.querySelector("source")) { const s = D.createElement("source"); s.src = SRC; s.type = "video/mp4"; v.appendChild(s); }
        v.preload = "auto";
        const go = () => {
          const off = parseFloat(v.dataset.offset) || 0;
          if (off && v.duration) v.currentTime = off % v.duration;
          if (!reduce) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
        };
        v.readyState >= 1 ? go() : v.addEventListener("loadedmetadata", go, { once: true });
        v.load();
      });
    };
    arm();
    let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(arm, 250); });
    // timecode in the HUD follows the first panel
    const tc = $("[data-tc]", cine), v0 = vids[0];
    const pad = (n) => String(Math.floor(n)).padStart(2, "0");
    (function tick() {
      if (tc && v0 && !v0.paused) { const t = v0.currentTime; tc.textContent = `${pad(t / 60)}:${pad(t % 60)}:${pad((t % 1) * 25)}`; }
      requestAnimationFrame(tick);
    })();
    // pause off-screen to save battery and data
    new IntersectionObserver((en) => {
      vids.forEach((v) => { if (!v.dataset.armed || reduce) return; en[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); });
    }, { threshold: 0.05 }).observe(cine);
  }

  /* ------------------------------------- films courts chargés à la demande
     <video data-lazy data-src="…" [data-seg="start-end"]> : the file is only
     fetched when the video nears the screen (hidden ones never load), plays
     while visible, pauses off-screen, and loops its segment if one is given. */
  const lazyVids = $$("video[data-lazy]");
  if (lazyVids.length && "IntersectionObserver" in window) {
    const seg = (v) => (v.dataset.seg ? v.dataset.seg.split("-").map(parseFloat) : null);
    const vio = new IntersectionObserver((entries) => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) {
          if (!v.src) {
            v.muted = true;
            v.preload = "auto";
            v.src = v.dataset.src;
            const s = seg(v);
            if (s) {
              v.loop = false;
              v.addEventListener("loadedmetadata", () => { v.currentTime = s[0]; }, { once: true });
              v.addEventListener("timeupdate", () => { if (v.currentTime >= s[1] - 0.06 || v.currentTime < s[0] - 0.3) v.currentTime = s[0]; });
              v.addEventListener("ended", () => { v.currentTime = s[0]; v.play().catch(() => {}); });
            }
          }
          if (!reduce) v.play().catch(() => {});
        } else if (v.src) v.pause();
      });
    }, { rootMargin: "300px 0px" });
    lazyVids.forEach((v) => vio.observe(v));
  }

  /* ------------------------------------------------- compteur (odomètre) */
  const odo = $("[data-odo]");
  // no real figures yet → the live counter stays off the page (never show invented tonnages)
  if (odo && DT.TONNAGE && DT.TONNAGE.show === false) { const box = odo.closest(".livet"); if (box) box.remove(); }
  if (odo && D.contains(odo) && window.DTTonnes) {
    let shape = "", live = false;
    const digits = (n) => fmt(n).replace(/[  ]/g, " ");
    function render(n, zero) {
      const str = digits(n);
      if (str !== shape && str.replace(/\d/g, "0") !== shape.replace(/\d/g, "0")) {
        odo.innerHTML = [...str].map((ch) => (/\d/.test(ch)
          ? `<span class="odo__d"><span class="odo__col">${"0123456789".split("").map((d) => `<span>${d}</span>`).join("")}</span></span>`
          : `<span class="odo__sep"></span>`)).join("") + `<span class="odo__unit">${T("tonnes")}</span>`;
      }
      shape = str;
      const cols = $$(".odo__col", odo); let i = 0;
      [...str].forEach((ch) => { if (/\d/.test(ch)) cols[i++].style.transform = `translateY(-${zero ? 0 : +ch * 10}%)`; });
      odo.setAttribute("aria-label", `${str} ${T("tonnes")}`);
    }
    render(window.DTTonnes(), true);
    new IntersectionObserver((en, obs) => {
      if (!en[0].isIntersecting) return;
      obs.disconnect(); live = true;
      setTimeout(() => render(window.DTTonnes()), 300);
      setInterval(() => render(window.DTTonnes()), 2600);
    }, { threshold: 0.4 }).observe(odo);
  }

  /* --------------------------------------------- chapitres + pellicule */
  const chaps = $$("[data-chapter]");
  if (chaps.length > 2) {
    const secs = chaps.map((c, i) => { const s = c.closest("section") || c; if (!s.id) s.id = "chapitre-" + (i + 1); return s; });
    const nav = D.createElement("nav");
    nav.className = "reel-nav";
    nav.setAttribute("aria-label", T("Chapitres"));
    nav.innerHTML = chaps.map((c, i) => `<a href="#${secs[i].id}">${c.dataset.chapter}<span>${T(c.dataset.title)}</span></a>`).join("");
    D.body.appendChild(nav);
    const links = $$("a", nav);
    let last = -1;
    const onChap = () => {
      nav.classList.toggle("is-on", scrollY > innerHeight * 0.7);
      let idx = -1;
      secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * 0.45) idx = i; });
      if (idx !== last) {
        links.forEach((a, i) => a.classList.toggle("is-on", i === idx));
        if (idx >= 0) { const a = links[idx]; a.classList.add("flash"); setTimeout(() => a.classList.remove("flash"), 1600); }
        last = idx;
      }
    };
    addEventListener("scroll", onChap, { passive: true });
    onChap();
  }

  /* ------------------------------------------- film piloté par le scroll */
  const sc = $("[data-scrub]");
  if (sc) {
    const n = +sc.dataset.frames, base = sc.dataset.src;
    const cv = $(".scrub__cv", sc), cx = cv.getContext("2d");
    const lines = $$(".scrub__line", sc), bar = $(".scrub__bar i", sc);
    const imgs = []; let loaded = false, cur = -1;
    const ok = (im) => im && im.complete && im.naturalWidth;
    function load() {
      if (loaded) return; loaded = true;
      for (let i = 0; i < n; i++) {
        const im = new Image(); im.decoding = "async";
        im.onload = () => { if (cur === -1 || i === cur) { cur = -1; onScrub(); } };
        im.src = `${base}${String(i).padStart(2, "0")}.jpg`; imgs[i] = im;
      }
    }
    new IntersectionObserver((e) => { if (e[0].isIntersecting) load(); }, { rootMargin: "150% 0px" }).observe(sc);
    function size() { const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; cur = -1; }
    function draw(i) {
      if (i === cur) return;
      let im = imgs[i];
      if (!ok(im)) { for (let k = 1; k < n && !ok(im); k++) im = ok(imgs[i - k]) ? imgs[i - k] : imgs[i + k]; }
      if (!ok(im)) return;
      cur = i;
      const W = cv.width, H = cv.height, iw = im.naturalWidth, ih = im.naturalHeight;
      cx.fillStyle = "#000"; cx.fillRect(0, 0, W, H);
      if (W / H > 0.9) {
        // landscape screen: blurred backdrop + the vertical film framed on the right
        const s = Math.max(W / iw, H / ih);
        cx.globalAlpha = 0.32; cx.filter = "blur(26px)";
        cx.drawImage(im, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
        cx.filter = "none"; cx.globalAlpha = 1;
        const w2 = iw * (H / ih), x2 = W * 0.64 - w2 / 2;
        cx.drawImage(im, x2, 0, w2, H);
        const fade = Math.min(140, w2 * 0.25);
        let g = cx.createLinearGradient(x2, 0, x2 + fade, 0); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
        cx.fillStyle = g; cx.fillRect(x2, 0, fade, H);
        g = cx.createLinearGradient(x2 + w2 - fade, 0, x2 + w2, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
        cx.fillStyle = g; cx.fillRect(x2 + w2 - fade, 0, fade, H);
      } else {
        const s = Math.max(W / iw, H / ih);
        cx.drawImage(im, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
      }
    }
    function onScrub() {
      const r = sc.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      draw(Math.min(n - 1, Math.floor(p * n)));
      bar.style.width = p * 100 + "%";
      lines.forEach((l) => l.classList.toggle("is-on", p >= +l.dataset.from && p < +l.dataset.to));
    }
    addEventListener("scroll", onScrub, { passive: true });
    addEventListener("resize", () => { size(); onScrub(); });
    size(); onScrub();
  }

  /* --------------------------------------------- effet secret (pluie d'or)
     Type "DT" anywhere (outside form fields), or tap the big "DAM TRUCK"
     in the footer three times: gold flakes rain over the page. */
  let raining = false;
  function goldRain() {
    if (raining || reduce) return;
    raining = true;
    const c = D.createElement("canvas"), g = c.getContext("2d");
    c.className = "goldrain"; c.setAttribute("aria-hidden", "true");
    const toast = D.createElement("div");
    toast.className = "goldrain__toast";
    toast.innerHTML = `<b>DT</b><span>${T("Vous avez trouvé le secret de la maison.")}</span>`;
    D.body.append(c, toast);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; g.scale(dpr, dpr);
    const cols = ["#f3e2b4", "#e3cc95", "#d7bd86", "#b69256", "#8c6f3f"];
    const flakes = Array.from({ length: innerWidth < 700 ? 140 : 260 }, () => ({
      x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.9, w: 3 + Math.random() * 7, h: 2 + Math.random() * 4,
      vy: 1.6 + Math.random() * 2.6, sw: Math.random() * 6.28, ss: 0.02 + Math.random() * 0.04, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.2,
      col: cols[Math.floor(Math.random() * cols.length)], dot: Math.random() < 0.35,
    }));
    const t0 = performance.now();
    (function frame(now) {
      const el = (now - t0) / 1000, fade = el > 4.2 ? Math.max(0, 1 - (el - 4.2) / 1.2) : 1;
      g.clearRect(0, 0, innerWidth, innerHeight);
      g.globalAlpha = fade;
      flakes.forEach((f) => {
        f.y += f.vy; f.sw += f.ss; f.rot += f.vr; f.x += Math.sin(f.sw) * 0.8;
        g.save(); g.translate(f.x, f.y); g.rotate(f.rot); g.fillStyle = f.col;
        if (f.dot) { g.beginPath(); g.arc(0, 0, f.h * 0.6, 0, 6.283); g.fill(); }
        else { g.scale(1, Math.abs(Math.cos(f.sw * 2)) + 0.15); g.fillRect(-f.w / 2, -f.h / 2, f.w, f.h); }
        g.restore();
      });
      if (el < 5.4) requestAnimationFrame(frame);
      else { c.remove(); toast.remove(); raining = false; }
    })(t0);
  }
  let typed = "";
  D.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    typed = (typed + (e.key || "").toLowerCase()).slice(-2);
    if (typed === "dt") goldRain();
  });
  let taps = [];
  $$(".footer__big").forEach((b) => b.addEventListener("click", () => {
    const now = Date.now(); taps = taps.filter((t) => now - t < 1400).concat(now);
    if (taps.length >= 3) { taps = []; goldRain(); }
  }));

  /* ------------------------------------------------------ business card */
  $$(".bcard-scene").forEach((scene) => {
    const card = $(".bcard", scene);
    let flipped = false, tx = 0, ty = 0, rx = 0, ry = 0;
    const flip = () => { flipped = !flipped; card.setAttribute("aria-pressed", flipped); };
    card.addEventListener("click", flip);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    if (fine && !reduce) {
      scene.addEventListener("mousemove", (e) => {
        const r = scene.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        tx = -ny * 16; ty = nx * 20;
        scene.style.setProperty("--shine", `${(1 - (nx + 0.5)) * 100}%`);
        $$(".bcard__face", scene).forEach((f) => f.style.setProperty("--shine", `${(nx + 0.5) * 100}%`));
      });
      scene.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    }
    // one loop: eased tilt + eased flip angle
    let cur = 0;
    (function loop() {
      rx += (tx - rx) * 0.08; ry += (ty - ry) * 0.08;
      cur += ((flipped ? 180 : 0) - cur) * (reduce ? 1 : 0.09);
      card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${(cur + ry).toFixed(2)}deg)`;
      requestAnimationFrame(loop);
    })();
  });

  /* ----------------------------------------------- process scrollytelling */
  const proc = $(".process");
  if (proc) {
    const steps = $$(".pstep", proc);
    proc.dataset.step = "1";
    steps[0] && steps[0].classList.add("is-active");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        steps.forEach((s) => s.classList.toggle("is-active", s === en.target));
        proc.dataset.step = en.target.dataset.step;
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
  }

  /* -------------------------------------------------- granulométrie lab */
  const FRACTIONS = [
    { id: "0/4", kind: "Sable concassé", min: 0.3, max: 4, uses: ["Béton", "Mortiers & enduits", "Pose de pavés", "Préfabrication"], desc: "Fraction fine issue du concassage. Angulaire, propre et régulière : la base des bétons et mortiers de qualité." },
    { id: "4/10", kind: "Gravette", min: 4, max: 10, uses: ["Béton", "Enrobés", "Enduits superficiels"], desc: "Petit gravillon calibré pour les bétons fins, les enrobés bitumineux et les revêtements routiers." },
    { id: "10/14", kind: "Gravier", min: 10, max: 14, uses: ["Béton armé", "Enrobés", "Drainage"], desc: "Le gravier de référence du béton armé et des couches de roulement. Forme cubique, résistance élevée." },
    { id: "15/25", kind: "Gravier", min: 15, max: 25, uses: ["Béton de masse", "Drainage", "Assises"], desc: "Gros gravier pour les bétons de masse, fondations, massifs et ouvrages de drainage." },
    { id: "0/31.5", kind: "Grave non traitée — GNT", min: 0.3, max: 31.5, mixed: true, uses: ["Couche de fondation", "Couche de base", "Plateformes", "Pistes"], desc: "Mélange continu, du fin au gros, pour un compactage optimal. Le squelette des routes, plateformes et pistes de chantier." },
    { id: "0/40", kind: "Grave concassée 0/40", min: 0.3, max: 40, mixed: true, uses: ["Couche de fondation", "Remblais techniques", "Plateformes", "Pistes"], desc: "Grave continue un peu plus grosse que la GNT : portance élevée pour les couches de fondation, plateformes et pistes lourdes." },
    { id: "0/100", kind: "Tout-venant 0/100", min: 0.3, max: 100, mixed: true, uses: ["Remblais", "Couche de forme", "Pistes de chantier", "Plateformes industrielles"], desc: "Tout-venant concassé du fin au gros bloc : remblais, couches de forme et pistes de chantier, au meilleur coût par tonne." },
    { id: "40/80", kind: "Pierre / ballast", min: 40, max: 80, uses: ["Gabions", "Drainage", "Enrochement léger", "Assises lourdes"], desc: "Pierre concassée de gros calibre pour gabions, tranchées drainantes et assises soumises à de fortes charges." },
  ];
  const glab = $(".granulo");
  if (glab) {
    const tabs = $(".granulo__tabs", glab);
    const field = $(".granulo__field svg", glab);
    const nameEl = $(".granulo__name", glab), kindEl = $(".granulo__kind", glab), usesEl = $(".granulo__uses", glab), descEl = $(".granulo__desc", glab);
    tabs.innerHTML = FRACTIONS.map((f, i) => `<button class="gtab${i === 2 ? " is-on" : ""}" data-i="${i}" type="button" role="tab" aria-selected="${i === 2}"><b>${f.id}</b><span>${T(f.kind)}</span><i>→</i></button>`).join("");
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const W = 600, H = 260, K = 0.62;
    const tones = ["#8f8676", "#a69d8b", "#6f685c", "#bdb3a0", "#7d7566", "#cfc5b0"];
    function rock(cx, cy, r) {
      const n = 6 + Math.floor(rnd() * 3), pts = [];
      const a0 = rnd() * Math.PI;
      for (let k = 0; k < n; k++) {
        const a = a0 + (k / n) * Math.PI * 2, rr = r * (0.68 + rnd() * 0.32);
        pts.push((cx + Math.cos(a) * rr).toFixed(1) + "," + (cy + Math.sin(a) * rr * 0.82).toFixed(1));
      }
      return pts.join(" ");
    }
    function draw(i) {
      const f = FRACTIONS[i];
      seed = 11 + i * 97;
      const rOf = (mm) => 0.9 + mm * K;
      const ravg = rOf((f.min + f.max) / 2);
      const n = Math.min(1100, Math.round((W * H * 0.55) / (Math.PI * ravg * ravg * (f.mixed ? 0.45 : 1))));
      const items = [];
      for (let k = 0; k < n; k++) {
        const mm = f.mixed ? f.min + Math.pow(rnd(), 2.2) * (f.max - f.min) : f.min + rnd() * (f.max - f.min);
        const r = rOf(mm);
        const x = rnd() * W;
        const mound = (H - 24) * (1 - Math.pow((x - W / 2) / (W / 2), 2)) * 0.92 + 14;
        const y = H - rnd() * mound;
        items.push({ x, y, r });
      }
      items.sort((a, b) => a.y - b.y);
      const scale = 10 * K * 2; // 10 mm → px in viewBox
      field.innerHTML =
        `<defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7bd86" stop-opacity=".25"/><stop offset="1" stop-color="#d7bd86" stop-opacity="0"/></linearGradient></defs>` +
        items.map((it, k) => `<polygon class="rock" points="${rock(it.x, it.y, it.r)}" fill="${tones[Math.floor(rnd() * tones.length)]}" stroke="rgba(0,0,0,.25)" stroke-width=".4" style="transform:translateY(-${30 + rnd() * 40}px);opacity:0;transition-delay:${Math.min(0.6, (k / items.length) * 0.6).toFixed(3)}s"/>`).join("") +
        `<g transform="translate(${W - 24 - scale},18)"><line x1="0" y1="0" x2="${scale}" y2="0" stroke="#b69256" stroke-width="1.2"/><line x1="0" y1="-4" x2="0" y2="4" stroke="#b69256"/><line x1="${scale}" y1="-4" x2="${scale}" y2="4" stroke="#b69256"/><text x="${scale / 2}" y="16" text-anchor="middle" font-family="Jost, sans-serif" font-size="9" letter-spacing="2" fill="#9b9486">${T("10 MM")}</text></g>`;
      requestAnimationFrame(() => requestAnimationFrame(() => $$(".rock", field).forEach((p) => { p.style.transform = "none"; p.style.opacity = "1"; })));
      nameEl.textContent = f.id;
      kindEl.textContent = T(f.kind);
      usesEl.innerHTML = f.uses.map((u) => `<span>${T(u)}</span>`).join("");
      descEl.textContent = T(f.desc);
    }
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".gtab"); if (!b) return;
      $$(".gtab", tabs).forEach((t) => { t.classList.toggle("is-on", t === b); t.setAttribute("aria-selected", t === b); });
      draw(+b.dataset.i);
    });
    field.setAttribute("viewBox", `0 0 ${W} ${H}`);
    field.setAttribute("preserveAspectRatio", "xMidYMax slice");
    draw(2);
  }

  /* ------------------------------------------------------ avant / après */
  $$("[data-ba]").forEach((ba) => {
    const r = $(".ba__range", ba);
    let hinted = false;
    const set = (v) => ba.style.setProperty("--pos", v + "%");
    r.addEventListener("input", () => { hinted = true; set(r.value); });
    if (reduce) return;
    new IntersectionObserver((en, obs) => {
      if (!en[0].isIntersecting) return;
      obs.disconnect();
      // gentle "look, it moves" hint: 50 → 22 → 78 → 50
      const keys = [[0, 50], [900, 22], [2100, 78], [3000, 50]], t0 = performance.now() + 500;
      const step = (t) => {
        if (hinted) return;
        const dt = t - t0;
        if (dt < 0) return requestAnimationFrame(step);
        let i = keys.findIndex((k) => k[0] > dt);
        if (i === -1) { set(50); r.value = 50; return; }
        const [ta, va] = keys[i - 1], [tb, vb2] = keys[i], p = (dt - ta) / (tb - ta), e = 0.5 - Math.cos(p * Math.PI) / 2;
        const v = va + (vb2 - va) * e; set(v); r.value = v;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 }).observe(ba);
  });

  /* ------------------------------------------------ carte présence terrain */
  const map = $("[data-map]");
  if (map && DT.SITES) {
    const K = 36, LON0 = -17.4, LAT0 = 36.1, CX = 0.88, W = 526, H = 562;
    const proj = (lon, lat) => [(lon - LON0) * CX * K, (LAT0 - lat) * K];
    const sites = DT.SITES.map((s) => ({ ...s, xy: proj(s.lon, s.lat) }));
    const STAT = { production: T("En production"), base: T("Siège · Parc") };
    const pinsG = $("[data-pins]", map);
    pinsG.innerHTML = sites.map((s) => {
      const left = sites.some((o) => o !== s && o.xy[0] > s.xy[0] && o.xy[0] - s.xy[0] < 70 && Math.abs(o.xy[1] - s.xy[1]) < 40);
      const tx = left ? -11 : 11, anc = left ? "end" : "start";
      const ring = s.status === "production"
        ? `<circle class="pin__ring" r="5"><animate attributeName="r" from="5" to="24" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" from=".9" to="0" dur="2.2s" repeatCount="indefinite"/></circle><circle class="pin__ring" r="5"><animate attributeName="r" from="5" to="24" dur="2.2s" begin="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" from=".9" to="0" dur="2.2s" begin="1.1s" repeatCount="indefinite"/></circle>`
        : `<rect class="pin__ring" x="-6.5" y="-6.5" width="13" height="13" transform="rotate(45)"/>`;
      return `<g class="mk pin pin--${s.status}" data-x="${s.xy[0]}" data-y="${s.xy[1]}" data-id="${s.id}" tabindex="0" role="button" aria-label="${T(s.name)} — ${STAT[s.status] || ""}">
        ${ring}<circle class="pin__hit" r="16"/><circle class="pin__core" r="${s.status === "production" ? 4.5 : 3.4}"/>
        <text class="pin__name" x="${tx}" y="-1" text-anchor="${anc}">${T(s.name)}</text>
        <text class="pin__kind" x="${tx}" y="9" text-anchor="${anc}">${STAT[s.status] || ""}</text></g>`;
    }).join("");

    const list = $("[data-sites]"), card = $("[data-map-card]");
    list.innerHTML = sites.map((s) => `<li><button type="button" class="site" data-id="${s.id}" data-s="${s.status}"><span class="site__ico" aria-hidden="true"></span><span><b>${T(s.name)}</b><span>${T(s.kind)}</span></span><i>${STAT[s.status] || ""}</i></button></li>`).join("");
    $("[data-live-count]").textContent = sites.length;
    $("[data-live-label]").textContent = T(sites.length > 1 ? "sites actifs" : "site actif");
    if (DT.SITES_UPDATED) $("[data-live-date]").textContent = new Date(DT.SITES_UPDATED + "T12:00").toLocaleDateString(LOC, { day: "numeric", month: "long", year: "numeric" });

    function select(id) {
      const s = sites.find((x) => x.id === id); if (!s) return;
      $$(".pin", map).forEach((p) => p.classList.toggle("is-on", p.dataset.id === id));
      $$(".site", list).forEach((b) => b.classList.toggle("is-on", b.dataset.id === id));
      card.classList.add("is-swap");
      setTimeout(() => {
        card.innerHTML = `<small>${STAT[s.status] || ""} · ${T(s.kind)}</small><b>${T(s.name)}</b><p>${T(s.detail)}</p>` +
          (s.status === "production" ? `<a class="link" href="concassage.html#devis">${T("Une station pour votre chantier →")}</a>` : `<a class="link" href="contact.html">${T("Nous rendre visite →")}</a>`);
        card.classList.remove("is-swap");
      }, 220);
    }
    // viewBox animation (zoom) — markers counter-scale so they keep their size
    let vb = [0, 0, W, H], anim = 0, touched = false;
    const regionVB = () => {
      const xs = sites.map((s) => s.xy[0]), ys = sites.map((s) => s.xy[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const w = Math.max(120, (Math.max(...xs) - Math.min(...xs)) * 3.2), h = (w * H) / W;
      return [cx - w / 2, cy - h * 0.4, w, h];
    };
    const apply = () => {
      map.setAttribute("viewBox", vb.map((n) => n.toFixed(2)).join(" "));
      const k = vb[2] / W;
      $$(".mk", map).forEach((m) => m.setAttribute("transform", `translate(${m.dataset.x} ${m.dataset.y}) scale(${k.toFixed(4)})`));
    };
    function zoomTo(target, dur = 1600) {
      const from = vb.slice(), t0 = performance.now();
      cancelAnimationFrame(anim);
      if (reduce) { vb = target.slice(); return apply(); }
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        vb = from.map((v, i) => v + (target[i] - v) * e);
        apply();
        if (p < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    const setZoom = (mode) => {
      $$("[data-zoom]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.zoom === mode));
      zoomTo(mode === "region" ? regionVB() : [0, 0, W, H]);
    };
    $$("[data-zoom]").forEach((b) => b.addEventListener("click", () => { touched = true; setZoom(b.dataset.zoom); }));
    $$("[data-zoom]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.zoom === "all"));
    const pick = (e) => { const el = e.target.closest("[data-id]"); if (el) { touched = true; select(el.dataset.id); } };
    map.addEventListener("click", pick);
    list.addEventListener("click", pick);
    map.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e); } });
    apply();
    // shared with assets/ciel.js (« votre chantier vu du ciel »)
    window.DTMap = { map, proj, W, H, zoomTo, card, stop: () => { touched = true; } };
    select((sites.find((s) => s.status === "production") || sites[0]).id);
    const box = map.closest(".map");
    new IntersectionObserver((en, obs) => {
      if (!en[0].isIntersecting) return;
      obs.disconnect();
      box.classList.add("is-in");
      setTimeout(() => { if (!touched) setZoom("region"); }, 2600);
    }, { threshold: 0.4 }).observe(box);
  }

  /* ------------------------------------------------ station configurator */
  const stn = $("[data-stn]");
  if (stn) {
    const ICO = {
      feed: '<path d="M6 12 H42 L34 26 H14 Z"/><path d="M12 30 H36 M14 34 H34"/><path d="M14 40 l4 -6 M24 40 l0 -6 M34 40 l-4 -6"/>',
      jaw: '<path d="M14 8 L22 40 M34 8 L26 40 M22 40 H26"/><path d="M16 16 l4 -1 M18 24 l4 -1 M32 16 l-4 -1 M30 24 l-4 -1"/>',
      cone: '<path d="M12 12 H36 L42 38 H6 Z"/><path d="M24 16 L15 36 M24 16 L33 36"/><circle cx="24" cy="12" r="2.5"/>',
      impact: '<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="3"/><path d="M24 10 v6 M24 32 v6 M10 24 h6 M32 24 h6"/>',
      screen: '<path d="M6 14 L42 20 M6 24 L42 30 M6 34 L42 40" stroke-dasharray="3 3"/><path d="M8 10 V40 M40 16 V44"/>',
      stack: '<path d="M6 40 L36 12"/><path d="M10 42 L14 36 M26 30 L30 24"/><path d="M30 42 L38 30 L46 42 Z"/>',
      loader: '<circle cx="14" cy="36" r="5"/><circle cx="34" cy="36" r="5"/><path d="M8 30 H28 V20 H20 L16 30 M28 26 H38 L44 16 L38 12"/>',
    };
    const HARD = ["Basalte", "Granite"];
    const ORDER = ["0/4", "4/10", "10/14", "15/25", "GNT 0/31.5", "0/40", "0/100", "40/80"];
    let rock = "Calcaire";
    const fr = () => $$("[data-stn-frac] .chip[aria-pressed='true']", stn).map((c) => c.dataset.v).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    let prevKeys = [];
    function build() {
      const f = fr();
      const fine = f.some((x) => x !== "40/80");
      const mods = [{ k: "feed", ico: "feed", name: "Alimentateur + pré-crible", role: "Trémie, scalpage de la terre", qty: 1 }];
      mods.push({ k: "jaw", ico: "jaw", name: "Concasseur à mâchoires", role: "Concassage primaire des blocs", qty: 1 });
      if (fine) {
        const hard = HARD.includes(rock);
        mods.push(hard
          ? { k: "cone", ico: "cone", name: "Concasseur à cône", role: "Secondaire — roche dure, grain cubique", qty: 1 }
          : { k: "impact", ico: "impact", name: "Concasseur à percussion", role: "Secondaire — calcaire, excellente cubicité", qty: 1 });
      }
      const n = Math.max(1, f.length);
      const decks = Math.max(1, n - 1), screens = Math.ceil(decks / 3);
      if (f.length) mods.push({ k: "screen", ico: "screen", name: screens > 1 ? "Cribles" : T(decks > 1 ? "Crible {n} étages" : "Crible {n} étage", { n: Math.min(3, decks) }), role: T(n > 1 ? "Séparation en {n} fractions" : "Séparation en {n} fraction", { n }), qty: screens });
      if (f.length) mods.push({ k: "stack", ico: "stack", name: "Convoyeurs de stockage", role: "Un stock par fraction", qty: n });
      mods.push({ k: "loader", ico: "loader", name: "Chargeuse sur pneus", role: "Alimentation & chargement camions", qty: 1 });
      const chain = $("[data-stn-chain]", stn);
      chain.innerHTML = mods.map((m, i) => `
        <div class="mod${prevKeys.includes(m.k) ? "" : " mod--new"}" style="animation-delay:${i * 0.11}s">
          <span class="mod__ico"><svg viewBox="0 0 48 48" aria-hidden="true">${ICO[m.ico]}</svg></span>
          <span><span class="mod__name">${T(m.name)}</span><br><span class="mod__role">${T(m.role)}</span></span>
          <span class="mod__qty">× ${m.qty}</span>
        </div>`).join("") +
        (f.length ? `<div class="stn__piles" style="animation-delay:${mods.length * 0.11}s">${f.map((x) => `<span><i></i>${x}</span>`).join("")}</div>` : "");
      prevKeys = mods.map((m) => m.k);
      const total = mods.reduce((s, m) => s + m.qty, 0);
      $("[data-stn-count]", stn).textContent = T("{n} machines", { n: total });
      $("[data-stn-line]", stn).textContent = f.length
        ? T("{rock} → {fr}. Production indicative {a} – {b} t/jour.", { rock: T(rock), fr: f.map((x) => T(x)).join(" · "), a: fmt(DT.rateMin || 1200), b: fmt(DT.rateMax || 1800) })
        : T("Choisissez au moins une fraction.");
    }
    $("[data-stn-rock]", stn).addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      $$("[data-stn-rock] .chip", stn).forEach((x) => x.setAttribute("aria-pressed", x === c));
      rock = c.dataset.v; build();
    });
    $("[data-stn-frac]", stn).addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true"); build();
    });
    $("[data-stn-use]", stn).addEventListener("click", () => {
      const want = fr();
      const m = $(`[data-group="materiau"] .chip[data-v="${rock}"]`);
      if (m && m.getAttribute("aria-pressed") !== "true") m.click();
      $$('[data-group="fractions"] .chip').forEach((c) => {
        const on = c.getAttribute("aria-pressed") === "true";
        if (on !== want.includes(c.dataset.v)) c.click();
      });
      $("#devis").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
    build();
  }

  /* --------------------------------------------- configurator / dossier */
  const cfg = $(".cfg");
  if (cfg) {
    const state = { projet: "", materiau: "", fractions: [], volume: 20000, lieu: "", delai: "", nom: "", societe: "", tel: "", note: "" };
    let ref = store.get("dtRef");
    if (!ref) { ref = `DT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`; store.set("dtRef", ref); }
    $("[data-ref]", cfg).textContent = ref;
    const rates = $("[data-rates]", cfg);
    if (rates) rates.textContent = `${fmt(DT.rateMin || 1200)} – ${fmt(DT.rateMax || 1800)}`;
    $("[data-date]", cfg).textContent = new Date().toLocaleDateString(LOC, { day: "2-digit", month: "long", year: "numeric" });

    // chips
    $$("[data-group]", cfg).forEach((g) => {
      const key = g.dataset.group, multi = g.hasAttribute("data-multi");
      g.addEventListener("click", (e) => {
        const c = e.target.closest(".chip"); if (!c) return;
        if (multi) {
          const on = c.getAttribute("aria-pressed") !== "true";
          c.setAttribute("aria-pressed", on);
          state[key] = $$(".chip[aria-pressed='true']", g).map((x) => x.dataset.v);
        } else {
          $$(".chip", g).forEach((x) => x.setAttribute("aria-pressed", x === c));
          state[key] = c.dataset.v;
        }
        render();
      });
    });
    // inputs
    $$("[data-k]", cfg).forEach((inp) => inp.addEventListener("input", () => { state[inp.dataset.k] = inp.value.trim(); render(); }));
    // volume (log slider)
    const vr = $("#volume", cfg), VMIN = 1000, VMAX = 500000;
    const toVol = (p) => { const v = VMIN * Math.pow(VMAX / VMIN, p / 100); const s = v < 10000 ? 500 : v < 100000 ? 1000 : 5000; return Math.round(v / s) * s; };
    const toPos = (v) => (Math.log(v / VMIN) / Math.log(VMAX / VMIN)) * 100;
    // prospect name from a personalised link (?pour=…) pre-fills the company
    const pr = store.get("dtPour"), so = $("#societe", cfg);
    if (pr && so && !so.value) { so.value = pr; state.societe = pr; }
    vr.value = toPos(state.volume);
    vr.addEventListener("input", () => { state.volume = toVol(+vr.value); render(); });

    const out = (k, v, empty) => { const el = $(`[data-out="${k}"]`, cfg); if (!el) return; el.textContent = v || T(empty); el.classList.toggle("is-empty", !v); };
    function render() {
      vr.style.setProperty("--p", vr.value + "%");
      $("[data-vol]", cfg).textContent = T("{v} t", { v: fmt(state.volume) });
      out("projet", state.projet && T(state.projet), "À préciser");
      out("materiau", state.materiau && T(state.materiau), "À préciser");
      out("fractions", state.fractions.map((x) => T(x)).join(" · "), "À préciser");
      out("volume", T("{v} tonnes", { v: fmt(state.volume) }));
      out("lieu", state.lieu, "Ville / région");
      out("delai", state.delai && T(state.delai), "À préciser");
      out("client", [state.nom, state.societe].filter(Boolean).join(" — "), "Votre nom");
      out("tel", state.tel, "Votre téléphone");
      const dMin = Math.max(1, Math.ceil(state.volume / (DT.rateMax || 1800)));
      const dMax = Math.max(dMin, Math.ceil(state.volume / (DT.rateMin || 1200)));
      $("[data-est]", cfg).textContent = dMin === dMax ? T(dMin > 1 ? "≈ {a} jours" : "≈ {a} jour", { a: dMin }) : T("≈ {a} à {b} jours", { a: dMin, b: dMax });
      $(".dossier", cfg).classList.toggle("is-ready", !!(state.nom && state.tel && state.lieu));
    }
    const message = () => [
      `Bonjour DAM TRUCK,`,
      `Demande de devis — Concassage / Criblage (réf. ${ref})`,
      ``,
      `• Projet : ${dash(state.projet)}`,
      `• Matériau : ${dash(state.materiau)}`,
      `• Fractions : ${dash(state.fractions.join(", "))}`,
      `• Volume : ${fmt(state.volume)} tonnes`,
      `• Lieu : ${dash(state.lieu)}`,
      `• Démarrage : ${dash(state.delai)}`,
      state.note ? `• Précisions : ${state.note}` : null,
      ``,
      `${dash(state.nom)}${state.societe ? " — " + state.societe : ""}`,
      `Tél : ${dash(state.tel)}`,
    ].filter((l) => l !== null).join("\n");
    // the request is sealed in wax (assets/cine.js) before it leaves
    const seal = (fn) => (window.DTSeal ? window.DTSeal(fn) : fn());
    $("[data-send='wa']", cfg).addEventListener("click", () => { window.open(waLink(message()), "_blank", "noopener"); seal(); });
    $("[data-send='mail']", cfg).addEventListener("click", () => seal(() => {
      location.href = `mailto:${DT.email}?subject=${encodeURIComponent("Demande de devis concassage — " + ref)}&body=${encodeURIComponent(message())}`;
    }));
    // dossier PDF : the data travels to devis.html through sessionStorage (never in the URL)
    $("[data-send='pdf']", cfg).addEventListener("click", () => {
      const dMin = Math.max(1, Math.ceil(state.volume / (DT.rateMax || 1800)));
      const dMax = Math.max(dMin, Math.ceil(state.volume / (DT.rateMin || 1200)));
      store.set("dtDevis", JSON.stringify(Object.assign({}, state, { ref, date: new Date().toISOString(), dMin, dMax })));
      seal(() => (location.href = "devis.html"));
    });
    render();
  }

  /* ------------------------------------------------------- sell-to-us form */
  const sell = $("[data-sell]");
  if (sell) {
    sell.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (n) => (sell.elements[n] && sell.elements[n].value.trim()) || "—";
      const msg = [
        "Bonjour DAM TRUCK,", "Je souhaite vous proposer une machine :", "",
        `• Type : ${v("type")}`, `• Marque / modèle : ${v("modele")}`, `• Année : ${v("annee")}`, `• Heures : ${v("heures")}`, `• Lieu : ${v("lieu")}`,
        "", `${v("nom")} — Tél : ${v("tel")}`, "(Photos à suivre dans cette conversation)",
      ].join("\n");
      window.open(waLink(msg), "_blank", "noopener");
    });
  }

  /* ------------------------------------------------- sourcing Europe form */
  const src = $("[data-sourcing]");
  if (src) {
    src.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (n) => (src.elements[n] && src.elements[n].value.trim()) || "—";
      const msg = [
        "Bonjour DAM TRUCK,", "Je recherche une machine (sourcing Europe) :", "",
        `• Type : ${v("type")}`, `• Marque / modèle : ${v("modele")}`, `• Année min. : ${v("annee")}`, `• Heures max. : ${v("heures")}`,
        `• Budget : ${v("budget")}`, `• Délai : ${v("delai")}`, "", `${v("nom")} — Tél : ${v("tel")}`,
      ].join("\n");
      window.open(waLink(msg), "_blank", "noopener");
    });
  }

  /* --------------------------------------------------------- contact form */
  const cf = $("[data-contact]");
  if (cf) {
    const subj = $("[data-subject]", cf);
    subj.addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      $$(".chip", subj).forEach((x) => x.setAttribute("aria-pressed", x === c));
    });
    const msg = () => {
      const s = $(".chip[aria-pressed='true']", subj);
      const v = (n) => cf.elements[n].value.trim();
      return [`Bonjour DAM TRUCK,`, `Objet : ${s ? s.dataset.v : "—"}`, ``, v("msg") || "—", ``, `${v("nom") || "—"} — Tél : ${v("tel") || "—"}`].join("\n");
    };
    // a machine purchase goes to Mohammed Damnati, everything else to the crushing side
    cf.addEventListener("submit", (e) => {
      e.preventDefault();
      const s = $(".chip[aria-pressed='true']", subj), num = s && /machine/i.test(s.dataset.v) ? DT.waMachines : DT.wa;
      window.open(`https://wa.me/${num || DT.wa}?text=${encodeURIComponent(msg())}`, "_blank", "noopener");
    });
    $("[data-mail]", cf).addEventListener("click", () => {
      if (!cf.reportValidity()) return;
      const s = $(".chip[aria-pressed='true']", subj);
      location.href = `mailto:${DT.email}?subject=${encodeURIComponent("Contact site — " + (s ? s.dataset.v : ""))}&body=${encodeURIComponent(msg())}`;
    });
  }

  /* ------------------------------------------------------------ machines */
  const M = DT.MACHINES || [];
  const STATUS = { dispo: T("Disponible"), reserve: T("Réservé"), vendu: T("Vendu") };
  const priceTxt = (m) => (m.price ? fmt(m.price) + " MAD HT" : T("Prix sur demande"));
  const cardHTML = (m, asLink) => `
    <${asLink ? `a href="machines.html#${m.ref}"` : `article tabindex="0" role="button" data-ref="${m.ref}"`} class="mcard reveal${m.status === "vendu" ? " is-sold" : ""}" data-cursor="view" aria-label="${T(m.title)} — ${m.ref}">
      <div class="mcard__img">
        <span class="mcard__status" data-s="${m.status}">${STATUS[m.status] || ""}</span>
        <span class="mcard__ref">${m.ref}</span>${m.spin ? `<span class="mcard__360">360°</span>` : ""}${m.inspection ? `<span class="mcard__insp">${T("✓ Inspectée")}</span>` : ""}
        <img src="${m.img}" alt="${T(m.title)}" loading="lazy" style="object-position:${m.imgPos || "center"}">
      </div>
      <div class="mcard__body">
        <span class="mcard__cat">${T((DT.CATS && DT.CATS[m.cat]) || "")}</span>
        <h3 class="mcard__title">${T(m.title)}</h3>
        <span class="small">${T(m.type)}</span>
        <div class="mcard__specs">
          <div><small>${T("Année")}</small><b>${dash(m.year)}</b></div>
          <div><small>${T("Heures")}</small><b>${dash(m.hours)}</b></div>
          <div><small>${T("Lieu")}</small><b>${dash(T(m.location))}</b></div>
        </div>
        <div class="mcard__foot"><span class="mcard__price">${priceTxt(m)}</span><span class="mcard__go">${T("Fiche →")}</span></div>
      </div>
    </${asLink ? "a" : "article"}>`;

  // home: references (clients who trusted us) — from data.js / live content
  const refsEl = $("[data-refs]");
  if (refsEl) refsEl.innerHTML = (DT.REFERENCES || []).map((r, i) => `<div class="plaque reveal" data-d="${i % 3}"><i></i><i></i><i></i><i></i><span class="plaque__lbl">${T("Client")}</span><b class="plaque__name">${r}</b><span class="plaque__rule"></span><span class="plaque__lbl">${T("Partenaire de confiance")}</span></div>`).join("");

  // home: featured — the whole section hides itself when no machine is on sale
  const feat = $("[data-featured]");
  if (feat) {
    const live = M.filter((m) => m.status !== "vendu" && !m.hidden);
    const pick = (live.filter((m) => m.featured).length ? live.filter((m) => m.featured) : live).slice(0, 3);
    if (pick.length) feat.innerHTML = pick.map((m) => cardHTML(m, true)).join("");
    else { const sec = feat.closest("[data-featured-section]"); if (sec) sec.remove(); }
  }

  // catalogue
  const grid = $("[data-catalogue]");
  if (grid && !M.filter((m) => !m.hidden).length) {
    // nothing on sale right now: one clear message + the two ways we can still help
    const tools = $(".mtools"); if (tools) tools.hidden = true;
    grid.innerHTML = `<div class="mempty mempty--none"><b>${T("Aucune machine disponible pour le moment.")}</b>
      ${T("Notre parc tourne sur nos chantiers. Dites-nous la machine que vous cherchez : nous la trouvons pour vous, en Europe comme au Maroc.")}
      <div class="mempty__acts"><a class="btn btn--gold" href="#sourcing">${T("Décrire la machine recherchée")} <span class="btn__arrow">→</span></a>
      <a class="btn btn--wa" href="https://wa.me/${DT.waMachines || DT.wa}" target="_blank" rel="noopener">WhatsApp · Mohammed Damnati</a></div></div>`;
    const cnt = $("[data-count-out]"); if (cnt) cnt.textContent = "0";
  } else if (grid) {
    const chipsEl = $("[data-cats]"), q = $("[data-search]"), sortEl = $("[data-sort]");
    let cat = "all";
    const cats = Object.keys(DT.CATS).filter((k) => M.some((m) => m.cat === k));
    chipsEl.innerHTML = `<button class="chip is-on" data-c="all" type="button">${T("Tout")}<sup>${M.length}</sup></button>` +
      cats.map((k) => `<button class="chip" data-c="${k}" type="button">${T(DT.CATS[k])}<sup>${M.filter((m) => m.cat === k).length}</sup></button>`).join("");
    chipsEl.addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      cat = c.dataset.c; $$(".chip", chipsEl).forEach((x) => x.classList.toggle("is-on", x === c)); list();
    });
    q.addEventListener("input", list);
    sortEl.addEventListener("change", list);
    function list() {
      const term = q.value.trim().toLowerCase();
      let rows = M.filter((m) => (cat === "all" || m.cat === cat) && (!term || [m.title, m.type, m.brand, m.model, m.ref].join(" ").toLowerCase().includes(term)));
      const order = { dispo: 0, reserve: 1, vendu: 2 };
      if (sortEl.value === "recent") rows.sort((a, b) => (+b.year || 0) - (+a.year || 0));
      else if (sortEl.value === "ref") rows.sort((a, b) => a.ref.localeCompare(b.ref));
      else rows.sort((a, b) => order[a.status] - order[b.status] || (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      grid.innerHTML = rows.length ? rows.map((m) => cardHTML(m)).join("") :
        `<div class="mempty"><b>${T("Aucune machine ne correspond.")}</b>${T("Grâce à notre réseau européen, nous trouvons la machine qu'il vous faut.")}<br><br><a class="link" href="#sourcing">${T("Nous la trouvons en Europe →")}</a></div>`;
      $("[data-count-out]").textContent = rows.length;
      requestAnimationFrame(() => $$(".reveal", grid).forEach((el, i) => setTimeout(() => el.classList.add("is-in"), i * 70)));
    }
    grid.addEventListener("click", (e) => { const c = e.target.closest("[data-ref]"); if (c) open(c.dataset.ref); });
    grid.addEventListener("keydown", (e) => { const c = e.target.closest("[data-ref]"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(c.dataset.ref); } });
    list();
  }
  if (grid) {
    // drawer
    const dr = $(".drawer"), panel = $(".drawer__panel", dr);
    let lastFocus = null, current = null;
    function open(ref, push = true) {
      const m = M.find((x) => x.ref === ref); if (!m) return;
      current = m; lastFocus = D.activeElement;
      $("[data-d='ref']", dr).textContent = m.ref;
      $("[data-d='cat']", dr).textContent = T(DT.CATS[m.cat] || "") + " · " + (STATUS[m.status] || "");
      $("[data-d='title']", dr).textContent = T(m.title);
      $("[data-d='type']", dr).textContent = T(m.type);
      $("[data-d='price']", dr).textContent = priceTxt(m);
      $("[data-d='desc']", dr).textContent = T(m.desc || "");
      const specs = Object.assign({ "Référence": m.ref }, m.specs, { "Localisation": m.location, "Disponibilité": STATUS[m.status] });
      $("[data-d='specs']", dr).innerHTML = Object.entries(specs).map(([k, v]) => `<div><dt>${T(k)}</dt><dd>${dash(v && T(v))}</dd></div>`).join("");
      const gal = m.gallery && m.gallery.length ? m.gallery : [m.img];
      const main = $(".dgal__main > img", dr);
      main.src = gal[0]; main.alt = T(m.title); main.style.objectPosition = m.imgPos || "center";
      const thumbs = gal.map((g, i) => `<button type="button" class="${i || m.spin ? "" : "is-on"}" data-g="${g}"><img src="${g}" alt=""></button>`);
      if (m.spin) thumbs.unshift(`<button type="button" class="is-on dgal__360" data-spin><span>360°</span></button>`);
      $(".dgal__thumbs", dr).innerHTML = thumbs.length > 1 ? thumbs.join("") : "";
      stopSpin();
      if (m.spin) startSpin(m);
      const insp = $("[data-d='insp']", dr);
      insp.hidden = !m.inspection;
      if (m.inspection) insp.href = `inspection.html?ref=${encodeURIComponent(m.ref)}`;
      $("[data-d='wa']", dr).href = waLink(`Bonjour DAM TRUCK, je suis intéressé(e) par la machine ${m.ref} — ${m.title}. Pouvez-vous m'envoyer le prix et la disponibilité ?`);
      dr.classList.add("is-open"); dr.setAttribute("aria-hidden", "false");
      D.body.classList.add("drawer-lock");
      panel.scrollTop = 0;
      if (push) history.replaceState(null, "", "#" + m.ref);
      setTimeout(() => $(".drawer__close button", dr).focus(), 50);
    }
    // 360° viewer: drag (mouse or finger) scrubs through the photo sequence
    let spinAbort = null;
    function stopSpin() {
      if (spinAbort) spinAbort.abort();
      spinAbort = null;
      $(".spin", dr).hidden = true;
      $(".dgal__main > img", dr).hidden = false;
    }
    function startSpin(m) {
      const box = $(".spin", dr), im = $(".spin__img", box);
      const n = m.spin.count, loop = !!m.spin.loop;
      const urls = Array.from({ length: n }, (_, i) => `${m.spin.src}${String(i).padStart(2, "0")}.jpg`);
      const ctl = new AbortController(); spinAbort = ctl;
      const sig = { signal: ctl.signal };
      box.hidden = false; $(".dgal__main > img", dr).hidden = true;
      box.classList.add("is-loading"); box.classList.remove("is-touched");
      let loaded = 0;
      urls.forEach((u) => { const i = new Image(); i.onload = i.onerror = () => { loaded++; box.style.setProperty("--load", loaded / n); if (loaded === n) box.classList.remove("is-loading"); }; i.src = u; });
      let idx = 0, dir = 1, acc = 0, lastX = 0, drag = false, auto = !reduce, tAuto = 0;
      const show = () => { im.src = urls[idx]; };
      const move = (k) => {
        idx += k;
        if (loop) idx = ((idx % n) + n) % n;
        else if (idx < 0 || idx > n - 1) { idx = Math.max(0, Math.min(n - 1, idx)); dir = -dir; }
        show();
      };
      show();
      const tick = (t) => {
        if (ctl.signal.aborted) return;
        if (auto && !drag && t - tAuto > 95) { tAuto = t; move(dir); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      box.addEventListener("pointerdown", (e) => { drag = true; auto = false; lastX = e.clientX; acc = 0; box.classList.add("is-touched", "is-drag"); box.setPointerCapture(e.pointerId); }, sig);
      box.addEventListener("pointermove", (e) => {
        if (!drag) return;
        acc += e.clientX - lastX; lastX = e.clientX;
        const ppf = Math.max(6, box.clientWidth / n);
        while (Math.abs(acc) >= ppf) { move(acc > 0 ? -1 : 1); acc -= Math.sign(acc) * ppf; }
      }, sig);
      const up = () => { drag = false; box.classList.remove("is-drag"); };
      box.addEventListener("pointerup", up, sig);
      box.addEventListener("pointercancel", up, sig);
    }
    function close() {
      stopSpin();
      dr.classList.remove("is-open"); dr.setAttribute("aria-hidden", "true");
      D.body.classList.remove("drawer-lock");
      history.replaceState(null, "", location.pathname);
      lastFocus && lastFocus.focus && lastFocus.focus();
    }
    $(".drawer__close button", dr).addEventListener("click", close);
    $(".drawer__scrim", dr).addEventListener("click", close);
    D.addEventListener("keydown", (e) => { if (e.key === "Escape" && dr.classList.contains("is-open")) close(); });
    $(".dgal__thumbs", dr).addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      $$(".dgal__thumbs button", dr).forEach((x) => x.classList.toggle("is-on", x === b));
      if (b.hasAttribute("data-spin")) { stopSpin(); startSpin(current); return; }
      stopSpin();
      $(".dgal__main > img", dr).src = b.dataset.g;
    });
    $("[data-d='share']", dr).addEventListener("click", async (e) => {
      const url = location.origin + location.pathname + "#" + current.ref;
      const btn = e.currentTarget;
      try {
        if (navigator.share) await navigator.share({ title: `${current.title} — DAM TRUCK`, url });
        else { await navigator.clipboard.writeText(url); btn.firstChild.textContent = T("Lien copié") + " "; setTimeout(() => (btn.firstChild.textContent = T("Partager") + " "), 2000); }
      } catch (err) {}
    });
    $("[data-d='print']", dr).addEventListener("click", () => {
      const m = current, ps = $(".printsheet");
      const specs = Object.assign({ "Référence": m.ref }, m.specs, { "Localisation": m.location, "Prix": priceTxt(m) });
      ps.innerHTML = `
        <div class="ps-head"><img src="images/logo-dark.png" alt="DAM TRUCK"><div style="text-align:right;font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:#86672f">${T("Fiche technique")}<br><b style="font-size:11pt;color:#000">${m.ref}</b></div></div>
        <h1>${T(m.title)}</h1><img class="ps-hero" src="${m.img}" alt="">
        <table>${Object.entries(specs).map(([k, v]) => `<tr><td>${T(k)}</td><td>${dash(v && T(v))}</td></tr>`).join("")}</table>
        <p style="margin-top:6mm;font-size:10pt;line-height:1.6">${T(m.desc || "")}</p>
        <div class="ps-foot">DAM TRUCK — Concassage &amp; Vente Achat Matériel TP · ${DT.address}<br>Machines : Mohammed Damnati · ${DT.phoneMachines || DT.phone} · ${DT.email} · www.damtruck.com</div>`;
      const img = $(".ps-hero", ps);
      const go = () => {
        if (!window.DTPdf) return window.print();
        ps.classList.add("is-render");
        window.DTPdf(ps, `DAM-TRUCK-Fiche-${m.ref}.pdf`).then(() => ps.classList.remove("is-render"));
      };
      img.complete ? go() : (img.onload = go);
    });
    const fromHash = decodeURIComponent(location.hash.slice(1));
    if (fromHash) setTimeout(() => open(fromHash, false), fromNav ? 700 : 300);
  }
})();
