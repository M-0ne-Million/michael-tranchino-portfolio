// English lives in the HTML (default for crawlers); this table holds both languages for the toggle.
const STR = {
  'loader': ['Building the city', 'Costruisco la città'],
  'nav.top': ['Back to top', 'Torna su'],
  'cta.enter': ['Enter the city', 'Entra in città'],
  'cta.contact': ['Contact', 'Contatti'],
  'hero.sub': [
    'Software engineer. I design and ship full stack systems for engineering and industry. This is my city.',
    'Software engineer. Progetto e realizzo sistemi full stack per l’ingegneria e l’industria. Questa è la mia città.',
  ],
  'core.meta': ['About', 'Chi sono'],
  'core.p1': [
    'Software engineer specialised in full stack web and mobile applications. I work across .NET, Angular and Spring Boot, designing scalable, high performance solutions.',
    'Software engineer specializzato in applicazioni web e mobile full stack. Lavoro con .NET, Angular e Spring Boot, progettando soluzioni scalabili e ad alte prestazioni.',
  ],
  'core.p2': [
    'I have run the technical side of a startup, built backend services and REST integrations, automated business processes, and now build software that supports engineering teams in a structured industrial context.',
    'Ho guidato la parte tecnica di una startup, sviluppato servizi backend e integrazioni REST, automatizzato processi aziendali e oggi costruisco software a supporto dei team di ingegneria in un contesto industriale strutturato.',
  ],
  'aq.meta': ['Engee Software · Contractor for Baker Hughes · Feb 2026 to now', 'Engee Software · Consulente per Baker Hughes · da Feb 2026 a oggi'],
  'aq.1': ['Full stack apps in .NET and Angular, wired to backend services', 'App full stack in .NET e Angular, integrate con i servizi backend'],
  'aq.2': ['REST APIs in Spring Boot on top of corporate databases', 'API REST in Spring Boot sui database aziendali'],
  'aq.3': ['Web tools supporting engineering and industrial processes', 'Strumenti web a supporto dei processi industriali e di ingegneria'],
  'aq.4': ['CI/CD with Azure Pipelines and GitHub Actions, Docker', 'CI/CD con Azure Pipelines e GitHub Actions, Docker'],
  'aq.5': ['Python for automation, data processing and AI/OCR', 'Python per automazione, elaborazione dati e AI/OCR'],
  'aq.6': ['CAD/CAE data integration with NX 2206 and Simcenter', 'Integrazione dati CAD/CAE con NX 2206 e Simcenter'],
  'aq.7': ['Excel VBA automation for DOE reporting', 'Automazione Excel VBA per il reporting DOE'],
  'aq.8': ['Business software migration: HR and ERP for management control', 'Migrazione di gestionali: HR ed ERP per il controllo di gestione'],
  'of.meta': ['Selected projects', 'Progetti selezionati'],
  'of.1t': ['Canteen AI/OCR', 'Mensa AI/OCR'],
  'of.1': [
    'Reads handwritten forms and checks booking, payment and data correctness for the company canteen, automatically.',
    'Legge i moduli scritti a mano e verifica in automatico prenotazioni, pagamenti e correttezza dei dati della mensa aziendale.',
  ],
  'of.2t': ['Impeller viewer', 'Viewer giranti'],
  'of.2': [
    'Desktop app that renders industrial impellers as point clouds with technical data. The compressor wheel spinning inside the Turbine is a nod to it.',
    'App desktop che visualizza giranti industriali come nuvole di punti, con i dati tecnici. La girante del compressore che ruota nella Turbine è un omaggio.',
  ],
  'of.3t': ['Webhook backend', 'Backend webhook'],
  'of.3': ['REST backend integrating databases and external services, with configurable webhooks.', 'Backend REST integrato con database e servizi esterni, con webhook configurabili.'],
  'of.4t': ['Ops automation', 'Automazioni'],
  'of.4': ['Python and Excel VBA tools that remove manual, repetitive work.', 'Strumenti in Python ed Excel VBA che eliminano il lavoro manuale e ripetitivo.'],
  'of.5t': ['ERP migration', 'Migrazione ERP'],
  'of.5': ['Migration of business management software focused on HR and management control.', 'Migrazione di software gestionali focalizzati su HR e controllo di gestione.'],
  'fa.meta': ['XAutomation · Full stack developer for EUROFORK · Sep 2025 to Feb 2026', 'XAutomation · Sviluppatore full stack per EUROFORK · da Set 2025 a Feb 2026'],
  'fa.1': ['Web, mobile and desktop apps with .NET MAUI, Blazor and Flutter', 'App web, mobile e desktop con .NET MAUI, Blazor e Flutter'],
  'fa.2': ['Backends and REST APIs in .NET, integrated with databases', 'Backend e API REST in .NET, integrati con i database'],
  'fa.3': ['Full stack C# with Blazor Server and WebAssembly', 'Full stack C# con Blazor Server e WebAssembly'],
  'fa.4': ['VBA tools for Excel and Access: data analysis and reporting', 'Strumenti VBA per Excel e Access: analisi dati e reporting'],
  'fa.5': ['Whole lifecycle: requirements, testing, debugging, Git, deploy', 'Tutto il ciclo di vita: requisiti, test, debug, Git, deploy'],
  'fa.note': ['First shift on record: PLC programming at RLS Sistemi, Prato, 2023.', 'Il primo turno: programmazione PLC in RLS Sistemi, Prato, 2023.'],
  'ph.meta': ['Guardians · IT Manager & COO · Jan to Jun 2025', 'Guardians · IT Manager e COO · da Gen a Giu 2025'],
  'ph.p': [
    'A startup building a safety bracelet that sends your location to chosen contacts with one press or a voice command, phone not needed.',
    'Una startup che ha creato un braccialetto di sicurezza: invia la tua posizione ai contatti scelti con un tasto o un comando vocale, senza bisogno del telefono.',
  ],
  'ph.s1': ['Italian mini-enterprises, nationwide', 'mini-imprese in tutta Italia'],
  'ph.s2': ['people on the team I led', 'persone nel team che ho guidato'],
  'ph.s3': ['public pitch to investors and media', 'pitch pubblico a investitori e media'],
  'ph.1': ['REST APIs for secure data and real-time notifications', 'API REST per dati sicuri e notifiche in tempo reale'],
  'ph.2': ['Privacy and security aligned with the Italian Data Protection Authority', 'Privacy e sicurezza in linea con le indicazioni del Garante Privacy'],
  'ph.3': ['Processes, tech standards and scalability for a growing startup', 'Processi, standard tecnici e scalabilità per una startup in crescita'],
  'ph.4': ['Multidisciplinary team coordination and delivery', 'Coordinamento di un team multidisciplinare e rispetto delle scadenze'],
  'po.meta': ['Every column is something I ship with', 'Ogni colonna è uno strumento con cui lavoro'],
  'po.build': ['Build', 'Sviluppo'],
  'po.data': ['Data and AI', 'Dati e AI'],
  'po.int': ['Integrate', 'Integrazione'],
  'po.ship': ['Ship', 'Rilascio'],
  'pa.meta': ['I.T.T.S. Silvano Fedi - Enrico Fermi, Pistoia · 2020 to 2025', 'I.T.T.S. Silvano Fedi - Enrico Fermi, Pistoia · dal 2020 al 2025'],
  'pa.p': ['Diploma in Computer Science, EQF level 4.', 'Diploma in Informatica, livello EQF 4.'],
  'pa.it': ['Native', 'Madrelingua'],
  'pa.en': ['C1 listening, reading, speaking<br>B2 writing', 'C1 ascolto, lettura, parlato<br>B2 scrittura'],
  'ci.meta': ['Off the clock', 'Fuori orario'],
  'ci.p': [
    'Cars are the other thing I can talk about for hours: German grand tourers like the Mercedes CLS and S-Class or the BMW 5 and 6 Series, and icons like Lamborghini and Porsche.',
    'Le auto sono l’altra cosa di cui posso parlare per ore: gran turismo tedesche come Mercedes CLS e Classe S o BMW Serie 5 e Serie 6, e icone come Lamborghini e Porsche.',
  ],
  'ci.note': [
    'Live telemetry. Six cars share the track, each with its own mass, power, grip, drag and downforce. Tyre grip sets the corner speed: they brake at the limit, take the racing line, attack on the free side, and the rear-drive cars power-slide out of the turns. The circuit is a 1:2.4 model.',
    'Telemetria dal vivo. Sei auto condividono la pista, ognuna con massa, potenza, aderenza, resistenza e deportanza proprie. In curva la velocità la decide il grip delle gomme: frenano al limite, seguono la traiettoria ideale, attaccano sul lato libero e le trazioni posteriori escono di traverso. Il circuito è in scala 1:2,4.',
  ],
  'car.lambo': ['Wedge supercar', 'Supercar a cuneo'],
  'car.nine': ['Rear-engine sports car', 'Sportiva a motore posteriore'],
  'car.six': ['Grand tourer coupe', 'Coupé gran turismo'],
  'car.cls': ['Four-door coupe', 'Coupé quattro porte'],
  'car.sclass': ['Flagship limousine', 'Limousine ammiraglia'],
  'car.five': ['Executive sport sedan', 'Berlina sportiva'],
  'co.h': ['Let’s build something.', 'Costruiamo qualcosa.'],
  'co.meta': ['Uplink · open channel', 'Uplink · canale aperto'],
  'co.p': ['Open to full stack, backend and industrial software roles.', 'Disponibile per ruoli full stack, backend e software industriale.'],
};

let lang = 'en';

function stored() {
  try { return localStorage.getItem('lang'); } catch { return null; }
}

function apply() {
  const k = lang === 'it' ? 1 : 0;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { const s = STR[el.dataset.i18n]; if (s) el.textContent = s[k]; });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { const s = STR[el.dataset.i18nHtml]; if (s) el.innerHTML = s[k]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { const s = STR[el.dataset.i18nAria]; if (s) el.setAttribute('aria-label', s[k]); });
  document.querySelectorAll('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
}

export function initI18n(onChange) {
  const param = new URLSearchParams(location.search).get('lang'); // shareable ?lang=it / ?lang=en
  const saved = param || stored();
  lang = saved === 'it' || saved === 'en' ? saved : (navigator.language || '').toLowerCase().startsWith('it') ? 'it' : 'en';
  apply();
  document.querySelectorAll('[data-set-lang]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.setLang === lang) return;
    lang = b.dataset.setLang;
    try { localStorage.setItem('lang', lang); } catch { /* private mode: keep it for this visit only */ }
    apply();
    onChange?.();
  }));
}
