/* =========================================================================
   DAM TRUCK — « Photographiez votre roche » (page Concassage)
   The photo is downsized in the browser, sent to our own server
   (/api/roche → Claude vision) and the answer becomes a station proposal
   that can pre-fill the quote form. Without the server (local preview, no
   API key, offline) the page makes a modest on-device estimate from colour
   and texture and says so.
   ========================================================================= */
(() => {
  const root = document.querySelector("[data-roche]");
  if (!root) return;
  const T = (s, v) => (window.I18N ? window.I18N.t(s, v) : String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v ? v[k] : "")));
  const $ = (s) => root.querySelector(s);
  const file = $("[data-roche-file]"), drop = $("[data-roche-drop]"), stage = $("[data-roche-stage]"), img = $("[data-roche-img]"), status = $("[data-roche-status]"), out = $("[data-roche-result]");

  const LABEL = { calcaire: "Calcaire", basalte: "Basalte", granite: "Granite", gres: "Grès", beton: "Béton de démolition", enrobe: "Enrobé", deblais: "Déblais de chantier", mixte: "Matériau mixte", autre: "Autre matériau" };
  const DEVIS_MAT = { calcaire: "Calcaire", basalte: "Basalte", granite: "Granite", gres: "Grès", beton: "Béton de démolition", deblais: "Déblais de chantier" };
  const R6_ROCK = { calcaire: "calcaire", basalte: "basalte", granite: "granite", beton: "beton" };
  const SIZE = { fin: "Petits blocs", moyen: "Blocs moyens", gros: "Gros blocs", tres_gros: "Très gros blocs" };

  // downsize to ≤ 1280 px JPEG — lighter upload, plenty for the analysis
  function load(f) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = rej;
      r.onload = () => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
          const k = Math.min(1, 1280 / Math.max(im.width, im.height));
          const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          const x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height);
          res({ url: c.toDataURL("image/jpeg", 0.85), ctx: x, w: c.width, h: c.height });
        };
        im.src = r.result;
      };
      r.readAsDataURL(f);
    });
  }

  // on-device fallback: colour + texture → a cautious guess
  function localGuess({ ctx, w, h }) {
    const d = ctx.getImageData(0, 0, w, h).data;
    let n = 0, R = 0, G = 0, B = 0, L = 0, L2 = 0, sat = 0;
    for (let i = 0; i < d.length; i += 4 * 16) {
      const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      R += r; G += g; B += b; L += l; L2 += l * l; sat += mx ? (mx - mn) / mx : 0; n++;
    }
    R /= n; G /= n; B /= n; L /= n; sat /= n;
    const contrast = Math.sqrt(Math.max(0, L2 / n - L * L)), warm = R - B;
    let m = "calcaire";
    if (L < 95 && sat < 0.22) m = "basalte";
    else if (sat < 0.12 && contrast > 48) m = "beton";
    else if (warm > 38 && sat > 0.3) m = "deblais";
    else if (warm > 12 && contrast > 55) m = "granite";
    const hard = { calcaire: 1, basalte: 4, granite: 3, beton: 2, deblais: 2 }[m];
    return {
      is_rock: true, material: m, material_label: LABEL[m], block_size: contrast > 60 ? "gros" : "moyen", hardness: hard,
      steel_present: false, fractions: m === "deblais" ? ["0/31,5", "40/80"] : ["0/4", "10/14", "0/31,5"],
      station: m === "beton" ? "Keestrack R6 + séparateur magnétique + crible double étage" : hard >= 3 ? "Concasseur à mâchoires + Keestrack R6 + crible" : "Keestrack R6 avec pré-crible et post-crible",
      confidence: 40, notes: T("Estimation faite sur votre appareil, à partir des couleurs et de la texture. L'analyse complète sera active à la mise en ligne."),
    };
  }

  const dots = (n) => "●".repeat(n) + "○".repeat(4 - n);
  function render(e, source) {
    if (!e.is_rock) {
      out.innerHTML = `<p class="roche__warn">${T("Nous ne reconnaissons pas de roche sur cette photo. Essayez de photographier le stock ou le front de taille de plus près.")}</p><button type="button" class="btn" data-again>${T("Reprendre une photo")}</button>`;
    } else {
      out.innerHTML = `
        <div class="roche__head"><small>${source === "ai" ? T("Analyse IA") : T("Estimation rapide")} · ${T("confiance")} ${e.confidence} %</small><i style="--c:${e.confidence}%"></i></div>
        <b class="roche__mat">${e.material_label || T(LABEL[e.material])}</b>
        <dl class="roche__facts">
          <div><dt>${T("Dureté")}</dt><dd>${dots(Math.max(1, Math.min(4, e.hardness)))}</dd></div>
          <div><dt>${T("Blocs")}</dt><dd>${T(SIZE[e.block_size] || "")}</dd></div>
          <div><dt>${T("Ferraille")}</dt><dd>${e.steel_present ? T("Oui — overband") : T("Non visible")}</dd></div>
        </dl>
        <div class="roche__fr"><span>${T("Fractions possibles")}</span>${e.fractions.map((f) => `<em>${f}</em>`).join("")}</div>
        <p class="roche__station"><span>${T("Station proposée")}</span>${e.station}</p>
        <p class="roche__notes">${e.notes}</p>
        <div class="roche__actions">
          <a class="btn btn--gold" href="#devis" data-use>${T("Utiliser pour mon devis")} <span class="btn__arrow">↓</span></a>
          ${R6_ROCK[e.material] ? `<a class="btn" href="#r6" data-r6go>${T("Voir dans la station R6")} <span class="btn__arrow">↑</span></a>` : ""}
          <button type="button" class="link roche__again" data-again>${T("Autre photo")}</button>
        </div>`;
    }
    out.hidden = false;
    stage.classList.add("is-done");
    status.textContent = source === "ai" ? T("Analyse terminée") : T("Estimation terminée");
    out.querySelector("[data-again]").addEventListener("click", () => { file.value = ""; file.click(); });
    const use = out.querySelector("[data-use]");
    if (use) use.addEventListener("click", () => prefill(e));
    const go = out.querySelector("[data-r6go]");
    if (go) go.addEventListener("click", () => { const b = document.querySelector(`[data-r6-rock] [data-v="${R6_ROCK[e.material]}"]`); b && b.click(); });
    if (window.DTSound) window.DTSound.play("gravier", 0.5);
  }

  // pre-fill the quote form by pressing its own chips (keeps its state logic in one place)
  function prefill(e) {
    const press = (group, v, multi) => {
      const b = document.querySelector(`[data-group="${group}"] [data-v="${v}"]`);
      if (b && (!multi || b.getAttribute("aria-pressed") !== "true")) { if (!multi && b.getAttribute("aria-pressed") === "true") return; b.click(); }
    };
    press("materiau", DEVIS_MAT[e.material] || "À déterminer");
    const map = { "0/31,5": "GNT 0/31.5" };
    e.fractions.forEach((f) => press("fractions", map[f] || f, true));
    const note = document.querySelector('[data-k="note"]');
    if (note && !note.value) { note.value = `${T("Analyse photo")} : ${e.material_label || LABEL[e.material]} — ${e.station}`; note.dispatchEvent(new Event("input", { bubbles: true })); }
  }

  async function analyse(f) {
    if (!f || !/^image\//.test(f.type)) return;
    out.hidden = true; stage.hidden = false; stage.classList.remove("is-done"); drop.classList.add("is-small");
    status.textContent = T("Analyse en cours…");
    let pic;
    try { pic = await load(f); } catch (err) { status.textContent = T("Photo illisible — essayez une autre image."); return; }
    img.src = pic.url;
    const minWait = new Promise((r) => setTimeout(r, 1800)); // let the scan read as a scan
    let est = null, source = "local";
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
      const r = await fetch("/api/roche", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: pic.url }), signal: ctl.signal });
      clearTimeout(to);
      if (r.ok) { const j = await r.json(); if (j.ok && j.estimate) { est = j.estimate; source = "ai"; } }
    } catch (err) {}
    if (!est) est = localGuess(pic);
    await minWait;
    render(est, source);
  }

  file.addEventListener("change", () => analyse(file.files[0]));
  ["dragover", "dragenter"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); analyse(e.dataTransfer.files[0]); });
})();
