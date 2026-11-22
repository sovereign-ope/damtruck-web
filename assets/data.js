/* =========================================================================
   DAM TRUCK — données du site
   ► Pour ajouter / modifier une machine : copier un bloc { ... } dans
     MACHINES, changer les valeurs, mettre la photo dans /images/.
   ► Champs vides ("") = s'affichent comme « — » sur le site.
   ► status : "dispo" | "reserve" | "vendu"
   ► price  : nombre en MAD HT (ex. 1450000) ou null = « Prix sur demande »
   ========================================================================= */

window.DT = {
  company: "DAM TRUCK",
  /* Concassage & criblage — Ihab Damnati (appel) + WhatsApp */
  phone: "+212 661 48 59 20",
  phoneRaw: "+212661485920",
  wa: "31639874182",
  waLabel: "+31 6 39 87 41 82",
  /* Achat & vente de machines — Mohammed Damnati */
  phoneMachines: "+212 661 14 73 11",
  phoneMachinesRaw: "+212661147311",
  waMachines: "212661147311",
  /* Standard société */
  phone2: "+212 661 14 73 11",
  email: "info@damtruck.com",
  address: "N° 18, Rue 3, Lot Ratc, 1er étage, Al Qods, Sidi Bernoussi — Casablanca",

  /* Production indicative d'une station mobile (tonnes / jour), pour le
     calculateur de devis. À ajuster selon votre réalité terrain. */
  rateMin: 1200,
  rateMax: 1800,

  /* Carte « Présence terrain » (page d'accueil).
     status : "production" (point qui pulse) | "base" (siège / parc)
     Pour ajouter un chantier : copier une ligne, changer nom + coordonnées GPS. */
  SITES_UPDATED: "2026-11-15",
  SITES: [
    { id: "sidi-maarouf", name: "Sidi Maârouf", lat: 33.535, lon: -7.645, status: "production", kind: "Station de concassage", detail: "Station mobile en production à Sidi Maârouf, Casablanca : concassage et criblage sur site." },
    { id: "jorf", name: "Jorf Lasfar", lat: 33.12, lon: -8.64, status: "production", kind: "Station de concassage", detail: "Station mobile en production : concassage et criblage, fractions calibrées sur site." },
    { id: "casa", name: "Casablanca", lat: 33.57, lon: -7.59, status: "base", kind: "Siège · Parc machines", detail: "Siège, atelier et parc de machines. Point de départ de toutes nos mobilisations." },
  ],

  /* Compteur « Tonnes concassées » (accueil + entrée).
     ► À REMPLACER par vos vrais chiffres : tonnage déjà produit à la date
       « since », et production moyenne par jour. Le compteur avance seul. */
  TONNAGE: { show: true, since: "2026-11-11", base: 612000, perDay: 0 },  // total concassé au 11/11/2026 · perDay = cadence pour faire avancer le compteur

  /* Horaires des stations (heure de Casablanca) — accueil : « en production » / « reprise à 7h00 » */
  HOURS: { start: 7, end: 19 },

  /* Références (plaques gravées sur l'accueil) */
  REFERENCES: ["GTR", "SBTX", "SOGEA", "MOJAZINE", "CAPEP"],

  CATS: {
    concasseur: "Concasseurs",
    crible: "Cribles",
    convoyeur: "Convoyeurs",
    chargeuse: "Chargeuses",
    pelle: "Pelles",
    camion: "Camions & transport",
  },

  /* Machines à vendre. Vide = « aucune machine disponible » (la section d'accueil se masque).
     Exemple de fiche complète : voir MACHINES_EXEMPLE plus bas. */
  MACHINES: [
    {
      ref: "DT-201",
      cat: "camion",
      brand: "Volvo",
      model: "A25D",
      title: "Volvo A25D",
      type: "Tombereau articulé 6×6",
      year: "",
      hours: "",
      status: "dispo",
      price: null,
      location: "Casablanca",
      featured: true,
      img: "images/vente/volvo-a25d-1.jpg",
      gallery: ["images/vente/volvo-a25d-1.jpg", "images/vente/volvo-a25d-2.jpg", "images/vente/volvo-a25d-3.jpg", "images/vente/volvo-a25d-4.jpg", "images/vente/volvo-a25d-5.jpg", "images/vente/volvo-a25d-6.jpg", "images/vente/volvo-a25d-7.jpg", "images/vente/volvo-a25d-8.jpg"],
      specs: {
        "Type": "Tombereau articulé (dumper) 6×6",
        "Marque": "Volvo",
        "Modèle": "A25D",
        "Unités disponibles": "Plusieurs — nous consulter",
        "Année": "",
        "Heures moteur": "",
      },
      desc: "Tombereaux articulés Volvo A25D du parc DAM TRUCK, entretenus par nos équipes et visibles à Casablanca. Plusieurs unités disponibles : année, heures et prix sur demande.",
    },
    {
      ref: "DT-202",
      cat: "convoyeur",
      brand: "IMS",
      model: "MC1050-30T",
      title: "IMS MC1050-30T",
      type: "Convoyeur de stockage mobile sur chenilles",
      year: "",
      hours: "",
      status: "dispo",
      price: null,
      location: "Casablanca",
      featured: true,
      img: "images/vente/ims-mc1050-1.jpg",
      gallery: ["images/vente/ims-mc1050-1.jpg", "images/vente/ims-mc1050-2.jpg", "images/vente/ims-mc1050-3.jpg", "images/vente/ims-mc1050-4.jpg", "images/vente/ims-mc1050-5.jpg"],
      specs: {
        "Type": "Convoyeur de stockage (stacker) sur chenilles",
        "Marque": "IMS",
        "Modèle": "MC1050-30T",
        "Commande": "Tableau IMS E-Pro, translation sur chenilles",
        "Année": "",
        "Heures moteur": "",
      },
      desc: "Convoyeur de stockage IMS sur chenilles, autonome avec son propre moteur : il se déplace seul sur le chantier et forme de grands stocks en sortie de concasseur ou de crible. Visible à Casablanca, prix sur demande.",
    },
  ],

  MACHINES_EXEMPLE: [
    {
      ref: "DT-101",
      cat: "concasseur",
      brand: "Terex Finlay",
      model: "J-1170",
      title: "Terex Finlay J-1170",
      type: "Concasseur à mâchoires sur chenilles",
      year: "",
      hours: "",
      status: "dispo",
      price: null,
      location: "Casablanca",
      featured: true,
      img: "images/j1170.jpg",
      gallery: ["images/j1170.jpg", "images/transport-j1170.jpg"],
      specs: {
        "Type": "Concasseur primaire à mâchoires, mobile sur chenilles",
        "Marque": "Terex Finlay",
        "Modèle": "J-1170",
        "Année": "",
        "Heures moteur": "",
        "Ouverture d'alimentation": "",
        "Moteur": "",
        "Poids": "",
      },
      desc: "Concasseur primaire compact et robuste, idéal pour la carrière, la démolition et le recyclage. Transport sur porte-engins, mise en service rapide sur chantier.",
      /* Rapport d'inspection (page inspection.html?ref=DT-101).
         s : "ok" = conforme · "obs" = à surveiller · "rep" = remplacé / réparé
         specimen: true affiche « SPÉCIMEN » — à retirer pour un vrai rapport. */
      inspection: {
        specimen: true,
        date: "2026-10-20",
        place: "Parc DAM TRUCK, Casablanca",
        by: "Mohammed Damnati",
        groups: [
          { name: "Moteur", items: [["Démarrage à froid", "ok"], ["Fuites d'huile / liquide", "ok"], ["Fumées à l'échappement", "ok"], ["Filtres (air, huile, carburant)", "rep", "Remplacés lors de l'inspection"]] },
          { name: "Hydraulique", items: [["Pompes et distributeurs", "ok"], ["Vérins", "ok"], ["Flexibles et raccords", "obs", "Deux flexibles à prévoir au prochain entretien"]] },
          { name: "Chambre de concassage", items: [["Mâchoire fixe — usure", "ok", "Environ 60 % restant"], ["Mâchoire mobile — usure", "ok", "Environ 55 % restant"], ["Réglage du CSS", "ok"]] },
          { name: "Convoyeurs", items: [["Bande principale", "ok"], ["Rouleaux et tambours", "ok"], ["Convoyeur latéral", "ok"]] },
          { name: "Train de roulement", items: [["Chenilles", "ok"], ["Barbotins et galets", "obs", "Usure normale"], ["Moteurs de translation", "ok"]] },
          { name: "Électrique & sécurité", items: [["Tableau de commande", "ok"], ["Télécommande", "ok"], ["Arrêts d'urgence", "ok"]] },
          { name: "Structure", items: [["Châssis et soudures", "ok"], ["Trémie et grille", "ok"]] },
        ],
        notes: "Machine en bon état général, prête à travailler. Essai de concassage réalisé sur site.",
      },
    },
    {
      ref: "DT-102",
      cat: "concasseur",
      brand: "",
      model: "",
      title: "Station de concassage mobile",
      type: "Concasseur sur chenilles avec crible intégré",
      year: "",
      hours: "",
      status: "dispo",
      price: null,
      location: "Casablanca",
      featured: true,
      img: "images/concasseur-jaune.jpg",
      gallery: ["images/concasseur-jaune.jpg", "images/station-concassage.jpg", "images/flotte-carriere.jpg"],
      specs: {
        "Type": "Concassage + criblage sur chenilles",
        "Marque": "",
        "Modèle": "",
        "Année": "",
        "Heures moteur": "",
        "Capacité": "",
      },
      desc: "Station mobile complète — alimentation, concassage et criblage en une seule unité. Produit plusieurs fractions directement sur le front de taille.",
    },
    {
      ref: "DT-103",
      cat: "convoyeur",
      brand: "",
      model: "",
      title: "Convoyeur de stockage sur chenilles",
      type: "Stacker mobile",
      year: "",
      hours: "",
      status: "dispo",
      price: null,
      location: "Casablanca",
      featured: false,
      img: "images/station-concassage.jpg",
      gallery: ["images/station-concassage.jpg", "images/concasseur-jaune.jpg"],
      specs: {
        "Type": "Convoyeur de mise en stock, mobile",
        "Marque": "",
        "Longueur": "",
        "Année": "",
      },
      desc: "Convoyeur de mise en stock pour constituer de grands volumes de granulats calibrés en sortie de station.",
    },
    {
      ref: "DT-104",
      cat: "chargeuse",
      brand: "Volvo",
      model: "",
      title: "Chargeuse sur pneus Volvo",
      type: "Chargeuse sur pneus",
      year: "",
      hours: "",
      status: "dispo",
      price: null,
      location: "Casablanca",
      featured: true,
      img: "images/flotte-carriere.jpg",
      imgPos: "18% 60%",
      gallery: ["images/flotte-carriere.jpg", "images/stock-chargeuse.jpg"],
      /* Vue 360° : photos numérotées 00, 01, 02… prises en tournant autour de la machine.
         loop: true pour un vrai tour complet ; false = démo (va-et-vient). */
      spin: { src: "images/360/dt104-", count: 24, loop: false },
      specs: {
        "Type": "Chargeuse sur pneus",
        "Marque": "Volvo",
        "Modèle": "",
        "Année": "",
        "Heures moteur": "",
        "Godet": "",
      },
      desc: "Chargeuse de carrière pour l'alimentation des stations et le chargement des camions.",
    },
    {
      ref: "DT-105",
      cat: "camion",
      brand: "MAN",
      model: "TGS",
      title: "MAN TGS",
      type: "Camion de carrière",
      year: "",
      hours: "",
      status: "dispo",
      price: null,
      location: "Casablanca",
      featured: false,
      img: "images/flotte-carriere.jpg",
      imgPos: "56% 55%",
      gallery: ["images/flotte-carriere.jpg"],
      specs: {
        "Type": "Camion",
        "Marque": "MAN",
        "Modèle": "TGS",
        "Année": "",
        "Kilométrage": "",
      },
      desc: "Camion pour le transport de granulats et matériaux de carrière.",
    },
    {
      ref: "DT-106",
      cat: "camion",
      brand: "",
      model: "",
      title: "Tracteur + porte-engins",
      type: "Transport d'engins lourds",
      year: "",
      hours: "",
      status: "reserve",
      price: null,
      location: "Casablanca",
      featured: false,
      img: "images/transport-j1170.jpg",
      gallery: ["images/transport-j1170.jpg"],
      specs: {
        "Type": "Tracteur routier + semi porte-engins",
        "Marque": "",
        "Année": "",
        "Charge utile": "",
      },
      desc: "Ensemble de transport pour concasseurs et engins de chantier lourds.",
    },
  ],
};
