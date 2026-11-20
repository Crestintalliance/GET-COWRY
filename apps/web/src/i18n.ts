export type Lang = "en" | "fr" | "es" | "pt" | "de";
export const LANGS: Lang[] = ["en", "fr", "es", "pt", "de"];

/** Each language's name in itself, for the language menu. */
export const LANG_NAMES: Record<Lang, string> = { en: "English", fr: "Français", es: "Español", pt: "Português", de: "Deutsch" };

const NUMBER_LOCALE: Record<Lang, string> = { en: "en-US", fr: "fr-FR", es: "es-419", pt: "pt-BR", de: "de-DE" };

export function isLang(v: string | undefined): v is Lang {
  return LANGS.includes(v as Lang);
}

const en = {
  nav: { destinations: "Destinations", how: "How it works", help: "Help", app: "Get the app", language: "Language" },
  getApp: { title: "Get the JoinCowry app", body: "Your eSIMs, trip checklist and local guides, all in your pocket. Coming soon to iPhone and Android.", soon: "Coming soon" },
  hero: {
    pill: "Travel eSIMs for 200+ destinations",
    count: "Wherever home is, stay connected.",
    countSub: "Travel eSIMs for 200+ destinations, made for trips home to Africa, the Caribbean, Latin America and Europe. Pick yours before you fly, switch it on when you land.",
    title1: "Touch down.",
    title2: "Light up.",
    body: "Data for the trip home, ready before you board. Switch it on when you land and you're online.",
    searchLabel: "Where are you going?",
    searchPlaceholder: "Add countries, e.g. Guinea",
    searchButton: "Find plans",
    getEsim: "Get my eSIM",
  },
  popular: { title: "Popular trips home", lead: "One eSIM, on local networks you already know.", all: "All countries" },
  regions: { all: "All", africa: "Africa", caribbean: "Caribbean", latam: "Latin America", world: "Europe & more", other: "Rest of the world" },
  why: {
    title: "Made for the trip home",
    items: [
      { h: "Keep your number", p: "WhatsApp and calls stay on your usual SIM. The eSIM just adds data." },
      { h: "Networks you know", p: "Every plan shows the local network, like Orange in Guinea or Digicel in Jamaica." },
      { h: "Help on WhatsApp", p: "Message us before and during your trip. Today we answer in English and French." },
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
    emailLabel: "Email address",
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
  footer: { rights: "JoinCowry · A product by Crest International Alliance LLC", terms: "Terms", refunds: "Refunds", privacy: "Privacy", install: "Install guide" },
  legal: {
    draft: "Draft. This page must be written and reviewed before launch.",
    terms: "Terms of service",
    refunds: "Refund policy",
    privacy: "Privacy policy",
  },
  picker: {
    showAll: "Show all destinations",
    remove: "Remove",
    noMatch: "No destination matches",
    selected: "selected",
    pickOne: "Add at least one destination.",
  },
  trip: {
    title: "Your trip",
    lead: "Choose a plan for each country. For now you buy one eSIM at a time; each one opens its own checkout.",
    change: "Change destinations",
    buy: "Buy this eSIM",
    none: "No plans for this country yet.",
  },
  error: "Something went wrong. Please try again.",
  loading: "Loading…",
};

export type Dict = typeof en;

const fr: Dict = {
  nav: { destinations: "Destinations", how: "Comment ça marche", help: "Aide", app: "L’app", language: "Langue" },
  getApp: { title: "Téléchargez l'app JoinCowry", body: "Vos eSIM, votre checklist de voyage et des guides locaux, toujours dans votre poche. Bientôt sur iPhone et Android.", soon: "Bientôt" },
  hero: {
    pill: "eSIM de voyage pour plus de 200 destinations",
    count: "Où que soit chez vous, restez connecté.",
    countSub: "Des eSIM de voyage pour plus de 200 destinations, pensées pour rentrer en Afrique, aux Caraïbes, en Amérique latine et en Europe. Choisissez avant de partir, activez à l'arrivée.",
    title1: "Vous atterrissez.",
    title2: "Vous êtes connecté.",
    body: "Des données pour le retour au pays, prêtes avant l'embarquement. Activez-la à l'arrivée et vous êtes en ligne.",
    searchLabel: "Où allez-vous ?",
    searchPlaceholder: "Ajoutez des pays, ex. Guinée",
    searchButton: "Voir les forfaits",
    getEsim: "Obtenir mon eSIM",
  },
  popular: { title: "Retours au pays les plus courants", lead: "Une eSIM, sur les réseaux locaux que vous connaissez.", all: "Tous les pays" },
  regions: { all: "Tout", africa: "Afrique", caribbean: "Caraïbes", latam: "Amérique latine", world: "Europe et plus", other: "Reste du monde" },
  why: {
    title: "Pensé pour le retour au pays",
    items: [
      { h: "Gardez votre numéro", p: "WhatsApp et les appels restent sur votre SIM habituelle. L'eSIM ajoute seulement les données." },
      { h: "Des réseaux connus", p: "Chaque forfait indique le réseau local, comme Orange en Guinée ou Digicel en Jamaïque." },
      { h: "Une aide sur WhatsApp", p: "Écrivez-nous avant et pendant votre voyage. Nous répondons en français et en anglais." },
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
    emailLabel: "Adresse e-mail",
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
  footer: { rights: "JoinCowry · Un produit de Crest International Alliance LLC", terms: "Conditions", refunds: "Remboursements", privacy: "Confidentialité", install: "Guide d'installation" },
  legal: {
    draft: "Brouillon. Cette page doit être rédigée et vérifiée avant le lancement.",
    terms: "Conditions d'utilisation",
    refunds: "Politique de remboursement",
    privacy: "Politique de confidentialité",
  },
  picker: {
    showAll: "Voir toutes les destinations",
    remove: "Retirer",
    noMatch: "Aucune destination ne correspond",
    selected: "sélectionné(s)",
    pickOne: "Ajoutez au moins une destination.",
  },
  trip: {
    title: "Votre voyage",
    lead: "Choisissez un forfait pour chaque pays. Pour l'instant, chaque eSIM s'achète séparément, avec son propre paiement.",
    change: "Modifier les destinations",
    buy: "Acheter cette eSIM",
    none: "Pas encore de forfait pour ce pays.",
  },
  error: "Un problème est survenu. Veuillez réessayer.",
  loading: "Chargement…",
};


const es: Dict = {
  nav: { destinations: "Destinos", how: "Cómo funciona", help: "Ayuda", app: "La app", language: "Idioma" },
  getApp: { title: "Descarga la app JoinCowry", body: "Tus eSIM, la lista de tu viaje y guías locales, siempre en tu bolsillo. Muy pronto en iPhone y Android.", soon: "Muy pronto" },
  hero: {
    pill: "eSIM de viaje para más de 200 destinos",
    count: "Dondequiera que esté tu hogar, mantente conectado.",
    countSub: "eSIM de viaje para más de 200 destinos, pensadas para volver a casa en África, el Caribe, América Latina y Europa. Elige antes de volar y actívala al aterrizar.",
    title1: "Aterrizas.",
    title2: "Te conectas.",
    body: "Datos para el viaje a casa, listos antes de embarcar. Actívala al aterrizar y ya estás en línea.",
    searchLabel: "¿A dónde vas?",
    searchPlaceholder: "Añade países, p. ej. Panamá",
    searchButton: "Ver planes",
    getEsim: "Obtener mi eSIM",
  },
  popular: { title: "Viajes a casa más populares", lead: "Una eSIM, en las redes locales que ya conoces.", all: "Todos los países" },
  regions: { all: "Todos", africa: "África", caribbean: "Caribe", latam: "América Latina", world: "Europa y más", other: "Resto del mundo" },
  why: {
    title: "Pensada para el viaje a casa",
    items: [
      { h: "Conserva tu número", p: "WhatsApp y las llamadas siguen en tu SIM de siempre. La eSIM solo añade datos." },
      { h: "Redes que conoces", p: "Cada plan muestra la red local, como Claro en Panamá o Digicel en Jamaica." },
      { h: "Ayuda por WhatsApp", p: "Escríbenos antes y durante tu viaje. Hoy atendemos en inglés y francés." },
    ],
  },
  steps: {
    title: "Tres pasos. Dos minutos.",
    items: [
      { h: "Elige tu plan", p: "Desde una visita corta hasta un mes con la familia." },
      { h: "Instálala antes de volar", p: "Escanea el código QR en casa, con wifi." },
      { h: "Aterriza conectado", p: "Actívala al llegar. Ya estás en línea." },
    ],
  },
  cta: { title: "Tu próximo aterrizaje, ya conectado.", button: "Buscar mi eSIM" },
  countries: { title: "Todos los países", lead: "Elige a dónde vas.", from: "Desde", plans: "planes", plan: "plan", empty: "No hay destinos disponibles por ahora." },
  country: {
    back: "Todos los países",
    lead: "Elige un plan y escribe tu correo. Tu eSIM llega justo después del pago.",
    days: "días",
    choose: "Elegir",
    chosen: "Elegido",
    popular: "El más popular",
    emailLabel: "Correo electrónico",
    emailHint: "Aquí te enviamos el código QR y la guía de instalación.",
    pay: "Continuar al pago",
    paying: "Abriendo el pago…",
    pickFirst: "Primero elige un plan.",
    badEmail: "Escribe un correo válido.",
    none: "Aún no hay planes para este país.",
    compat: "Comprueba que tu teléfono admite eSIM: la mayoría de iPhone desde el XS y los Android recientes la admiten.",
  },
  order: {
    title: "Tu eSIM",
    status: {
      awaiting_payment: "Esperando el pago",
      paid: "Pago recibido, preparando tu eSIM",
      provisioning: "Preparando tu eSIM",
      fulfilled: "Lista para instalar",
      fulfillment_failed: "Algo salió mal",
    },
    waiting: "Esta página se actualiza sola. Suele tardar menos de un minuto.",
    failed: "Tu pago se realizó, pero no pudimos emitir la eSIM. Te devolveremos el dinero o te enviaremos otra. Escríbenos por WhatsApp.",
    scan: "Escanea este código QR desde los ajustes del teléfono: Ajustes → Datos móviles → Añadir eSIM.",
    manual: "¿No puedes escanear? Introduce estos datos a mano:",
    smdp: "Dirección SM-DP+",
    code: "Código de activación",
    guide: "Leer la guía de instalación",
    keep: "Guarda esta página. Instala la eSIM antes de viajar, con wifi.",
    notFound: "Pedido no encontrado. Revisa el enlace de tu correo.",
  },
  install: {
    title: "Cómo instalar tu eSIM",
    lead: "Hazlo en casa, con wifi, antes de viajar. Tarda unos dos minutos.",
    iphone: "iPhone",
    iphoneSteps: [
      "Abre Ajustes → Datos móviles → Añadir eSIM.",
      "Elige «Usar código QR» y escanea el código de tu página de pedido.",
      "Llámala «Cowry» y úsala solo para datos móviles.",
      "Al aterrizar, activa la itinerancia de datos para la eSIM Cowry.",
    ],
    android: "Android",
    androidSteps: [
      "Abre Ajustes → Redes e Internet → SIM → Añadir eSIM.",
      "Escanea el código QR de tu página de pedido.",
      "Usa la eSIM Cowry para datos y tu SIM de siempre para llamadas.",
      "Al aterrizar, activa la itinerancia para la eSIM Cowry.",
    ],
    help: "¿Algún problema? Escríbenos por WhatsApp.",
  },
  dev: { title: "Pago de prueba", body: "Modo de desarrollo: no se cobra ninguna tarjeta. Pulsa el botón para simular un pago correcto.", pay: "Simular pago" },
  footer: { rights: "JoinCowry · Un producto de Crest International Alliance LLC", terms: "Términos", refunds: "Reembolsos", privacy: "Privacidad", install: "Guía de instalación" },
  legal: {
    draft: "Borrador. Esta página debe redactarse y revisarse antes del lanzamiento.",
    terms: "Términos del servicio",
    refunds: "Política de reembolsos",
    privacy: "Política de privacidad",
  },
  picker: {
    showAll: "Ver todos los destinos",
    remove: "Quitar",
    noMatch: "Ningún destino coincide",
    selected: "seleccionados",
    pickOne: "Añade al menos un destino.",
  },
  trip: {
    title: "Tu viaje",
    lead: "Elige un plan para cada país. Por ahora cada eSIM se compra por separado, con su propio pago.",
    change: "Cambiar destinos",
    buy: "Comprar esta eSIM",
    none: "Aún no hay planes para este país.",
  },
  error: "Algo salió mal. Inténtalo de nuevo.",
  loading: "Cargando…",
};

const pt: Dict = {
  nav: { destinations: "Destinos", how: "Como funciona", help: "Ajuda", app: "O app", language: "Idioma" },
  getApp: { title: "Baixe o app JoinCowry", body: "Seus eSIMs, o checklist da viagem e guias locais, sempre no seu bolso. Em breve no iPhone e Android.", soon: "Em breve" },
  hero: {
    pill: "eSIM de viagem para mais de 200 destinos",
    count: "Onde quer que seja a sua casa, fique conectado.",
    countSub: "eSIM de viagem para mais de 200 destinos, feitos para voltar para casa na África, no Caribe, na América Latina e na Europa. Escolha antes de voar e ative ao pousar.",
    title1: "Pousou.",
    title2: "Conectou.",
    body: "Dados para a viagem para casa, prontos antes do embarque. Ative ao pousar e você já está online.",
    searchLabel: "Para onde você vai?",
    searchPlaceholder: "Adicione países, ex. Brasil",
    searchButton: "Ver planos",
    getEsim: "Quero meu eSIM",
  },
  popular: { title: "Viagens para casa mais procuradas", lead: "Um eSIM, nas redes locais que você já conhece.", all: "Todos os países" },
  regions: { all: "Todos", africa: "África", caribbean: "Caribe", latam: "América Latina", world: "Europa e mais", other: "Resto do mundo" },
  why: {
    title: "Feito para a viagem para casa",
    items: [
      { h: "Mantenha seu número", p: "WhatsApp e ligações continuam no seu chip de sempre. O eSIM só adiciona dados." },
      { h: "Redes que você conhece", p: "Cada plano mostra a rede local, como a Claro no Brasil ou a Orange na Guiné." },
      { h: "Ajuda pelo WhatsApp", p: "Fale com a gente antes e durante a viagem. Hoje atendemos em inglês e francês." },
    ],
  },
  steps: {
    title: "Três passos. Dois minutos.",
    items: [
      { h: "Escolha seu plano", p: "De uma visita rápida a um mês com a família." },
      { h: "Instale antes de voar", p: "Escaneie o QR code em casa, no Wi-Fi." },
      { h: "Pouse conectado", p: "Ative ao chegar. Você já está online." },
    ],
  },
  cta: { title: "Seu próximo pouso, já conectado.", button: "Encontrar meu eSIM" },
  countries: { title: "Todos os países", lead: "Escolha para onde você vai.", from: "A partir de", plans: "planos", plan: "plano", empty: "Nenhum destino disponível no momento." },
  country: {
    back: "Todos os países",
    lead: "Escolha um plano e informe seu e-mail. Seu eSIM chega logo após o pagamento.",
    days: "dias",
    choose: "Escolher",
    chosen: "Escolhido",
    popular: "Mais procurado",
    emailLabel: "Endereço de e-mail",
    emailHint: "Enviamos aqui o QR code e o guia de instalação.",
    pay: "Continuar para o pagamento",
    paying: "Abrindo o pagamento…",
    pickFirst: "Escolha um plano primeiro.",
    badEmail: "Informe um e-mail válido.",
    none: "Ainda não há planos para este país.",
    compat: "Confira se seu celular aceita eSIM: a maioria dos iPhone a partir do XS e dos Android recentes aceita.",
  },
  order: {
    title: "Seu eSIM",
    status: {
      awaiting_payment: "Aguardando pagamento",
      paid: "Pagamento recebido, preparando seu eSIM",
      provisioning: "Preparando seu eSIM",
      fulfilled: "Pronto para instalar",
      fulfillment_failed: "Algo deu errado",
    },
    waiting: "Esta página se atualiza sozinha. Normalmente leva menos de um minuto.",
    failed: "Seu pagamento foi aprovado, mas não conseguimos emitir o eSIM. Vamos reembolsar você ou enviar um novo. Fale com a gente pelo WhatsApp.",
    scan: "Escaneie este QR code nas configurações do celular: Ajustes → Celular → Adicionar eSIM.",
    manual: "Não consegue escanear? Digite estes dados manualmente:",
    smdp: "Endereço SM-DP+",
    code: "Código de ativação",
    guide: "Ler o guia de instalação",
    keep: "Guarde esta página. Instale o eSIM antes de viajar, no Wi-Fi.",
    notFound: "Pedido não encontrado. Confira o link no seu e-mail.",
  },
  install: {
    title: "Como instalar seu eSIM",
    lead: "Faça isso em casa, no Wi-Fi, antes de viajar. Leva uns dois minutos.",
    iphone: "iPhone",
    iphoneSteps: [
      "Abra Ajustes → Celular → Adicionar eSIM.",
      "Escolha “Usar QR Code” e escaneie o código da sua página de pedido.",
      "Dê o nome “Cowry” e use-o só para dados móveis.",
      "Ao pousar, ative o roaming de dados no eSIM Cowry.",
    ],
    android: "Android",
    androidSteps: [
      "Abra Configurações → Rede e internet → Chips → Adicionar eSIM.",
      "Escaneie o QR code da sua página de pedido.",
      "Use o eSIM Cowry para dados e seu chip de sempre para ligações.",
      "Ao pousar, ative o roaming no eSIM Cowry.",
    ],
    help: "Precisa de ajuda? Fale com a gente pelo WhatsApp.",
  },
  dev: { title: "Pagamento de teste", body: "Modo de desenvolvimento: nenhum cartão é cobrado. Toque no botão para simular um pagamento aprovado.", pay: "Simular pagamento" },
  footer: { rights: "JoinCowry · Um produto da Crest International Alliance LLC", terms: "Termos", refunds: "Reembolsos", privacy: "Privacidade", install: "Guia de instalação" },
  legal: {
    draft: "Rascunho. Esta página precisa ser escrita e revisada antes do lançamento.",
    terms: "Termos de serviço",
    refunds: "Política de reembolso",
    privacy: "Política de privacidade",
  },
  picker: {
    showAll: "Ver todos os destinos",
    remove: "Remover",
    noMatch: "Nenhum destino encontrado",
    selected: "selecionados",
    pickOne: "Adicione pelo menos um destino.",
  },
  trip: {
    title: "Sua viagem",
    lead: "Escolha um plano para cada país. Por enquanto cada eSIM é comprado separadamente, com seu próprio pagamento.",
    change: "Alterar destinos",
    buy: "Comprar este eSIM",
    none: "Ainda não há planos para este país.",
  },
  error: "Algo deu errado. Tente novamente.",
  loading: "Carregando…",
};

const de: Dict = {
  nav: { destinations: "Reiseziele", how: "So funktioniert's", help: "Hilfe", app: "Die App", language: "Sprache" },
  getApp: { title: "Hol dir die JoinCowry-App", body: "Deine eSIMs, Reise-Checkliste und lokale Guides immer dabei. Bald für iPhone und Android.", soon: "Bald verfügbar" },
  hero: {
    pill: "Reise-eSIMs für über 200 Reiseziele",
    count: "Wo auch immer dein Zuhause ist: bleib verbunden.",
    countSub: "Reise-eSIMs für über 200 Reiseziele, gemacht für die Reise nach Hause nach Afrika, in die Karibik, nach Lateinamerika und Europa. Vor dem Flug wählen, bei der Landung einschalten.",
    title1: "Landen.",
    title2: "Online sein.",
    body: "Daten für die Reise nach Hause, bereit vor dem Abflug. Bei der Landung einschalten, und du bist online.",
    searchLabel: "Wohin geht die Reise?",
    searchPlaceholder: "Länder hinzufügen, z. B. Ghana",
    searchButton: "Tarife ansehen",
    getEsim: "Meine eSIM holen",
  },
  popular: { title: "Beliebte Reisen nach Hause", lead: "Eine eSIM, in den lokalen Netzen, die du kennst.", all: "Alle Länder" },
  regions: { all: "Alle", africa: "Afrika", caribbean: "Karibik", latam: "Lateinamerika", world: "Europa & mehr", other: "Rest der Welt" },
  why: {
    title: "Gemacht für die Reise nach Hause",
    items: [
      { h: "Behalte deine Nummer", p: "WhatsApp und Anrufe bleiben auf deiner gewohnten SIM. Die eSIM fügt nur Daten hinzu." },
      { h: "Netze, die du kennst", p: "Jeder Tarif zeigt das lokale Netz, etwa Orange in Guinea oder Digicel in Jamaika." },
      { h: "Hilfe per WhatsApp", p: "Schreib uns vor und während der Reise. Wir antworten heute auf Englisch und Französisch." },
    ],
  },
  steps: {
    title: "Drei Schritte. Zwei Minuten.",
    items: [
      { h: "Tarif wählen", p: "Vom kurzen Besuch bis zum Monat bei der Familie." },
      { h: "Vor dem Flug installieren", p: "Scanne den QR-Code zu Hause im WLAN." },
      { h: "Verbunden landen", p: "Bei der Ankunft einschalten. Du bist online." },
    ],
  },
  cta: { title: "Deine nächste Landung, schon verbunden.", button: "Meine eSIM finden" },
  countries: { title: "Alle Länder", lead: "Wähle dein Reiseziel.", from: "Ab", plans: "Tarife", plan: "Tarif", empty: "Gerade sind keine Reiseziele verfügbar." },
  country: {
    back: "Alle Länder",
    lead: "Wähle einen Tarif und gib deine E-Mail-Adresse ein. Deine eSIM kommt direkt nach der Zahlung.",
    days: "Tage",
    choose: "Wählen",
    chosen: "Ausgewählt",
    popular: "Am beliebtesten",
    emailLabel: "E-Mail-Adresse",
    emailHint: "Hierhin schicken wir QR-Code und Installationsanleitung.",
    pay: "Weiter zur Zahlung",
    paying: "Zahlung wird geöffnet…",
    pickFirst: "Wähle zuerst einen Tarif.",
    badEmail: "Gib eine gültige E-Mail-Adresse ein.",
    none: "Für dieses Land gibt es noch keine Tarife.",
    compat: "Prüfe, ob dein Handy eSIM unterstützt: Die meisten iPhones ab XS und neuere Android-Geräte tun das.",
  },
  order: {
    title: "Deine eSIM",
    status: {
      awaiting_payment: "Warten auf Zahlung",
      paid: "Zahlung erhalten, eSIM wird geholt",
      provisioning: "eSIM wird vorbereitet",
      fulfilled: "Bereit zur Installation",
      fulfillment_failed: "Etwas ist schiefgelaufen",
    },
    waiting: "Diese Seite aktualisiert sich selbst. Meist dauert es unter einer Minute.",
    failed: "Deine Zahlung ist eingegangen, aber wir konnten die eSIM nicht ausstellen. Wir erstatten den Betrag oder schicken eine neue. Schreib uns auf WhatsApp.",
    scan: "Scanne diesen QR-Code in den Einstellungen: Einstellungen → Mobilfunk → eSIM hinzufügen.",
    manual: "Scannen klappt nicht? Gib diese Daten von Hand ein:",
    smdp: "SM-DP+-Adresse",
    code: "Aktivierungscode",
    guide: "Installationsanleitung lesen",
    keep: "Bewahre diese Seite auf. Installiere die eSIM vor der Reise im WLAN.",
    notFound: "Bestellung nicht gefunden. Prüfe den Link in deiner E-Mail.",
  },
  install: {
    title: "So installierst du deine eSIM",
    lead: "Mach das zu Hause im WLAN, vor der Reise. Es dauert etwa zwei Minuten.",
    iphone: "iPhone",
    iphoneSteps: [
      "Öffne Einstellungen → Mobilfunk → eSIM hinzufügen.",
      "Wähle „QR-Code verwenden“ und scanne den Code auf deiner Bestellseite.",
      "Nenne sie „Cowry“ und nutze sie nur für mobile Daten.",
      "Schalte nach der Landung Datenroaming für die Cowry-eSIM ein.",
    ],
    android: "Android",
    androidSteps: [
      "Öffne Einstellungen → Netzwerk & Internet → SIMs → eSIM hinzufügen.",
      "Scanne den QR-Code auf deiner Bestellseite.",
      "Nutze die Cowry-eSIM für Daten und deine gewohnte SIM für Anrufe.",
      "Schalte nach der Landung Roaming für die Cowry-eSIM ein.",
    ],
    help: "Hängst du fest? Schreib uns auf WhatsApp.",
  },
  dev: { title: "Testzahlung", body: "Entwicklungsmodus: Es wird keine Karte belastet. Tippe auf den Button, um eine erfolgreiche Zahlung zu simulieren.", pay: "Zahlung simulieren" },
  footer: { rights: "JoinCowry · Ein Produkt der Crest International Alliance LLC", terms: "AGB", refunds: "Erstattungen", privacy: "Datenschutz", install: "Installationsanleitung" },
  legal: {
    draft: "Entwurf. Diese Seite muss vor dem Start geschrieben und geprüft werden.",
    terms: "Nutzungsbedingungen",
    refunds: "Erstattungsrichtlinie",
    privacy: "Datenschutzerklärung",
  },
  picker: {
    showAll: "Alle Reiseziele anzeigen",
    remove: "Entfernen",
    noMatch: "Kein Reiseziel gefunden",
    selected: "ausgewählt",
    pickOne: "Füge mindestens ein Reiseziel hinzu.",
  },
  trip: {
    title: "Deine Reise",
    lead: "Wähle für jedes Land einen Tarif. Vorerst kaufst du jede eSIM einzeln, mit eigener Zahlung.",
    change: "Reiseziele ändern",
    buy: "Diese eSIM kaufen",
    none: "Für dieses Land gibt es noch keine Tarife.",
  },
  error: "Etwas ist schiefgelaufen. Bitte versuch es noch einmal.",
  loading: "Wird geladen…",
};

export const DICTS: Record<Lang, Dict> = { en, fr, es, pt, de };

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
  JM: "Jamaïque",
  HT: "Haïti",
  DO: "République dominicaine",
  TT: "Trinité-et-Tobago",
  BB: "Barbade",
  PA: "Panama",
  CO: "Colombie",
  BR: "Brésil",
  PE: "Pérou",
  MX: "Mexique",
};

const NAMES = new Map<Lang, Intl.DisplayNames | null>();
function displayNames(lang: Lang): Intl.DisplayNames | null {
  if (!NAMES.has(lang)) {
    NAMES.set(lang, typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames([NUMBER_LOCALE[lang]], { type: "region" }) : null);
  }
  return NAMES.get(lang) ?? null;
}

/** Country name in the page language. English uses the supplier's name. */
export function countryName(code: string, fallback: string, lang: Lang): string {
  if (lang === "en") return fallback;
  if (lang === "fr" && FR_COUNTRY[code]) return FR_COUNTRY[code];
  try {
    return displayNames(lang)?.of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

export function formatPrice(cents: number, lang: Lang): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatData(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB` : `${Math.round(bytes / 1024 ** 2)} MB`;
}
