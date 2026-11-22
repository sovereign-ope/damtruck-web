/* DAM TRUCK — Passeport machine (passeport.html?ref=DT-101)
   Lit window.DT (assets/data.js) : MACHINES, sinon MACHINES_EXEMPLE (affiché « SPÉCIMEN »).
   Rien n'est inventé : un champ vide s'affiche « — », pas d'historique sans rapport. */
(function () {
  const DT = window.DT || {};
  const ref = new URLSearchParams(location.search).get("ref") || "";
  const real = (DT.MACHINES || []).find((m) => m.ref === ref);
  const ex = (DT.MACHINES_EXEMPLE || []).find((m) => m.ref === ref);
  const m = real || ex || (DT.MACHINES || [])[0] || (DT.MACHINES_EXEMPLE || [])[0];
  const root = document.getElementById("passport");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const v = (s) => (s === "" || s == null ? "—" : esc(s));
  if (!m) { root.innerHTML = `<div class="empty"><p class="kicker">PASSEPORT MACHINE</p><h1>Aucune machine</h1><p class="type">Ce passeport n'existe pas ou la machine n'est plus en vente.</p><div class="cta" style="justify-content:center"><a class="btn" href="machines.html">VOIR LES MACHINES</a></div></div>`; return; }
  const specimen = !real || (m.inspection && m.inspection.specimen);
  document.title = `${m.title} — Passeport machine · DAM TRUCK`;
  const STATUS = { dispo: "DISPONIBLE", reserve: "RÉSERVÉE", vendu: "VENDUE" };
  const price = m.price ? `${Number(m.price).toLocaleString("fr-FR")} MAD HT` : "Prix sur demande";
  // serial: the reference + a check code derived from it (stable, not random)
  const check = [...m.ref].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7).toString(36).toUpperCase().padStart(3, "0");
  const insp = m.inspection;
  let inspHtml = `<p class="type">Aucun rapport d'inspection publié pour cette machine. Demandez-le à DAM TRUCK.</p>`;
  if (insp && insp.groups) {
    const all = insp.groups.flatMap((g) => g.items.map((it) => ({ g: g.name, s: it[1] })));
    const n = (s) => all.filter((x) => x.s === s).length;
    const bars = insp.groups.map((g) => {
      const ok = g.items.filter((i) => i[1] === "ok" || i[1] === "rep").length;
      return `<div class="bar"><span>${esc(g.name)}</span><span>${ok}/${g.items.length}</span><i><em style="width:${Math.round((ok / g.items.length) * 100)}%"></em></i></div>`;
    }).join("");
    inspHtml = `<div class="bars">${bars}</div>
      <div class="legend"><span><span class="dot" style="background:var(--ok)"></span>${n("ok")} conforme${n("ok") > 1 ? "s" : ""}</span><span><span class="dot" style="background:var(--obs)"></span>${n("obs")} à surveiller</span><span><span class="dot" style="background:var(--rep)"></span>${n("rep")} remplacé${n("rep") > 1 ? "s" : ""}</span></div>
      ${insp.notes ? `<p class="verdict">« ${esc(insp.notes)} »</p>` : ""}
      <p class="signed">Inspection du ${v(insp.date)} · ${v(insp.place)} · par ${v(insp.by)}</p>
      <div class="cta"><a class="btn" href="inspection.html?ref=${encodeURIComponent(m.ref)}">RAPPORT COMPLET</a></div>`;
  }
  const specs = Object.entries(m.specs || {}).map(([k, val]) => `<dt>${esc(k)}</dt><dd>${v(val)}</dd>`).join("");
  const wa = DT.waMachines ? `https://wa.me/${DT.waMachines}?text=${encodeURIComponent(`Bonjour, je suis intéressé par la machine ${m.title} (réf. ${m.ref}).`)}` : "";
  const seal = `<svg class="seal" viewBox="0 0 120 120" aria-hidden="true">
      <defs><path id="c" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3cc95"/><stop offset=".5" stop-color="#b69256"/><stop offset="1" stop-color="#8c6f3f"/></linearGradient></defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="url(#g)" stroke-width="1.5"/><circle cx="60" cy="60" r="36" fill="none" stroke="url(#g)" stroke-width=".8"/>
      <text font-family="Cinzel" font-size="8.5" letter-spacing="3.2" fill="#d7bd86"><textPath href="#c">DAM TRUCK · ${specimen ? "SPÉCIMEN" : "VÉRIFIÉ"} · PASSEPORT · </textPath></text>
      <text x="60" y="58" text-anchor="middle" font-family="Bodoni Moda" font-size="15" fill="#e3cc95">DT</text>
      <text x="60" y="74" text-anchor="middle" font-family="Cinzel" font-size="7" letter-spacing="1.5" fill="#9b9486">${esc(check)}</text></svg>`;
  root.innerHTML = `
    <article class="doc">
      <span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
      ${specimen ? `<div class="specimen">SPÉCIMEN</div>` : ""}
      <div class="top">
        <div class="photo">${m.img ? `<img src="${esc(m.img)}" alt="${esc(m.title)}" />` : ""}</div>
        <div class="id">
          ${seal}
          <p class="kicker">PASSEPORT MACHINE</p>
          <h1>${esc(m.title)}</h1>
          <p class="type">${v(m.type)}</p>
          <div class="serial">
            <div><span>RÉFÉRENCE</span><b>${esc(m.ref)}</b></div>
            <div><span>ANNÉE</span><b>${v(m.year)}</b></div>
            <div><span>HEURES</span><b>${v(m.hours)}</b></div>
            <div><span>LIEU</span><b>${v(m.location)}</b></div>
          </div>
          <span class="status ${esc(m.status || "")}">${STATUS[m.status] || "—"}</span>
          <p class="type" style="margin-top:1rem">${esc(price)}</p>
        </div>
      </div>
      <div class="grid">
        <section>
          <h2>FICHE TECHNIQUE</h2>
          <dl>${specs}</dl>
          ${m.desc ? `<p class="desc">${esc(m.desc)}</p>` : ""}
        </section>
        <section>
          <h2>INSPECTION</h2>
          ${inspHtml}
          <div class="cta">
            ${wa ? `<a class="btn wa" href="${wa}" target="_blank" rel="noopener">WHATSAPP</a>` : ""}
            ${DT.phoneMachinesRaw ? `<a class="btn" href="tel:${esc(DT.phoneMachinesRaw)}">APPELER</a>` : ""}
          </div>
          <div class="qr"><img src="images/passport/qr-${encodeURIComponent(m.ref)}.svg" alt="QR ${esc(m.ref)}" onerror="this.remove()" />
            <p>Ce QR est gravé sur la plaque de la machine. Scannez-le sur le chantier pour retrouver ce passeport.<br /><a href="plaque.html?ref=${encodeURIComponent(m.ref)}" style="color:var(--soft)">Imprimer la plaque</a></p></div>
        </section>
      </div>
    </article>`;
})();
