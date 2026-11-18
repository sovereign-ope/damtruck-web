/* DAMTRUCK MOVIE — the premiere player (index.html #movie).
   Press play → the house lights go down over the whole page, a gold film-leader counts 3·2·1 with a projector click,
   the film starts with sound, the screen throws its own light around it (ambilight from the real frames), gold
   chapter marks on the timeline, full screen, and at the end the lights come up on "c'est votre chantier".
   The film only loads when the visitor presses play (preload none); phones and data-saver get the 720p file. */
(() => {
  const root = document.querySelector("[data-movie]");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const T = (s) => (window.I18N ? window.I18N.t(s) : s);
  const video = $("[data-movie-video]"), screen = $("[data-movie-screen]"), playBtn = $("[data-movie-play]");
  const leader = $("[data-movie-leader]"), count = $("[data-movie-count]"), endCard = $("[data-movie-end]");
  const ui = $("[data-movie-ui]"), bar = $("[data-movie-bar]"), fill = $("[data-movie-fill]"), timeEl = $("[data-movie-time]");
  const lights = $("[data-movie-lights]"), ambi = $("[data-movie-ambi]"), list = $("[data-movie-list]"), chapsEl = $("[data-movie-chaps]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // damtruck.com/#movie → straight to the film (the intro is skipped in index.html for this address)
  if (location.hash === "#movie") setTimeout(() => root.scrollIntoView({ block: "start" }), 700);

  const CHAPTERS = [
    [0, "Ouverture", "DAM TRUCK"],
    [30.9, "La matière", "Crushing · Screening · Morocco"],
    [32, "Présenté par", "DAM TRUCK"],
    [46.5, "La machine", "Professional · Reliable · Powerful"],
    [57.2, "Engineered for power", "Built to perform"],
    [81.8, "Le serment", "We crush · We screen · We deliver"],
    [82.8, "Le titre", "The power behind production"],
    [106.2, "Final", "damtruck.com"],
  ];
  const DUR = 111.5;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // chapters: gold ticks on the bar + a numbered list under the screen (click = jump there)
  chapsEl.innerHTML = CHAPTERS.map(([t, name]) => `<i style="left:${(t / DUR) * 100}%" title="${T(name)}"></i>`).join("");
  list.innerHTML = CHAPTERS.map(([t, name, sub], i) =>
    `<li><button type="button" data-t="${t}"><span class="movie__no">${String(i + 1).padStart(2, "0")}</span><b>${T(name)}</b><small>${fmt(t)} · ${sub}</small></button></li>`).join("");

  let loaded = false, started = false, raf = 0, hideUi = 0;
  const load = () => {
    if (loaded) return;
    loaded = true;
    const small = innerWidth < 900 || navigator.connection?.saveData;
    video.src = small ? video.dataset.srcMobile : video.dataset.src;
  };

  /* projector click + low hum for the leader (Web Audio, no file) */
  let ac = null;
  const click = (hi) => {
    try {
      ac ??= new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = "square"; o.frequency.value = hi ? 1400 : 900; f.type = "bandpass"; f.frequency.value = 2200;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.08);
    } catch {}
  };

  const lightsDown = (on) => { document.documentElement.classList.toggle("movie-on", on); lights.classList.toggle("is-on", on); };

  async function start(fromLeader = true) {
    load();
    started = true;
    endCard.hidden = true;
    root.classList.add("is-playing");
    lightsDown(true);
    screen.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    if (fromLeader && !reduce) {
      leader.classList.add("is-on");
      for (const n of [3, 2, 1]) { count.textContent = n; leader.style.setProperty("--k", 0); void leader.offsetWidth; leader.classList.remove("tick"); void leader.offsetWidth; leader.classList.add("tick"); click(n === 1); await new Promise((r) => setTimeout(r, 700)); }
      leader.classList.remove("is-on");
    }
    video.muted = false;
    try { await video.play(); } catch { video.muted = true; video.play().catch(() => {}); }
    loop();
  }
  playBtn.addEventListener("click", () => start(true));

  // toggle, mute, full screen, scrub
  const toggle = () => { if (!started) return start(true); video.paused ? video.play() : video.pause(); };
  $("[data-movie-toggle]").addEventListener("click", toggle);
  video.addEventListener("click", toggle);
  $("[data-movie-mute]").addEventListener("click", () => { video.muted = !video.muted; root.classList.toggle("is-muted", video.muted); });
  $("[data-movie-fs]").addEventListener("click", () => {
    const el = screen;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();          // iPhone
  });
  const seek = (e) => { const r = bar.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); if (!started) start(false).then(() => (video.currentTime = p * (video.duration || DUR))); else video.currentTime = p * (video.duration || DUR); };
  bar.addEventListener("pointerdown", seek);
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b) return;
    const t = +b.dataset.t;
    if (!started) start(false).then(() => (video.currentTime = t)); else { video.currentTime = t; video.play(); }
  });
  $("[data-movie-replay]").addEventListener("click", () => { video.currentTime = 0; start(false); });
  $("[data-movie-share]").addEventListener("click", async () => {
    const url = location.origin + location.pathname + "#movie", text = "DAMTRUCK MOVIE — " + url;
    if (navigator.share) { try { await navigator.share({ title: "DAMTRUCK MOVIE", url }); return; } catch {} }
    open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
  });

  video.addEventListener("play", () => { root.classList.add("is-playing"); root.classList.remove("is-paused"); lightsDown(true); });
  video.addEventListener("pause", () => { root.classList.add("is-paused"); if (!video.ended) lightsDown(false); });
  video.addEventListener("ended", () => {
    lightsDown(false); root.classList.remove("is-playing"); root.classList.add("is-ended");
    endCard.hidden = false;
    if (document.fullscreenElement) document.exitFullscreen();
  });
  video.addEventListener("timeupdate", () => {
    const d = video.duration || DUR;
    fill.style.width = `${(video.currentTime / d) * 100}%`;
    timeEl.textContent = `${fmt(video.currentTime)} / ${fmt(d)}`;
    const cur = CHAPTERS.reduce((k, c, i) => (video.currentTime >= c[0] ? i : k), 0);
    list.querySelectorAll("li").forEach((li, i) => li.classList.toggle("is-now", i === cur));
  });
  // controls fade away while the film plays, come back on movement
  screen.addEventListener("pointermove", () => { root.classList.add("show-ui"); clearTimeout(hideUi); hideUi = setTimeout(() => root.classList.remove("show-ui"), 2200); });
  // Esc or scrolling far away → lights up again (the film keeps its place)
  addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("is-playing") && !document.fullscreenElement) video.pause(); if (e.key === " " && document.activeElement?.closest?.("[data-movie]")) { e.preventDefault(); toggle(); } });
  new IntersectionObserver(([en]) => { if (!en.isIntersecting && !video.paused) video.pause(); }, { threshold: 0.2 }).observe(screen);

  /* ambilight: the real frame, tiny and blurred, painted behind the screen */
  const g = ambi.getContext("2d", { alpha: true });
  let frame = 0;
  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      raf = requestAnimationFrame(step);
      if (video.paused || video.readyState < 2) return;
      if (frame++ % 3) return;                                              // every third frame is enough
      try { ambi.width = 48; ambi.height = 27; g.drawImage(video, 0, 0, 48, 27); } catch {}
    };
    raf = requestAnimationFrame(step);
  }
})();
