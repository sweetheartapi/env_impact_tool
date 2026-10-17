/*
 * i18n.js: English / Czech for the whole tool. Loaded first (not deferred),
 * so the page language is known before anything renders.
 *
 *   L(en, cs)  pick the string for the current language (prose, labels)
 *   tr(value)  display form of a STORED value: stage names, pathway steps,
 *              indicator names, evidence levels... Saved data always keeps
 *              the English value, so save files are language-independent
 *              and switching language never changes what was entered.
 *
 * The language is chosen by the ENG / CZ switch and kept in localStorage;
 * a first visit from a Czech or Slovak browser starts in Czech. Switching
 * reloads the page (progress is saved continuously, so nothing is lost).
 */

const I18N = (function () {
  const KEY = "eia-lang";
  let lang = "en";
  try {
    const forced = typeof globalThis !== "undefined" && globalThis.EIA_LANG;   // tests
    let saved = null;
    try { saved = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null; } catch (e) { /* storage blocked */ }
    if (forced) lang = forced;
    else if (saved) lang = saved;
    else if (typeof navigator !== "undefined" && /^(cs|sk)\b/i.test(navigator.language || "")) lang = "cs";
  } catch (e) { /* keep English */ }
  if (lang !== "cs") lang = "en";
  if (typeof document !== "undefined" && document.documentElement) document.documentElement.lang = lang;

  function set(next) {
    if (next !== "cs") next = "en";
    try { localStorage.setItem(KEY, next); } catch (e) { /* storage blocked: the switch then only lasts this page */ }
  }

  return { lang, set, KEY };
})();

const L = (en, cs) => (I18N.lang === "cs" && cs != null ? cs : en);

// ---------------------------------------------------------------------------
// Vocabulary: English stored value -> Czech display text.
// ---------------------------------------------------------------------------

I18N.VOCAB = {
  // development stages
  "Ideation": "Nápad",
  "Validation / MVP": "Ověřování / MVP",
  "Early commercialization": "Raná komercializace",
  "Growth": "Růst",

  // classification answers
  "Direct": "Přímý",
  "Enabling": "Umožňující",
  "Primary": "Primární",
  "Secondary": "Sekundární",

  // review milestones
  "Product launch": "Uvedení produktu na trh",
  "First significant commercial scale": "První významné komerční měřítko",
  "New funding round": "Nové investiční kolo",
  "Major regulatory change": "Zásadní změna regulace",
  "Annual review": "Roční revize",
  "Other (specify in notes)": "Jiné (upřesněte v poznámkách)",

  // pathway tracks
  "Product life cycle": "Životní cyklus produktu",
  "Adoption chain": "Řetězec přijetí",
  "Track A: Operational footprint": "Linie A: Provozní stopa",
  "Track B: Product/service externalities": "Linie B: Externality produktu/služby",

  // pathway stages ("Head: title"; the diagram splits at the colon)
  "Activities: product design & development": "Aktivity: návrh a vývoj produktu",
  "Outputs: production": "Výstupy: výroba",
  "Outcomes: use phase": "Výsledky: fáze užívání",
  "Impact: full life-cycle environmental effect": "Dopad: environmentální efekt za celý životní cyklus",
  "Activities: product features / service delivered": "Aktivity: funkce produktu / poskytovaná služba",
  "Outputs: customer adoption": "Výstupy: přijetí zákazníky",
  "Outcomes: customer behavior change": "Výsledky: změna chování zákazníků",
  "Impact: avoided environmental harm": "Dopad: odvrácená environmentální škoda",
  "Activities: operations": "Aktivity: provoz",
  "Outputs: resource use & emissions": "Výstupy: spotřeba zdrojů a emise",
  "Impact: direct environmental effect": "Dopad: přímý environmentální efekt",
  "Activities: product or service in the market": "Aktivity: produkt nebo služba na trhu",
  "Outcomes: induced changes": "Výsledky: vyvolané změny",
  "Impact: net externality": "Dopad: čistá externalita",

  // evidence strength (step 2)
  "Not rated": "Nehodnoceno",
  "Weak (assumption only)": "Slabé (jen předpoklad)",
  "Moderate (some evidence)": "Střední (částečné důkazy)",
  "Strong (validated / observed)": "Silné (ověřeno / pozorováno)",

  // feasibility / relevance
  "Low": "Nízká",
  "Medium": "Střední",
  "High": "Vysoká",

  // confidence levels (step 4)
  "Measured": "Měřené",
  "Modelled": "Modelované",
  "Projected": "Projektované",

  // indicator buckets
  "Core set": "Klíčová sada",
  "Aspirational (future indicator)": "Aspirační (budoucí ukazatel)",
  "Supplementary": "Doplňkové",
  "Optional": "Volitelné",
  "Excluded (low relevance)": "Vyřazené (nízká relevance)",

  // measurement frequency
  "Monthly": "Měsíčně",
  "Quarterly": "Čtvrtletně",
  "Annually": "Ročně",
  "Per milestone": "Při každém milníku",

  // indicator categories
  "Resource & Energy Input": "Vstupy zdrojů a energie",
  "Emissions & Waste Output": "Emise a odpady",
  "Product-Level Performance & Avoided Impact": "Výkon produktu a odvrácený dopad",
  "Materials & Circularity": "Materiály a cirkularita",
  "Strategic & Governance": "Strategie a řízení",
  "Systemic & Enabling Contribution": "Systémový a umožňující přínos",

  // indicators
  "Total energy use over a defined period": "Celková spotřeba energie za určené období",
  "Energy intensity per unit of output": "Energetická náročnost na jednotku výstupu",
  "Share of renewable energy in total consumption": "Podíl obnovitelné energie na celkové spotřebě",
  "Water consumption": "Spotřeba vody",
  "Scope 1 direct GHG emissions (fuel combustion, company vehicles)": "Přímé emise skleníkových plynů Scope 1 (spalování paliv, firemní vozidla)",
  "Scope 2 indirect emissions (purchased electricity & heat)": "Nepřímé emise Scope 2 (nakoupená elektřina a teplo)",
  "Scope 3 value-chain emissions (screening level)": "Emise hodnotového řetězce Scope 3 (orientačně)",
  "Total waste generated": "Celkové množství vyprodukovaného odpadu",
  "Proportion of waste recycled": "Podíl recyklovaného odpadu",
  "Real-world environmental outcome per participating customer (measured against their own baseline)": "Skutečný environmentální výsledek na zapojeného zákazníka (měřeno vůči jeho vlastnímu výchozímu stavu)",
  "Avoided emissions vs. conventional reference technology": "Odvrácené emise oproti konvenční referenční technologii",
  "Avoided physical harm per unit of adoption (domain-specific)": "Odvrácená fyzická škoda na jednotku přijetí (oborově specifické)",
  "GHG emissions per functional unit (simplified / screening LCA)": "Emise skleníkových plynů na funkční jednotku (zjednodušené / orientační LCA)",
  "Units produced, sold or installed (e.g. sensors manufactured)": "Vyrobené, prodané nebo instalované kusy (např. vyrobené senzory)",
  "Share of recycled or biobased materials in products": "Podíl recyklovaných nebo biologických materiálů ve výrobcích",
  "Expected product lifetime vs. standard alternatives": "Očekávaná životnost produktu oproti běžným alternativám",
  "Proportion of components designed for reuse / repair / remanufacture": "Podíl komponent navržených k opětovnému použití / opravě / repasování",
  "Share of products actually returned, reused or recycled at end of life": "Podíl výrobků skutečně vrácených, znovu použitých nebo recyklovaných na konci životnosti",
  "Explicit environmental mission or quantified targets in place": "Výslovná environmentální mise nebo kvantifikované cíle",
  "Assigned responsibility for sustainability within the team": "Určená odpovědnost za udržitelnost v týmu",
  "Environmental criteria formally integrated into product development or partner selection": "Environmentální kritéria formálně zahrnutá do vývoje produktu nebo výběru partnerů",
  "Active use rate: share of customers using the solution as intended": "Míra aktivního používání: podíl zákazníků, kteří řešení používají tak, jak je zamýšleno",
  "Customer retention (share still using the solution after 6–12 months)": "Udržení zákazníků (podíl těch, kdo řešení používají i po 6–12 měsících)",
  "Number / type of customers or partners using the solution for environmental purposes": "Počet / typ zákazníků nebo partnerů, kteří řešení využívají k environmentálním účelům",
  "Adoption rate of the solution": "Míra přijetí řešení",
  "Quality / reliability of adoption evidence": "Kvalita / spolehlivost důkazů o přijetí",
  "Alignment with specific transition pathways or policy targets": "Soulad s konkrétními transformačními cestami nebo politickými cíli",

  // typical data sources
  "Utility invoices, production records": "Faktury za energie, výrobní záznamy",
  "Utility invoices + production volumes": "Faktury za energie + objemy výroby",
  "Utility invoices / supplier data": "Faktury za energie / údaje dodavatele",
  "Utility invoices": "Faktury za energie a vodu",
  "Fuel records": "Záznamy o palivu",
  "Utility invoices × emission factors": "Faktury za energie × emisní faktory",
  "Spend data × generic factors; supplier data": "Údaje o výdajích × obecné faktory; údaje dodavatelů",
  "Internal operational records": "Interní provozní záznamy",
  "Customer meter / usage data before and after adoption": "Data z měřidel / o používání u zákazníka před zavedením a po něm",
  "Scenario-based calculation, contribution analysis": "Výpočet podle scénářů, analýza příspěvku",
  "Operational data + contribution analysis": "Provozní data + analýza příspěvku",
  "Design docs, bill of materials, LCA databases": "Projektová dokumentace, kusovník, databáze LCA",
  "Production and sales records": "Výrobní a prodejní záznamy",
  "Bill of materials, supplier data": "Kusovník, údaje dodavatelů",
  "Product specifications, testing": "Specifikace produktu, testování",
  "Design documentation": "Projektová dokumentace",
  "Take-back records, partner data": "Záznamy o zpětném odběru, údaje partnerů",
  "Internal documents (self-assessment)": "Interní dokumenty (sebehodnocení)",
  "Self-assessment": "Sebehodnocení",
  "Self-assessment, process documentation": "Sebehodnocení, dokumentace procesů",
  "Product analytics, usage logs": "Produktová analytika, záznamy o používání",
  "CRM / subscription data": "CRM / data o předplatném",
  "CRM / sales data": "CRM / prodejní data",
  "Product analytics, sales data": "Produktová analytika, prodejní data",
  "Product analytics, user studies": "Produktová analytika, uživatelské studie",
  "Strategy documents (self-assessment)": "Strategické dokumenty (sebehodnocení)",
  "Custom indicator": "Vlastní indikátor",

  // typical units
  "kWh / period": "kWh / období",
  "kWh / unit": "kWh / jednotka",
  "m³ / period": "m³ / období",
  "t CO₂e / yr": "t CO₂e / rok",
  "kg / period": "kg / období",
  "domain-specific (e.g. m³ water saved per farm / season)": "oborově specifické (např. m³ ušetřené vody na farmu / sezónu)",
  "t CO₂e avoided / yr": "t CO₂e odvráceno / rok",
  "domain-specific (e.g. kg pesticide avoided / ha)": "oborově specifické (např. kg odvrácených pesticidů / ha)",
  "kg CO₂e / functional unit": "kg CO₂e / funkční jednotka",
  "count / period": "počet / období",
  "years (vs. baseline)": "roky (oproti výchozímu stavu)",
  "yes/no + description": "ano/ne + popis",
  "yes/no + role": "ano/ne + role",
  "% of customers active per period": "% zákazníků aktivních za období",
  "count + segmentation": "počet + segmentace",
  "% of target market or growth rate": "% cílového trhu nebo tempo růstu",
  "qualitative rating + evidence description": "kvalitativní hodnocení + popis důkazů",
  "qualitative + referenced target": "kvalitativně + odkaz na cíl",

  // Scope 1+2 estimator inputs
  "Grid electricity (kWh)": "Elektřina ze sítě (kWh)",
  "Natural gas (kWh)": "Zemní plyn (kWh)",
  "Diesel (litres)": "Nafta (litry)",
  "Petrol (litres)": "Benzín (litry)",
  "District heating (kWh)": "Dálkové vytápění (kWh)",
};

// Display form of a stored value. Handles "track → stage" links and the
// hybrid "Secondary track (light-touch): …" track name; anything unknown
// (e.g. text the user typed) is returned unchanged.
const tr = s => {
  if (I18N.lang !== "cs" || s == null) return s;
  const v = String(s);
  if (Object.prototype.hasOwnProperty.call(I18N.VOCAB, v)) return I18N.VOCAB[v];
  if (v.includes(" → ")) return v.split(" → ").map(tr).join(" → ");
  const SEC = "Secondary track (light-touch): ";
  if (v.startsWith(SEC)) return "Sekundární linie (zjednodušeně): " + tr(v.slice(SEC.length));
  return v;
};

// Czech plural: one / few (2–4) / many.
I18N.plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
