/*
 * framework.js: reference data and scoring rules for the four-module
 * environmental impact assessment framework, from the thesis "A Proposed
 * Framework for Environmental Impact Assessment in Early-Stage Startups".
 *
 * A direct port of framework/reference.py and framework/scoring.py. Edit
 * this file to refine wording, add indicators, or change a rule; the UI
 * picks it up automatically.
 *
 * Bilingual (English / Czech): every text shown to people goes through
 * L(en, cs) or tr(value) from i18n.js. Keys and stored values (stage
 * names, indicator names, evidence levels, rule IDs) stay English, so the
 * logic and the save files do not depend on the language.
 */

const REF = {};

// ---------------------------------------------------------------------------
// Module 1: Startup typology (2x2: impact mechanism x value orientation)
// ---------------------------------------------------------------------------

REF.CLASSIFICATION_MATRIX = {
  "Direct|Primary": {
    label: L("Directly Environmental Startup (Core Cleantech)", "Přímo environmentální startup (jádro cleantechu)"),
    blurb: L("The core product or service is explicitly designed to deliver immediate environmental improvements. Direct environmental impact is central to the value proposition.",
      "Hlavní produkt nebo služba je výslovně navržen tak, aby přinášel přímé environmentální zlepšení. Přímý environmentální dopad je jádrem hodnotové nabídky."),
    unit_of_analysis: L("The product / service itself (full life cycle)", "Samotný produkt / služba (celý životní cyklus)"),
    pathway_template: "lifecycle",
  },
  "Enabling|Primary": {
    label: L("Enabling Startup", "Umožňující startup"),
    blurb: L("The startup is not itself environmental technology, but allows other actors to reduce their environmental impact. The benefit depends on adoption and behavior change by customers or partners.",
      "Startup sám o sobě není environmentální technologií, ale umožňuje jiným aktérům snížit jejich dopad na životní prostředí. Přínos závisí na tom, zda zákazníci nebo partneři řešení přijmou a změní své chování."),
    unit_of_analysis: L("The adoption pathway", "Cesta přijetí"),
    pathway_template: "adoption",
  },
  "Direct|Secondary": {
    label: L("General-Purpose Startup (direct footprint focus)", "Startup s obecným zaměřením (důraz na přímou stopu)"),
    blurb: L("The technology or business model is not intrinsically environmental; environmental effects are a secondary outcome of a primarily commercial offering. Assessment distinguishes the operational footprint from externalities of the product/service.",
      "Technologie ani obchodní model nejsou ze své podstaty environmentální; environmentální účinky jsou vedlejším výsledkem převážně komerční nabídky. Hodnocení odlišuje provozní stopu od externalit produktu či služby."),
    unit_of_analysis: L("Operational footprint + product/service externalities (dual track)", "Provozní stopa + externality produktu/služby (dvě linie)"),
    pathway_template: "dual_track",
  },
  "Enabling|Secondary": {
    label: L("Incidental Enabler (General-Purpose)", "Nahodilý umožňovatel (obecné zaměření)"),
    blurb: L("Environmental effects arise as a by-product of commercial activity through enabling others, rather than as an explicit value proposition. Assessed via the operational footprint with light-touch screening of enabling effects.",
      "Environmentální účinky vznikají jako vedlejší produkt komerční činnosti tím, že startup umožňuje něco jiným, nikoli jako výslovná hodnotová nabídka. Hodnotí se provozní stopa a zjednodušeně i umožňující účinky."),
    unit_of_analysis: L("Operational footprint + light-touch adoption screening (dual track)", "Provozní stopa + zjednodušené posouzení přijetí (dvě linie)"),
    pathway_template: "dual_track",
  },
};

// Diagnostic questions used to *derive* the classification rather than
// asking users to self-label in abstract terms.
REF.DIAGNOSTIC_MECHANISM = {
  question: L("If your product or service works exactly as intended, but none of your customers or partners change their behavior, does the environmental benefit still occur?",
    "Pokud váš produkt nebo služba funguje přesně podle záměru, ale žádný z vašich zákazníků ani partnerů nezmění své chování, vznikne environmentální přínos i tak?"),
  options: [
    [L("Yes, the benefit is inherent in the product/service itself", "Ano, přínos je obsažen přímo v produktu / službě"), "Direct"],
    [L("No, the benefit only materializes if customers/partners adopt it and change what they do", "Ne, přínos vznikne jen tehdy, když ho zákazníci / partneři přijmou a změní, co dělají"), "Enabling"],
  ],
};

// Contrasting examples shown under the orientation question (added Oct 2026
// after reviewers found the question ambiguous for products that have both
// an environmental purpose and a stand-alone commercial case).
REF.ORIENTATION_EXAMPLES = {
  primary: [L("A carbon-removal service: without the climate benefit there is nothing to sell.", "Služba pro odstraňování uhlíku: bez přínosu pro klima není co prodávat."),
    L("Compostable packaging bought because it replaces plastic, at a higher price.", "Kompostovatelné obaly, které zákazníci kupují, protože nahrazují plast, i za vyšší cenu.")],
  secondary: [L("Route-planning software bought to cut fuel and driver costs; lower emissions are a by-product.", "Software pro plánování tras kupovaný kvůli úspoře paliva a nákladů na řidiče; nižší emise jsou vedlejší efekt."),
    L("A cloud platform that happens to run on renewable energy.", "Cloudová platforma, která shodou okolností běží na obnovitelnou energii.")],
  both: L("Many products have both an environmental purpose and a commercial case that would stand on its own (e.g. irrigation sensors that save water and pumping costs). Answer for how you pitch and design the product today. If you are genuinely unsure, note why in the description: this question is still being tested with founders.",
    "Mnoho produktů má environmentální účel i komerční smysl, který by obstál sám o sobě (např. senzory pro zavlažování, které šetří vodu i náklady na čerpání). Odpovězte podle toho, jak produkt dnes prezentujete a navrhujete. Pokud si opravdu nejste jistí, uveďte proč v popisu: tuto otázku ještě testujeme se zakladateli."),
};

REF.DIAGNOSTIC_ORIENTATION = {
  question: L("Imagine removing every environmental claim from your pitch. Would the core commercial case for your product still stand on its own?",
    "Představte si, že z prezentace odstraníte všechna environmentální tvrzení. Obstál by hlavní obchodní smysl vašeho produktu i tak?"),
  options: [
    [L("No, environmental improvement IS the value proposition", "Ne, environmentální zlepšení JE hodnotovou nabídkou"), "Primary"],
    [L("Yes, the offering is primarily commercial; environmental benefit is a secondary outcome", "Ano, nabídka je primárně komerční; environmentální přínos je vedlejší výsledek"), "Secondary"],
  ],
};

// ---------------------------------------------------------------------------
// Customer profile (added after the SIC expert consultation, Oct 2026):
// who buys the product and why. The impact claim has to survive contact
// with a paying customer, and the next steps depend on who that is.
// ---------------------------------------------------------------------------

REF.CUSTOMER_TYPES = [
  ["B2B", L("Businesses (B2B)", "Firmy (B2B)")],
  ["B2C", L("Consumers (B2C)", "Spotřebitelé (B2C)")],
  ["B2G", L("Public sector (B2G)", "Veřejný sektor (B2G)")],
];

// Revenue model: how the startup earns money. Not the same thing as the
// customer segment (a B2G startup can sell licences or subscriptions).
REF.REVENUE_MODELS = [
  ["subscription", L("Subscription (e.g. SaaS, monthly or annual fee)", "Předplatné (např. SaaS, měsíční nebo roční poplatek)")],
  ["hardware_sub", L("Device or equipment plus a subscription", "Zařízení plus předplatné")],
  ["sale", L("One-off sale of a product, device or equipment", "Jednorázový prodej produktu nebo zařízení")],
  ["licence", L("Licensing (others use your technology or IP)", "Licencování (jiní využívají vaši technologii nebo duševní vlastnictví)")],
  ["usage", L("Pay per use or per transaction", "Platba za použití nebo za transakci")],
  ["service", L("Project, service or consulting fees", "Platby za projekty, služby nebo poradenství")],
  ["commission", L("Commission or marketplace fee", "Provize nebo poplatek tržiště")],
  ["other", L("Other / not decided yet", "Jiné / zatím nerozhodnuto")],
];

// Why a customer would pay, and whether the environmental benefit is part
// of that reason. Multi-select.
REF.VALUE_DRIVERS = [
  ["cost", L("It saves them money on the resource the environmental benefit is about (e.g. less water, energy, fuel or material bought)",
    "Ušetří jim peníze na zdroji, kterého se environmentální přínos týká (např. méně nakoupené vody, energie, paliva nebo materiálu)")],
  ["cost_other", L("It saves them money in other ways (e.g. labour, time, maintenance)", "Ušetří jim peníze jinak (např. práce, čas, údržba)")],
  ["compliance", L("It helps them meet a regulation, permit or reporting duty", "Pomáhá jim splnit regulaci, povolení nebo povinnost výkaznictví")],
  ["reporting", L("It gives them data for their own sustainability / ESG reporting or supplier requests", "Dává jim data pro jejich vlastní reporting udržitelnosti / ESG nebo pro požadavky odběratelů")],
  ["premium", L("It lets them charge more or win buyers who value sustainability", "Umožňuje jim účtovat více nebo získat zákazníky, kteří oceňují udržitelnost")],
  ["performance", L("It does the job better, faster or more reliably (environment aside)", "Odvede práci lépe, rychleji nebo spolehlivěji (bez ohledu na životní prostředí)")],
  ["none", L("There is no direct financial benefit to the customer yet", "Pro zákazníka zatím nemá přímý finanční přínos")],
];

REF.customerTypeLabel = function (types) {
  const t = (types || []).filter(x => REF.CUSTOMER_TYPES.some(([k]) => k === x));
  if (!t.length) return "";
  return t.length > 1 ? L(`Mixed (${t.join(" + ")})`, `Kombinace (${t.join(" + ")})`) : t[0];
};

// ---------------------------------------------------------------------------
// Development stages and stage-dependent module emphasis (thesis Figure 11)
// ---------------------------------------------------------------------------

REF.STAGES = ["Ideation", "Validation / MVP", "Early commercialization", "Growth"];

REF.STAGE_SHORT = {
  "Ideation": L("You are exploring an idea. Nothing is built or sold yet.", "Zkoumáte nápad. Zatím nic není postavené ani prodané."),
  "Validation / MVP": L("You are testing a first version (MVP) with early users or pilot customers.", "Testujete první verzi (MVP) s prvními uživateli nebo pilotními zákazníky."),
  "Early commercialization": L("You have your first paying customers and initial operational data.", "Máte první platící zákazníky a první provozní data."),
  "Growth": L("You are scaling up, with growing scrutiny from investors and regulators.", "Rostete a investoři i regulátoři se na vás dívají stále pozorněji."),
};

REF.STAGE_GUIDANCE = {
  "Ideation": {
    priority_modules: [1, 2],
    note: L("At ideation, Modules 1 and 2 are the priority: getting the impact logic right matters more than populating metrics that do not yet have data behind them. Keep Module 3 to a shortlist of intended indicators; treat most claims as projected.",
      "Ve fázi nápadu mají přednost moduly 1 a 2: správná logika dopadu je důležitější než vyplňování metrik, za kterými zatím nejsou data. V modulu 3 se omezte na krátký seznam zamýšlených indikátorů; většinu tvrzení berte jako projektovaná."),
  },
  "Validation / MVP": {
    priority_modules: [1, 2, 3],
    note: L("Refine the impact pathway with first evidence from pilots. Begin populating the most feasible indicators; expect most claims to be modelled or projected.",
      "Zpřesněte cestu dopadu podle prvních důkazů z pilotů. Začněte vyplňovat nejsnáze proveditelné indikátory; počítejte s tím, že většina tvrzení bude modelovaná nebo projektovaná."),
  },
  "Early commercialization": {
    priority_modules: [3],
    note: L("Module 3 becomes the central activity as first operational data becomes available. Move indicators from modelled toward measured where data systems allow.",
      "Jakmile jsou k dispozici první provozní data, stává se hlavní činností modul 3. Kde to datové systémy dovolí, posouvejte indikátory od modelovaných k měřeným."),
  },
  "Growth": {
    priority_modules: [3, 4],
    note: L("Module 4 gains importance as the startup faces greater scrutiny from investors, corporate customers, and regulators. Uncertainty labeling and honest communication become critical.",
      "Modul 4 nabývá na významu, protože startup čelí větší pozornosti investorů, firemních zákazníků a regulátorů. Označování nejistoty a poctivá komunikace jsou zásadní."),
  },
};

REF.REVIEW_MILESTONES = [
  "Product launch",
  "First significant commercial scale",
  "New funding round",
  "Major regulatory change",
  "Annual review",
  "Other (specify in notes)",
];

// ---------------------------------------------------------------------------
// Module 2: Impact pathway templates (theory-of-change logic models)
// Track and stage names are stored keys (English); tr() displays them.
// ---------------------------------------------------------------------------

REF.PATHWAY_TEMPLATES = {
  lifecycle: {
    name: L("Product life-cycle pathway (directly environmental startups)", "Cesta životního cyklu produktu (přímo environmentální startupy)"),
    description: L("The impact pathway covers the complete product life cycle. Make explicit what happens at each phase and which assumptions link the phases to the claimed environmental improvement.",
      "Cesta dopadu pokrývá celý životní cyklus produktu. Popište, co se děje v každé fázi a které předpoklady jednotlivé fáze propojují s deklarovaným environmentálním zlepšením."),
    tracks: [{
      track: "Product life cycle",
      stages: [
        ["Activities: product design & development", L("What design choices create the environmental improvement?", "Která konstrukční rozhodnutí vytvářejí environmentální zlepšení?")],
        ["Outputs: production", L("What is produced, from what materials, with what process?", "Co se vyrábí, z jakých materiálů a jakým procesem?")],
        ["Outcomes: use phase", L("What happens when the product is used? What does it replace?", "Co se děje při používání produktu? Co nahrazuje?"), "adoption"],
        ["Impact: full life-cycle environmental effect", L("What is the net environmental effect across the life cycle, incl. end-of-life?", "Jaký je čistý environmentální efekt za celý životní cyklus, včetně konce životnosti?")],
      ],
    }],
  },
  adoption: {
    name: L("Adoption-dependent pathway (enabling startups)", "Cesta závislá na přijetí (umožňující startupy)"),
    description: L("The impact runs through customer adoption and behavior change. The links between adoption, behavior, and avoided harm carry the key assumptions, typically the weakest part of the chain and the point where contribution analysis is most needed.",
      "Dopad vzniká prostřednictvím přijetí řešení zákazníky a změny jejich chování. Klíčové předpoklady leží ve vazbách mezi přijetím, chováním a odvrácenou škodou; to bývá nejslabší část řetězce a místo, kde je analýza příspěvku nejpotřebnější."),
    tracks: [{
      track: "Adoption chain",
      stages: [
        ["Activities: product features / service delivered", L("What exactly does the product enable users to do differently?", "Co přesně produkt uživatelům umožňuje dělat jinak?")],
        ["Outputs: customer adoption", L("Who adopts it, at what rate, and how is adoption evidenced?", "Kdo řešení přijímá, jak rychle a čím je přijetí doloženo?"), "adoption"],
        ["Outcomes: customer behavior change", L("What behavior actually changes? How do you know users follow through?", "Které chování se skutečně mění? Jak víte, že to uživatelé opravdu dělají?"), "behaviour"],
        ["Impact: avoided environmental harm", L("What environmental harm is avoided per unit of changed behavior, relative to what baseline?", "Jaké environmentální škodě se zabrání na jednotku změněného chování, a oproti jakému výchozímu stavu?")],
      ],
    }],
  },
  dual_track: {
    name: L("Dual-track pathway (general-purpose startups)", "Cesta ve dvou liniích (startupy s obecným zaměřením)"),
    description: L("General-purpose ventures are assessed on two tracks: their own operational footprint, and the externalities (positive or negative) generated through the product or service.",
      "Firmy s obecným zaměřením se hodnotí ve dvou liniích: jejich vlastní provozní stopa a externality (pozitivní i negativní), které vytváří produkt nebo služba."),
    tracks: [
      {
        track: "Track A: Operational footprint",
        stages: [
          ["Activities: operations", L("Offices, cloud/compute, logistics, travel, production: what drives your footprint?", "Kanceláře, cloud a výpočetní výkon, logistika, cestování, výroba: co tvoří vaši stopu?")],
          ["Outputs: resource use & emissions", L("Energy, materials, waste, Scope 1 & 2 emissions.", "Energie, materiály, odpad, emise Scope 1 a 2.")],
          ["Impact: direct environmental effect", L("Net direct effect of running the company.", "Čistý přímý efekt provozu firmy.")],
        ],
      },
      {
        track: "Track B: Product/service externalities",
        stages: [
          ["Activities: product or service in the market", L("What does deployment of your product cause in the world?", "Co nasazení vašeho produktu ve světě způsobuje?"), "adoption"],
          ["Outcomes: induced changes", L("Positive or negative environmental changes induced in customers or systems (incl. rebound effects).", "Pozitivní nebo negativní environmentální změny vyvolané u zákazníků nebo v systémech (včetně rebound efektů)."), "behaviour"],
          ["Impact: net externality", L("Net environmental externality of the product/service at current scale.", "Čistá environmentální externalita produktu/služby při současném rozsahu.")],
        ],
      },
    ],
  },
};

// Each stage may carry a third element: the default answer to "does this
// step depend on customers?" ("adoption" = they must buy / take it up,
// "behaviour" = they or their users must do things differently). The user
// can change it per stage in step 2.
REF.CUSTOMER_DEPENDENCE = [
  ["none", L("No: this is within our control", "Ne: to máme ve svých rukou")],
  ["adoption", L("Yes: customers must buy or adopt it", "Ano: zákazníci to musí koupit nebo přijmout")],
  ["behaviour", L("Yes: customers or users must change behaviour", "Ano: zákazníci nebo uživatelé musí změnit chování")],
];
REF.DEPENDENCE_SHORT = {
  adoption: L("Adoption needed", "Nutné přijetí"),
  behaviour: L("Behaviour change needed", "Nutná změna chování"),
};

REF.EVIDENCE = ["Not rated", "Weak (assumption only)", "Moderate (some evidence)", "Strong (validated / observed)"];

// ---------------------------------------------------------------------------
// Module 3: Indicator bank (thesis Chapter 6, six categories)
// Each entry: [indicator, typical data source, typical unit, citation key, kind]
// (citation null = added after the thesis, Oct 2026). Names, sources and
// units are English keys; tr() displays them.
// ---------------------------------------------------------------------------

REF.INDICATOR_BANK = {
  "Resource & Energy Input": [
    ["Total energy use over a defined period", "Utility invoices, production records", "kWh / period", "neumann2023", "operations"],
    ["Energy intensity per unit of output", "Utility invoices + production volumes", "kWh / unit", "neumann2023", "operations"],
    ["Share of renewable energy in total consumption", "Utility invoices / supplier data", "%", "neumann2023", "operations"],
    ["Water consumption", "Utility invoices", "m³ / period", "iso2015", "operations"],
  ],
  "Emissions & Waste Output": [
    ["Scope 1 direct GHG emissions (fuel combustion, company vehicles)", "Fuel records", "t CO₂e / yr", "ghgprotocol", "operations"],
    ["Scope 2 indirect emissions (purchased electricity & heat)", "Utility invoices × emission factors", "t CO₂e / yr", "ghgprotocol", "operations"],
    ["Scope 3 value-chain emissions (screening level)", "Spend data × generic factors; supplier data", "t CO₂e / yr", "ghgprotocol", "operations"],
    ["Total waste generated", "Internal operational records", "kg / period", "neumann2023", "operations"],
    ["Proportion of waste recycled", "Internal operational records", "%", "neumann2023", "operations"],
  ],
  "Product-Level Performance & Avoided Impact": [
    ["Real-world environmental outcome per participating customer (measured against their own baseline)", "Customer meter / usage data before and after adoption", "domain-specific (e.g. m³ water saved per farm / season)", null, "outcome"],
    ["Avoided emissions vs. conventional reference technology", "Scenario-based calculation, contribution analysis", "t CO₂e avoided / yr", "goyal2024", "outcome"],
    ["Avoided physical harm per unit of adoption (domain-specific)", "Operational data + contribution analysis", "domain-specific (e.g. kg pesticide avoided / ha)", "mayne2008", "outcome"],
    ["GHG emissions per functional unit (simplified / screening LCA)", "Design docs, bill of materials, LCA databases", "kg CO₂e / functional unit", "goyal2024", "technology"],
    ["Units produced, sold or installed (e.g. sensors manufactured)", "Production and sales records", "count / period", null, "technology"],
  ],
  "Materials & Circularity": [
    ["Share of recycled or biobased materials in products", "Bill of materials, supplier data", "%", "vanstijn2021", "technology"],
    ["Expected product lifetime vs. standard alternatives", "Product specifications, testing", "years (vs. baseline)", "vanstijn2021", "technology"],
    ["Proportion of components designed for reuse / repair / remanufacture", "Design documentation", "%", "vanstijn2021", "technology"],
    ["Share of products actually returned, reused or recycled at end of life", "Take-back records, partner data", "%", null, "outcome"],
  ],
  "Strategic & Governance": [
    ["Explicit environmental mission or quantified targets in place", "Internal documents (self-assessment)", "yes/no + description", "neumann2023", "governance"],
    ["Assigned responsibility for sustainability within the team", "Self-assessment", "yes/no + role", "neumann2023", "governance"],
    ["Environmental criteria formally integrated into product development or partner selection", "Self-assessment, process documentation", "yes/no + description", "neumann2023", "governance"],
  ],
  "Systemic & Enabling Contribution": [
    ["Active use rate: share of customers using the solution as intended", "Product analytics, usage logs", "% of customers active per period", null, "adoption"],
    ["Customer retention (share still using the solution after 6–12 months)", "CRM / subscription data", "%", null, "adoption"],
    ["Number / type of customers or partners using the solution for environmental purposes", "CRM / sales data", "count + segmentation", "markard2012", "adoption"],
    ["Adoption rate of the solution", "Product analytics, sales data", "% of target market or growth rate", "roomi2021", "adoption"],
    ["Quality / reliability of adoption evidence", "Product analytics, user studies", "qualitative rating + evidence description", "mayne2008", "adoption"],
    ["Alignment with specific transition pathways or policy targets", "Strategy documents (self-assessment)", "qualitative + referenced target", "markard2012", "governance"],
  ],
};

// What an indicator measures (5th element of each bank entry). The SIC
// consultation's point: a working technology is not yet impact, so
// indicators of adoption and real-world outcomes are highlighted over those
// of technological performance (e.g. irrigation saved per participating
// farm says more than the number of sensors manufactured).
REF.INDICATOR_KINDS = {
  outcome: { label: L("Real-world outcome", "Skutečný výsledek"), short: L("Real-world outcome", "Skutečný výsledek"), real: true,
    help: L("Measures a change that actually happened at customers or in the environment.", "Měří změnu, která skutečně nastala u zákazníků nebo v životním prostředí.") },
  adoption: { label: L("Adoption & use", "Přijetí a používání"), short: L("Adoption & use", "Přijetí a používání"), real: true,
    help: L("Measures whether customers take the product up and actually use it.", "Měří, zda zákazníci produkt přijmou a skutečně používají.") },
  technology: { label: L("Technology / product only", "Jen technologie / produkt"), short: L("Technology only", "Jen technologie"), real: false,
    help: L("Measures what the product is or can do, or how many were made. Useful, but not proof of impact on its own.", "Měří, co produkt je nebo umí, případně kolik kusů vzniklo. Užitečné, ale samo o sobě to dopad nedokazuje.") },
  operations: { label: L("Own operations", "Vlastní provoz"), short: L("Own operations", "Vlastní provoz"), real: false,
    help: L("Measures the startup's own footprint (energy, emissions, waste).", "Měří vlastní stopu startupu (energie, emise, odpad).") },
  governance: { label: L("Strategy & governance", "Strategie a řízení"), short: L("Governance", "Řízení"), real: false,
    help: L("Measures commitments and processes inside the startup.", "Měří závazky a procesy uvnitř startupu.") },
};

// Kind of a selected indicator: bank entries carry it, custom indicators
// store it on their entry.
REF.indicatorKind = function (name, entry) {
  for (const rows of Object.values(REF.INDICATOR_BANK)) {
    const r = rows.find(x => x[0] === name);
    if (r) return r[4];
  }
  return entry && REF.INDICATOR_KINDS[entry.kind] ? entry.kind : "";
};

REF.FREQUENCIES = ["", "Monthly", "Quarterly", "Annually", "Per milestone"];

// ---------------------------------------------------------------------------
// Module 4: Evidential confidence levels (keys stored in English)
// ---------------------------------------------------------------------------

REF.CONFIDENCE_LEVELS = {
  Measured: L("Supported by startup-held operational data directly linked to the impact indicator. Can be reported as evidence.",
    "Podloženo vlastními provozními daty startupu, která přímo souvisejí s indikátorem dopadu. Lze uvádět jako důkaz."),
  Modelled: L("Derived from industry averages, supplier data, or simplified lifecycle calculations that introduce additional assumptions. Report with the assumptions stated.",
    "Odvozeno z oborových průměrů, údajů dodavatelů nebo zjednodušených výpočtů životního cyklu, které přidávají další předpoklady. Uvádějte spolu s předpoklady."),
  Projected: L("Relies on adoption scenarios and theory-of-change reasoning about future or indirect impacts. Legitimate, but belongs in the impact pathway narrative, not in the evidence base.",
    "Opírá se o scénáře přijetí a úvahy teorie změny o budoucích nebo nepřímých dopadech. Legitimní, ale patří do popisu cesty dopadu, ne mezi důkazy."),
};

// Evidence quality: a second dimension, separate from the confidence level.
// The level says where a number comes from (measured, modelled, projected);
// quality says how far it can be trusted. A self-reported survey of 22
// farmers is "measured" data of low quality. (Added Oct 2026.)
REF.EVIDENCE_QUALITY = [
  ["", L("Not assessed yet", "Zatím neposouzeno")],
  ["low", L("Low: anecdotal, self-reported, or a very small sample", "Nízká: neformální, sebehodnocení nebo velmi malý vzorek")],
  ["medium", L("Medium: real data, but a limited sample, short period or no comparison group", "Střední: skutečná data, ale omezený vzorek, krátké období nebo bez srovnávací skupiny")],
  ["high", L("High: systematic, representative data that someone else could check", "Vysoká: systematická, reprezentativní data, která by mohl ověřit i někdo jiný")],
];
REF.QUALITY_SHORT = {
  "": L("Not assessed", "Neposouzeno"), low: L("Low", "Nízká"), medium: L("Medium", "Střední"), high: L("High", "Vysoká"),
};

// ---------------------------------------------------------------------------
// Quick Scope 1 & 2 estimator: generic, screening-level emission factors
// (order of magnitude consistent with DEFRA / EEA published factors).
// Results are MODELLED claims. Keys are stored; tr() displays them.
// ---------------------------------------------------------------------------

REF.EMISSION_FACTORS = {
  "Grid electricity (kWh)": { factor: 0.25, unit_note: L("kg CO₂e/kWh, EU-average order of magnitude; replace with your national grid factor", "kg CO₂e/kWh, řádově průměr EU; nahraďte faktorem vaší národní sítě"), scope: 2 },
  "Natural gas (kWh)": { factor: 0.18, unit_note: "kg CO₂e/kWh", scope: 1 },
  "Diesel (litres)": { factor: 2.68, unit_note: L("kg CO₂e/litre", "kg CO₂e/litr"), scope: 1 },
  "Petrol (litres)": { factor: 2.31, unit_note: L("kg CO₂e/litre", "kg CO₂e/litr"), scope: 1 },
  "District heating (kWh)": { factor: 0.15, unit_note: L("kg CO₂e/kWh, highly network-dependent", "kg CO₂e/kWh, silně závisí na konkrétní síti"), scope: 2 },
};

// ---------------------------------------------------------------------------
// References (keyed by citation key; bibliographic entries stay as published)
// ---------------------------------------------------------------------------

REF.REFERENCES = {
  ghgprotocol: "World Resources Institute & WBCSD (2013). The Greenhouse Gas Protocol: A Corporate Accounting and Reporting Standard.",
  goyal2024: "Goyal, S. & Mahmoudzadeh, A. (2024). [Product-level performance and avoided impact assessment for cleantech startups].",
  iso2006: "ISO (2006). ISO 14040/14044: Environmental management — Life cycle assessment.",
  iso2015: "ISO (2015). ISO 14031: Environmental management — Environmental performance evaluation.",
  kellogg2004: "W.K. Kellogg Foundation (2004). Logic Model Development Guide.",
  markard2012: "Markard, J., Raven, R. & Truffer, B. (2012). Sustainability transitions: An emerging field of research and its prospects. Research Policy 41(6).",
  mayne2008: "Mayne, J. (2008). Contribution analysis: An approach to exploring cause and effect. ILAC Brief 16.",
  mclaughlin2015: "McLaughlin, J.A. & Jordan, G.B. (2015). Using logic models. In Handbook of Practical Program Evaluation.",
  neumann2023: "Neumann, T. (2023). [Environmental performance indicators for young ventures].",
  roomi2021: "Roomi, M.A. et al. (2021). [Indicator sets for sustainable entrepreneurship].",
  vanstijn2021: "Van Stijn, A. et al. (2021). [Circularity metrics for modular and reusable products].",
  weidema2018: "Weidema, B.P. et al. (2018). [Progressive data collection and hybrid assessment].",
  weiss1995: "Weiss, C.H. (1995). Nothing as practical as good theory. In New Approaches to Evaluating Community Initiatives.",
  sahili2024: "Sahili, Z. & Barrales-Molina, V. (2024). [Lean environmental assessment in young firms].",
  lilin2025: "Li, X. & Lin, Y. (2025). [Relevance criteria for environmental indicators].",
  finnveden2009: "Finnveden, G. et al. (2009). Recent developments in Life Cycle Assessment. Journal of Environmental Management 91(1).",
};

REF.METHODOLOGY_NOTE = L(
  "This assessment follows a four-module framework for environmental impact assessment in early-stage startups: " +
  "(1) startup profiling and type classification; (2) impact pathway mapping grounded in theory-of-change / " +
  "logic-model reasoning (Weiss 1995; Mayne 2008; W.K. Kellogg Foundation 2004; McLaughlin & Jordan 2015); " +
  "(3) indicator selection via two-dimensional feasibility–relevance scoring; and (4) uncertainty acknowledgement " +
  "using three levels of evidential confidence (measured, modelled, projected). The framework is governed by four " +
  "principles: proportionality, type-differentiation, transparency over precision, and design for updating rather " +
  "than completion. It is a screening-level instrument: it does not replace full LCA (ISO 14040/44), comprehensive " +
  "GHG Protocol reporting, or regulatory compliance assessment, and it does not produce a composite score.",
  "Toto hodnocení vychází ze čtyřmodulového rámce pro hodnocení environmentálního dopadu startupů v raných fázích: " +
  "(1) profil startupu a klasifikace typu; (2) mapování cesty dopadu opřené o teorii změny / logický model " +
  "(Weiss 1995; Mayne 2008; W.K. Kellogg Foundation 2004; McLaughlin & Jordan 2015); (3) výběr indikátorů " +
  "pomocí dvourozměrného hodnocení proveditelnosti a relevance; a (4) přiznání nejistoty pomocí tří úrovní " +
  "podloženosti (měřené, modelované, projektované). Rámec se řídí čtyřmi principy: přiměřenost, rozlišení podle " +
  "typu, transparentnost před přesností a návrh pro průběžnou aktualizaci místo jednorázového dokončení. Jde " +
  "o orientační nástroj: nenahrazuje úplné LCA (ISO 14040/44), komplexní výkaznictví podle GHG Protocol ani " +
  "posouzení souladu s předpisy a nevytváří souhrnné skóre.");

// ===========================================================================
// Scoring: feasibility-relevance bucketing + automated integrity checks
// ===========================================================================

const SCORING = {};

SCORING.LEVELS = ["Low", "Medium", "High"];
SCORING.BUCKET_CORE = "Core set";
SCORING.BUCKET_ASPIRATIONAL = "Aspirational (future indicator)";
SCORING.BUCKET_SUPPLEMENTARY = "Supplementary";
SCORING.BUCKET_OPTIONAL = "Optional";
SCORING.BUCKET_EXCLUDED = "Excluded (low relevance)";
SCORING.BUCKET_ORDER = [SCORING.BUCKET_CORE, SCORING.BUCKET_ASPIRATIONAL,
  SCORING.BUCKET_SUPPLEMENTARY, SCORING.BUCKET_OPTIONAL, SCORING.BUCKET_EXCLUDED];

/*
 * Thesis scoring rules (Ch. 6.3 / Module 3):
 *   High relevance + at least moderate feasibility -> core set
 *   High relevance + low feasibility               -> aspirational / future
 *   Low relevance, regardless of feasibility       -> excluded
 *   Medium relevance -> supplementary if readily feasible, otherwise optional
 */
SCORING.bucket = function (feasibility, relevance) {
  if (relevance === "Low") return SCORING.BUCKET_EXCLUDED;
  if (relevance === "High")
    return (feasibility === "High" || feasibility === "Medium") ? SCORING.BUCKET_CORE : SCORING.BUCKET_ASPIRATIONAL;
  return feasibility === "High" ? SCORING.BUCKET_SUPPLEMENTARY : SCORING.BUCKET_OPTIONAL;
};

// selected: {name: entry} -> {bucket: [[name, entry], ...]}
SCORING.groupByBucket = function (selected) {
  const out = {};
  SCORING.BUCKET_ORDER.forEach(b => { out[b] = []; });
  Object.entries(selected || {}).forEach(([n, e]) => {
    out[SCORING.bucket(e.feasibility, e.relevance)].push([n, e]);
  });
  return out;
};

// ---------------------------------------------------------------------------
// Claim-evidence gaps: where what a claim says outruns the evidence behind
// it. Returns [{sev: "warning"|"info", msg, kind}] for one labelled indicator.
// pathway (optional) lets the claim be checked against the step it evidences.
// ---------------------------------------------------------------------------

// Wording checks are simple text patterns: prompts, not language
// understanding. They look at each sentence that makes a quantitative or
// comparative statement, so a hedge word elsewhere in the claim does not
// excuse it. "can" and "will" are deliberately not hedges: "will cut water
// use by 18%" states a projection as a certainty. Claims can be written in
// English or Czech whatever the interface language, so both are matched.
// The Czech hedges include the conditional "by" ("snížilo by"), which is
// also an English word ("cut by 18%"), so they only apply to Czech text.
SCORING.HEDGE_EN = /\b(could|may|might|expect(ed|s)?|project(ed|ion|s)?|potential(ly)?|up to|aim(s|ing)? to|target(s|ed)?|estimat(e|ed|es)|would|scenario|forecast|if\b)/i;
SCORING.HEDGE_CS = /(?<!\p{L})(by(?!\p{L})|bych|mohl|může|mohou|potenciál|až o|odhad|očekáv|předpoklád|scénář|pokud|kdyby|cíl|projekc|prognóz)/iu;
SCORING.LOOKS_CZECH = /[ěščřžýáíéůúťďň]/i;
SCORING.HEDGE = { test: x => SCORING.HEDGE_EN.test(x) || (SCORING.LOOKS_CZECH.test(x) && SCORING.HEDGE_CS.test(x)) };
SCORING.COMPARATIVE = /(\d+([.,]\d+)?\s?%|\breduc|\bsav(e|es|ed|ing)\b|\bless\b|\blower\b|\bfewer\b|\bavoid|\bcut(s)?\b|\bdecreas|\bimprov|sníž|úspor|ušetř|méně|nižší|menší|odvrát|zabrán|zlepš|pokles|redukc)/iu;
SCORING.DISCLOSES_SELF_REPORT = /\b(self[- ]?report|survey|surveyed|report(ed|s)? that|say(s)? (they|that)|according to (users|customers|farmers))|(dotazník|průzkum|uvád|uvedl|říkají|deklar|sebehodnocen|podle (uživatel|zákazník|farmář|zemědělc|respondent))/iu;
SCORING.STATES_MODELLED = /\b(estimat|model|calculat|approximately|about|around|roughly)|~|(odhad|model|výpoč|vypočt|přibližně|zhruba|cca|kolem)/iu;
SCORING.MIN_CLAIM_WORDS = 4;

SCORING.sentences = t => String(t || "").split(/(?<=[.!?;])\s+/).map(x => x.trim()).filter(Boolean);
SCORING.claimWritten = u => !!u && (u.claim || "").trim().split(/\s+/).filter(Boolean).length >= SCORING.MIN_CLAIM_WORDS;

SCORING.pathwayStage = function (pathway, link) {
  if (!link || !pathway) return null;
  const [track, stage] = link.split(" → ");
  return (pathway[track] || []).find(s => s.stage === stage) || null;
};

SCORING.claimGaps = function (name, u, entry, pathway) {
  const gaps = [];
  if (!u) return gaps;
  const claim = (u.claim || "").trim();
  const q = u.quality || "";
  const level = u.level;
  // kind "wording" = a simple text-pattern prompt; the UI says so
  const add = (sev, msg, kind = "evidence") => gaps.push({ sev, msg, kind });

  if (!SCORING.claimWritten(u)) {
    add("info", L("No claim is written yet (at least a short sentence), so the wording and baseline checks could not run.",
      "Zatím není napsané tvrzení (alespoň krátká věta), takže kontroly formulace a výchozího stavu nemohly proběhnout."), "blank");
  } else {
    const assertive = SCORING.sentences(claim).filter(x => SCORING.COMPARATIVE.test(x));
    if (level === "Projected" && assertive.some(x => !SCORING.HEDGE.test(x)))
      add("warning", L("Wording prompt: a projected figure reads as if it is already happening. Word it as a possibility for a stated scenario and period, e.g. “could reduce … by up to … by 2027 if …”.",
        "Podnět k formulaci: projektované číslo zní, jako by se to už dělo. Formulujte ho jako možnost pro uvedený scénář a období, např. „mohlo by snížit … až o … do roku 2027, pokud …“."), "wording");
    if (level === "Modelled" && !SCORING.STATES_MODELLED.test(claim))
      add("info", L("Wording prompt: the claim is modelled; say so (e.g. “an estimated …”).", "Podnět k formulaci: tvrzení je modelované; řekněte to (např. „odhadem …“)."), "wording");
    if (assertive.length && !(u.baseline || "").trim())
      add("warning", L("The claim compares (less, lower, saves, a %), but no baseline is stated. Compared with what?",
        "Tvrzení srovnává (méně, nižší, úspora, %), ale není uveden výchozí stav. Ve srovnání s čím?"));
  }
  if (level === "Measured" && q === "low") {
    if (SCORING.claimWritten(u) && SCORING.DISCLOSES_SELF_REPORT.test(claim))
      add("info", L("Measured, low quality: the wording discloses that this is reported, not observed. Do not present it as evidence of the environmental outcome itself.",
        "Měřené, nízká kvalita: formulace přiznává, že jde o deklarované, ne pozorované údaje. Neprezentujte to jako důkaz samotného environmentálního výsledku."));
    else
      add("warning", L("Labelled Measured, but the evidence quality is low (e.g. self-reported or a tiny sample). Say so in the claim, so nobody reads it as validated.",
        "Označeno jako měřené, ale kvalita důkazů je nízká (např. sebehodnocení nebo malý vzorek). Uveďte to v tvrzení, aby ho nikdo nečetl jako ověřené."));
  }
  if ((level === "Measured" || level === "Modelled") && !(u.sources || "").trim())
    add("warning", L(`A ${level.toLowerCase()} claim needs its data source named.`, `${tr(level)} tvrzení potřebuje uvedený zdroj dat.`));
  if (!q)
    add("warning", L("Evidence quality is not assessed. Without it, a reader cannot tell a survey from a meter reading.",
      "Kvalita důkazů není posouzena. Bez ní čtenář nerozezná dotazník od odečtu z měřidla."));
  if ((level === "Measured" || level === "Modelled") && !(u.boundary || "").trim())
    add("warning", L("No boundary: state what the figure includes and leaves out (period, sites or customers, life-cycle stages). Two honest figures can differ only because their boundaries differ.",
      "Chybí hranice: uveďte, co číslo zahrnuje a co ne (období, místa nebo zákazníci, fáze životního cyklu). Dvě poctivá čísla se mohou lišit jen proto, že mají jiné hranice."));
  const link = entry && entry.pathway_link;
  const st = SCORING.pathwayStage(pathway, link);
  if (link && !st)
    add("warning", L(`The linked pathway step (“${link}”) no longer exists. Re-link the indicator in step 3.`,
      `Propojený krok cesty dopadu („${tr(link)}“) už neexistuje. Propojte indikátor znovu v kroku 3.`));
  if (st && st.evidence === "Weak (assumption only)" && ((level === "Measured" && q && q !== "low") || q === "high"))
    add("info", L(`This indicator evidences “${st.stage}”, which step 2 still rates as weak. If this evidence now supports it, update the rating in step 2.`,
      `Tento indikátor dokládá krok „${tr(st.stage)}“, který je v kroku 2 stále hodnocen jako slabý. Pokud ho tyto důkazy nyní podporují, upravte hodnocení v kroku 2.`));
  return gaps;
};

SCORING.allClaimGaps = function (selected, uncertainty, pathway) {
  const out = [];
  Object.entries(uncertainty || {}).forEach(([n, u]) => {
    SCORING.claimGaps(n, u, (selected || {})[n], pathway).forEach(g => out.push(Object.assign({ name: n }, g)));
  });
  return out;
};

// Operationalizes the anti-greenwashing findings. Returns [severity, message]
// pairs; severity in {"warning", "info", "ok"}.
SCORING.integrityChecks = function (selected, uncertainty, pathway) {
  const checks = [];
  const core = SCORING.groupByBucket(selected)[SCORING.BUCKET_CORE];
  const names = list => list.map(tr).join("; ");

  // 1. Core set size (proportionality)
  if (core.length === 0) {
    checks.push(["warning", L("No core indicators. Select at least one indicator that is highly relevant and at least moderately feasible.",
      "Žádné klíčové indikátory. Vyberte alespoň jeden indikátor s vysokou relevancí a alespoň střední proveditelností.")]);
  } else if (core.length > 5) {
    checks.push(["warning", L(`Core set contains ${core.length} indicators. The framework recommends no more than 3–5 at early stages (proportionality principle). Consider trimming.`,
      `Klíčová sada obsahuje ${core.length} indikátorů. Rámec v raných fázích doporučuje nejvýše 3–5 (princip přiměřenosti). Zvažte zúžení.`)]);
  } else {
    checks.push(["ok", L(`Core set size (${core.length}) is within the recommended 3–5 range.`, `Velikost klíčové sady (${core.length}) je v doporučeném rozsahu 3–5.`)]);
  }

  // 2. Vanity metrics: easy to measure but not material
  const vanity = Object.entries(selected).filter(([, e]) => e.feasibility === "High" && e.relevance === "Low").map(([n]) => n);
  if (vanity.length) {
    checks.push(["warning", L("Possible vanity metrics selected (high feasibility, low relevance): " + names(vanity) +
      ". Reporting metrics that are available rather than meaningful is a structural driver of greenwashing, and the framework excludes these.",
      "Pravděpodobně „parádní“ metriky (vysoká proveditelnost, nízká relevance): " + names(vanity) +
      ". Vykazování metrik, které jsou po ruce, místo těch, které něco znamenají, je strukturální příčinou greenwashingu; rámec je proto vyřazuje.")]);
  } else {
    checks.push(["ok", L("No vanity metrics (high feasibility / low relevance) in the selection.", "Ve výběru nejsou žádné „parádní“ metriky (vysoká proveditelnost / nízká relevance).")]);
  }

  // 3. Evidence base composition
  if (core.length) {
    const lvl = n => (uncertainty[n] || {}).level;
    const unlabelled = core.filter(([n]) => !lvl(n)).map(([n]) => n);
    if (unlabelled.length)
      checks.push(["warning", L("Core indicators without an evidential confidence label: ", "Klíčové indikátory bez označení míry podloženosti: ") + names(unlabelled)]);
    const projected = core.filter(([n]) => lvl(n) === "Projected").map(([n]) => n);
    const grounded = core.filter(([n]) => lvl(n) === "Measured" || lvl(n) === "Modelled");
    if (projected.length && !grounded.length) {
      checks.push(["warning", L("All labelled core claims are Projected. Projected claims belong in the impact-pathway narrative, not in the evidence base. Consider whether any indicator can be grounded in operational data, or state clearly that the assessment is prospective.",
        "Všechna označená klíčová tvrzení jsou projektovaná. Projektovaná tvrzení patří do popisu cesty dopadu, ne mezi důkazy. Zvažte, zda lze některý indikátor opřít o provozní data, nebo jasně uveďte, že hodnocení je výhledové.")]);
    } else if (projected.length) {
      checks.push(["info", L("Projected claims in the core set: " + names(projected) + ". Report these in the narrative, clearly separated from measured/modelled evidence.",
        "Projektovaná tvrzení v klíčové sadě: " + names(projected) + ". Uvádějte je v popisu, jasně oddělené od měřených a modelovaných důkazů.")]);
    }
  }

  // 3b. Real impact: does the core set measure adoption or outcomes, or
  // only the technology?
  if (core.length) {
    const kindOf = ([n, e]) => REF.indicatorKind(n, e);
    const outcomes = core.filter(x => kindOf(x) === "outcome");
    const adoption = core.filter(x => kindOf(x) === "adoption");
    if (!outcomes.length && !adoption.length) {
      checks.push(["warning", L("No core indicator measures adoption or a real-world outcome. The core set describes the technology or the company, not whether customers use it or the environment benefits. Add one (e.g. irrigation saved per participating farm rather than sensors manufactured).",
        "Žádný klíčový indikátor neměří přijetí ani skutečný výsledek. Klíčová sada popisuje technologii nebo firmu, ne to, zda ji zákazníci používají a zda z toho má prospěch životní prostředí. Přidejte takový indikátor (např. ušetřená voda na zapojenou farmu místo počtu vyrobených senzorů).")]);
    } else if (!outcomes.length) {
      checks.push(["info", L("The core set measures adoption but no real-world outcome yet. Adoption shows the product is used; an outcome indicator shows that use changes something.",
        "Klíčová sada měří přijetí, ale zatím žádný skutečný výsledek. Přijetí ukazuje, že se produkt používá; indikátor výsledku ukazuje, že používání něco mění.")]);
    } else {
      checks.push(["ok", L("The core set includes at least one real-world outcome indicator.", "Klíčová sada obsahuje alespoň jeden indikátor skutečného výsledku.")]);
    }
  }

  // 4. Materiality linkage: indicators should trace to the impact pathway
  const unlinked = core.filter(([, e]) => !SCORING.pathwayStage(pathway, e.pathway_link)).map(([n]) => n);
  if (unlinked.length) {
    checks.push(["info", L("Core indicators not linked to a pathway stage: " + names(unlinked) +
      ". Linking each indicator to the step of the causal chain it evidences strengthens the materiality of the indicator set.",
      "Klíčové indikátory nepropojené s krokem cesty dopadu: " + names(unlinked) +
      ". Propojení každého indikátoru s krokem příčinného řetězce, který dokládá, posiluje významnost sady indikátorů.")]);
  } else if (core.length) {
    checks.push(["ok", L("All core indicators are linked to an impact-pathway stage.", "Všechny klíčové indikátory jsou propojené s krokem cesty dopadu.")]);
  }

  // 4b. Claim-evidence gaps (wording, baselines, sources, quality)
  const allG = SCORING.allClaimGaps(selected, uncertainty, pathway);
  const gw = allG.filter(g => g.sev === "warning");
  const blank = [...new Set(allG.filter(g => g.kind === "blank").map(g => g.name))];
  if (gw.length) {
    const ns = [...new Set(gw.map(g => g.name))];
    checks.push(["warning", L(`${gw.length} claim–evidence issue(s) in: ${names(ns)}. See the claims and evidence overview in section 4.`,
      `${gw.length} ${I18N.plural(gw.length, "nesoulad", "nesoulady", "nesouladů")} mezi tvrzením a důkazy u: ${names(ns)}. Viz přehled tvrzení a důkazů v oddílu 4.`)]);
  }
  if (blank.length) {
    checks.push(["info", L(`No claim written yet for: ${names(blank)}. These claims were not checked.`,
      `Zatím bez napsaného tvrzení: ${names(blank)}. Tato tvrzení nebyla zkontrolována.`)]);
  }
  if (!gw.length && Object.keys(uncertainty || {}).length && blank.length < Object.keys(uncertainty).length) {
    checks.push(["info", L("No issues detected by these automated checks. They look for missing baselines, sources, quality ratings and boundaries, and use simple text patterns for wording; they cannot tell whether the figures are true.",
      "Tyto automatické kontroly nenašly žádný problém. Hledají chybějící výchozí stavy, zdroje, hodnocení kvality a hranice a u formulací používají jednoduché textové vzory; nedokážou posoudit, zda jsou čísla pravdivá.")]);
  }

  // 5. Missing assumption documentation on non-measured claims
  const undocumented = Object.entries(uncertainty)
    .filter(([, u]) => (u.level === "Modelled" || u.level === "Projected") && !(u.assumptions || "").trim())
    .map(([n]) => n);
  if (undocumented.length) {
    checks.push(["warning", L("Modelled/Projected claims without documented assumptions: " + names(undocumented) +
      ". Transparency over precision: every non-measured claim must state its driving assumptions.",
      "Modelovaná/projektovaná tvrzení bez uvedených předpokladů: " + names(undocumented) +
      ". Transparentnost před přesností: každé neměřené tvrzení musí uvádět předpoklady, na kterých stojí.")]);
  }
  return checks;
};

// ===========================================================================
// Next steps and points to consider (added after the SIC expert
// consultation, Oct 2026). The report should not stop at a diagnosis: it
// ends with concrete next steps drawn from the gaps in this assessment, and
// with "Have you considered...?" prompts the team is free to ignore.
// Returns {actions: [{id, type, title, priority, condition, implication, action,
//          why_now, trace}], more, hidden, strengths, consider: [{id, title, text,
//          trace}], fired: [rule ids]}. See SCORING.RULES for every rule.
// ===========================================================================

SCORING.MAX_ACTIONS = 7;
SCORING.PLAN_SIZE = 3;   // recommendations shown as the action plan, with owner and deadline

SCORING.PRIORITY_LABEL = { 3: L("High", "Vysoká"), 2: L("Medium", "Střední"), 1: L("Low", "Nízká") };
SCORING.STAGE_LEAD = {
  "Ideation": L("At ideation nothing is built or sold yet, so the priority is getting the impact logic and the customer right before collecting data.",
    "Ve fázi nápadu ještě nic není postavené ani prodané, takže prioritou je mít správně logiku dopadu a zákazníka dřív, než začnete sbírat data."),
  "Validation / MVP": L("At validation the open question is whether real customers adopt the product and use it as intended.",
    "Ve fázi ověřování je otevřenou otázkou, zda skuteční zákazníci produkt přijmou a budou ho používat tak, jak je zamýšleno."),
  "Early commercialization": L("In early commercialization the first paying customers produce real data, so claims are expected to move from modelled to measured.",
    "V rané komercializaci první platící zákazníci vytvářejí skutečná data, takže se očekává, že se tvrzení posunou od modelovaných k měřeným."),
  "Growth": L("At growth, investors, corporate customers and regulators scrutinise claims, so evidence and careful wording matter most.",
    "Ve fázi růstu tvrzení zkoumají investoři, firemní zákazníci i regulátoři, takže nejvíc záleží na důkazech a pečlivé formulaci."),
};
SCORING.RELEVANCE_PHRASE = {
  3: L("That makes this a priority now.", "Proto je to teď priorita."),
  2: L("Worth doing now, after the high-priority items.", "Vyplatí se to udělat teď, po bodech s vysokou prioritou."),
  1: L("This can wait; note it for a later stage.", "Může to počkat; poznamenejte si to na pozdější fázi."),
};

// The complete rule set behind the recommendations, in plain language, so a
// reader can check which rules exist and which ones fired for a startup.
// [id, kind, title, condition]; kind: gap | strength | consider.
SCORING.RULES = [
  ["R01", "gap", L("Name your customer", "Pojmenujte zákazníka"), L("Customer segment, revenue model or buyer is missing in step 1.", "V kroku 1 chybí zákaznický segment, model příjmů nebo kupující.")],
  ["R02", "gap", L("Name who has to change behaviour", "Pojmenujte, kdo musí změnit chování"), L("The impact mechanism is enabling, but nobody is named whose behaviour must change (step 1).", "Mechanismus dopadu je umožňující, ale není uvedeno, kdo musí změnit chování (krok 1).")],
  ["R03", "gap", L("Test the weakest link(s)", "Otestujte nejslabší článek"), L("A pathway step is rated “Weak (assumption only)” (step 2); one recommendation covering up to two steps, later steps first.", "Krok cesty dopadu je hodnocen jako „Slabé (jen předpoklad)“ (krok 2); jedno doporučení pokrývá až dva kroky, pozdější kroky mají přednost.")],
  ["R04", "gap", L("Validate customer adoption", "Ověřte přijetí zákazníky"), L("Pathway steps depend on customer adoption or behaviour change, and none of them has moderate or strong evidence (step 2).", "Kroky cesty dopadu závisejí na přijetí zákazníky nebo na změně chování a žádný z nich nemá střední ani silné důkazy (krok 2).")],
  ["R05", "gap", L("Mark the steps that depend on customers", "Označte kroky závislé na zákaznících"), L("The mechanism is enabling, but no pathway step is marked as depending on customers (step 2).", "Mechanismus je umožňující, ale žádný krok cesty dopadu není označen jako závislý na zákaznících (krok 2).")],
  ["R06", "gap", L("Complete the impact pathway", "Doplňte cestu dopadu"), L("One or more pathway steps have no description (step 2).", "Jeden nebo více kroků cesty dopadu nemá popis (krok 2).")],
  ["R07", "gap", L("Choose a core indicator", "Vyberte klíčový indikátor"), L("No indicator is both highly relevant and at least moderately feasible (step 3).", "Žádný indikátor nemá zároveň vysokou relevanci a alespoň střední proveditelnost (krok 3).")],
  ["R08", "gap", L("Record a baseline", "Zaznamenejte výchozí stav"), L("A core indicator has no current value (step 3).", "Klíčový indikátor nemá současnou hodnotu (krok 3).")],
  ["R09", "gap", L("Measure the projected impact", "Změřte projektovaný dopad"), L("An outcome or adoption claim is labelled Projected and no real-world outcome claim is Measured (step 4).", "Tvrzení o výsledku nebo přijetí je označeno jako projektované a žádné tvrzení o skutečném výsledku není měřené (krok 4).")],
  ["R10", "gap", L("Turn one claim into a measured one", "Změňte jedno tvrzení na měřené"), L("No core claim is labelled Measured, and R09 does not apply (step 4).", "Žádné klíčové tvrzení není označeno jako měřené a R09 neplatí (krok 4).")],
  ["R11", "gap", L("Measure real impact, not only the technology", "Měřte skutečný dopad, ne jen technologii"), L("No core indicator measures adoption or a real-world outcome (step 3).", "Žádný klíčový indikátor neměří přijetí ani skutečný výsledek (krok 3).")],
  ["R12", "gap", L("Close the claim–evidence gaps", "Odstraňte nesoulady mezi tvrzeními a důkazy"), L("At least one claim–evidence gap is flagged (step 4): a projection worded as fact, a comparison without baseline, low-quality measured data, missing sources, or a contradiction with step 2.", "Je označen alespoň jeden nesoulad mezi tvrzením a důkazy (krok 4): projekce formulovaná jako fakt, srovnání bez výchozího stavu, měřená data nízké kvality, chybějící zdroje nebo rozpor s krokem 2.")],
  ["R13", "gap", L("Plan your future indicators", "Naplánujte budoucí indikátory"), L("An indicator is highly relevant but low in feasibility (aspirational, step 3).", "Indikátor má vysokou relevanci, ale nízkou proveditelnost (aspirační, krok 3).")],
  ["R14", "gap", L("Find out who gains and who would pay", "Zjistěte, kdo získá a kdo by zaplatil"), L("No reason for customers to buy is recorded, or only “no direct financial benefit yet” (step 1).", "Není uveden žádný důvod, proč by zákazníci kupovali, nebo jen „zatím bez přímého finančního přínosu“ (krok 1).")],
  ["R15", "gap", L("Check a commercial assumption", "Ověřte obchodní předpoklad"), L("An impact–business alignment assumption is not validated (step 5); at most three, skipping those on a step R03 already covers.", "Předpoklad souladu dopadu a byznysu není ověřen (krok 5); nejvýše tři, kromě těch na kroku, který už pokrývá R03.")],
  ["R16", "gap", L("Set the next review", "Nastavte další revizi"), L("No review milestone is set (step 5).", "Není nastaven milník revize (krok 5).")],
  ["S01", "strength", L("Prepare an evidence summary", "Připravte shrnutí důkazů"), L("A written claim is Measured, of high evidence quality, has sources, assumptions and a boundary, is linked to an existing pathway step, and has no claim–evidence warning (step 4).", "Napsané tvrzení je měřené, s vysokou kvalitou důkazů, má zdroje, předpoklady i hranici, je propojené s existujícím krokem cesty dopadu a nemá žádné varování o nesouladu (krok 4).")],
  ["C01", "consider", L("Which customer comes first?", "Který zákazník je první?"), L("More than one customer segment is selected.", "Je vybráno více zákaznických segmentů.")],
  ["C02", "consider", L("Is your impact data a selling point?", "Jsou vaše data o dopadu prodejním argumentem?"), L("Customer segment includes B2B.", "Zákaznický segment zahrnuje B2B.")],
  ["C03", "consider", L("How will you word claims to consumers?", "Jak budete formulovat tvrzení pro spotřebitele?"), L("Customer segment includes B2C.", "Zákaznický segment zahrnuje B2C.")],
  ["C04", "consider", L("What do public buyers ask for?", "Co požadují veřejní zadavatelé?"), L("Customer segment includes B2G.", "Zákaznický segment zahrnuje B2G.")],
  ["C05", "consider", L("Is your evidence about the right people?", "Týkají se vaše důkazy správných lidí?"), L("Enabling, and the person whose behaviour must change differs from the buyer.", "Umožňující mechanismus a ten, kdo musí změnit chování, není kupující.")],
  ["C06", "consider", L("Do the users actually use it?", "Používají to uživatelé opravdu?"), L("The user differs from the buyer (and C05 does not apply).", "Uživatel není kupující (a C05 neplatí).")],
  ["C07", "consider", L("Who has to change their behaviour?", "Kdo musí změnit chování?"), L("Enabling, and nobody is named whose behaviour must change.", "Umožňující mechanismus a není uvedeno, kdo musí změnit chování.")],
  ["C08", "consider", L("Does churn also cut your impact?", "Snižuje odchod zákazníků i váš dopad?"), L("Revenue model includes a subscription.", "Model příjmů zahrnuje předplatné.")],
  ["C09", "consider", L("What happens after the sale?", "Co se děje po prodeji?"), L("Revenue model includes a one-off sale.", "Model příjmů zahrnuje jednorázový prodej.")],
  ["C10", "consider", L("Can you see how licensees deploy it?", "Vidíte, jak to nasazují držitelé licence?"), L("Revenue model includes licensing.", "Model příjmů zahrnuje licencování.")],
  ["C11", "consider", L("Is your billing data also impact data?", "Jsou vaše fakturační data zároveň daty o dopadu?"), L("Revenue model includes pay per use.", "Model příjmů zahrnuje platbu za použití.")],
  ["C12", "consider", L("Can one dataset show both savings?", "Ukáže jedna sada dat obě úspory?"), L("Enabling, and customers buy because it saves them money.", "Umožňující mechanismus a zákazníci kupují, protože jim to šetří peníze.")],
  ["C13", "consider", L("What about rebound effects?", "Co rebound efekty?"), L("Enabling or secondary orientation, and rebound is not mentioned anywhere in steps 2–4.", "Umožňující mechanismus nebo sekundární orientace a rebound efekt není v krocích 2–4 nikde zmíněn.")],
  ["C14", "consider", L("What happens at end of life?", "Co se děje na konci životnosti?"), L("Direct mechanism, and end of life, recycling or disposal is not mentioned in steps 2–4.", "Přímý mechanismus a konec životnosti, recyklace ani likvidace nejsou v krocích 2–4 zmíněny.")],
  ["C15", "consider", L("Do you know your own footprint?", "Znáte svou vlastní stopu?"), L("Value orientation is secondary.", "Hodnotová orientace je sekundární.")],
  ["C16", "consider", L("Is it time for external verification?", "Je čas na externí ověření?"), L("Stage is early commercialization or growth.", "Fáze je raná komercializace nebo růst.")],
  ["C17", "consider", L("How will investors read this?", "Jak to budou číst investoři?"), L("At least half of the labelled claims are Projected.", "Alespoň polovina označených tvrzení je projektovaná.")],
];

// ===========================================================================
// Impact-business alignment (added after the SIC consultation, Oct 2026).
// Not a commercial viability score and not business due diligence: it only
// names the commercial assumptions on which the environmental benefit, or
// the evidence for it, depends. Each assumption can be marked by the team
// (state.alignment[key] = {status: "unchecked" | "some" | "validated", note}).
// ===========================================================================

SCORING.ALIGN_STATUS = [
  ["unchecked", L("Not checked yet", "Zatím neověřeno")],
  ["some", L("Some evidence", "Částečné důkazy")],
  ["validated", L("Validated", "Ověřeno")],
];

SCORING.alignment = function (state) {
  const pathway = state.pathway || {};
  const stages = [];
  Object.values(pathway).forEach(st => (st || []).forEach(s => stages.push(s)));
  const drivers = state.value_drivers || [];
  const revenue = state.revenue_models || [];
  const unc = state.uncertainty || {};
  const marks = state.alignment || {};
  const enabling = state.mechanism === "Enabling" || state.secondary_mechanism === "Enabling";
  const custSteps = stages.filter(s => s.change === "adoption" || s.change === "behaviour");
  const adoptStep = stages.find(s => s.change === "adoption");
  const behavStep = stages.find(s => s.change === "behaviour");
  const impactStep = stages.find(s => /^impact/i.test(s.stage || "") && (s.description || "").trim()) || stages.find(s => /^impact/i.test(s.stage || ""));
  const driverLabel = k => ((REF.VALUE_DRIVERS.find(([v]) => v === k) || [k, k])[1]);
  const revLabel = (REF.REVENUE_MODELS.find(([v]) => v === revenue[0]) || [null, ""])[1].replace(/\s*\(.*\)$/, "").toLowerCase();
  const step = (n, label, val) => L(`Step ${n} · ${label[0]}: ${val[0]}`, `Krok ${n} · ${label[1]}: ${val[1]}`);

  // the two values side by side
  const customerValue = (state.customer_value || "").trim() ||
    drivers.filter(d => d !== "none").map(driverLabel).join("; ") || "";
  const envValue = (impactStep && (impactStep.description || "").trim()) || "";

  // how the customer's reason to buy relates to the environmental benefit
  // (the verdict below is only a structural reading of the answers; how
  // confident it may sound depends on how many assumptions are verified,
  // see the end of this function)
  const linked = drivers.filter(d => d === "cost" || d === "compliance");
  const indirect = drivers.filter(d => d === "reporting" || d === "premium");
  let verdict, verdictText;
  if (!drivers.length || (drivers.length === 1 && drivers[0] === "none")) {
    verdict = "unclear";
    verdictText = L("No commercial reason to buy is recorded in step 1, so it is unclear what would drive the adoption your impact depends on.",
      "V kroku 1 není uveden žádný obchodní důvod ke koupi, takže není jasné, co by vedlo k přijetí, na kterém váš dopad závisí.");
  } else if (linked.length) {
    verdict = "aligned";
    const why = linked.map(d => d === "cost" ? L("saving money on the same resource", "úspora peněz na stejném zdroji") : L("meeting a regulation", "splnění regulace")).join(", ");
    verdictText = L(`On your answers, the customer's reason to buy (${why}) comes from the same change that produces the environmental benefit. If that holds, commercial success and impact move together.`,
      `Podle vašich odpovědí vychází důvod, proč zákazník kupuje (${why}), ze stejné změny, která vytváří environmentální přínos. Pokud to platí, obchodní úspěch a dopad jdou ruku v ruce.`);
  } else if (indirect.length) {
    verdict = "partly";
    verdictText = L("Customers pay for the environmental label or data rather than for the change itself. The benefit is only real if that data or label leads to an actual change, which is worth evidencing separately.",
      "Zákazníci platí spíš za environmentální označení nebo data než za samotnou změnu. Přínos je skutečný jen tehdy, když tato data nebo označení vedou ke skutečné změně, a to je dobré doložit zvlášť.");
  } else {
    verdict = "independent";
    verdictText = L("Customers would buy for reasons unrelated to the environmental benefit (e.g. performance, or savings in labour or time). The impact then depends on how the product is used, not on why it is bought, so sales alone say little about impact.",
      "Zákazníci by kupovali z důvodů, které s environmentálním přínosem nesouvisejí (např. výkon nebo úspora práce či času). Dopad pak závisí na tom, jak se produkt používá, ne na tom, proč se kupuje, takže samotné prodeje o dopadu mnoho neříkají.");
  }

  const A = [];
  const add = (key, rel, title, text, why, test, stepName, basis) => {
    const m = marks[key] || {};
    A.push({ key, rel, title, text, why, test, step: stepName || "", basis: basis || [],
      status: SCORING.ALIGN_STATUS.some(([k]) => k === m.status) ? m.status : "unchecked", note: m.note || "",
      gap: L(`Assumption not yet checked: ${text.charAt(0).toLowerCase() + text.slice(1)}`, `Předpoklad zatím není ověřen: ${text.charAt(0).toLowerCase() + text.slice(1)}`) });
  };

  if (custSteps.length || enabling) {
    add("value", [3, 3, 2, 2], L("Check that customers find it worth paying for", "Ověřte, že zákazníkům stojí za to zaplatit"),
      L(`Customers find the product worth paying for${revLabel ? ` (${revLabel})` : ""}.`, `Zákazníkům stojí produkt za to, aby za něj zaplatili${revLabel ? ` (${revLabel})` : ""}.`),
      L("If customers do not buy it, the adoption step never happens and none of the environmental benefit follows.",
        "Pokud ho zákazníci nekoupí, krok přijetí nikdy nenastane a žádný environmentální přínos nevznikne."),
      L("Interview pilot customers about what the problem costs them today and what they would pay. A paid pilot or a letter of intent is stronger evidence than stated interest.",
        "Udělejte rozhovory s pilotními zákazníky o tom, kolik je problém stojí dnes a kolik by zaplatili. Placený pilot nebo letter of intent je silnější důkaz než deklarovaný zájem."),
      adoptStep && adoptStep.stage, adoptStep
        ? [L(`Step 2 · ${adoptStep.stage}: marked “adoption needed”`, `Krok 2 · ${tr(adoptStep.stage)}: označeno „nutné přijetí“`)]
        : [step(1, ["Impact mechanism", "Mechanismus dopadu"], ["Enabling", "Umožňující"])]);
  }
  if (behavStep || enabling) {
    add("use", [2, 3, 3, 2], L("Check that use turns into behaviour change", "Ověřte, že používání vede ke změně chování"),
      L("Using the product leads to an actual change in what customers or users do.", "Používání produktu vede ke skutečné změně toho, co zákazníci nebo uživatelé dělají."),
      L("Customers can pay and still carry on as before; the environmental benefit needs the change, not the sale.",
        "Zákazníci mohou platit a přesto pokračovat jako dřív; environmentální přínos potřebuje změnu, ne prodej."),
      L("Track whether recommendations or features translate into behaviour change: usage logs combined with the data from the behaviour step.",
        "Sledujte, zda se doporučení nebo funkce promítají do změny chování: záznamy o používání spolu s daty z kroku změny chování."),
      behavStep && behavStep.stage, behavStep
        ? [L(`Step 2 · ${behavStep.stage}: marked “behaviour change needed”`, `Krok 2 · ${tr(behavStep.stage)}: označeno „nutná změna chování“`)]
        : [step(1, ["Impact mechanism", "Mechanismus dopadu"], ["Enabling", "Umožňující"])]);
  }
  if (linked.includes("cost")) {
    add("same_change", [2, 3, 3, 3], L("Check that the saving and the impact come from the same change", "Ověřte, že úspora i dopad vycházejí ze stejné změny"),
      L("The change that saves the customer money is the same change that produces the environmental benefit, and it yields measurable net savings.",
        "Změna, která zákazníkovi šetří peníze, je stejná změna, která vytváří environmentální přínos, a přináší měřitelné čisté úspory."),
      L("If customers save money in another way (e.g. labour or time), the business can succeed while the environmental benefit stays small.",
        "Pokud zákazníci šetří jinak (např. práci nebo čas), může byznys uspět, zatímco environmentální přínos zůstane malý."),
      L("Compare pilot usage against a clearly defined baseline, tracking the customer's saving and the environmental saving from the same data.",
        "Porovnejte používání v pilotu s jasně definovaným výchozím stavem a sledujte úsporu zákazníka i environmentální úsporu ze stejných dat."),
      impactStep && impactStep.stage, [step(1, ["Why customers buy", "Proč zákazníci kupují"], ["it saves them money", "šetří jim to peníze"])]);
    if (enabling) {
      add("rebound", [1, 2, 2, 3], L("Check for rebound effects", "Prověřte rebound efekty"),
        L("Lower costs do not lead customers to expand their use (e.g. irrigate more land with the water they save).",
          "Nižší náklady nevedou zákazníky k rozšíření používání (např. k zavlažování větší plochy ušetřenou vodou)."),
        L("Commercial success can then erode the net environmental benefit: the better the product sells, the more the rebound matters.",
          "Obchodní úspěch pak může čistý environmentální přínos oslabit: čím lépe se produkt prodává, tím víc rebound efekt váží."),
        L("Ask pilot customers what they do with the savings, and track the total, not only the per-unit, resource use.",
          "Zeptejte se pilotních zákazníků, co s úsporami dělají, a sledujte celkovou, nejen jednotkovou spotřebu zdrojů."),
        impactStep && impactStep.stage, [step(1, ["Why customers buy", "Proč zákazníci kupují"], ["it saves them money", "šetří jim to peníze"]),
          step(1, ["Impact mechanism", "Mechanismus dopadu"], ["Enabling", "Umožňující"])]);
    }
  }
  if (revenue.includes("subscription") || revenue.includes("hardware_sub")) {
    add("retention", [1, 2, 3, 3], L("Check that customers stay", "Ověřte, že zákazníci zůstávají"),
      L("Customers keep paying and using the product beyond the first season or year.", "Zákazníci za produkt platí a používají ho i po první sezóně nebo roce."),
      L("With a subscription, the impact stops when a customer cancels, so churn directly reduces the environmental benefit.",
        "U předplatného dopad končí, když zákazník předplatné zruší, takže odchod zákazníků přímo snižuje environmentální přínos."),
      L("Track retention of active customers per period and report impact only for customers who stay.",
        "Sledujte udržení aktivních zákazníků za období a dopad vykazujte jen za zákazníky, kteří zůstávají."),
      "", [step(1, ["Revenue model", "Model příjmů"], ["subscription", "předplatné"])]);
  }
  const projectedAdoption = Object.entries(unc).some(([n, u]) => u.level === "Projected" &&
    ["adoption", "outcome"].includes(REF.indicatorKind(n, (state.selected_indicators || {})[n])));
  if (projectedAdoption) {
    add("scale", [1, 2, 3, 3], L("Check the adoption your projection assumes", "Ověřte přijetí, se kterým počítá vaše projekce"),
      L("Adoption grows to the level that your projected impact figures assume.", "Přijetí dosáhne úrovně, se kterou počítají vaše projektovaná čísla o dopadu."),
      L("A projected environmental figure is only as good as the sales forecast behind it.", "Projektované environmentální číslo je jen tak dobré, jak dobrý je odhad prodejů, který za ním stojí."),
      L("State the number of customers or hectares each projection assumes, and compare it with your actual sales pipeline.",
        "Uveďte, s kolika zákazníky nebo hektary každá projekce počítá, a porovnejte to se skutečným obchodním plánem (pipeline)."),
      "", [L("Step 4 · an adoption or outcome claim is labelled Projected", "Krok 4 · tvrzení o přijetí nebo výsledku je označeno jako projektované")]);
  }

  // the headline never sounds more certain than the evidence: "aligned"
  // is only reported as such once every critical assumption is validated
  const nVal = A.filter(a => a.status === "validated").length;
  const LABEL = {
    aligned: A.length && nVal === A.length ? L("Aligned: key assumptions validated", "V souladu: klíčové předpoklady ověřeny")
      : L(`Potential alignment: ${nVal ? `${nVal} of ${A.length}` : "no"} assumption${A.length === 1 ? "" : "s"} verified yet`,
        `Možný soulad: ${nVal ? `ověřeno ${nVal} z ${A.length} předpokladů` : "zatím není ověřen žádný předpoklad"}`),
    partly: L(`Partial alignment: ${nVal} of ${A.length} assumptions verified`, `Částečný soulad: ověřeno ${nVal} z ${A.length} předpokladů`),
    independent: L("Not linked: sales do not imply impact", "Bez vazby: prodeje neznamenají dopad"),
    unclear: L("Unclear: no reason to buy recorded", "Nejasné: není uveden důvod ke koupi"),
  };
  return {
    customer_value: customerValue, env_value: envValue,
    verdict, verdict_label: LABEL[verdict], verdict_text: verdictText,
    verified: nVal,
    assumptions: A,
    applies: A.length > 0,
  };
};
SCORING.MAX_CONSIDER = 6;

SCORING.nextSteps = function (state) {
  const actions = [], consider = [];
  const list = ns => ns.map(n => L(`“${n}”`, `„${tr(n)}“`)).join(", ");

  const pathway = state.pathway || {};
  const selected = state.selected_indicators || {};
  const unc = state.uncertainty || {};
  const types = (state.customer_types || []).filter(t => REF.CUSTOMER_TYPES.some(([k]) => k === t));
  const drivers = state.value_drivers || [];
  const revenue = state.revenue_models || [];
  const buyer = (state.customer_profile || "").trim();
  const user = (state.customer_user || "").trim();
  const actor = (state.behaviour_actor || "").trim();
  // "same as buyer", empty or identical text all mean the same role
  const norm = t => t.toLowerCase().replace(/[^a-z0-9á-ž]+/g, " ").trim();
  const sameRole = (a, b) => !a || !b || /^(same|the buyer|buyer|stejn|kupuj|totéž|tentýž|tatáž)/i.test(a) || norm(a) === norm(b);
  const short = t => t.length > 60 ? t.slice(0, 57).replace(/\s+\S*$/, "") + "…" : t;
  const enabling = state.mechanism === "Enabling" || state.secondary_mechanism === "Enabling";
  const direct = state.mechanism === "Direct" || state.secondary_mechanism === "Direct";
  const stagesFlat = [];
  Object.entries(pathway).forEach(([track, st]) => (st || []).forEach(s => stagesFlat.push(Object.assign({ track }, s))));
  const allText = [state.weakest_links || "", ...stagesFlat.map(s => `${s.description || ""} ${s.assumption || ""}`),
    ...Object.values(unc).map(u => `${u.assumptions || ""} ${u.conditions || ""}`)].join(" ").toLowerCase();

  // ---- Recommendations ----------------------------------------------------
  // Transparent decision rules (SCORING.RULES). Every recommendation names
  // the rule that produced it and the assessment answers that triggered it
  // ("based on"), so it can be traced back and checked by hand. No language
  // model is involved.
  const fired = new Set();
  const stageIdx = Math.max(0, REF.STAGES.indexOf(state.stage));
  const rec = (id, rel, title, condition, implication, action, trace, stageNote, type = "gap") => {
    fired.add(id.split(".")[0]);
    const r = rel[stageIdx];
    const note = (stageNote && stageNote[stageIdx]) || SCORING.RELEVANCE_PHRASE[r];
    actions.push({ id, type, title, priority: r, condition, implication, action, trace: trace || [],
      why_now: `${SCORING.STAGE_LEAD[REF.STAGES[stageIdx]]} ${note}`,
      // aliases kept for older callers
      gap: condition, text: `${condition} ${action}` });
  };
  const ask = (id, title, text, trace) => { fired.add(id); consider.push({ id, title, text, trace: trace || [] }); };
  // one "based on" line: step number, field label, the answer
  const stepAns = (st, label, val) => L(`Step ${st} · ${label[0]}: ${val[0]}`, `Krok ${st} · ${label[1]}: ${val[1]}`);
  const same = v => [v, v];                       // values that read the same in both languages
  const ev = s => s.evidence || "Not rated";
  const evQ = s => L(`evidence “${ev(s)}”`, `důkazy „${tr(ev(s))}“`);
  const F = {                                     // field labels used in traces
    segment: ["Customer segment", "Zákaznický segment"],
    revenue: ["Revenue model", "Model příjmů"],
    buyer: ["Buyer", "Kupující"],
    user: ["User", "Uživatel"],
    actor: ["Whose behaviour must change", "Kdo musí změnit chování"],
    mechanism: ["Impact mechanism", "Mechanismus dopadu"],
    whyBuy: ["Why customers buy", "Proč zákazníci kupují"],
    orientation: ["Value orientation", "Hodnotová orientace"],
    stage: ["Development stage", "Fáze vývoje"],
  };
  const NOT_ANSWERED = ["not answered", "bez odpovědi"];
  const EMPTY = ["empty", "nevyplněno"];

  // R01 customer profile missing
  if (!types.length || !buyer || !revenue.length) {
    const miss = [], trace = [];
    if (!types.length) { miss.push(L("the customer segment (B2B, B2C, B2G or a mix)", "zákaznický segment (B2B, B2C, B2G nebo kombinace)")); trace.push(stepAns(1, F.segment, NOT_ANSWERED)); }
    if (!revenue.length) { miss.push(L("the revenue model", "model příjmů")); trace.push(stepAns(1, F.revenue, NOT_ANSWERED)); }
    if (!buyer) { miss.push(L("who the buyer is", "kdo je kupující")); trace.push(stepAns(1, F.buyer, EMPTY)); }
    rec("R01", [3, 3, 2, 2], L("Name your customer", "Pojmenujte zákazníka"),
      L(`Step 1 does not yet say ${miss.join(", ")}.`, `Krok 1 zatím neuvádí ${miss.join(", ")}.`),
      L("Impact only happens if someone pays for and uses the solution; without a named customer, nobody can judge whether the adoption your impact depends on is realistic.",
        "Dopad vznikne jen tehdy, když někdo za řešení zaplatí a používá ho; bez pojmenovaného zákazníka nikdo neposoudí, zda je přijetí, na kterém váš dopad závisí, realistické."),
      L(`Fill in ${miss.join(", ")} in step 1.`, `Doplňte v kroku 1: ${miss.join(", ")}.`), trace);
  }
  // R02 behaviour actor missing
  if (enabling && !actor) {
    rec("R02", [3, 3, 2, 2], L("Name who has to change behaviour", "Pojmenujte, kdo musí změnit chování"),
      L("Impact relies on someone changing behaviour, but nobody is named.", "Dopad stojí na tom, že někdo změní chování, ale nikdo není uveden."),
      L("Your evidence may then cover the wrong people: a signed contract shows a purchase, not a change in behaviour.",
        "Vaše důkazy se pak mohou týkat nesprávných lidí: podepsaná smlouva dokládá nákup, ne změnu chování."),
      L("Say in step 1 whose behaviour must change: the buyer, the day-to-day user, or someone else.",
        "Uveďte v kroku 1, kdo musí změnit chování: kupující, každodenní uživatel, nebo někdo jiný."),
      [stepAns(1, F.mechanism, [state.mechanism + (state.is_hybrid ? " (hybrid)" : ""), tr(state.mechanism) + (state.is_hybrid ? " (hybridní)" : "")]), stepAns(1, F.actor, EMPTY)]);
  }
  // R14 business benefit unclear
  if (!drivers.length || (drivers.length === 1 && drivers[0] === "none")) {
    rec("R14", [3, 3, 3, 2], L("Find out who gains and who would pay", "Zjistěte, kdo získá a kdo by zaplatil"),
      L("No plausible customer benefit or payment rationale has been identified.", "Nebyl identifikován žádný věrohodný přínos pro zákazníka ani důvod, proč by platil."),
      L("A solution may have environmental potential without a viable route to adoption, and then the benefit never materialises.",
        "Řešení může mít environmentální potenciál bez životaschopné cesty k přijetí, a pak přínos nikdy nevznikne."),
      L("Investigate who receives financial or operational value from the product and who is willing to pay for it: a few customer interviews about what the problem costs them today.",
        "Zjistěte, kdo z produktu získává finanční nebo provozní hodnotu a kdo je ochoten za něj platit: několik rozhovorů se zákazníky o tom, kolik je problém stojí dnes."),
      [stepAns(1, F.whyBuy, drivers.length ? ["“no direct financial benefit yet”", "„zatím bez přímého finančního přínosu“"] : NOT_ANSWERED)]);
  }

  // R03 weakest links (later links in the chain first)
  const rank = s => /impact/i.test(s.stage) ? 0 : /outcome/i.test(s.stage) ? 1 : /output/i.test(s.stage) ? 2 : 3;
  const weak = stagesFlat.filter(s => s.evidence === "Weak (assumption only)").sort((x, y) => rank(x) - rank(y));
  if (weak.length) {
    const top = weak.slice(0, 2);
    const two = top.length > 1;
    let action = L("Design one small, cheap test for " + (two ? "each, starting with the first" : "it") + ", and run it before you build further claims on " + (two ? "them" : "it") + ".",
      "Navrhněte jeden malý, levný test " + (two ? "pro každý z nich, začněte prvním," : "") + " a proveďte ho dřív, než na " + (two ? "nich" : "něm") + " postavíte další tvrzení.");
    if (enabling && top.some(s => /outcome|behav/i.test(s.stage))) action += " " + L("For behaviour change, compare usage logs or meter readings for a few pilot customers before and after they adopt.",
      "U změny chování porovnejte záznamy o používání nebo odečty z měřidel u několika pilotních zákazníků před zavedením a po něm.");
    else if (top.some(s => /impact/i.test(s.stage))) action += " " + L("For the impact step, agree a baseline first: what would have happened without your product?",
      "U kroku dopadu si nejdřív stanovte výchozí stav: co by se stalo bez vašeho produktu?");
    rec("R03", [2, 3, 3, 3], two ? L("Test your weakest links", "Otestujte nejslabší články") : L("Test the weakest link", "Otestujte nejslabší článek"),
      top.map(s => L(`“${s.stage}” rests on an assumption only` + (s.assumption ? ` (“${s.assumption}”)` : ""),
        `„${tr(s.stage)}“ stojí jen na předpokladu` + (s.assumption ? ` („${s.assumption}“)` : ""))).join("; ") + "." +
        (weak.length > 2 ? " " + L(`${weak.length - 2} more step(s) are also rated weak.`, `Jako slabé ${I18N.plural(weak.length - 2, "je hodnocen ještě 1 další krok", `jsou hodnoceny ještě ${weak.length - 2} další kroky`, `je hodnoceno ještě ${weak.length - 2} dalších kroků`)}.`) : ""),
      L("Every claim further down the chain inherits this uncertainty. If an assumption fails, the environmental benefit does not happen, however well the technology works.",
        "Tuto nejistotu dědí každé tvrzení dál v řetězci. Pokud předpoklad neplatí, environmentální přínos nevznikne, ať technologie funguje jakkoli dobře."),
      action, top.map(s => stepAns(2, [`${s.track} → ${s.stage}`, tr(`${s.track} → ${s.stage}`)], [evQ(s), evQ(s)])),
      [L("At ideation an untested assumption is normal; write the test down now so the first pilot can answer it.", "Ve fázi nápadu je neotestovaný předpoklad normální; zapište si test už teď, aby na něj mohl odpovědět první pilot."), null, null,
       L("At this stage an untested assumption in the chain is what a due-diligence reviewer will find first.", "V této fázi je neotestovaný předpoklad v řetězci první věc, kterou najde hodnotitel při due diligence.")]);
  }

  // R04 customer adoption not validated / R05 customer steps not marked
  const custSteps = stagesFlat.filter(s => s.change === "adoption" || s.change === "behaviour");
  if (stagesFlat.length && !custSteps.length && enabling) {
    rec("R05", [2, 2, 2, 2], L("Mark the steps that depend on customers", "Označte kroky závislé na zákaznících"),
      L("Impact depends on adoption, but no pathway step is marked as depending on customers.", "Dopad závisí na přijetí, ale žádný krok cesty dopadu není označen jako závislý na zákaznících."),
      L("The pathway then reads as if the technology alone produces the impact, which overstates what you control.",
        "Cesta dopadu pak vypadá, jako by dopad vytvářela samotná technologie, což přeceňuje to, co máte v rukou."),
      L("In step 2, mark where customers must buy the product or change what they do.", "V kroku 2 označte, kde musí zákazníci produkt koupit nebo změnit, co dělají."),
      [stepAns(1, F.mechanism, ["Enabling", "Umožňující"]), stepAns(2, ["Steps that depend on customers", "Kroky závislé na zákaznících"], ["none marked", "žádný neoznačen"])]);
  } else if (custSteps.length && !custSteps.some(s => /^(Moderate|Strong)/.test(ev(s)))) {
    const behaviour = custSteps.some(s => s.change === "behaviour");
    rec("R04", [2, 3, 3, 2], L("Validate customer adoption", "Ověřte přijetí zákazníky"),
      L(`Impact relies on ${behaviour ? "behaviour change" : "customer adoption"}, but no customer evidence is documented.`,
        `Dopad stojí na ${behaviour ? "změně chování" : "přijetí zákazníky"}, ale nejsou doloženy žádné důkazy od zákazníků.`),
      L("Without adoption, the environmental benefit may never materialise, however well the technology works.",
        "Bez přijetí nemusí environmentální přínos nikdy vzniknout, ať technologie funguje jakkoli dobře."),
      L("Run a small pilot or customer interviews to validate the adoption assumptions: paid pilots, letters of intent, usage data" + (actor ? `, and observation of ${short(actor).replace(/\.$/, "")}` : "") + ".",
        "Ověřte předpoklady přijetí malým pilotem nebo rozhovory se zákazníky: placené piloty, letters of intent, data o používání" + (actor ? ` a pozorování: ${short(actor).replace(/\.$/, "")}` : "") + "."),
      custSteps.map(s => stepAns(2, [`${s.stage} (${REF.DEPENDENCE_SHORT[s.change].toLowerCase()})`, `${tr(s.stage)} (${REF.DEPENDENCE_SHORT[s.change].toLowerCase()})`], [evQ(s), evQ(s)])));
  }

  // R06 pathway stages left empty
  const empty = stagesFlat.filter(s => !(s.description || "").trim());
  if (stagesFlat.length && empty.length) {
    rec("R06", [3, 3, 2, 2], L("Complete the impact pathway", "Doplňte cestu dopadu"),
      L(`${empty.length} of ${stagesFlat.length} pathway stage${stagesFlat.length === 1 ? " is" : "s are"} not described.`,
        `Nepopsané kroky cesty dopadu: ${empty.length} z ${stagesFlat.length}.`),
      L("A gap in the chain is the first place an investor or mentor will push, and indicators cannot be linked to a step that is not there.",
        "Mezera v řetězci je první místo, kde zatlačí investor nebo mentor, a indikátory nelze propojit s krokem, který chybí."),
      L("Describe each missing stage in one or two sentences in step 2, with the assumption that links it to the next.",
        "V kroku 2 popište každý chybějící krok jednou nebo dvěma větami, včetně předpokladu, který ho propojuje s dalším krokem."),
      empty.slice(0, 4).map(s => stepAns(2, [s.stage, tr(s.stage)], ["description empty", "popis nevyplněn"])));
  }

  // Indicators
  const buckets = SCORING.groupByBucket(selected);
  const core = buckets[SCORING.BUCKET_CORE];
  const lvl = n => (unc[n] || {}).level;
  const kindOf = n => REF.indicatorKind(n, selected[n]);
  const ind = n => [n, tr(n)];
  if (!core.length) {
    rec("R07", [2, 3, 3, 3], L("Choose a core indicator", "Vyberte klíčový indikátor"),
      L("There is no core indicator: nothing is both highly relevant and feasible to measure.", "Chybí klíčový indikátor: nic není zároveň vysoce relevantní a proveditelné k měření."),
      L("Without one, the report has no way to show progress at the next review.", "Bez něj zpráva nemůže při další revizi ukázat pokrok."),
      L("In step 3, select at least one indicator that is highly relevant to your pathway and at least moderately feasible.",
        "V kroku 3 vyberte alespoň jeden indikátor, který je pro vaši cestu dopadu vysoce relevantní a alespoň středně proveditelný."),
      [stepAns(3, ["Core set", "Klíčová sada"], Object.keys(selected).length
        ? ["empty (no indicator scored high relevance + at least medium feasibility)", "prázdná (žádný indikátor nemá vysokou relevanci a alespoň střední proveditelnost)"]
        : ["no indicators selected", "nejsou vybrány žádné indikátory"])]);
  } else {
    const noBaseline = core.filter(([, e]) => !(e.current_value || "").toString().trim()).map(([n]) => n);
    if (noBaseline.length) {
      rec("R08", [1, 3, 3, 3], L("Record a baseline", "Zaznamenejte výchozí stav"),
        L(`No current value is recorded for ${list(noBaseline.slice(0, 3))}${noBaseline.length > 3 ? " and others" : ""}.`,
          `Chybí současná hodnota u: ${list(noBaseline.slice(0, 3))}${noBaseline.length > 3 ? " a dalších" : ""}.`),
        L("Without a starting point, any later improvement is a claim nobody can check.", "Bez výchozího bodu je jakékoli pozdější zlepšení tvrzením, které nikdo nemůže ověřit."),
        L("Write down today's value, even if it is zero or a rough figure, and where it comes from.", "Zapište dnešní hodnotu, i kdyby byla nulová nebo jen hrubá, a odkud pochází."),
        noBaseline.slice(0, 3).map(n => stepAns(3, ind(n), ["current value empty", "současná hodnota nevyplněna"])),
        [L("At ideation there may be nothing to measure yet; note how you would get the baseline once a pilot starts.", "Ve fázi nápadu možná ještě není co měřit; poznamenejte si, jak výchozí stav získáte, až začne pilot."), null, null, null]);
    }
  }
  // R09 impact claim is projected, with no measured claim of the same kind
  const projImpact = Object.keys(unc).filter(n => lvl(n) === "Projected" && ["outcome", "adoption"].includes(kindOf(n)));
  const measuredImpact = Object.keys(unc).filter(n => lvl(n) === "Measured" && kindOf(n) === "outcome");
  if (projImpact.length && !measuredImpact.length) {
    const n = projImpact[0];
    rec("R09", [1, 2, 3, 3], L("Measure the projected impact", "Změřte projektovaný dopad"),
      L(`A projected impact claim (“${n}”) has no supporting operational measurement.`, `Projektované tvrzení o dopadu („${tr(n)}“) nemá oporu v provozním měření.`),
      L("This helps distinguish expected impact from observed impact; until then, reviewers will treat the figure as a forecast.",
        "Měření pomáhá odlišit očekávaný dopad od pozorovaného; do té doby budou hodnotitelé číslo brát jako prognózu."),
      L("Identify the earliest feasible real-world measurement for it, and establish a baseline now so the first measurement can be compared.",
        "Určete nejdřívější proveditelné měření ve skutečném provozu a stanovte výchozí stav už teď, aby bylo s čím první měření porovnat."),
      projImpact.slice(0, 3).map(x => stepAns(4, ind(x), [`labelled Projected (${REF.INDICATOR_KINDS[kindOf(x)].label.toLowerCase()})`, `označeno jako projektované (${REF.INDICATOR_KINDS[kindOf(x)].label.toLowerCase()})`]))
        .concat([stepAns(4, ["Measured real-world outcome claims", "Měřená tvrzení o skutečném výsledku"], ["none", "žádná"])]));
  } else if (core.length && !core.some(([n]) => lvl(n) === "Measured")) {
    // R10 no core claim measured (when R09 did not already cover it)
    const pick = core.map(([n]) => n).find(n => lvl(n) === "Modelled") || core[0][0];
    rec("R10", [1, 2, 3, 3], L("Turn one claim into a measured one", "Změňte jedno tvrzení na měřené"),
      L("None of your core claims is measured yet.", "Žádné z vašich klíčových tvrzení zatím není měřené."),
      L("Reviewers discount modelled and projected figures; one measured claim is worth more than several projected ones.",
        "Hodnotitelé modelovaná a projektovaná čísla zlevňují; jedno měřené tvrzení má větší váhu než několik projektovaných."),
      L(`Start with “${pick}”: name the data that would prove it, who collects it, and how often.`, `Začněte u „${tr(pick)}“: určete data, která by ho doložila, kdo je sbírá a jak často.`),
      core.slice(0, 3).map(([n]) => stepAns(4, ind(n), [`labelled ${lvl(n) || "unlabelled"}`, `označeno: ${lvl(n) ? tr(lvl(n)).toLowerCase() : "bez označení"}`])));
  }
  if (core.length && !core.some(([n, e]) => REF.INDICATOR_KINDS[REF.indicatorKind(n, e)]?.real)) {
    rec("R11", [1, 2, 3, 3], L("Measure real impact, not only the technology", "Měřte skutečný dopad, ne jen technologii"),
      L("Your core indicators describe the product or the company, not whether customers use it or anything changes.",
        "Vaše klíčové indikátory popisují produkt nebo firmu, ne to, zda ho zákazníci používají a zda se něco mění."),
      L("The report can then show that the technology works, but not that it has any environmental effect.",
        "Zpráva pak může ukázat, že technologie funguje, ale ne to, že má nějaký environmentální účinek."),
      L("In step 3, add an indicator marked green, e.g. irrigation water saved per participating farm rather than sensors manufactured.",
        "V kroku 3 přidejte indikátor označený zeleně, např. ušetřenou vodu na zavlažování na zapojenou farmu místo počtu vyrobených senzorů."),
      core.slice(0, 3).map(([n]) => stepAns(3, ind(n), same((REF.INDICATOR_KINDS[kindOf(n)] || { label: L("kind not set", "druh nenastaven") }).label))));
  }
  const gapW = SCORING.allClaimGaps(selected, unc, pathway).filter(g => g.sev === "warning");
  if (gapW.length) {
    const first = gapW[0];
    rec("R12", [2, 2, 3, 3], L("Close the claim–evidence gaps", "Odstraňte nesoulady mezi tvrzeními a důkazy"),
      L(`${gapW.length} claim–evidence gap(s), starting with “${first.name}”: ${first.msg}`,
        `${gapW.length} ${I18N.plural(gapW.length, "nesoulad", "nesoulady", "nesouladů")} mezi tvrzením a důkazy, první u „${tr(first.name)}“: ${first.msg}`),
      L("A claim that says more than its evidence is how an honest startup ends up accused of greenwashing.",
        "Tvrzení, které říká víc, než dokládají důkazy, je přesně to, kvůli čemu bývá i poctivý startup obviněn z greenwashingu."),
      L("Reword the claim or add the missing baseline, source or quality rating in step 4 before you present it.",
        "Před prezentací tvrzení přeformulujte, nebo v kroku 4 doplňte chybějící výchozí stav, zdroj či hodnocení kvality."),
      gapW.slice(0, 3).map(g => stepAns(4, ind(g.name), same(g.msg.split(".")[0].toLowerCase()))),
      [null, null, null, L("At growth, claims reach investors, corporate buyers and consumers; under EU green-claims rules a mismatch can become a legal problem, not just a credibility one.",
        "Ve fázi růstu se tvrzení dostávají k investorům, firemním odběratelům i spotřebitelům; podle pravidel EU pro environmentální tvrzení se nesoulad může stát právním problémem, nejen otázkou důvěryhodnosti.")]);
  }
  const asp = buckets[SCORING.BUCKET_ASPIRATIONAL].map(([n]) => n);
  if (asp.length) {
    rec("R13", [1, 2, 2, 1], L("Plan your future indicators", "Naplánujte budoucí indikátory"),
      L(`${list(asp.slice(0, 3))} ${asp.length === 1 ? "is" : "are"} relevant but not yet measurable.`,
        `${list(asp.slice(0, 3))}: ${asp.length === 1 ? "je relevantní, ale zatím neměřitelný" : "jsou relevantní, ale zatím neměřitelné"}.`),
      L("Until it is measured, the most relevant part of your impact stays a projection.", "Dokud se to neměří, zůstává nejrelevantnější část vašeho dopadu projekcí."),
      L(`Note what would make ${asp.length === 1 ? "it" : "each one"} measurable (a tool, a partner, budget, a pilot customer sharing data) and at which milestone you expect it.`,
        `Poznamenejte si, co by ${asp.length === 1 ? "ho" : "každý z nich"} umožnilo měřit (nástroj, partner, rozpočet, pilotní zákazník sdílející data) a ke kterému milníku to očekáváte.`),
      asp.slice(0, 3).map(n => stepAns(3, ind(n), [`relevance ${selected[n].relevance}, feasibility ${selected[n].feasibility}`,
        `relevance ${tr(selected[n].relevance).toLowerCase()}, proveditelnost ${tr(selected[n].feasibility).toLowerCase()}`])));
  }

  // R15 impact-business alignment: unvalidated commercial assumptions,
  // skipping those whose pathway step R03 already covers
  const align = SCORING.alignment(state);
  const weakCovered = new Set(weak.slice(0, 2).map(s => s.stage));
  align.assumptions.filter(a => a.status !== "validated" && !(a.step && weakCovered.has(a.step))).slice(0, 3).forEach(a => {
    const st = (SCORING.ALIGN_STATUS.find(([k]) => k === a.status) || [, ""])[1].toLowerCase();
    rec(`R15.${a.key}`, a.rel, a.title, a.gap, a.why, a.test,
      [L(`Step 5 · Alignment assumption “${a.text.replace(/\.$/, "")}”: ${st}`, `Krok 5 · Předpoklad souladu „${a.text.replace(/\.$/, "")}“: ${st}`)].concat(a.basis || []));
  });

  // S01 strong evidence available: a claim worth showing off
  // strength requires a written claim, sources, assumptions, a boundary,
  // a link to an existing pathway step and no claim-evidence warning
  const strong = Object.entries(unc).filter(([n, u]) => u.level === "Measured" && u.quality === "high" &&
    SCORING.claimWritten(u) && (u.sources || "").trim() && (u.assumptions || "").trim() && (u.boundary || "").trim() &&
    SCORING.pathwayStage(pathway, (selected[n] || {}).pathway_link) &&
    !SCORING.claimGaps(n, u, selected[n], pathway).some(g => g.sev === "warning"));
  if (strong.length) {
    const [n] = strong[0];
    rec("S01", [1, 2, 2, 3], L("Prepare an evidence summary", "Připravte shrnutí důkazů"),
      L(`Operational measurements and documented assumptions support a claim (“${n}”).`, `Provozní měření a doložené předpoklady podporují tvrzení („${tr(n)}“).`),
      L("This makes the claim easier for customers, accelerators and reviewers to evaluate, and sets the standard for your other claims.",
        "Zákazníci, akcelerátory i hodnotitelé pak tvrzení snáz posoudí a nastaví to laťku pro vaše další tvrzení."),
      L("Prepare a short, transparent evidence summary for it: scope, limitations, baseline and sources, ready to attach to a pitch or tender.",
        "Připravte k němu krátké, transparentní shrnutí důkazů: rozsah, omezení, výchozí stav a zdroje, připravené k přiložení k prezentaci nebo nabídce."),
      strong.slice(0, 3).map(([x, v]) => stepAns(4, ind(x), [`Measured, quality High, sources: ${short(v.sources)}`, `měřené, vysoká kvalita, zdroje: ${short(v.sources)}`])),
      null, "strength");
  }

  // R16 review milestone
  if (!state.next_review_milestone) {
    rec("R16", [1, 1, 1, 1], L("Set the next review", "Nastavte další revizi"),
      L("No review milestone is set.", "Není nastaven milník revize."),
      L("Without one, the assessment tends to be filed and forgotten while the business changes.", "Bez něj hodnocení obvykle skončí v šuplíku, zatímco se byznys mění."),
      L("Pick the milestone at which you will update this assessment (step 5).", "Vyberte milník, při kterém hodnocení aktualizujete (krok 5)."),
      [stepAns(5, ["Next review milestone", "Milník další revize"], ["not set", "nenastaven"])]);
  }

  // highest priority first; gaps before strengths of equal priority
  actions.forEach((a, k) => { a._i = k; });
  actions.sort((x, y) => (y.priority - x.priority) || ((x.type === "strength") - (y.type === "strength")) || (x._i - y._i));
  actions.forEach(a => { delete a._i; });

  // ---- Points to consider ("Ke zvážení"): prompts the team may ignore ----

  if (types.length > 1) {
    ask("C01", L("Which customer comes first?", "Který zákazník je první?"),
      L(`You sell to ${types.join(" and ")}. Have you decided which segment you will prove the impact with first? Each one usually asks for different evidence, so one strong case beats several partial ones.`,
        `Prodáváte segmentům ${types.join(" a ")}. Rozhodli jste se, na kterém segmentu dopad prokážete nejdřív? Každý obvykle vyžaduje jiné důkazy, takže jeden silný případ je lepší než několik dílčích.`),
      [stepAns(1, F.segment, same(types.join(" + ")))]);
  }
  if (types.includes("B2B")) {
    ask("C02", L("Is your impact data a selling point?", "Jsou vaše data o dopadu prodejním argumentem?"),
      L("Have you considered whether your business customers need environmental data for their own sustainability reporting or supplier questionnaires? If your product can supply it, the impact claim becomes part of the sales argument, not just the pitch deck.",
        "Zvážili jste, zda vaši firemní zákazníci potřebují environmentální data pro vlastní reporting udržitelnosti nebo dotazníky pro dodavatele? Pokud je váš produkt dokáže dodat, stane se tvrzení o dopadu součástí prodejního argumentu, nejen prezentace."),
      [stepAns(1, F.segment, ["includes B2B", "zahrnuje B2B"])]);
  }
  if (types.includes("B2C")) {
    ask("C03", L("How will you word claims to consumers?", "Jak budete formulovat tvrzení pro spotřebitele?"),
      L("Since 27 September 2026, EU rules (Directive 2024/825) ban generic environmental claims such as “eco-friendly” or “climate neutral” towards consumers without proof of recognised excellent environmental performance. Have you checked that every public claim matches a measured or clearly labelled projected figure in this report?",
        "Od 27. září 2026 pravidla EU (směrnice 2024/825) zakazují vůči spotřebitelům obecná environmentální tvrzení typu „ekologické“ nebo „klimaticky neutrální“ bez doložení uznávaného vynikajícího environmentálního profilu. Ověřili jste, že každé veřejné tvrzení odpovídá měřenému nebo jasně označenému projektovanému číslu v této zprávě?"),
      [stepAns(1, F.segment, ["includes B2C", "zahrnuje B2C"])]);
  }
  if (types.includes("B2G")) {
    ask("C04", L("What do public buyers ask for?", "Co požadují veřejní zadavatelé?"),
      L("Have you considered which environmental criteria public tenders in your field use (e.g. green public procurement criteria) and whether your indicators match them? Expect long sales cycles, so plan the evidence early.",
        "Zvážili jste, jaká environmentální kritéria používají veřejné zakázky ve vašem oboru (např. kritéria zelených veřejných zakázek) a zda jim vaše indikátory odpovídají? Počítejte s dlouhými prodejními cykly a plánujte důkazy včas."),
      [stepAns(1, F.segment, ["includes B2G", "zahrnuje B2G"])]);
  }
  if (enabling && actor && buyer && !sameRole(actor, buyer)) {
    ask("C05", L("Is your evidence about the right people?", "Týkají se vaše důkazy správných lidí?"),
      L(`The buyer (${short(buyer)}) is not the one whose behaviour must change (${short(actor)}). Have you considered how you will show that those people actually change what they do? A signed contract or a sold licence is evidence of purchase, not of behaviour change.`,
        `Kupující (${short(buyer)}) není ten, kdo musí změnit chování (${short(actor)}). Zvážili jste, jak ukážete, že tito lidé skutečně mění, co dělají? Podepsaná smlouva nebo prodaná licence dokládá nákup, ne změnu chování.`),
      [stepAns(1, F.buyer, same(short(buyer))), stepAns(1, F.actor, same(short(actor)))]);
  } else if (user && buyer && !sameRole(user, buyer)) {
    ask("C06", L("Do the users actually use it?", "Používají to uživatelé opravdu?"),
      L(`The buyer (${short(buyer)}) and the day-to-day users (${short(user)}) are different. Have you considered tracking active use, not only sales? Products bought by one person and ignored by another produce no impact.`,
        `Kupující (${short(buyer)}) a každodenní uživatelé (${short(user)}) jsou různí lidé. Zvážili jste sledování aktivního používání, nejen prodejů? Produkt, který jeden koupí a druhý ignoruje, žádný dopad nemá.`),
      [stepAns(1, F.buyer, same(short(buyer))), stepAns(1, F.user, same(short(user)))]);
  } else if (enabling && !actor) {
    ask("C07", L("Who has to change their behaviour?", "Kdo musí změnit chování?"),
      L("Have you considered who actually has to do something differently: the person who buys the product, or someone else (an employee, a tenant, an end user)? If they differ, your adoption evidence has to come from them, not from the sale.",
        "Zvážili jste, kdo musí ve skutečnosti něco dělat jinak: ten, kdo produkt kupuje, nebo někdo jiný (zaměstnanec, nájemník, koncový uživatel)? Pokud je to někdo jiný, důkazy o přijetí musí pocházet od něj, ne z prodeje."),
      [stepAns(1, F.actor, EMPTY)]);
  }
  if (revenue.includes("subscription") || revenue.includes("hardware_sub")) {
    ask("C08", L("Does churn also cut your impact?", "Snižuje odchod zákazníků i váš dopad?"),
      L("With a subscription, a customer who cancels stops producing impact. Have you considered reporting active, retained customers rather than total sign-ups? Your retention figure then doubles as adoption evidence.",
        "U předplatného zákazník, který zruší předplatné, přestává vytvářet dopad. Zvážili jste vykazování aktivních, udržených zákazníků místo celkového počtu registrací? Míra udržení pak zároveň slouží jako důkaz přijetí."),
      [stepAns(1, F.revenue, ["subscription", "předplatné"])]);
  }
  if (revenue.includes("sale")) {
    ask("C09", L("What happens after the sale?", "Co se děje po prodeji?"),
      L("With a one-off sale you lose sight of how the product is used. Have you considered how you will get usage data afterwards (a data-sharing clause, service visits, a connected device, a follow-up survey)?",
        "Při jednorázovém prodeji ztrácíte přehled o tom, jak se produkt používá. Zvážili jste, jak budete data o používání získávat i potom (doložka o sdílení dat, servisní návštěvy, připojené zařízení, navazující dotazník)?"),
      [stepAns(1, F.revenue, ["one-off sale", "jednorázový prodej"])]);
  }
  if (revenue.includes("licence")) {
    ask("C10", L("Can you see how licensees deploy it?", "Vidíte, jak to nasazují držitelé licence?"),
      L("With licensing, the impact happens at the licensee. Have you considered a contract clause that gives you access to deployment and usage data?",
        "Při licencování vzniká dopad u držitele licence. Zvážili jste smluvní ustanovení, které vám dá přístup k datům o nasazení a používání?"),
      [stepAns(1, F.revenue, ["licensing", "licencování"])]);
  }
  if (revenue.includes("usage")) {
    ask("C11", L("Is your billing data also impact data?", "Jsou vaše fakturační data zároveň daty o dopadu?"),
      L("With pay-per-use, every billed use is recorded. Have you considered using those records directly as measured adoption evidence?",
        "Při platbě za použití je každé vyfakturované použití zaznamenané. Zvážili jste využít tyto záznamy přímo jako měřený důkaz přijetí?"),
      [stepAns(1, F.revenue, ["pay per use", "platba za použití"])]);
  }
  if (enabling && drivers.includes("cost")) {
    ask("C12", L("Can one dataset show both savings?", "Ukáže jedna sada dat obě úspory?"),
      L("Your customers save money through the same mechanism that saves the environment. Have you considered tracking both from the same data (e.g. the water bill and the m³ saved)? It makes the environmental claim far harder to dispute.",
        "Vaši zákazníci šetří peníze stejným mechanismem, který šetří životní prostředí. Zvážili jste sledovat obojí ze stejných dat (např. účet za vodu a ušetřené m³)? Environmentální tvrzení je pak mnohem hůř zpochybnitelné."),
      [stepAns(1, F.mechanism, ["Enabling", "Umožňující"]), stepAns(1, F.whyBuy, ["it saves them money", "šetří jim to peníze"])]);
  }
  if ((enabling || state.orientation === "Secondary") && !/rebound|odraz/.test(allText)) {
    ask("C13", L("What about rebound effects?", "Co rebound efekty?"),
      L("Have you considered whether efficiency gains could lead customers to use more (more hectares irrigated, more trips made)? Naming the risk yourself is more credible than having a reviewer raise it.",
        "Zvážili jste, zda by vyšší efektivita nemohla vést zákazníky k vyšší spotřebě (více zavlažovaných hektarů, více jízd)? Když riziko pojmenujete sami, je to věrohodnější, než když na něj upozorní hodnotitel."),
      [stepAns(1, ["Impact mechanism / orientation", "Mechanismus / orientace dopadu"], [`${state.mechanism} / ${state.orientation}`, `${tr(state.mechanism)} / ${tr(state.orientation)}`]),
        L("Steps 2–4 · the word “rebound” does not appear", "Kroky 2–4 · slovo „rebound“ se v nich nevyskytuje")]);
  }
  if (direct && !/end.of.life|recycl|disposal|compost|konec život|konci život|recykl|likvidac|kompost/.test(allText)) {
    ask("C14", L("What happens at end of life?", "Co se děje na konci životnosti?"),
      L("Have you considered the whole life cycle, not only the use phase? Production and end-of-life are often where most of the footprint sits; a screening LCA can show you where.",
        "Zvážili jste celý životní cyklus, nejen fázi užívání? Výroba a konec životnosti bývají místem, kde leží většina stopy; orientační LCA vám ukáže kde."),
      [stepAns(1, F.mechanism, ["Direct", "Přímý"]), L("Steps 2–4 · no mention of end of life, recycling or disposal", "Kroky 2–4 · bez zmínky o konci životnosti, recyklaci nebo likvidaci")]);
  }
  if (state.orientation === "Secondary") {
    ask("C15", L("Do you know your own footprint?", "Znáte svou vlastní stopu?"),
      L("As a commercially driven startup, your operational footprint may matter as much as the product's effect. Have you tried the quick Scope 1 + 2 estimator in step 3?",
        "U komerčně zaměřeného startupu může vaše provozní stopa vážit stejně jako účinek produktu. Vyzkoušeli jste rychlý odhad Scope 1 + 2 v kroku 3?"),
      [stepAns(1, F.orientation, ["Secondary", "Sekundární"])]);
  }
  if (state.stage === "Early commercialization" || state.stage === "Growth") {
    ask("C16", L("Is it time for external verification?", "Je čas na externí ověření?"),
      L("Have you considered an independent check (e.g. an LCA or a third-party review of your main claim) before the next funding round or a large customer contract?",
        "Zvážili jste nezávislou kontrolu (např. LCA nebo posouzení hlavního tvrzení třetí stranou) před dalším investičním kolem nebo velkou zakázkou?"),
      [stepAns(1, F.stage, [state.stage, tr(state.stage)])]);
  }
  const projectedN = Object.values(unc).filter(u => u.level === "Projected").length;
  if (projectedN && projectedN >= Object.keys(unc).length / 2) {
    ask("C17", L("How will investors read this?", "Jak to budou číst investoři?"),
      L("Most of your claims are projected. Investors usually discount those heavily. Have you considered which single claim you most want measured by your next funding conversation?",
        "Většina vašich tvrzení je projektovaná. Investoři je obvykle výrazně zlevňují. Zvážili jste, které jedno tvrzení nejvíc chcete mít změřené do příštího jednání o investici?"),
      [stepAns(4, ["Projected claims", "Projektovaná tvrzení"], [`${projectedN} of ${Object.keys(unc).length}`, `${projectedN} z ${Object.keys(unc).length}`])]);
  }

  const strengths = actions.filter(a => a.type === "strength");
  const gaps = actions.filter(a => a.type !== "strength");
  return { actions: gaps.slice(0, SCORING.MAX_ACTIONS), more: Math.max(0, gaps.length - SCORING.MAX_ACTIONS),
    hidden: gaps.slice(SCORING.MAX_ACTIONS), strengths,
    consider: consider.slice(0, SCORING.MAX_CONSIDER), fired: [...fired] };
};
