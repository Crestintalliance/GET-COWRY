export type Lang = "en" | "fr";
export const LANGS: Lang[] = ["en", "fr"];

export function isLang(v: string | undefined): v is Lang {
  return v === "en" || v === "fr";
}

const en = {
  nav: { destinations: "Destinations", how: "How it works", help: "Help", switchLang: "Français" },
  hero: {
    pill: "Travel eSIMs for Africa",
    title1: "Touch down.",
    title2: "Light up.",
    body: "Your eSIM is ready before you board. Switch it on when you land and you're online, with help in French and English.",
    searchLabel: "Where are you going?",
    searchPlaceholder: "Where are you going? e.g. Guinea",
    searchButton: "Find plans",
  },
  popular: { title: "Popular trips home", lead: "One eSIM, on local networks you already know.", all: "All countries" },
  why: {
    title: "Made for the trip home",
    items: [
      { h: "Keep your number", p: "WhatsApp and calls stay on your usual SIM. The eSIM just adds data." },
      { h: "Networks you know", p: "Every plan shows the local network, like Orange Guinée." },
      { h: "Help that speaks French", p: "Message us on WhatsApp before and during your trip." },
    ],
  },
  steps: {
    title: "Three steps. Two minutes.",
    items: [
      { h: "Pick your plan", p: "From a short visit to a month with family." },
      { h: "Install before you fly", p: "Scan the QR code at home, on Wi-Fi." },
      { h: "Land connected", p: "Switch it on at arrival. You're online." },
    ],
  },
  cta: { title: "Your next landing, already connected.", button: "Find my eSIM" },
  countries: { title: "All countries", lead: "Choose where you're going.", from: "From", plans: "plans", plan: "plan", empty: "No destinations available right now." },
  country: {
    back: "All countries",
    lead: "Choose a plan, then enter your email. Your eSIM arrives right after payment.",
    days: "days",
    choose: "Choose",
    chosen: "Selected",
    popular: "Most popular",
    emailLabel: "Email for your eSIM",
    emailHint: "We send your QR code and install guide here.",
    pay: "Continue to payment",
    paying: "Opening payment…",
    pickFirst: "Choose a plan first.",
    badEmail: "Enter a valid email address.",
    none: "No plans for this country yet.",
    compat: "Check your phone supports eSIM: most iPhones from XS and recent Android phones do.",
  },
  order: {
    title: "Your eSIM",
    status: {
      awaiting_payment: "Waiting for payment",
      paid: "Payment received, getting your eSIM",
      provisioning: "Getting your eSIM ready",
      fulfilled: "Ready to install",
      fulfillment_failed: "Something went wrong",
    },
    waiting: "This page updates by itself. It usually takes under a minute.",
    failed: "Your payment went through but we couldn't issue the eSIM. We'll refund you or send a new one. Contact us on WhatsApp.",
    scan: "Scan this QR code from your phone's settings: Settings → Mobile data → Add eSIM.",
    manual: "Can't scan? Enter these details manually:",
    smdp: "SM-DP+ address",
    code: "Activation code",
    guide: "Read the install guide",
    keep: "Keep this page. Install the eSIM before you travel, on Wi-Fi.",
    notFound: "Order not found. Check the link in your email.",
  },
  install: {
    title: "How to install your eSIM",
    lead: "Do this at home on Wi-Fi, before you travel. It takes about two minutes.",
    iphone: "iPhone",
    iphoneSteps: [
      "Open Settings → Mobile Data (or Cellular) → Add eSIM.",
      "Choose “Use QR Code” and scan the code on your order page.",
      "Name it “Cowry” and set it as your line for mobile data only.",
      "When you land, turn on Data Roaming for the Cowry eSIM.",
    ],
    android: "Android",
    androidSteps: [
      "Open Settings → Network & internet → SIMs → Add eSIM.",
      "Scan the QR code on your order page.",
      "Set the Cowry eSIM for mobile data, keep your usual SIM for calls.",
      "When you land, turn on Roaming for the Cowry eSIM.",
    ],
    help: "Stuck? Message us on WhatsApp.",
  },
  dev: { title: "Test payment", body: "Development mode: no card is charged. Press the button to simulate a successful payment.", pay: "Simulate payment" },
  footer: { rights: "Get Cowry · A product by Crest International Alliance LLC", terms: "Terms", refunds: "Refunds", privacy: "Privacy", install: "Install guide" },
  legal: {
    draft: "Draft. This page must be written and reviewed before launch.",
    terms: "Terms of service",
    refunds: "Refund policy",
    privacy: "Privacy policy",
  },
  error: "Something went wrong. Please try again.",
  loading: "Loading…",
};

export type Dict = typeof en;

const fr: Dict = {
  nav: { destinations: "Destinations", how: "Comment ça marche", help: "Aide", switchLang: "English" },
  hero: {
    pill: "eSIM de voyage pour l'Afrique",
    title1: "Vous atterrissez.",
    title2: "Vous êtes connecté.",
    body: "Votre eSIM est prête avant l'embarquement. Activez-la à l'arrivée et vous êtes en ligne, avec une aide en français et en anglais.",
    searchLabel: "Où allez-vous ?",
    searchPlaceholder: "Où allez-vous ? ex. Guinée",
    searchButton: "Voir les forfaits",
  },
  popular: { title: "Retours au pays les plus courants", lead: "Une eSIM, sur les réseaux locaux que vous connaissez.", all: "Tous les pays" },
  why: {
    title: "Pensé pour le retour au pays",
    items: [
      { h: "Gardez votre numéro", p: "WhatsApp et les appels restent sur votre SIM habituelle. L'eSIM ajoute seulement les données." },
      { h: "Des réseaux connus", p: "Chaque forfait indique le réseau local, comme Orange Guinée." },
      { h: "Une aide en français", p: "Écrivez-nous sur WhatsApp avant et pendant votre voyage." },
    ],
  },
  steps: {
    title: "Trois étapes. Deux minutes.",
    items: [
      { h: "Choisissez votre forfait", p: "D'un court séjour à un mois en famille." },
      { h: "Installez avant de partir", p: "Scannez le QR code chez vous, en Wi-Fi." },
      { h: "Atterrissez connecté", p: "Activez-la à l'arrivée. Vous êtes en ligne." },
    ],
  },
  cta: { title: "Votre prochain atterrissage, déjà connecté.", button: "Trouver mon eSIM" },
  countries: { title: "Tous les pays", lead: "Choisissez votre destination.", from: "À partir de", plans: "forfaits", plan: "forfait", empty: "Aucune destination disponible pour le moment." },
  country: {
    back: "Tous les pays",
    lead: "Choisissez un forfait, puis indiquez votre e-mail. Votre eSIM arrive juste après le paiement.",
    days: "jours",
    choose: "Choisir",
    chosen: "Sélectionné",
    popular: "Le plus choisi",
    emailLabel: "E-mail pour recevoir votre eSIM",
    emailHint: "Nous y envoyons votre QR code et le guide d'installation.",
    pay: "Passer au paiement",
    paying: "Ouverture du paiement…",
    pickFirst: "Choisissez d'abord un forfait.",
    badEmail: "Saisissez une adresse e-mail valide.",
    none: "Pas encore de forfait pour ce pays.",
    compat: "Vérifiez que votre téléphone accepte l'eSIM : la plupart des iPhone depuis le XS et des Android récents.",
  },
  order: {
    title: "Votre eSIM",
    status: {
      awaiting_payment: "En attente du paiement",
      paid: "Paiement reçu, préparation de votre eSIM",
      provisioning: "Préparation de votre eSIM",
      fulfilled: "Prête à installer",
      fulfillment_failed: "Un problème est survenu",
    },
    waiting: "Cette page se met à jour toute seule. Cela prend en général moins d'une minute.",
    failed: "Votre paiement est passé mais nous n'avons pas pu émettre l'eSIM. Nous vous rembourserons ou en enverrons une nouvelle. Contactez-nous sur WhatsApp.",
    scan: "Scannez ce QR code depuis les réglages : Réglages → Données cellulaires → Ajouter une eSIM.",
    manual: "Impossible de scanner ? Saisissez ces informations :",
    smdp: "Adresse SM-DP+",
    code: "Code d'activation",
    guide: "Lire le guide d'installation",
    keep: "Gardez cette page. Installez l'eSIM avant de partir, en Wi-Fi.",
    notFound: "Commande introuvable. Vérifiez le lien dans votre e-mail.",
  },
  install: {
    title: "Installer votre eSIM",
    lead: "À faire chez vous en Wi-Fi, avant le voyage. Comptez environ deux minutes.",
    iphone: "iPhone",
    iphoneSteps: [
      "Ouvrez Réglages → Données cellulaires → Ajouter une eSIM.",
      "Choisissez « Utiliser un QR code » et scannez le code de votre commande.",
      "Nommez-la « Cowry » et utilisez-la uniquement pour les données.",
      "À l'arrivée, activez l'itinérance des données pour l'eSIM Cowry.",
    ],
    android: "Android",
    androidSteps: [
      "Ouvrez Paramètres → Réseau et internet → SIM → Ajouter une eSIM.",
      "Scannez le QR code de votre commande.",
      "Utilisez l'eSIM Cowry pour les données, gardez votre SIM habituelle pour les appels.",
      "À l'arrivée, activez l'itinérance pour l'eSIM Cowry.",
    ],
    help: "Bloqué ? Écrivez-nous sur WhatsApp.",
  },
  dev: { title: "Paiement de test", body: "Mode développement : aucune carte n'est débitée. Appuyez pour simuler un paiement réussi.", pay: "Simuler le paiement" },
  footer: { rights: "Get Cowry · Un produit de Crest International Alliance LLC", terms: "Conditions", refunds: "Remboursements", privacy: "Confidentialité", install: "Guide d'installation" },
  legal: {
    draft: "Brouillon. Cette page doit être rédigée et vérifiée avant le lancement.",
    terms: "Conditions d'utilisation",
    refunds: "Politique de remboursement",
    privacy: "Politique de confidentialité",
  },
  error: "Un problème est survenu. Veuillez réessayer.",
  loading: "Chargement…",
};

export const DICTS: Record<Lang, Dict> = { en, fr };

/** Country names in French for the countries Cowry markets first; others fall back to the supplier's name. */
const FR_COUNTRY: Record<string, string> = {
  GN: "Guinée",
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
  ML: "Mali",
  NG: "Nigeria",
  GH: "Ghana",
  SL: "Sierra Leone",
  FR: "France",
  US: "États-Unis",
};

export function countryName(code: string, fallback: string, lang: Lang): string {
  return lang === "fr" ? (FR_COUNTRY[code] ?? fallback) : fallback;
}

export function formatPrice(cents: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatData(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB` : `${Math.round(bytes / 1024 ** 2)} MB`;
}
