/* =========================================================================
   DAM TRUCK — « Votre chantier vu du ciel » (carte de l'accueil)
   The visitor names the city of the site (or shares the position): the map
   flies there from Morocco-wide, a gold route draws from Casablanca, and an
   indicative distance / transport time / mobilisation delay appears, with a
   shortcut to the quote form (city carried over via sessionStorage).
   ========================================================================= */
(() => {
  const form = document.querySelector("[data-ciel]");
  if (!form || !window.DTMap) return;
  const T = (s, v) => (window.I18N ? window.I18N.t(s, v) : String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v ? v[k] : "")));
  const { map, proj, W, H, zoomTo, stop } = window.DTMap;
  const out = form.querySelector("[data-ciel-out]"), inp = form.querySelector("input");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const CASA = [33.5731, -7.5898];

  // [name, lat, lon] — main towns and industrial sites
  const CITIES = [
    ["Casablanca", 33.5731, -7.5898], ["Mohammedia", 33.6861, -7.3829], ["Berrechid", 33.265, -7.587], ["Settat", 33.001, -7.6166], ["Benslimane", 33.618, -7.121],
    ["Rabat", 34.0209, -6.8416], ["Salé", 34.0531, -6.7985], ["Skhirat", 33.85, -7.03], ["Kénitra", 34.261, -6.5802], ["Sidi Kacem", 34.226, -5.707], ["Sidi Slimane", 34.265, -5.925],
    ["Tanger", 35.7595, -5.834], ["Tétouan", 35.5785, -5.3684], ["Larache", 35.1932, -6.1557], ["Chefchaouen", 35.1688, -5.2636], ["Ouezzane", 34.797, -5.583],
    ["Al Hoceïma", 35.2517, -3.9372], ["Nador", 35.1681, -2.9335], ["Berkane", 34.92, -2.32], ["Oujda", 34.6814, -1.9086], ["Taza", 34.21, -4.01], ["Guercif", 34.225, -3.353],
    ["Fès", 34.0181, -5.0078], ["Meknès", 33.8935, -5.5473], ["Ifrane", 33.5228, -5.11], ["Khénifra", 32.935, -5.668], ["Midelt", 32.685, -4.745],
    ["Béni Mellal", 32.3394, -6.3608], ["Khouribga", 32.8811, -6.9063], ["El Kelaa des Sraghna", 32.048, -7.408], ["Benguerir", 32.236, -7.954], ["Youssoufia", 32.246, -8.529],
    ["El Jadida", 33.2316, -8.5007], ["Jorf Lasfar", 33.12, -8.64], ["Azemmour", 33.287, -8.342], ["Sidi Bennour", 32.65, -8.43], ["Safi", 32.2994, -9.2372],
    ["Marrakech", 31.6295, -7.9811], ["Essaouira", 31.5085, -9.7595], ["Ouarzazate", 30.9189, -6.8934], ["Zagora", 30.33, -5.838], ["Tinghir", 31.515, -5.532], ["Errachidia", 31.9314, -4.4246],
    ["Bouarfa", 32.53, -1.96], ["Figuig", 32.109, -1.229], ["Agadir", 30.4278, -9.5981], ["Taroudant", 30.4703, -8.877], ["Tiznit", 29.6974, -9.7316], ["Guelmim", 28.987, -10.0574],
    ["Tan-Tan", 28.438, -11.103], ["Tarfaya", 27.939, -12.926], ["Laâyoune", 27.1536, -13.2033], ["Smara", 26.738, -11.672], ["Boujdour", 26.126, -14.484], ["Dakhla", 23.6848, -15.958],
  ];
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  form.querySelector("datalist").innerHTML = CITIES.map((c) => `<option value="${c[0]}">`).join("");

  const km = (a, b) => {
    const R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  let layer = null;
  function fly(name, lat, lon) {
    stop();
    const [x0, y0] = proj(CASA[1], CASA[0]), [x1, y1] = proj(lon, lat);
    // route: a gentle arc from Casablanca to the site
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / len) * len * 0.22, cy = my + (dx / len) * len * 0.22;
    if (layer) layer.remove();
    layer = document.createElementNS(NS, "g"); layer.setAttribute("class", "ciel__layer");
    const near = len < 4;
    layer.innerHTML = (near ? "" : `<path class="ciel__route" d="M${x0} ${y0} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1} ${y1}" pathLength="1"/>`) +
      `<g class="mk ciel__pin" data-x="${x1}" data-y="${y1}"><circle class="ciel__ring" r="6"/><circle class="ciel__ring ciel__ring--2" r="6"/><circle class="ciel__core" r="4"/>
        <text class="ciel__name" x="10" y="-6">${T("Votre chantier")}</text><text class="ciel__city" x="10" y="5">${name}</text></g>`;
    map.appendChild(layer);
    // fly: whole country first, then frame Casablanca + the site
    const pad = 70, minX = Math.min(x0, x1), maxX = Math.max(x0, x1), minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
    let w = Math.max(150, maxX - minX + pad * 2), h = Math.max(150, maxY - minY + pad * 2);
    if (w / h > W / H) h = (w * H) / W; else w = (h * W) / H;
    const target = [(minX + maxX) / 2 - w / 2, (minY + maxY) / 2 - h / 2, w, h];
    zoomTo([0, 0, W, H], reduce ? 0 : 700);
    setTimeout(() => { zoomTo(target, reduce ? 0 : 2200); layer.classList.add("is-on"); }, reduce ? 0 : 750);

    const road = near ? 15 : Math.round(km(CASA, [lat, lon]) * 1.25 / 5) * 5;
    const hours = Math.max(1, Math.round(road / 55));
    const mob = road <= 650 ? "48 h" : "72 h";
    out.innerHTML = `<b>${name}</b>
      <dl><div><dt>${T("Depuis Casablanca")}</dt><dd>≈ ${new Intl.NumberFormat("fr-FR").format(road)} km</dd></div>
      <div><dt>${T("Transport des engins")}</dt><dd>≈ ${hours} h</dd></div>
      <div><dt>${T("Station opérationnelle")}</dt><dd>${T("sous {d}", { d: mob })}</dd></div></dl>
      <small>${T("Indicatif — distance par la route estimée, confirmée après visite technique.")}</small>
      <a class="link" href="concassage.html#devis" data-ciel-devis>${T("Estimer mon projet à {v} →", { v: name })}</a>`;
    out.hidden = false;
    out.querySelector("[data-ciel-devis]").addEventListener("click", () => { try { sessionStorage.setItem("dtLieu", name); } catch (e) {} });
    if (window.DTSound) window.DTSound.play("gravier", 0.35);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = norm(inp.value); if (!q) return;
    const c = CITIES.find((x) => norm(x[0]) === q) || CITIES.find((x) => norm(x[0]).startsWith(q)) || CITIES.find((x) => norm(x[0]).includes(q));
    if (c) { inp.value = c[0]; fly(c[0], c[1], c[2]); }
    else { out.innerHTML = `<small>${T("Ville introuvable — essayez la ville la plus proche, ou « Utiliser ma position ».")}</small>`; out.hidden = false; }
  });
  inp.addEventListener("change", () => { if (CITIES.some((x) => x[0] === inp.value)) form.requestSubmit(); });

  const me = form.querySelector("[data-ciel-me]");
  if (!navigator.geolocation) me.hidden = true;
  me.addEventListener("click", () => {
    me.textContent = T("Localisation…");
    navigator.geolocation.getCurrentPosition((p) => {
      me.textContent = T("Utiliser ma position");
      const { latitude: la, longitude: lo } = p.coords;
      if (la < 20.5 || la > 36.2 || lo < -17.5 || lo > -0.9) { out.innerHTML = `<small>${T("Votre position semble hors du Maroc — indiquez la ville du chantier.")}</small>`; out.hidden = false; return; }
      // label with the nearest known town
      const near = CITIES.reduce((a, c) => (km([la, lo], [c[1], c[2]]) < km([la, lo], [a[1], a[2]]) ? c : a));
      fly(T("Près de {v}", { v: near[0] }), la, lo);
    }, () => { me.textContent = T("Utiliser ma position"); }, { timeout: 10000, maximumAge: 600000 });
  });
})();
