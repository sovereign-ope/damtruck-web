/* =========================================================================
   DAM TRUCK — Station Keestrack R6 en action (page Concassage)
   Side elevation to scale (50 units = 1 m, ground at y 640) after
   Keestrack's R6 drawings: front hopper on a tilting frame with
   double-deck pre-screen and side conveyor, compact crusher + power-pack
   block (rotor Ø 1 267 mm), main conveyor under an overband magnet,
   double-deck after-screen at the rear with platform, oversize return
   conveyor back to the hopper, long product conveyor. A Doosan DX340LC
   excavator swings between the tout-venant and the hopper; a Volvo L180
   wheel loader works the stockpile. Visitors pick the rock and the
   fraction (0/31,5 or 0/40); stones flow on a canvas over the SVG.
   ========================================================================= */
(() => {
  const root = document.querySelector("[data-r6]");
  if (!root) return;
  const T = (s, v) => (window.I18N ? window.I18N.t(s, v) : String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v ? v[k] : "")));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const VX = -330, VY = 196, VW = 2250, VH = 484, G = 640; // viewBox + ground line

  /* ------------------------------------------------------------ palette */
  const K = { y: "#eeb10a", yd: "#c18c05", yl: "#ffd34d", gr: "#2c2e31", gr2: "#43464a", gr3: "#5f6368", belt: "#18191b", rol: "#7a7e83", rub: "#141415", steel: "#9aa0a6" };
  const DS = { o: "url(#r6o)", od: "#b8481b" }; // Doosan orange
  const V = { y: "#f2b300", yd: "#c78f00", blk: "#1b1b1c", glass: "rgba(140,172,190,.5)", grey: "#3a3c3f" };

  /* ------------------------------------------------------- drawing helpers */
  const conveyor = (x1, y1, x2, y2, w = 10) => {
    const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.floor(len / 30)), ux = (x2 - x1) / len, uy = (y2 - y1) / len, nx = -uy, ny = ux;
    const s = ny < 0 ? -1 : 1; // normal pointing down
    let rollers = "";
    for (let i = 1; i < n; i++) { const t = i / n; rollers += `<circle cx="${(x1 + (x2 - x1) * t + nx * s * w * 0.9).toFixed(1)}" cy="${(y1 + (y2 - y1) * t + ny * s * w * 0.9).toFixed(1)}" r="2.6" fill="${K.rol}"/>`; }
    const ox = nx * s * w * 1.7, oy = ny * s * w * 1.7;
    return `<g>
      <polygon points="${x1},${y1} ${x2},${y2} ${(x2 + ox).toFixed(1)},${(y2 + oy).toFixed(1)} ${(x1 + ox).toFixed(1)},${(y1 + oy).toFixed(1)}" fill="${K.gr}"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${K.belt}" stroke-width="4" stroke-linecap="round"/>
      ${rollers}
      <circle cx="${(x1 + ox * 0.45).toFixed(1)}" cy="${(y1 + oy * 0.45).toFixed(1)}" r="${w * 0.75}" fill="${K.gr2}" stroke="${K.belt}" stroke-width="2"/>
      <circle cx="${(x2 + ox * 0.45).toFixed(1)}" cy="${(y2 + oy * 0.45).toFixed(1)}" r="${w * 0.8}" fill="${K.gr2}" stroke="${K.belt}" stroke-width="2"/>
    </g>`;
  };
  const truss = (x1, y1, x2, y2, off = 18, depth = 14) => {
    const n = Math.max(3, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 36)); let s = "";
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const ax = x1 + (x2 - x1) * t0, ay = y1 + (y2 - y1) * t0 + off, bx = x1 + (x2 - x1) * t1, by = y1 + (y2 - y1) * t1 + off;
      s += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(by + depth).toFixed(1)}" stroke="${K.gr3}" stroke-width="1.4"/>`;
    }
    return `<g>${s}<line x1="${x1}" y1="${y1 + off + depth}" x2="${x2}" y2="${y2 + off + depth}" stroke="${K.gr3}" stroke-width="2"/></g>`;
  };
  const track = (x, y, w, h, nRoll, col = K.gr) => {
    let r = ""; for (let i = 0; i < nRoll; i++) r += `<circle cx="${(x + h * 0.95 + (w - h * 1.9) * (i / (nRoll - 1))).toFixed(1)}" cy="${y + h * 0.66}" r="${(h * 0.15).toFixed(1)}" fill="${K.gr3}"/>`;
    let pads = ""; for (let i = 0; i < Math.floor(w / 8); i++) pads += `<rect x="${x + 2 + i * 8}" y="${y + h - 4}" width="5" height="4" fill="#0b0b0c"/>`;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${K.rub}"/>
      <rect x="${x + h * 0.4}" y="${y + h * 0.2}" width="${w - h * 0.8}" height="${h * 0.42}" fill="${col}"/>${r}
      <circle cx="${x + h / 2}" cy="${y + h / 2}" r="${h * 0.36}" fill="${K.gr2}" stroke="#0b0b0c" stroke-width="2"/>
      <circle cx="${x + w - h / 2}" cy="${y + h / 2}" r="${h * 0.38}" fill="${K.gr2}" stroke="#0b0b0c" stroke-width="2"/>
      <circle cx="${x + w - h / 2}" cy="${y + h / 2}" r="${h * 0.14}" fill="${K.gr3}"/>${pads}</g>`;
  };
  const rails = (x1, x2, yTop, yBase, step = 24) => {
    let s = `<line x1="${x1}" y1="${yTop}" x2="${x2}" y2="${yTop}" stroke="${K.steel}" stroke-width="2.4"/><line x1="${x1}" y1="${(yTop + yBase) / 2}" x2="${x2}" y2="${(yTop + yBase) / 2}" stroke="${K.steel}" stroke-width="1.4"/>`;
    for (let x = x1; x <= x2 + 0.1; x += step) s += `<line x1="${x}" y1="${yTop}" x2="${x}" y2="${yBase}" stroke="${K.steel}" stroke-width="2"/>`;
    return s;
  };
  const ladder = (x1, y1, x2, y2, rungs) => {
    let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${K.steel}" stroke-width="2.4"/><line x1="${x1 + 12}" y1="${y1}" x2="${x2 + 12}" y2="${y2}" stroke="${K.steel}" stroke-width="2.4"/>`;
    for (let i = 1; i < rungs; i++) { const t = i / rungs, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; s += `<line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${K.steel}" stroke-width="1.8"/>`; }
    return s;
  };

  /* ------------------------------------------------------- Keestrack R6 */
  // rear conveyor geometry (from Ihab's own R6): tail under the power pack, head high at the rear
  const CT = [860, 594], CH = [1400, 344];
  const cAt = (f, off = 0) => { const ux = CH[0] - CT[0], uy = CH[1] - CT[1], L = Math.hypot(ux, uy), nx = uy / L, ny = -ux / L; return [CT[0] + ux * f + nx * off, CT[1] + uy * f + ny * off]; };
  const CANG = (Math.atan2(CH[1] - CT[1], CH[0] - CT[0]) * 180) / Math.PI; // ≈ -24.8°
  const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  function r6() {
    // after-screen box sits along the rear conveyor, steeply inclined like the real machine
    const A = cAt(0.3, 14), B = cAt(0.7, 14), C = cAt(0.7, 94), Dd = cAt(0.3, 94);
    const deck = (o) => { const p = cAt(0.32, o), q = cAt(0.68, o); return [p, q]; };
    const [d1a, d1b] = deck(70), [d2a, d2b] = deck(46);
    const vib = (f) => { const c = cAt(f, 56); return `<g transform="rotate(${CANG.toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)})"><rect x="${(c[0] - 26).toFixed(1)}" y="${(c[1] - 18).toFixed(1)}" width="52" height="36" rx="3" fill="#b5b0a2" stroke="${K.yd}" stroke-width="2"/>${[0, 1, 2].map((i) => `<circle cx="${(c[0] - 14 + i * 14).toFixed(1)}" cy="${c[1].toFixed(1)}" r="3.5" fill="#6d6a62"/>`).join("")}</g>`; };
    const railTop = [0.32, 0.42, 0.52, 0.62, 0.69].map((f) => { const p = cAt(f, 94), q = cAt(f, 122); return `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${K.steel}" stroke-width="2"/>`; }).join("");
    const rt0 = cAt(0.31, 122), rt1 = cAt(0.69, 122), mesh = cAt(0.5, 30);
    let louv = ""; for (let y = 458; y <= 510; y += 6) louv += `<line x1="714" y1="${y}" x2="760" y2="${y}" stroke="${K.yd}" stroke-width="2"/>`;
    const fanC = [852, 486];
    return `<g class="r6">
      <!-- oversize return conveyor: top of the screen → back over the machine into the hopper -->
      <g data-hot="return">${conveyor(1206, 322, 560, 424, 6)}
        <line x1="760" y1="398" x2="760" y2="448" stroke="${K.gr3}" stroke-width="3"/><line x1="1000" y1="362" x2="1000" y2="436" stroke="${K.gr3}" stroke-width="3"/></g>
      <!-- rear conveyor (crushed material up to the stockpile) + its yellow support frame -->
      <g data-hot="product">
        ${truss(CT[0], CT[1], CH[0], CH[1], 20, 18)}${conveyor(CT[0], CT[1], CH[0], CH[1], 11)}
        <path d="M960 592 L1118 474 L1130 488 L976 598 Z" fill="url(#r6y)"/>
        <path d="M1286 640 L1290 398 L1304 396 L1302 640 Z" fill="${K.yd}"/><rect x="1272" y="634" width="44" height="6" fill="${K.gr2}"/>
      </g>
      <!-- chassis + tracks -->
      <path d="M396 566 L984 566 L984 590 L960 598 L420 598 L396 586 Z" fill="url(#r6y)"/>
      <rect x="396" y="584" width="588" height="6" fill="${K.yd}"/>
      ${track(560, 594, 272, 46, 7)}
      <!-- after-screen: double deck, angled down along the conveyor, vibrator housings on the side -->
      <g data-hot="screen">
        <path d="M996 566 L1004 504 L1018 504 L1012 566 Z" fill="url(#r6y)"/>
        <path d="M1126 640 L1132 462 L1146 462 L1142 640 Z" fill="url(#r6y)"/><rect x="1114" y="634" width="42" height="6" fill="${K.gr2}"/>
        <g class="r6__scrn">
          <polygon points="${pt(A)} ${pt(B)} ${pt(C)} ${pt(Dd)}" fill="${K.gr}"/>
          <polygon points="${pt(Dd)} ${pt(C)} ${pt(cAt(0.7, 84))} ${pt(cAt(0.3, 84))}" fill="${K.gr2}"/>
          <polygon class="r6__xwin" points="${pt(cAt(0.31, 22))} ${pt(cAt(0.69, 22))} ${pt(cAt(0.69, 80))} ${pt(cAt(0.31, 80))}" fill="#121314"/>
          <line class="r6__deck1 r6__xray" x1="${d1a[0].toFixed(1)}" y1="${d1a[1].toFixed(1)}" x2="${d1b[0].toFixed(1)}" y2="${d1b[1].toFixed(1)}" stroke="${K.yl}" stroke-width="2" stroke-dasharray="9 5"/>
          <line class="r6__deck2 r6__xray" x1="${d2a[0].toFixed(1)}" y1="${d2a[1].toFixed(1)}" x2="${d2b[0].toFixed(1)}" y2="${d2b[1].toFixed(1)}" stroke="${K.yl}" stroke-width="1.5" stroke-dasharray="3 3"/>
          ${vib(0.4)}${vib(0.6)}
          <text class="r6__mesh" x="${mesh[0].toFixed(1)}" y="${mesh[1].toFixed(1)}" text-anchor="middle" transform="rotate(${CANG.toFixed(1)} ${mesh[0].toFixed(1)} ${mesh[1].toFixed(1)})" font-family="Jost, Arial, sans-serif" font-size="12" letter-spacing="1.5" fill="${K.yl}">31,5 mm</text>
        </g>
        ${railTop}<line x1="${rt0[0].toFixed(1)}" y1="${rt0[1].toFixed(1)}" x2="${rt1[0].toFixed(1)}" y2="${rt1[1].toFixed(1)}" stroke="${K.steel}" stroke-width="2.4"/>
        <rect x="930" y="470" width="96" height="6" fill="${K.gr2}"/>${rails(932, 1024, 436, 470, 23)}
        ${ladder(968, 640, 982, 476, 8)}
      </g>
      <!-- overband magnet over the rising conveyor -->
      <g data-hot="magnet">
        <line x1="946" y1="470" x2="946" y2="500" stroke="${K.gr3}" stroke-width="3"/>
        <g transform="rotate(${CANG.toFixed(1)} 958 516)"><rect x="926" y="506" width="64" height="20" rx="4" fill="#38424c"/><rect x="930" y="510" width="56" height="4" fill="url(#r6y)"/></g>
      </g>
      <!-- crusher housing + lower body, with the DAM TRUCK logos as on Ihab's machine -->
      <g data-hot="engine">
        <path d="M606 596 L606 520 L944 520 L944 596 Z" fill="url(#r6y)"/>
        <path d="M606 520 L606 494 L640 478 L700 478 L700 520 Z" fill="url(#r6y)"/>
        <line x1="700" y1="522" x2="700" y2="596" stroke="${K.yd}" stroke-width="2"/><line x1="800" y1="522" x2="800" y2="596" stroke="${K.yd}" stroke-width="2"/><line x1="880" y1="522" x2="880" y2="596" stroke="${K.yd}" stroke-width="2"/>
        <image href="images/logo-mark-dark.png" x="712" y="530" width="62" height="36.5"/>
        <image href="images/logo-mark-dark.png" x="812" y="530" width="62" height="36.5"/>
        <text x="743" y="576" text-anchor="middle" font-family="Jost, Arial, sans-serif" font-weight="600" font-size="7.5" letter-spacing="1.2" fill="#192035">DAM TRUCK</text>
        <text x="843" y="576" text-anchor="middle" font-family="Jost, Arial, sans-serif" font-weight="600" font-size="7.5" letter-spacing="1.2" fill="#192035">DAM TRUCK</text>
        <!-- power pack: tall block, louvres, round radiator fan on the side -->
        <path d="M700 520 L700 456 Q700 446 710 446 L880 446 Q890 446 890 456 L890 520 Z" fill="url(#r6y)"/>
        ${louv}
        <rect x="772" y="456" width="44" height="56" rx="2" fill="none" stroke="${K.yd}" stroke-width="2"/><circle cx="810" cy="484" r="2" fill="${K.yd}"/>
        <rect x="824" y="456" width="56" height="58" rx="3" fill="#2c2e31"/>
        <circle cx="${fanC[0]}" cy="${fanC[1]}" r="24" fill="#8f938f" stroke="#5f6368" stroke-width="2"/>
        <g class="r6__fan">${Array.from({ length: 10 }, (_, i) => `<rect x="${fanC[0] - 1.5}" y="${fanC[1] - 22}" width="3" height="20" rx="1.5" fill="#d9dcd6" transform="rotate(${i * 36} ${fanC[0]} ${fanC[1]})"/>`).join("")}<circle cx="${fanC[0]}" cy="${fanC[1]}" r="6" fill="#5f6368"/></g>
        <rect x="728" y="424" width="9" height="24" fill="${K.gr}"/><rect x="725" y="420" width="15" height="6" fill="${K.gr2}"/>
        ${rails(704, 886, 424, 446, 26)}
      </g>
      <g data-hot="rotor">
        <polygon class="r6__xwin" points="616,500 652,486 696,486 696,520 732,520 732,560 616,560" fill="#121314"/>
        <g class="r6__xray">
          <circle cx="668" cy="528" r="32" fill="#0b0b0c" stroke="${K.yl}" stroke-width="1.5"/>
          <g class="r6__blades"><rect x="664" y="493" width="8" height="16" fill="${K.yl}"/><rect x="664" y="547" width="8" height="16" fill="${K.yl}"/><rect x="633" y="524" width="16" height="8" fill="${K.yl}"/><rect x="687" y="524" width="16" height="8" fill="${K.yl}"/><circle cx="668" cy="528" r="6" fill="${K.yl}"/></g>
          <path d="M704 494 L726 520 M706 548 L728 556" stroke="${K.yl}" stroke-width="3"/>
        </g>
      </g>
      <!-- hopper + pre-screen (front, on the tilting frame) -->
      <g data-hot="hopper">
        <polygon points="410,500 608,500 608,566 410,566" fill="url(#r6y)"/>
        <polygon points="410,500 608,500 608,508 410,508" fill="${K.yd}"/>
        <polygon class="r6__xwin" points="420,512 598,512 598,558 420,558" fill="#121314"/>
        <g class="r6__xray"><line x1="424" y1="520" x2="596" y2="536" stroke="${K.yl}" stroke-width="3" stroke-dasharray="10 5"/><line x1="424" y1="536" x2="596" y2="552" stroke="${K.yl}" stroke-width="2" stroke-dasharray="4 4"/></g>
        <polygon points="388,446 618,446 608,500 410,500" fill="url(#r6y)"/>
        <polygon points="378,432 628,432 618,446 388,446" fill="${K.gr2}"/>
        <line x1="440" y1="452" x2="448" y2="496" stroke="${K.yd}" stroke-width="3"/><line x1="500" y1="452" x2="502" y2="496" stroke="${K.yd}" stroke-width="3"/><line x1="560" y1="452" x2="556" y2="496" stroke="${K.yd}" stroke-width="3"/>
        <path d="M396 566 L410 520 L424 566 Z" fill="${K.yd}"/>
        ${ladder(586, 640, 596, 506, 6)}
      </g>
      <!-- pre-screen side conveyor (fines) -->
      <g data-hot="side">${conveyor(598, 572, 470, 624, 7)}</g>
    </g>`;
  }

  /* ----------------------------------------------------- Doosan DX340LC */
  // pivots: swing x 210 · boom foot (318,526) · stick (566,300) · bucket (614,462)
  function excavator() {
    return `<g class="ex" data-hot="ex">
      ${track(70, 580, 280, 60, 8)}
      <g class="ex__upper">
        <rect x="170" y="566" width="84" height="16" fill="${V.blk}"/>
        <g class="ex__boom">
          <path d="M306 540 Q352 392 552 288 L578 312 Q396 410 334 552 Z" fill="${DS.o}"/>
          <path d="M318 526 Q372 410 548 302" fill="none" stroke="${DS.od}" stroke-width="2"/>
          <text x="420" y="430" transform="rotate(-38 420 430)" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="17" letter-spacing="2" fill="${V.blk}">DOOSAN</text>
          <line x1="352" y1="560" x2="410" y2="440" stroke="${K.steel}" stroke-width="8"/><line x1="352" y1="560" x2="376" y2="510" stroke="${V.blk}" stroke-width="11"/>
          <line x1="470" y1="350" x2="552" y2="280" stroke="${K.steel}" stroke-width="6"/><line x1="470" y1="350" x2="500" y2="324" stroke="${V.blk}" stroke-width="9"/>
          <g class="ex__stick">
            <path d="M548 278 L580 290 L626 458 L604 468 Z" fill="${DS.o}"/>
            <line x1="556" y1="282" x2="598" y2="400" stroke="${K.steel}" stroke-width="5"/>
            <g class="ex__bucket">
              <path d="M604 452 L646 446 L660 500 L618 530 Q596 502 604 452 Z" fill="${V.grey}"/>
              <path d="M618 530 L660 500" stroke="${K.steel}" stroke-width="4"/>
              <path d="M622 534 L626 542 M634 526 L640 534 M646 518 L652 526" stroke="${K.steel}" stroke-width="3"/>
              <circle cx="614" cy="462" r="5" fill="${V.blk}"/>
            </g>
            <circle cx="566" cy="300" r="5" fill="${V.blk}"/>
          </g>
        </g>
        <path d="M58 568 L58 520 Q58 500 80 500 L156 500 L156 568 Z" fill="${DS.o}"/>
        <rect x="58" y="552" width="98" height="16" fill="${V.blk}"/>
        <path d="M156 568 L156 508 L292 508 L292 568 Z" fill="${DS.o}"/>
        ${Array.from({ length: 6 }, (_, i) => `<line x1="${180 + i * 14}" y1="520" x2="${180 + i * 14}" y2="548" stroke="${DS.od}" stroke-width="3"/>`).join("")}
        <line x1="166" y1="492" x2="270" y2="492" stroke="${K.steel}" stroke-width="2.4"/><line x1="170" y1="492" x2="170" y2="508" stroke="${K.steel}" stroke-width="2"/><line x1="266" y1="492" x2="266" y2="508" stroke="${K.steel}" stroke-width="2"/>
        <path d="M290 568 L290 466 L350 464 Q362 464 366 476 L380 530 L380 568 Z" fill="${V.grey}"/>
        <path d="M298 474 L348 472 Q356 472 358 480 L370 528 L298 528 Z" fill="${V.glass}"/>
        <line x1="330" y1="473" x2="333" y2="528" stroke="${V.grey}" stroke-width="3"/>
        <rect x="290" y="540" width="90" height="4" fill="${DS.o}"/>
      </g>
    </g>`;
  }

  /* ------------------------------------------------------ Volvo L180 */
  // pivots: lift arm (1736,526) · bucket (1604,594)
  function loader() {
    const wheel = (cx) => `<g><circle cx="${cx}" cy="596" r="44" fill="${K.rub}"/>${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<line x1="${(cx + Math.cos(a) * 36).toFixed(1)}" y1="${(596 + Math.sin(a) * 36).toFixed(1)}" x2="${(cx + Math.cos(a) * 44).toFixed(1)}" y2="${(596 + Math.sin(a) * 44).toFixed(1)}" stroke="#2a2a2b" stroke-width="4"/>`; }).join("")}<circle cx="${cx}" cy="596" r="25" fill="${V.y}"/><circle cx="${cx}" cy="596" r="10" fill="${V.blk}"/></g>`;
    return `<g class="ld" data-hot="ld">
      <path d="M1660 584 L1660 548 L1756 540 L1772 584 Z" fill="${V.y}"/>
      <path d="M1772 590 L1772 528 L1802 520 L1898 516 Q1916 516 1918 534 L1920 590 Z" fill="${V.y}"/>
      <rect x="1800" y="516" width="118" height="10" fill="${V.yd}"/>
      ${Array.from({ length: 5 }, (_, i) => `<line x1="${1880 + i * 7}" y1="532" x2="${1880 + i * 7}" y2="576" stroke="${V.yd}" stroke-width="3"/>`).join("")}
      <text x="1846" y="546" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="14" letter-spacing="1.5" fill="${V.blk}">VOLVO</text>
      <path d="M1752 540 L1752 462 L1818 462 L1826 540 Z" fill="${V.grey}"/>
      <path d="M1758 470 L1812 470 L1818 534 L1758 534 Z" fill="${V.glass}"/>
      <rect x="1746" y="454" width="84" height="10" rx="2" fill="${V.blk}"/>
      ${wheel(1698)}${wheel(1874)}
      <g class="ld__arm">
        <path d="M1746 520 L1610 584 L1600 570 L1730 506 Z" fill="${V.y}"/>
        <line x1="1754" y1="556" x2="1666" y2="560" stroke="${K.steel}" stroke-width="7"/><line x1="1754" y1="556" x2="1716" y2="558" stroke="${V.blk}" stroke-width="10"/>
        <path d="M1700 520 L1680 498 L1666 508 L1640 556" fill="none" stroke="${V.yd}" stroke-width="7" stroke-linejoin="round"/>
        <circle cx="1736" cy="526" r="5" fill="${V.blk}"/>
        <g class="ld__bucket">
          <path d="M1612 548 L1560 552 Q1534 584 1544 636 L1612 628 Q1622 590 1612 548 Z" fill="${V.grey}"/>
          <path d="M1544 636 L1612 628" stroke="${K.steel}" stroke-width="5"/>
          <circle cx="1604" cy="594" r="5" fill="${V.blk}"/>
        </g>
      </g>
    </g>`;
  }

  /* ------------------------------------------------------------ scene */
  let rockPile = "";
  for (let i = 0; i < 90; i++) { const x = -330 + Math.random() * 280, h = 130 - Math.abs(x + 210) * 0.95, y = G - Math.random() * Math.max(10, h), r = 8 + Math.random() * 13; rockPile += `<path class="rp" d="M${(x - r).toFixed(1)} ${y.toFixed(1)} L${(x - r * .4).toFixed(1)} ${(y - r * .9).toFixed(1)} L${(x + r * .5).toFixed(1)} ${(y - r * .8).toFixed(1)} L${(x + r).toFixed(1)} ${(y - r * .1).toFixed(1)} L${(x + r * .4).toFixed(1)} ${(y + r * .5).toFixed(1)} L${(x - r * .6).toFixed(1)} ${(y + r * .4).toFixed(1)}Z"/>`; }
  const grid = Array.from({ length: 30 }, (_, i) => `<line x1="${-320 + i * 80}" y1="${VY}" x2="${-320 + i * 80}" y2="${VY + VH}"/>`).join("") + Array.from({ length: 7 }, (_, i) => `<line x1="${VX}" y1="${G - i * 80}" x2="${VX + VW}" y2="${G - i * 80}"/>`).join("");
  const scene = root.querySelector("[data-r6-scene]");
  scene.innerHTML = `
    <svg class="r6__svg" viewBox="${VX} ${VY} ${VW} ${VH}" role="img" aria-label="${T("Station Keestrack R6 alimentée par une pelle Doosan DX340LC, stock repris par une chargeuse Volvo L180")}">
      <defs><linearGradient id="r6floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a241a"/><stop offset="1" stop-color="#0d0d0e"/></linearGradient>
        <linearGradient id="r6sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1012"/><stop offset=".75" stop-color="#231e16"/><stop offset="1" stop-color="#3a2f1e"/></linearGradient>
        <linearGradient id="r6y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc21f"/><stop offset=".55" stop-color="#eeb10a"/><stop offset="1" stop-color="#c99206"/></linearGradient>
        <linearGradient id="r6o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f47a3d"/><stop offset="1" stop-color="#c9501d"/></linearGradient></defs>
      <rect x="${VX}" y="${VY}" width="${VW}" height="${G - VY}" fill="url(#r6sky)"/>
      <path class="r6__hills" d="M${VX} ${G} L${VX} 600 Q-120 560 40 586 T360 574 T720 590 T1080 566 T1420 588 T1760 570 T${VX + VW} 584 L${VX + VW} ${G} Z"/>
      <g class="r6__grid">${grid}</g>
      <rect x="${VX}" y="${G}" width="${VW}" height="${VY + VH - G}" fill="url(#r6floor)"/>
      <line x1="${VX}" y1="${G}" x2="${VX + VW}" y2="${G}" class="r6__ground"/>
      <g class="r6__scale" transform="translate(1720 662)"><line x1="0" y1="0" x2="150" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="50" y1="-3" x2="50" y2="3"/><line x1="100" y1="-3" x2="100" y2="3"/><line x1="150" y1="-5" x2="150" y2="5"/><text x="75" y="-8" text-anchor="middle">3 m</text></g>
      <g class="r6__rockpile">${rockPile}</g>
      <polygon class="r6__fines" points="420,${G} 462,${G - 16} 506,${G}"/>
      <polygon class="r6__stock" points="1280,${G} 1410,${G - 40} 1540,${G}"/>
      ${r6()}
      ${loader()}
      ${excavator()}
      <g class="r6__hots"></g>
    </svg>
    <canvas class="r6__cv" aria-hidden="true"></canvas>`;
  const svg = scene.querySelector("svg"), cv = scene.querySelector("canvas"), cx = cv.getContext("2d");

  /* ------------------------------------------------------------ hotspots */
  const HOTS = [
    { k: "hopper", x: 596, y: 408, t: "Trémie + pré-crible", d: "Trémie de 7 m³ (extensions 9 m³), ouverture 970 × 1 300 mm. Le pré-crible double étage écarte la terre et les fines avant le concasseur." },
    { k: "side", x: 512, y: 612, t: "Convoyeur latéral", d: "Les fines du pré-crible sortent sur le côté : elles ne fatiguent pas le rotor." },
    { k: "rotor", x: 668, y: 528, t: "Rotor à percussion", d: "Rotor Ø 1 267 mm × 1 250 mm, 6,1 t. Les battoirs projettent la roche contre les écrans : grain cubique." },
    { k: "engine", x: 795, y: 408, t: "Groupe de puissance", d: "Diesel / électrique. Le système hydraulique « load sensing » réduit la consommation." },
    { k: "magnet", x: 960, y: 474, t: "Convoyeur principal + overband", d: "Le séparateur magnétique retire les ferrailles — essentiel en recyclage de béton." },
    { k: "screen", x: 1180, y: 300, t: "Post-crible double étage", d: "Il calibre la fraction finale : 0/31,5 ou 0/40. Le refus repart au concasseur." },
    { k: "return", x: 660, y: 384, t: "Convoyeur de retour", d: "Circuit fermé : les grains trop gros remontent dans la trémie. Rien ne se perd." },
    { k: "product", x: 1350, y: 318, t: "Convoyeur produit fini", d: "La fraction calibrée forme le stock, prête à être chargée." },
    { k: "ex", x: 220, y: 470, t: "Pelle Doosan DX340LC", d: "Alimente la trémie en continu depuis le tout-venant." },
    { k: "ld", x: 1790, y: 430, t: "Chargeuse Volvo L180", d: "Reprend le stock et charge les camions vers votre chantier." },
  ];
  scene.querySelector(".r6__hots").innerHTML = HOTS.map((h, i) => `<g class="r6__hot" data-k="${h.k}" tabindex="0" role="button" aria-label="${T(h.t)}" transform="translate(${h.x} ${h.y})"><circle r="15" class="r6__hotring"/><circle r="11"/><text y="4" text-anchor="middle">${i + 1}</text></g>`).join("");
  const info = root.querySelector("[data-r6-info]");
  function showHot(k) {
    const h = HOTS.find((x) => x.k === k); if (!h) return;
    info.innerHTML = `<small>${HOTS.indexOf(h) + 1} · ${T("Composant")}</small><b>${T(h.t)}</b><p>${T(h.d)}</p>`;
    const focus = k === "magnet" ? ["magnet", "main"] : [k];
    svg.querySelectorAll("[data-hot]").forEach((g) => g.classList.toggle("is-focus", focus.includes(g.dataset.hot)));
    svg.querySelectorAll(".r6__hot").forEach((g) => g.classList.toggle("is-on", g.dataset.k === k));
  }
  svg.addEventListener("click", (e) => { const g = e.target.closest(".r6__hot"); if (g) showHot(g.dataset.k); });
  svg.addEventListener("keydown", (e) => { const g = e.target.closest(".r6__hot"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); showHot(g.dataset.k); } });

  /* ------------------------------------------------------- material state */
  const ROCKS = {
    calcaire: { c: ["#e2d8c4", "#cfc3ab", "#bfb196", "#d8ccb4"], label: "Calcaire", dur: 1, debit: 4, usure: 1, d: "Roche tendre, se concasse facilement. Débit élevé, usure faible." },
    basalte: { c: ["#5b5c61", "#4a4b50", "#66676c", "#414246"], label: "Basalte", dur: 3, debit: 2, usure: 3, d: "Roche très dure et dense. Débit plus faible, usure plus élevée des battoirs." },
    granite: { c: ["#bcae9f", "#a8988a", "#cbbcad", "#8e8075"], label: "Granite", dur: 3, debit: 2, usure: 3, d: "Roche dure et abrasive, grain de qualité pour bétons et enrobés." },
    beton: { c: ["#a9a69e", "#bdbab2", "#94918a", "#c8c5bd"], label: "Béton recyclé", dur: 2, debit: 3, usure: 2, d: "Démolition valorisée : l'overband retire les ferrailles, le béton devient granulat." },
  };
  let rock = "calcaire", frac = "0/31,5";
  const dots = (n) => "●".repeat(Math.min(4, n)) + "○".repeat(Math.max(0, 4 - n));
  const panel = root.querySelector("[data-r6-mat]");
  function updatePanel() {
    const r = ROCKS[rock];
    panel.innerHTML = `<b>${T(r.label)} → ${frac}</b><p>${T(r.d)}</p>
      <dl><div><dt>${T("Dureté")}</dt><dd>${dots(r.dur + 1)}</dd></div><div><dt>${T("Débit")}</dt><dd>${dots(r.debit)}</dd></div><div><dt>${T("Usure")}</dt><dd>${dots(r.usure + 1)}</dd></div></dl>
      <small>${T("Le tonnage dépend du matériau et de la fraction : nous le chiffrons pour votre roche.")}</small>`;
    svg.querySelector(".r6__mesh").textContent = frac === "0/40" ? "40 mm" : "31,5 mm";
    svg.querySelector(".r6__deck1").setAttribute("stroke-dasharray", frac === "0/40" ? "12 5" : "9 5");
    svg.querySelectorAll(".rp").forEach((p, i) => p.setAttribute("fill", r.c[i % r.c.length]));
    svg.querySelector(".r6__stock").setAttribute("fill", r.c[1]);
    svg.querySelector(".r6__fines").setAttribute("fill", r.c[2]);
  }
  root.querySelector("[data-r6-rock]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    rock = b.dataset.v; root.querySelectorAll("[data-r6-rock] [data-v]").forEach((x) => x.setAttribute("aria-pressed", x === b)); updatePanel(); stock = 0.25; stones = []; warm();
  });
  root.querySelector("[data-r6-frac]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    frac = b.dataset.v; root.querySelectorAll("[data-r6-frac] [data-v]").forEach((x) => x.setAttribute("aria-pressed", x === b)); updatePanel();
  });
  let xray = false;
  root.querySelector("[data-r6-xray]").addEventListener("change", (e) => { xray = e.target.checked; root.classList.toggle("is-xray", xray); });

  /* ----------------------------------------------------- material paths */
  // "inside" paths run within the machine: only drawn in X-ray view
  const P = {
    feed: [[506, 448], [500, 470], [470, 506]],
    deck: [[424, 516], [596, 532]],
    toCrush: [[596, 532], [628, 506], [668, 528]],
    side: [[598, 568], [470, 620], [458, G - 12]],
    main: [[668, 562], [700, 590], [cAt(0, 0)[0], cAt(0, 0)[1] - 4], cAt(0.3, 4)],
    screen: [cAt(0.3, 4), cAt(0.7, 4)],
    product: [cAt(0.7, 4), [CH[0] + 6, CH[1] - 4], [CH[0] + 14, CH[1] + 20], [1410, G - 36]],
    ret: [[1206, 318], [560, 420], [540, 468]],
  };
  const INSIDE = { deck: 1, toCrush: 1, screen: 1 };
  const segLen = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
  const at = (p, d) => {
    for (let i = 1; i < p.length; i++) {
      const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (d <= l) { const t = d / l; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; }
      d -= l;
    }
    return p[p.length - 1];
  };
  const LEN = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, segLen(p)]));
  const SPEED = { feed: 4.2, deck: 1.5, toCrush: 2.4, side: 2.4, main: 2.6, screen: 1.4, product: 2.8, ret: 2.8 };
  let stones = [], stock = 0.25, raf = 0, running = false, t = 0;
  // soft dust clouds: where the bucket dumps, under the crusher, at the stockpile
  let puffs = [];
  const puff = (x, y, n = 6, spread = 30) => { for (let i = 0; i < n; i++) puffs.push({ x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * 10, r: 8 + Math.random() * 14, vx: 0.15 + Math.random() * 0.35, vy: -0.15 - Math.random() * 0.25, a: 0.22 + Math.random() * 0.12, life: 1 }); };
  function drawPuffs(k) {
    puffs = puffs.filter((p) => (p.life -= 0.006 * k) > 0);
    for (const p of puffs) {
      p.x += p.vx * k; p.y += p.vy * k; p.r += 0.25 * k;
      const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(196,170,128,${(p.a * p.life).toFixed(3)})`); g.addColorStop(1, "rgba(196,170,128,0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
    }
  }
  function spawnBucket() {
    puff(506, 440, 7, 70);
    const r = ROCKS[rock];
    for (let i = 0; i < 9; i++) stones.push({ path: "feed", d: Math.random() * 20, s: 6 + Math.random() * 6, c: r.c[i % 4], big: true, delay: i * 5 });
  }

  /* ------------------------------------------------------- machines motion */
  const ex = svg.querySelector(".ex__upper"), boom = svg.querySelector(".ex__boom"), stick = svg.querySelector(".ex__stick"), bucket = svg.querySelector(".ex__bucket");
  const ld = svg.querySelector(".ld"), arm = svg.querySelector(".ld__arm"), lbk = svg.querySelector(".ld__bucket");
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const lerp = (a, b, p) => a + (b - a) * p;
  const EX_PIV = 210;
  function exSet(face, b, s, k) {
    ex.setAttribute("transform", `translate(${EX_PIV} 0) scale(${face.toFixed(3)} 1) translate(${-EX_PIV} 0)`);
    boom.setAttribute("transform", `rotate(${b.toFixed(2)} 318 526)`);
    stick.setAttribute("transform", `rotate(${s.toFixed(2)} 566 300)`);
    bucket.setAttribute("transform", `rotate(${k.toFixed(2)} 614 462)`);
  }
  // excavator cycle: dump over the hopper → swing → dig the pile → swing back
  const EX_T = 10;
  // [time, facing (1 right / -1 left), boom°, stick°, bucket°]
  const EX_KF = [[0, 1, -22, 23, -30], [0.1, 1, -22, 23, 75], [0.2, 1, -24, 26, 40], [0.34, -1, -12, 10, 30], [0.46, -1, 18, -30, 10], [0.56, -1, 22, -6, -70], [0.66, -1, -10, 10, -60], [0.84, 1, -22, 23, -40], [1, 1, -22, 23, -30]];
  function exPose(ts) {
    const p = (ts % EX_T) / EX_T;
    let i = 1; while (i < EX_KF.length - 1 && EX_KF[i][0] < p) i++;
    const a = EX_KF[i - 1], b = EX_KF[i], q = ease(Math.min(1, (p - a[0]) / (b[0] - a[0] || 1)));
    exSet(lerp(a[1], b[1], q), lerp(a[2], b[2], q), lerp(a[3], b[3], q), lerp(a[4], b[4], q));
    return p;
  }
  let lastExP = 0;
  const LD_T = 12;
  function ldPose(ts) {
    const p = (ts % LD_T) / LD_T;
    const x = p < 0.3 ? lerp(0, -70, ease(p / 0.3)) : p < 0.5 ? -70 : p < 0.8 ? lerp(-70, 60, ease((p - 0.5) / 0.3)) : lerp(60, 0, ease((p - 0.8) / 0.2));
    const armA = p < 0.4 ? 0 : p < 0.6 ? lerp(0, 26, ease((p - 0.4) / 0.2)) : p < 0.8 ? 26 : lerp(26, 0, ease((p - 0.8) / 0.2));
    const bkA = p < 0.3 ? 0 : p < 0.4 ? lerp(0, 34, ease((p - 0.3) / 0.1)) : p < 0.85 ? 34 : lerp(34, 0, ease((p - 0.85) / 0.15));
    ld.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
    arm.setAttribute("transform", `rotate(${armA.toFixed(2)} 1736 526)`);
    lbk.setAttribute("transform", `rotate(${bkA.toFixed(2)} 1604 594)`);
    return p;
  }
  let lastLdP = 0;

  /* --------------------------------------------------------------- loop */
  function size() {
    const r = svg.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width) return;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    cv.style.width = r.width + "px"; cv.style.height = r.height + "px";
    const sx = dpr * r.width / VW, sy = dpr * r.height / VH;
    cx.setTransform(sx, 0, 0, sy, -VX * sx, -VY * sy);
    cx.strokeStyle = "rgba(255,246,225,.28)"; cx.lineWidth = 0.9;
  }
  function stone(x, y, s, c) {
    cx.fillStyle = c; cx.beginPath();
    cx.moveTo(x - s, y); cx.lineTo(x - s * 0.4, y - s * 0.8); cx.lineTo(x + s * 0.6, y - s * 0.7); cx.lineTo(x + s, y); cx.lineTo(x + s * 0.3, y + s * 0.6); cx.lineTo(x - s * 0.6, y + s * 0.5);
    cx.closePath(); cx.fill(); cx.stroke();
  }
  const blades = svg.querySelector(".r6__blades"), stockEl = svg.querySelector(".r6__stock"), fan = svg.querySelector(".r6__fan");
  // one simulation step (k = elapsed time in 60 fps frames); draw only when asked
  function tick(k, draw) {
    const r = ROCKS[rock], oversizeShare = (frac === "0/31,5" ? 0.34 : 0.24) + r.dur * 0.03;
    const next = [];
    if (draw) cx.clearRect(VX, VY, VW, VH);
    for (const st of stones) {
      if (st.delay > 0) { st.delay -= k; next.push(st); continue; }
      st.d += SPEED[st.path] * (st.big ? 0.9 : 1) * k;
      if (st.d >= LEN[st.path]) {
        const go = (p, patch) => { Object.assign(st, { path: p, d: 0 }, patch || {}); next.push(st); };
        if (st.path === "feed") go("deck");
        else if (st.path === "deck") { if (Math.random() < 0.18) go("side", { s: 2.2, big: false }); else go("toCrush"); }
        else if (st.path === "toCrush") {
          // the rotor breaks one block into several stones
          for (let j = 0; j < 4; j++) next.push({ path: "main", d: j * 6, s: 2.4 + Math.random() * 3, c: r.c[(j + 1) % 4], big: false, delay: j * 3 });
        } else if (st.path === "main") go("screen");
        else if (st.path === "screen") { if (Math.random() < oversizeShare) go("ret", { s: 4.2 }); else go("product", { s: frac === "0/40" ? 3.2 : 2.6 }); }
        else if (st.path === "ret") go("deck", { big: true });
        else if (st.path === "product") { stock = Math.min(1, stock + 0.004); if (draw && Math.random() < 0.08) puff(1410, G - 30 - stock * 60, 1, 20); }
        continue;
      }
      next.push(st);
      if (!draw || (INSIDE[st.path] && !xray)) continue;
      const [x, y] = at(P[st.path], st.d);
      if (!xray && st.path === "main" && x < 944) continue;   // still inside the body
      const jig = st.path === "screen" || st.path === "deck" ? Math.sin(t * 40 + st.d) * 1.5 : 0;
      stone(x, y - st.s * 0.6 + jig, st.s, st.c);
    }
    stones = next.slice(-420);
  }
  let last = 0;
  function frame(now) {
    if (!running) return;
    const k = last ? Math.min(3, (now - last) / 16.67) : 1;   // same speed at 60 or 120 Hz
    last = now; t = now / 1000;
    const exP = exPose(t);
    if (lastExP < 0.1 && exP >= 0.1) spawnBucket();   // bucket opens over the hopper
    lastExP = exP;
    const ldP = ldPose(t);
    if (lastLdP < 0.4 && ldP >= 0.4) { stock = Math.max(0.2, stock - 0.12); puff(1490, G - 20, 6, 60); }  // the loader takes a bite
    if (Math.random() < 0.05 * k) puff(700, 590, 1, 20);   // crusher discharge
    lastLdP = ldP;
    tick(k, true);
    blades.setAttribute("transform", `rotate(${(t * 520) % 360} 668 528)`);
    fan.setAttribute("transform", `rotate(${(t * 900) % 360} 852 486)`);
    drawPuffs(k);
    const h = 30 + stock * 140, w = 80 + stock * 150;
    stockEl.setAttribute("points", `${1410 - w},${G} 1410,${G - h} ${1410 + w * 0.8},${G}`);
    raf = requestAnimationFrame(frame);
  }
  // the plant is already running when the visitor arrives: pre-fill the belts
  function warm() {
    for (let n = 0; n < 3; n++) { spawnBucket(); for (let i = 0; i < 200; i++) tick(1, false); }
  }
  function start() { if (running || reduce) return; running = true; last = 0; size(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  new IntersectionObserver((en) => (en[0].isIntersecting ? start() : stop()), { threshold: 0.1 }).observe(scene);
  addEventListener("resize", () => { if (running) size(); });

  // phones: the scene scrolls sideways; open on the crusher, hide the hint after a swipe
  const sc = root.querySelector(".r6__scroll"), fr = root.querySelector(".r6__frame");
  if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) * 0.36;
  if (sc) setTimeout(() => sc.addEventListener("scroll", () => fr.classList.add("is-swiped"), { once: true, passive: true }), 600);
  updatePanel();
  warm();
  showHot("rotor");
  exSet(1, -22, 23, -30);
  if (/[?&]r6debug/.test(location.search)) window.__r6 = { exSet, stop, start };
})();
