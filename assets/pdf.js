/* =========================================================================
   DAM TRUCK — vrai téléchargement PDF (au lieu de la fenêtre d'impression)
   window.DTPdf(element, "Nom-du-fichier.pdf") → A4, rendu net (×2).
   La bibliothèque n'est chargée qu'au premier clic. En cas d'échec
   (hors ligne…), on retombe sur l'impression du navigateur.
   ========================================================================= */
(() => {
  let lib = null;
  const load = () => lib || (lib = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
    s.onload = () => res(window.html2pdf); s.onerror = rej;
    document.head.appendChild(s);
  }));
  window.DTPdf = async (el, name, btn) => {
    const label = btn && btn.innerHTML;
    if (btn) { btn.disabled = true; btn.textContent = (window.I18N ? window.I18N.t("Préparation du PDF…") : "Préparation du PDF…"); }
    try {
      const h2p = await load();
      await h2p().set({
        margin: 0, filename: name,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fffdf8", logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      }).from(el).save();
    } catch (e) { window.print(); }
    if (btn) { btn.disabled = false; btn.innerHTML = label; }
  };
})();
