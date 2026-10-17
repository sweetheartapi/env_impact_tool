/*
 * framework.js: reference data and scoring rules for the four-module
 * environmental impact assessment framework, from the thesis "A Proposed
 * Framework for Environmental Impact Assessment in Early-Stage Startups".
 *
 * A direct port of framework/reference.py and framework/scoring.py. Edit
 * this file to refine wording, add indicators, or change a rule; the UI
 * picks it up automatically.
 */

const REF = {};

// ---------------------------------------------------------------------------
// Module 1: Startup typology (2x2: impact mechanism x value orientation)
// ---------------------------------------------------------------------------

REF.CLASSIFICATION_MATRIX = {
  "Direct|Primary": {
    label: "Directly Environmental Startup (Core Cleantech)",
    blurb: "The core product or service is explicitly designed to deliver immediate environmental improvements. Direct environmental impact is central to the value proposition.",
    unit_of_analysis: "The product / service itself (full life cycle)",
    pathway_template: "lifecycle",
  },
  "Enabling|Primary": {
    label: "Enabling Startup",
    blurb: "The startup is not itself environmental technology, but allows other actors to reduce their environmental impact. The benefit depends on adoption and behavior change by customers or partners.",
    unit_of_analysis: "The adoption pathway",
    pathway_template: "adoption",
  },
  "Direct|Secondary": {
    label: "General-Purpose Startup (direct footprint focus)",
    blurb: "The technology or business model is not intrinsically environmental; environmental effects are a secondary outcome of a primarily commercial offering. Assessment distinguishes the operational footprint from externalities of the product/service.",
    unit_of_analysis: "Operational footprint + product/service externalities (dual track)",
    pathway_template: "dual_track",
  },
  "Enabling|Secondary": {
    label: "Incidental Enabler (General-Purpose)",
    blurb: "Environmental effects arise as a by-product of commercial activity through enabling others, rather than as an explicit value proposition. Assessed via the operational footprint with light-touch screening of enabling effects.",
    unit_of_analysis: "Operational footprint + light-touch adoption screening (dual track)",
    pathway_template: "dual_track",
  },
};

// Diagnostic questions used to *derive* the classification rather than
// asking users to self-label in abstract terms.
REF.DIAGNOSTIC_MECHANISM = {
  question: "If your product or service works exactly as intended, but none of your customers or partners change their behavior, does the environmental benefit still occur?",
  options: [
    ["Yes, the benefit is inherent in the product/service itself", "Direct"],
    ["No, the benefit only materializes if customers/partners adopt it and change what they do", "Enabling"],
  ],
};

REF.DIAGNOSTIC_ORIENTATION = {
  question: "Imagine removing every environmental claim from your pitch. Would the core commercial case for your product still stand on its own?",
  options: [
    ["No, environmental improvement IS the value proposition", "Primary"],
    ["Yes, the offering is primarily commercial; environmental benefit is a secondary outcome", "Secondary"],
  ],
};

// ---------------------------------------------------------------------------
// Customer profile (added after the SIC expert consultation, Oct 2026):
// who buys the product and why. The impact claim has to survive contact
// with a paying customer, and the next steps depend on who that is.
// ---------------------------------------------------------------------------

REF.CUSTOMER_TYPES = [
  ["B2B", "Businesses (B2B)"],
  ["B2C", "Consumers (B2C)"],
  ["B2G", "Public sector (B2G)"],
];

// Revenue model: how the startup earns money. Not the same thing as the
// customer segment (a B2G startup can sell licences or subscriptions).
REF.REVENUE_MODELS = [
  ["subscription", "Subscription (e.g. SaaS, monthly or annual fee)"],
  ["hardware_sub", "Device or equipment plus a subscription"],
  ["sale", "One-off sale of a product, device or equipment"],
  ["licence", "Licensing (others use your technology or IP)"],
  ["usage", "Pay per use or per transaction"],
  ["service", "Project, service or consulting fees"],
  ["commission", "Commission or marketplace fee"],
  ["other", "Other / not decided yet"],
];

// Why a customer would pay, and whether the environmental benefit is part
// of that reason. Multi-select.
REF.VALUE_DRIVERS = [
  ["cost", "It saves the customer money (lower energy, water, material or input costs)"],
  ["compliance", "It helps them meet a regulation, permit or reporting duty"],
  ["reporting", "It gives them data for their own sustainability / ESG reporting or supplier requests"],
  ["premium", "It lets them charge more or win buyers who value sustainability"],
  ["performance", "It does the job better, faster or more reliably (environment aside)"],
  ["none", "There is no direct financial benefit to the customer yet"],
];

REF.customerTypeLabel = function (types) {
  const t = (types || []).filter(x => REF.CUSTOMER_TYPES.some(([k]) => k === x));
  if (!t.length) return "";
  return t.length > 1 ? `Mixed (${t.join(" + ")})` : t[0];
};

// ---------------------------------------------------------------------------
// Development stages and stage-dependent module emphasis (thesis Figure 11)
// ---------------------------------------------------------------------------

REF.STAGES = ["Ideation", "Validation / MVP", "Early commercialization", "Growth"];

REF.STAGE_SHORT = {
  "Ideation": "You are exploring an idea. Nothing is built or sold yet.",
  "Validation / MVP": "You are testing a first version (MVP) with early users or pilot customers.",
  "Early commercialization": "You have your first paying customers and initial operational data.",
  "Growth": "You are scaling up, with growing scrutiny from investors and regulators.",
};

REF.STAGE_GUIDANCE = {
  "Ideation": {
    priority_modules: [1, 2],
    note: "At ideation, Modules 1 and 2 are the priority: getting the impact logic right matters more than populating metrics that do not yet have data behind them. Keep Module 3 to a shortlist of intended indicators; treat most claims as projected.",
  },
  "Validation / MVP": {
    priority_modules: [1, 2, 3],
    note: "Refine the impact pathway with first evidence from pilots. Begin populating the most feasible indicators; expect most claims to be modelled or projected.",
  },
  "Early commercialization": {
    priority_modules: [3],
    note: "Module 3 becomes the central activity as first operational data becomes available. Move indicators from modelled toward measured where data systems allow.",
  },
  "Growth": {
    priority_modules: [3, 4],
    note: "Module 4 gains importance as the startup faces greater scrutiny from investors, corporate customers, and regulators. Uncertainty labeling and honest communication become critical.",
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
// ---------------------------------------------------------------------------

REF.PATHWAY_TEMPLATES = {
  lifecycle: {
    name: "Product life-cycle pathway (directly environmental startups)",
    description: "The impact pathway covers the complete product life cycle. Make explicit what happens at each phase and which assumptions link the phases to the claimed environmental improvement.",
    tracks: [{
      track: "Product life cycle",
      stages: [
        ["Activities: product design & development", "What design choices create the environmental improvement?"],
        ["Outputs: production", "What is produced, from what materials, with what process?"],
        ["Outcomes: use phase", "What happens when the product is used? What does it replace?", "adoption"],
        ["Impact: full life-cycle environmental effect", "What is the net environmental effect across the life cycle, incl. end-of-life?"],
      ],
    }],
  },
  adoption: {
    name: "Adoption-dependent pathway (enabling startups)",
    description: "The impact runs through customer adoption and behavior change. The links between adoption, behavior, and avoided harm carry the key assumptions, typically the weakest part of the chain and the point where contribution analysis is most needed.",
    tracks: [{
      track: "Adoption chain",
      stages: [
        ["Activities: product features / service delivered", "What exactly does the product enable users to do differently?"],
        ["Outputs: customer adoption", "Who adopts it, at what rate, and how is adoption evidenced?", "adoption"],
        ["Outcomes: customer behavior change", "What behavior actually changes? How do you know users follow through?", "behaviour"],
        ["Impact: avoided environmental harm", "What environmental harm is avoided per unit of changed behavior, relative to what baseline?"],
      ],
    }],
  },
  dual_track: {
    name: "Dual-track pathway (general-purpose startups)",
    description: "General-purpose ventures are assessed on two tracks: their own operational footprint, and the externalities (positive or negative) generated through the product or service.",
    tracks: [
      {
        track: "Track A: Operational footprint",
        stages: [
          ["Activities: operations", "Offices, cloud/compute, logistics, travel, production: what drives your footprint?"],
          ["Outputs: resource use & emissions", "Energy, materials, waste, Scope 1 & 2 emissions."],
          ["Impact: direct environmental effect", "Net direct effect of running the company."],
        ],
      },
      {
        track: "Track B: Product/service externalities",
        stages: [
          ["Activities: product or service in the market", "What does deployment of your product cause in the world?", "adoption"],
          ["Outcomes: induced changes", "Positive or negative environmental changes induced in customers or systems (incl. rebound effects).", "behaviour"],
          ["Impact: net externality", "Net environmental externality of the product/service at current scale."],
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
  ["none", "No: this is within our control"],
  ["adoption", "Yes: customers must buy or adopt it"],
  ["behaviour", "Yes: customers or users must change behaviour"],
];
REF.DEPENDENCE_SHORT = { adoption: "Adoption needed", behaviour: "Behaviour change needed" };

REF.EVIDENCE = ["Not rated", "Weak (assumption only)", "Moderate (some evidence)", "Strong (validated / observed)"];

// ---------------------------------------------------------------------------
// Module 3: Indicator bank (thesis Chapter 6, six categories)
// Each entry: [indicator, typical data source, typical unit, citation key, kind]
// (citation null = added after the thesis, Oct 2026)
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
  outcome: { label: "Real-world outcome", short: "Real-world outcome", real: true,
    help: "Measures a change that actually happened at customers or in the environment." },
  adoption: { label: "Adoption & use", short: "Adoption & use", real: true,
    help: "Measures whether customers take the product up and actually use it." },
  technology: { label: "Technology / product only", short: "Technology only", real: false,
    help: "Measures what the product is or can do, or how many were made. Useful, but not proof of impact on its own." },
  operations: { label: "Own operations", short: "Own operations", real: false,
    help: "Measures the startup's own footprint (energy, emissions, waste)." },
  governance: { label: "Strategy & governance", short: "Governance", real: false,
    help: "Measures commitments and processes inside the startup." },
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
// Module 4: Evidential confidence levels
// ---------------------------------------------------------------------------

REF.CONFIDENCE_LEVELS = {
  Measured: "Supported by startup-held operational data directly linked to the impact indicator. Can be reported as evidence.",
  Modelled: "Derived from industry averages, supplier data, or simplified lifecycle calculations that introduce additional assumptions. Report with the assumptions stated.",
  Projected: "Relies on adoption scenarios and theory-of-change reasoning about future or indirect impacts. Legitimate, but belongs in the impact pathway narrative, not in the evidence base.",
};

// Evidence quality: a second dimension, separate from the confidence level.
// The level says where a number comes from (measured, modelled, projected);
// quality says how far it can be trusted. A self-reported survey of 22
// farmers is "measured" data of low quality. (Added Oct 2026.)
REF.EVIDENCE_QUALITY = [
  ["", "Not assessed yet"],
  ["low", "Low: anecdotal, self-reported, or a very small sample"],
  ["medium", "Medium: real data, but a limited sample, short period or no comparison group"],
  ["high", "High: systematic, representative data that someone else could check"],
];
REF.QUALITY_SHORT = { "": "Not assessed", low: "Low", medium: "Medium", high: "High" };

// ---------------------------------------------------------------------------
// Quick Scope 1 & 2 estimator: generic, screening-level emission factors
// (order of magnitude consistent with DEFRA / EEA published factors).
// Results are MODELLED claims.
// ---------------------------------------------------------------------------

REF.EMISSION_FACTORS = {
  "Grid electricity (kWh)": { factor: 0.25, unit_note: "kg CO₂e/kWh, EU-average order of magnitude; replace with your national grid factor", scope: 2 },
  "Natural gas (kWh)": { factor: 0.18, unit_note: "kg CO₂e/kWh", scope: 1 },
  "Diesel (litres)": { factor: 2.68, unit_note: "kg CO₂e/litre", scope: 1 },
  "Petrol (litres)": { factor: 2.31, unit_note: "kg CO₂e/litre", scope: 1 },
  "District heating (kWh)": { factor: 0.15, unit_note: "kg CO₂e/kWh, highly network-dependent", scope: 2 },
};

// ---------------------------------------------------------------------------
// References (keyed by citation key)
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

REF.METHODOLOGY_NOTE =
  "This assessment follows a four-module framework for environmental impact assessment in early-stage startups: " +
  "(1) startup profiling and type classification; (2) impact pathway mapping grounded in theory-of-change / " +
  "logic-model reasoning (Weiss 1995; Mayne 2008; W.K. Kellogg Foundation 2004; McLaughlin & Jordan 2015); " +
  "(3) indicator selection via two-dimensional feasibility–relevance scoring; and (4) uncertainty acknowledgement " +
  "using three levels of evidential confidence (measured, modelled, projected). The framework is governed by four " +
  "principles: proportionality, type-differentiation, transparency over precision, and design for updating rather " +
  "than completion. It is a screening-level instrument: it does not replace full LCA (ISO 14040/44), comprehensive " +
  "GHG Protocol reporting, or regulatory compliance assessment, and it does not produce a composite score.";

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
// it. Returns [{sev: "warning"|"info", msg}] for one labelled indicator.
// pathway (optional) lets the claim be checked against the step it evidences.
// ---------------------------------------------------------------------------

SCORING.HEDGE = /\b(could|can|may|might|expect(ed|s)?|project(ed|ion)?|potential(ly)?|up to|aim(s|ing)?|target(s|ed)?|estimat(e|ed|es)|would|will|scenario|forecast)\b/i;
SCORING.COMPARATIVE = /(\d+(\.\d+)?\s?%|\breduc|\bsav(e|es|ed|ing)\b|\bless\b|\blower\b|\bfewer\b|\bavoid|\bcut(s)?\b|\bdecreas|\bimprov)/i;

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
  const add = (sev, msg) => gaps.push({ sev, msg });

  if (claim && level === "Projected" && !SCORING.HEDGE.test(claim))
    add("warning", "The claim reads as if it is already happening, but it is labelled Projected. Word it as a possibility, e.g. “could reduce … by up to …”.");
  if (claim && level === "Modelled" && !/\b(estimat|model|calculat|approximately|about|around|roughly|~)/i.test(claim))
    add("info", "The claim is modelled; say so in the wording (e.g. “an estimated …”).");
  if (claim && SCORING.COMPARATIVE.test(claim) && !(u.baseline || "").trim())
    add("warning", "The claim compares (less, lower, saves, a %), but no baseline is stated. Compared with what?");
  if (level === "Measured" && q === "low")
    add("warning", "Labelled Measured, but the evidence quality is low (e.g. self-reported or a tiny sample). Report both, so nobody reads it as validated.");
  if ((level === "Measured" || level === "Modelled") && !(u.sources || "").trim())
    add("warning", `A ${level.toLowerCase()} claim needs its data source named.`);
  if (!q)
    add("info", "Evidence quality is not assessed yet.");
  const st = SCORING.pathwayStage(pathway, entry && entry.pathway_link);
  if (st && st.evidence === "Weak (assumption only)" && (level === "Measured" || q === "high"))
    add("info", `This indicator evidences “${st.stage}”, which step 2 still rates as weak. If this evidence now supports it, update the rating in step 2.`);
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

  // 1. Core set size (proportionality)
  if (core.length === 0) {
    checks.push(["warning", "No core indicators. Select at least one indicator that is highly relevant and at least moderately feasible."]);
  } else if (core.length > 5) {
    checks.push(["warning", `Core set contains ${core.length} indicators. The framework recommends no more than 3–5 at early stages (proportionality principle). Consider trimming.`]);
  } else {
    checks.push(["ok", `Core set size (${core.length}) is within the recommended 3–5 range.`]);
  }

  // 2. Vanity metrics: easy to measure but not material
  const vanity = Object.entries(selected).filter(([, e]) => e.feasibility === "High" && e.relevance === "Low").map(([n]) => n);
  if (vanity.length) {
    checks.push(["warning", "Possible vanity metrics selected (high feasibility, low relevance): " + vanity.join("; ") +
      ". Reporting metrics that are available rather than meaningful is a structural driver of greenwashing, and the framework excludes these."]);
  } else {
    checks.push(["ok", "No vanity metrics (high feasibility / low relevance) in the selection."]);
  }

  // 3. Evidence base composition
  if (core.length) {
    const lvl = n => (uncertainty[n] || {}).level;
    const unlabelled = core.filter(([n]) => !lvl(n)).map(([n]) => n);
    if (unlabelled.length)
      checks.push(["warning", "Core indicators without an evidential confidence label: " + unlabelled.join("; ")]);
    const projected = core.filter(([n]) => lvl(n) === "Projected").map(([n]) => n);
    const grounded = core.filter(([n]) => lvl(n) === "Measured" || lvl(n) === "Modelled");
    if (projected.length && !grounded.length) {
      checks.push(["warning", "All labelled core claims are Projected. Projected claims belong in the impact-pathway narrative, not in the evidence base. Consider whether any indicator can be grounded in operational data, or state clearly that the assessment is prospective."]);
    } else if (projected.length) {
      checks.push(["info", "Projected claims in the core set: " + projected.join("; ") + ". Report these in the narrative, clearly separated from measured/modelled evidence."]);
    }
  }

  // 3b. Real impact: does the core set measure adoption or outcomes, or
  // only the technology?
  if (core.length) {
    const kindOf = ([n, e]) => REF.indicatorKind(n, e);
    const outcomes = core.filter(x => kindOf(x) === "outcome");
    const adoption = core.filter(x => kindOf(x) === "adoption");
    if (!outcomes.length && !adoption.length) {
      checks.push(["warning", "No core indicator measures adoption or a real-world outcome. The core set describes the technology or the company, not whether customers use it or the environment benefits. Add one (e.g. irrigation saved per participating farm rather than sensors manufactured)."]);
    } else if (!outcomes.length) {
      checks.push(["info", "The core set measures adoption but no real-world outcome yet. Adoption shows the product is used; an outcome indicator shows that use changes something."]);
    } else {
      checks.push(["ok", "The core set includes at least one real-world outcome indicator."]);
    }
  }

  // 4. Materiality linkage: indicators should trace to the impact pathway
  const unlinked = core.filter(([, e]) => !e.pathway_link).map(([n]) => n);
  if (unlinked.length) {
    checks.push(["info", "Core indicators not linked to a pathway stage: " + unlinked.join("; ") +
      ". Linking each indicator to the step of the causal chain it evidences strengthens the materiality of the indicator set."]);
  } else if (core.length) {
    checks.push(["ok", "All core indicators are linked to an impact-pathway stage."]);
  }

  // 4b. Claim-evidence gaps (wording, baselines, sources, quality)
  const gw = SCORING.allClaimGaps(selected, uncertainty, pathway).filter(g => g.sev === "warning");
  if (gw.length) {
    const names = [...new Set(gw.map(g => g.name))];
    checks.push(["warning", `${gw.length} claim–evidence gap(s) in: ${names.join("; ")}. See the claim–evidence overview in section 4.`]);
  } else if (Object.keys(uncertainty || {}).length) {
    checks.push(["ok", "No claim–evidence gaps: wording, baselines and sources match the evidence labels."]);
  }

  // 5. Missing assumption documentation on non-measured claims
  const undocumented = Object.entries(uncertainty)
    .filter(([, u]) => (u.level === "Modelled" || u.level === "Projected") && !(u.assumptions || "").trim())
    .map(([n]) => n);
  if (undocumented.length) {
    checks.push(["warning", "Modelled/Projected claims without documented assumptions: " + undocumented.join("; ") +
      ". Transparency over precision: every non-measured claim must state its driving assumptions."]);
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

SCORING.PRIORITY_LABEL = { 3: "High", 2: "Medium", 1: "Low" };
SCORING.STAGE_LEAD = {
  "Ideation": "At ideation nothing is built or sold yet, so the priority is getting the impact logic and the customer right before collecting data.",
  "Validation / MVP": "At validation the open question is whether real customers adopt the product and use it as intended.",
  "Early commercialization": "In early commercialization the first paying customers produce real data, so claims are expected to move from modelled to measured.",
  "Growth": "At growth, investors, corporate customers and regulators scrutinise claims, so evidence and careful wording matter most.",
};
SCORING.RELEVANCE_PHRASE = {
  3: "That makes this a priority now.",
  2: "Worth doing now, after the high-priority items.",
  1: "This can wait; note it for a later stage.",
};

// The complete rule set behind the recommendations, in plain language, so a
// reader can check which rules exist and which ones fired for a startup.
// [id, kind, title, condition]; kind: gap | strength | consider.
SCORING.RULES = [
  ["R01", "gap", "Name your customer", "Customer segment, revenue model or buyer is missing in step 1."],
  ["R02", "gap", "Name who has to change behaviour", "The impact mechanism is enabling, but nobody is named whose behaviour must change (step 1)."],
  ["R03", "gap", "Test the weakest link", "A pathway step is rated “Weak (assumption only)” (step 2); at most two, later steps first."],
  ["R04", "gap", "Validate customer adoption", "Pathway steps depend on customer adoption or behaviour change, and none of them has moderate or strong evidence (step 2)."],
  ["R05", "gap", "Mark the steps that depend on customers", "The mechanism is enabling, but no pathway step is marked as depending on customers (step 2)."],
  ["R06", "gap", "Complete the impact pathway", "One or more pathway steps have no description (step 2)."],
  ["R07", "gap", "Choose a core indicator", "No indicator is both highly relevant and at least moderately feasible (step 3)."],
  ["R08", "gap", "Record a baseline", "A core indicator has no current value (step 3)."],
  ["R09", "gap", "Measure the projected impact", "An outcome or adoption claim is labelled Projected and no real-world outcome claim is Measured (step 4)."],
  ["R10", "gap", "Turn one claim into a measured one", "No core claim is labelled Measured, and R09 does not apply (step 4)."],
  ["R11", "gap", "Measure real impact, not only the technology", "No core indicator measures adoption or a real-world outcome (step 3)."],
  ["R12", "gap", "Close the claim–evidence gaps", "At least one claim–evidence gap is flagged (step 4): a projection worded as fact, a comparison without baseline, low-quality measured data, missing sources, or a contradiction with step 2."],
  ["R13", "gap", "Plan your future indicators", "An indicator is highly relevant but low in feasibility (aspirational, step 3)."],
  ["R14", "gap", "Find out who gains and who would pay", "No reason for customers to buy is recorded, or only “no direct financial benefit yet” (step 1)."],
  ["R15", "gap", "Check a commercial assumption", "An impact–business alignment assumption is not validated (step 5); at most three, skipping those on a step R03 already covers."],
  ["R16", "gap", "Set the next review", "No review milestone is set (step 5)."],
  ["S01", "strength", "Prepare an evidence summary", "A claim is Measured, of high evidence quality, has sources and documented assumptions, and has no claim–evidence gap (step 4)."],
  ["C01", "consider", "Which customer comes first?", "More than one customer segment is selected."],
  ["C02", "consider", "Is your impact data a selling point?", "Customer segment includes B2B."],
  ["C03", "consider", "How will you word claims to consumers?", "Customer segment includes B2C."],
  ["C04", "consider", "What do public buyers ask for?", "Customer segment includes B2G."],
  ["C05", "consider", "Is your evidence about the right people?", "Enabling, and the person whose behaviour must change differs from the buyer."],
  ["C06", "consider", "Do the users actually use it?", "The user differs from the buyer (and C05 does not apply)."],
  ["C07", "consider", "Who has to change their behaviour?", "Enabling, and nobody is named whose behaviour must change."],
  ["C08", "consider", "Does churn also cut your impact?", "Revenue model includes a subscription."],
  ["C09", "consider", "What happens after the sale?", "Revenue model includes a one-off sale."],
  ["C10", "consider", "Can you see how licensees deploy it?", "Revenue model includes licensing."],
  ["C11", "consider", "Is your billing data also impact data?", "Revenue model includes pay per use."],
  ["C12", "consider", "Can one dataset show both savings?", "Enabling, and customers buy because it saves them money."],
  ["C13", "consider", "What about rebound effects?", "Enabling or secondary orientation, and rebound is not mentioned anywhere in steps 2–4."],
  ["C14", "consider", "What happens at end of life?", "Direct mechanism, and end of life, recycling or disposal is not mentioned in steps 2–4."],
  ["C15", "consider", "Do you know your own footprint?", "Value orientation is secondary."],
  ["C16", "consider", "Is it time for external verification?", "Stage is early commercialization or growth."],
  ["C17", "consider", "How will investors read this?", "At least half of the labelled claims are Projected."],
];

// ===========================================================================
// Impact-business alignment (added after the SIC consultation, Oct 2026).
// Not a commercial viability score and not business due diligence: it only
// names the commercial assumptions on which the environmental benefit, or
// the evidence for it, depends. Each assumption can be marked by the team
// (state.alignment[key] = {status: "unchecked" | "some" | "validated", note}).
// ===========================================================================

SCORING.ALIGN_STATUS = [
  ["unchecked", "Not checked yet"],
  ["some", "Some evidence"],
  ["validated", "Validated"],
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

  // the two values side by side
  const customerValue = (state.customer_value || "").trim() ||
    drivers.filter(d => d !== "none").map(driverLabel).join("; ") || "";
  const envValue = (impactStep && (impactStep.description || "").trim()) || "";

  // how the customer's reason to buy relates to the environmental benefit
  const linked = drivers.filter(d => d === "cost" || d === "compliance");
  const indirect = drivers.filter(d => d === "reporting" || d === "premium");
  let verdict, verdictText;
  if (!drivers.length || (drivers.length === 1 && drivers[0] === "none")) {
    verdict = "unclear";
    verdictText = "No commercial reason to buy is recorded in step 1, so it is unclear what would drive the adoption your impact depends on.";
  } else if (linked.length) {
    verdict = "aligned";
    verdictText = "The customer's reason to buy comes from the same change that produces the environmental benefit (" +
      linked.map(d => d === "cost" ? "it saves them money" : "it helps them comply").join(", ") +
      "). Commercial success and impact should move together, as long as the assumptions below hold.";
  } else if (indirect.length) {
    verdict = "partly";
    verdictText = "Customers pay for the environmental label or data rather than for the change itself. The benefit is only real if that data or label leads to an actual change, which is worth evidencing separately.";
  } else {
    verdict = "independent";
    verdictText = "Customers would buy for reasons unrelated to the environmental benefit (e.g. performance). The impact then depends on how the product is used, not on why it is bought, so sales alone say little about impact.";
  }

  const A = [];
  const add = (key, rel, title, text, why, test, step, basis) => {
    const m = marks[key] || {};
    A.push({ key, rel, title, text, why, test, step: step || "", basis: basis || [],
      status: SCORING.ALIGN_STATUS.some(([k]) => k === m.status) ? m.status : "unchecked", note: m.note || "",
      gap: `Assumption not yet checked: ${text.charAt(0).toLowerCase() + text.slice(1)}` });
  };

  if (custSteps.length || enabling) {
    add("value", [3, 3, 2, 2], "Check that customers find it worth paying for",
      `Customers find the product worth paying for${revLabel ? ` (${revLabel})` : ""}.`,
      "If customers do not buy it, the adoption step never happens and none of the environmental benefit follows.",
      "Interview pilot customers about what the problem costs them today and what they would pay. A paid pilot or a letter of intent is stronger evidence than stated interest.",
      adoptStep && adoptStep.stage, adoptStep ? [`Step 2 · ${adoptStep.stage}: marked “adoption needed”`] : ["Step 1 · Impact mechanism: Enabling"]);
  }
  if (behavStep || enabling) {
    add("use", [2, 3, 3, 2], "Check that use turns into behaviour change",
      "Using the product leads to an actual change in what customers or users do.",
      "Customers can pay and still carry on as before; the environmental benefit needs the change, not the sale.",
      "Track whether recommendations or features translate into behaviour change: usage logs combined with the data from the behaviour step.",
      behavStep && behavStep.stage, behavStep ? [`Step 2 · ${behavStep.stage}: marked “behaviour change needed”`] : ["Step 1 · Impact mechanism: Enabling"]);
  }
  if (linked.includes("cost")) {
    add("same_change", [2, 3, 3, 3], "Check that the saving and the impact come from the same change",
      "The change that saves the customer money is the same change that produces the environmental benefit, and it yields measurable net savings.",
      "If customers save money in another way (e.g. labour or time), the business can succeed while the environmental benefit stays small.",
      "Compare pilot usage against a clearly defined baseline, tracking the customer's saving and the environmental saving from the same data.",
      impactStep && impactStep.stage, ["Step 1 · Why customers buy: it saves them money"]);
    if (enabling) {
      add("rebound", [1, 2, 2, 3], "Check for rebound effects",
        "Lower costs do not lead customers to expand their use (e.g. irrigate more land with the water they save).",
        "Commercial success can then erode the net environmental benefit: the better the product sells, the more the rebound matters.",
        "Ask pilot customers what they do with the savings, and track the total, not only the per-unit, resource use.",
        impactStep && impactStep.stage, ["Step 1 · Why customers buy: it saves them money", "Step 1 · Impact mechanism: Enabling"]);
    }
  }
  if (revenue.includes("subscription") || revenue.includes("hardware_sub")) {
    add("retention", [1, 2, 3, 3], "Check that customers stay",
      "Customers keep paying and using the product beyond the first season or year.",
      "With a subscription, the impact stops when a customer cancels, so churn directly reduces the environmental benefit.",
      "Track retention of active customers per period and report impact only for customers who stay.", "", ["Step 1 · Revenue model: subscription"]);
  }
  const projectedAdoption = Object.entries(unc).some(([n, u]) => u.level === "Projected" &&
    ["adoption", "outcome"].includes(REF.indicatorKind(n, (state.selected_indicators || {})[n])));
  if (projectedAdoption) {
    add("scale", [1, 2, 3, 3], "Check the adoption your projection assumes",
      "Adoption grows to the level that your projected impact figures assume.",
      "A projected environmental figure is only as good as the sales forecast behind it.",
      "State the number of customers or hectares each projection assumes, and compare it with your actual sales pipeline.", "", ["Step 4 · an adoption or outcome claim is labelled Projected"]);
  }

  return {
    customer_value: customerValue, env_value: envValue,
    verdict, verdict_text: verdictText,
    assumptions: A,
    applies: A.length > 0,
  };
};
SCORING.MAX_CONSIDER = 6;

SCORING.nextSteps = function (state) {
  const actions = [], consider = [];
  const list = names => names.map(n => `“${n}”`).join(", ");

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
  const sameRole = (a, b) => !a || !b || /^(same|stejn|the buyer|buyer)\b/i.test(a) || norm(a) === norm(b);
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
  const stepAns = (st, label, val) => `Step ${st} · ${label}: ${val}`;
  const ev = s => s.evidence || "Not rated";

  // R01 customer profile missing
  if (!types.length || !buyer || !revenue.length) {
    const miss = [], tr = [];
    if (!types.length) { miss.push("the customer segment (B2B, B2C, B2G or a mix)"); tr.push(stepAns(1, "Customer segment", "not answered")); }
    if (!revenue.length) { miss.push("the revenue model"); tr.push(stepAns(1, "Revenue model", "not answered")); }
    if (!buyer) { miss.push("who the buyer is"); tr.push(stepAns(1, "Buyer", "empty")); }
    rec("R01", [3, 3, 2, 2], "Name your customer",
      `Step 1 does not yet say ${miss.join(", ")}.`,
      "Impact only happens if someone pays for and uses the solution; without a named customer, nobody can judge whether the adoption your impact depends on is realistic.",
      `Fill in ${miss.join(", ")} in step 1.`, tr);
  }
  // R02 behaviour actor missing
  if (enabling && !actor) {
    rec("R02", [3, 3, 2, 2], "Name who has to change behaviour",
      "Impact relies on someone changing behaviour, but nobody is named.",
      "Your evidence may then cover the wrong people: a signed contract shows a purchase, not a change in behaviour.",
      "Say in step 1 whose behaviour must change: the buyer, the day-to-day user, or someone else.",
      [stepAns(1, "Impact mechanism", state.mechanism + (state.is_hybrid ? " (hybrid)" : "")), stepAns(1, "Whose behaviour must change", "empty")]);
  }
  // R14 business benefit unclear
  if (!drivers.length || (drivers.length === 1 && drivers[0] === "none")) {
    rec("R14", [3, 3, 3, 2], "Find out who gains and who would pay",
      "No plausible customer benefit or payment rationale has been identified.",
      "A solution may have environmental potential without a viable route to adoption, and then the benefit never materialises.",
      "Investigate who receives financial or operational value from the product and who is willing to pay for it: a few customer interviews about what the problem costs them today.",
      [stepAns(1, "Why customers buy", drivers.length ? "“no direct financial benefit yet”" : "not answered")]);
  }

  // R03 weakest links (later links in the chain first)
  const rank = s => /impact/i.test(s.stage) ? 0 : /outcome/i.test(s.stage) ? 1 : /output/i.test(s.stage) ? 2 : 3;
  const weak = stagesFlat.filter(s => s.evidence === "Weak (assumption only)").sort((x, y) => rank(x) - rank(y));
  weak.slice(0, 2).forEach((s, k) => {
    let action = "Design one small, cheap test that would confirm or refute it before you build further claims on it.";
    if (enabling && /outcome|behav/i.test(s.stage)) action += " For an adoption-driven pathway, compare usage logs or meter readings for a few pilot customers before and after they adopt.";
    else if (/impact/i.test(s.stage)) action += " Agree a baseline first: what would have happened without your product?";
    rec(`R03.${k + 1}`, [2, 3, 3, 3], "Test the weakest link",
      `“${s.stage}” rests on an assumption only` + (s.assumption ? `: “${s.assumption}”` : "."),
      "Every claim further down the chain inherits this uncertainty. If the assumption fails, the environmental benefit does not happen, however well the technology works.",
      action, [stepAns(2, `${s.track} → ${s.stage}`, `evidence “${ev(s)}”`)],
      ["At ideation an untested assumption is normal; write the test down now so the first pilot can answer it.", null, null,
       "At this stage an untested assumption in the chain is what a due-diligence reviewer will find first."]);
  });

  // R04 customer adoption not validated / R05 customer steps not marked
  const custSteps = stagesFlat.filter(s => s.change === "adoption" || s.change === "behaviour");
  if (stagesFlat.length && !custSteps.length && enabling) {
    rec("R05", [2, 2, 2, 2], "Mark the steps that depend on customers",
      "Impact depends on adoption, but no pathway step is marked as depending on customers.",
      "The pathway then reads as if the technology alone produces the impact, which overstates what you control.",
      "In step 2, mark where customers must buy the product or change what they do.",
      [stepAns(1, "Impact mechanism", "Enabling"), stepAns(2, "Steps that depend on customers", "none marked")]);
  } else if (custSteps.length && !custSteps.some(s => /^(Moderate|Strong)/.test(ev(s)))) {
    const behaviour = custSteps.some(s => s.change === "behaviour");
    rec("R04", [2, 3, 3, 2], "Validate customer adoption",
      `Impact relies on ${behaviour ? "behaviour change" : "customer adoption"}, but no customer evidence is documented.`,
      "Without adoption, the environmental benefit may never materialise, however well the technology works.",
      "Run a small pilot or customer interviews to validate the adoption assumptions: paid pilots, letters of intent, usage data" +
        (actor ? `, and observation of ${short(actor).replace(/\.$/, "")}` : "") + ".",
      custSteps.map(s => stepAns(2, `${s.stage} (${REF.DEPENDENCE_SHORT[s.change].toLowerCase()})`, `evidence “${ev(s)}”`)));
  }

  // R06 pathway stages left empty
  const empty = stagesFlat.filter(s => !(s.description || "").trim());
  if (stagesFlat.length && empty.length) {
    rec("R06", [3, 3, 2, 2], "Complete the impact pathway",
      `${empty.length} of ${stagesFlat.length} pathway stage${stagesFlat.length === 1 ? " is" : "s are"} not described.`,
      "A gap in the chain is the first place an investor or mentor will push, and indicators cannot be linked to a step that is not there.",
      "Describe each missing stage in one or two sentences in step 2, with the assumption that links it to the next.",
      empty.slice(0, 4).map(s => stepAns(2, s.stage, "description empty")));
  }

  // Indicators
  const buckets = SCORING.groupByBucket(selected);
  const core = buckets[SCORING.BUCKET_CORE];
  const lvl = n => (unc[n] || {}).level;
  const kindOf = n => REF.indicatorKind(n, selected[n]);
  if (!core.length) {
    rec("R07", [2, 3, 3, 3], "Choose a core indicator",
      "There is no core indicator: nothing is both highly relevant and feasible to measure.",
      "Without one, the report has no way to show progress at the next review.",
      "In step 3, select at least one indicator that is highly relevant to your pathway and at least moderately feasible.",
      [stepAns(3, "Core set", Object.keys(selected).length ? "empty (no indicator scored high relevance + at least medium feasibility)" : "no indicators selected")]);
  } else {
    const noBaseline = core.filter(([, e]) => !(e.current_value || "").toString().trim()).map(([n]) => n);
    if (noBaseline.length) {
      rec("R08", [1, 3, 3, 3], "Record a baseline",
        `No current value is recorded for ${list(noBaseline.slice(0, 3))}${noBaseline.length > 3 ? " and others" : ""}.`,
        "Without a starting point, any later improvement is a claim nobody can check.",
        "Write down today's value, even if it is zero or a rough figure, and where it comes from.",
        noBaseline.slice(0, 3).map(n => stepAns(3, n, "current value empty")),
        ["At ideation there may be nothing to measure yet; note how you would get the baseline once a pilot starts.", null, null, null]);
    }
  }
  // R09 impact claim is projected, with no measured claim of the same kind
  const projImpact = Object.keys(unc).filter(n => lvl(n) === "Projected" && ["outcome", "adoption"].includes(kindOf(n)));
  const measuredImpact = Object.keys(unc).filter(n => lvl(n) === "Measured" && kindOf(n) === "outcome");
  if (projImpact.length && !measuredImpact.length) {
    const n = projImpact[0];
    rec("R09", [1, 2, 3, 3], "Measure the projected impact",
      `A projected impact claim (“${n}”) has no supporting operational measurement.`,
      "This helps distinguish expected impact from observed impact; until then, reviewers will treat the figure as a forecast.",
      "Identify the earliest feasible real-world measurement for it, and establish a baseline now so the first measurement can be compared.",
      projImpact.slice(0, 3).map(x => stepAns(4, x, `labelled Projected (${REF.INDICATOR_KINDS[kindOf(x)].label.toLowerCase()})`))
        .concat([stepAns(4, "Measured real-world outcome claims", "none")]));
  } else if (core.length && !core.some(([n]) => lvl(n) === "Measured")) {
    // R10 no core claim measured (when R09 did not already cover it)
    const pick = core.map(([n]) => n).find(n => lvl(n) === "Modelled") || core[0][0];
    rec("R10", [1, 2, 3, 3], "Turn one claim into a measured one",
      "None of your core claims is measured yet.",
      "Reviewers discount modelled and projected figures; one measured claim is worth more than several projected ones.",
      `Start with “${pick}”: name the data that would prove it, who collects it, and how often.`,
      core.slice(0, 3).map(([n]) => stepAns(4, n, `labelled ${lvl(n) || "unlabelled"}`)));
  }
  if (core.length && !core.some(([n, e]) => REF.INDICATOR_KINDS[REF.indicatorKind(n, e)]?.real)) {
    rec("R11", [1, 2, 3, 3], "Measure real impact, not only the technology",
      "Your core indicators describe the product or the company, not whether customers use it or anything changes.",
      "The report can then show that the technology works, but not that it has any environmental effect.",
      "In step 3, add an indicator marked green, e.g. irrigation water saved per participating farm rather than sensors manufactured.",
      core.slice(0, 3).map(([n]) => stepAns(3, n, (REF.INDICATOR_KINDS[kindOf(n)] || { label: "kind not set" }).label)));
  }
  const gapW = SCORING.allClaimGaps(selected, unc, pathway).filter(g => g.sev === "warning");
  if (gapW.length) {
    const first = gapW[0];
    rec("R12", [2, 2, 3, 3], "Close the claim–evidence gaps",
      `${gapW.length} claim–evidence gap(s), starting with “${first.name}”: ${first.msg}`,
      "A claim that says more than its evidence is how an honest startup ends up accused of greenwashing.",
      "Reword the claim or add the missing baseline, source or quality rating in step 4 before you present it.",
      gapW.slice(0, 3).map(g => stepAns(4, g.name, g.msg.split(".")[0].toLowerCase())),
      [null, null, null, "At growth, claims reach investors, corporate buyers and consumers; under EU green-claims rules a mismatch can become a legal problem, not just a credibility one."]);
  }
  const asp = buckets[SCORING.BUCKET_ASPIRATIONAL].map(([n]) => n);
  if (asp.length) {
    rec("R13", [1, 2, 2, 1], "Plan your future indicators",
      `${list(asp.slice(0, 3))} ${asp.length === 1 ? "is" : "are"} relevant but not yet measurable.`,
      "Until it is measured, the most relevant part of your impact stays a projection.",
      `Note what would make ${asp.length === 1 ? "it" : "each one"} measurable (a tool, a partner, budget, a pilot customer sharing data) and at which milestone you expect it.`,
      asp.slice(0, 3).map(n => stepAns(3, n, `relevance ${selected[n].relevance}, feasibility ${selected[n].feasibility}`)));
  }

  // R15 impact-business alignment: unvalidated commercial assumptions,
  // skipping those whose pathway step R03 already covers
  const align = SCORING.alignment(state);
  const weakCovered = new Set(weak.slice(0, 2).map(s => s.stage));
  align.assumptions.filter(a => a.status !== "validated" && !(a.step && weakCovered.has(a.step))).slice(0, 3).forEach(a => {
    rec(`R15.${a.key}`, a.rel, a.title, a.gap, a.why, a.test,
      [`Step 5 · Alignment assumption “${a.text.replace(/\.$/, "")}”: ${(SCORING.ALIGN_STATUS.find(([k]) => k === a.status) || [, ""])[1].toLowerCase()}`].concat(a.basis || []));
  });

  // S01 strong evidence available: a claim worth showing off
  const strong = Object.entries(unc).filter(([n, u]) => u.level === "Measured" && u.quality === "high" &&
    (u.sources || "").trim() && (u.assumptions || "").trim() &&
    !SCORING.claimGaps(n, u, selected[n], pathway).some(g => g.sev === "warning"));
  if (strong.length) {
    const [n, u] = strong[0];
    rec("S01", [1, 2, 2, 3], "Prepare an evidence summary",
      `Operational measurements and documented assumptions support a claim (“${n}”).`,
      "This makes the claim easier for customers, accelerators and reviewers to evaluate, and sets the standard for your other claims.",
      "Prepare a short, transparent evidence summary for it: scope, limitations, baseline and sources, ready to attach to a pitch or tender.",
      strong.slice(0, 3).map(([x, v]) => stepAns(4, x, `Measured, quality High, sources: ${short(v.sources)}`)),
      null, "strength");
  }

  // R16 review milestone
  if (!state.next_review_milestone) {
    rec("R16", [1, 1, 1, 1], "Set the next review",
      "No review milestone is set.",
      "Without one, the assessment tends to be filed and forgotten while the business changes.",
      "Pick the milestone at which you will update this assessment (step 5).",
      [stepAns(5, "Next review milestone", "not set")]);
  }

  // highest priority first; gaps before strengths of equal priority
  actions.forEach((a, k) => { a._i = k; });
  actions.sort((x, y) => (y.priority - x.priority) || ((x.type === "strength") - (y.type === "strength")) || (x._i - y._i));
  actions.forEach(a => { delete a._i; });

  // ---- Points to consider: prompts the team is free to ignore ------------

  if (types.length > 1) {
    ask("C01", "Which customer comes first?",
      `You sell to ${types.join(" and ")}. Have you decided which segment you will prove the impact with first? ` +
      "Each one usually asks for different evidence, so one strong case beats several partial ones.",
      [stepAns(1, "Customer segment", types.join(" + "))]);
  }
  if (types.includes("B2B")) {
    ask("C02", "Is your impact data a selling point?",
      "Have you considered whether your business customers need environmental data for their own sustainability reporting or supplier questionnaires? " +
      "If your product can supply it, the impact claim becomes part of the sales argument, not just the pitch deck.",
      [stepAns(1, "Customer segment", "includes B2B")]);
  }
  if (types.includes("B2C")) {
    ask("C03", "How will you word claims to consumers?",
      "Since 27 September 2026, EU rules (Directive 2024/825) ban generic environmental claims such as “eco-friendly” or “climate neutral” towards consumers without proof of recognised excellent environmental performance. " +
      "Have you checked that every public claim matches a measured or clearly labelled projected figure in this report?",
      [stepAns(1, "Customer segment", "includes B2C")]);
  }
  if (types.includes("B2G")) {
    ask("C04", "What do public buyers ask for?",
      "Have you considered which environmental criteria public tenders in your field use (e.g. green public procurement criteria) and whether your indicators match them? " +
      "Expect long sales cycles, so plan the evidence early.",
      [stepAns(1, "Customer segment", "includes B2G")]);
  }
  if (enabling && actor && buyer && !sameRole(actor, buyer)) {
    ask("C05", "Is your evidence about the right people?",
      `The buyer (${short(buyer)}) is not the one whose behaviour must change (${short(actor)}). ` +
      "Have you considered how you will show that those people actually change what they do? A signed contract or a sold licence is evidence of purchase, not of behaviour change.",
      [stepAns(1, "Buyer", short(buyer)), stepAns(1, "Whose behaviour must change", short(actor))]);
  } else if (user && buyer && !sameRole(user, buyer)) {
    ask("C06", "Do the users actually use it?",
      `The buyer (${short(buyer)}) and the day-to-day users (${short(user)}) are different. ` +
      "Have you considered tracking active use, not only sales? Products bought by one person and ignored by another produce no impact.",
      [stepAns(1, "Buyer", short(buyer)), stepAns(1, "User", short(user))]);
  } else if (enabling && !actor) {
    ask("C07", "Who has to change their behaviour?",
      "Have you considered who actually has to do something differently: the person who buys the product, or someone else (an employee, a tenant, an end user)? " +
      "If they differ, your adoption evidence has to come from them, not from the sale.",
      [stepAns(1, "Whose behaviour must change", "empty")]);
  }
  if (revenue.includes("subscription") || revenue.includes("hardware_sub")) {
    ask("C08", "Does churn also cut your impact?",
      "With a subscription, a customer who cancels stops producing impact. Have you considered reporting active, retained customers rather than total sign-ups? " +
      "Your retention figure then doubles as adoption evidence.",
      [stepAns(1, "Revenue model", "subscription")]);
  }
  if (revenue.includes("sale")) {
    ask("C09", "What happens after the sale?",
      "With a one-off sale you lose sight of how the product is used. Have you considered how you will get usage data afterwards (a data-sharing clause, service visits, a connected device, a follow-up survey)?",
      [stepAns(1, "Revenue model", "one-off sale")]);
  }
  if (revenue.includes("licence")) {
    ask("C10", "Can you see how licensees deploy it?",
      "With licensing, the impact happens at the licensee. Have you considered a contract clause that gives you access to deployment and usage data?",
      [stepAns(1, "Revenue model", "licensing")]);
  }
  if (revenue.includes("usage")) {
    ask("C11", "Is your billing data also impact data?",
      "With pay-per-use, every billed use is recorded. Have you considered using those records directly as measured adoption evidence?",
      [stepAns(1, "Revenue model", "pay per use")]);
  }
  if (enabling && drivers.includes("cost")) {
    ask("C12", "Can one dataset show both savings?",
      "Your customers save money through the same mechanism that saves the environment. Have you considered tracking both from the same data " +
      "(e.g. the water bill and the m³ saved)? It makes the environmental claim far harder to dispute.",
      [stepAns(1, "Impact mechanism", "Enabling"), stepAns(1, "Why customers buy", "it saves them money")]);
  }
  if ((enabling || state.orientation === "Secondary") && !/rebound/.test(allText)) {
    ask("C13", "What about rebound effects?",
      "Have you considered whether efficiency gains could lead customers to use more (more hectares irrigated, more trips made)? " +
      "Naming the risk yourself is more credible than having a reviewer raise it.",
      [stepAns(1, "Impact mechanism / orientation", `${state.mechanism} / ${state.orientation}`), "Steps 2–4 · the word “rebound” does not appear"]);
  }
  if (direct && !/end.of.life|recycl|disposal|compost/.test(allText)) {
    ask("C14", "What happens at end of life?",
      "Have you considered the whole life cycle, not only the use phase? Production and end-of-life are often where most of the footprint sits; a screening LCA can show you where.",
      [stepAns(1, "Impact mechanism", "Direct"), "Steps 2–4 · no mention of end of life, recycling or disposal"]);
  }
  if (state.orientation === "Secondary") {
    ask("C15", "Do you know your own footprint?",
      "As a commercially driven startup, your operational footprint may matter as much as the product's effect. Have you tried the quick Scope 1 + 2 estimator in step 3?",
      [stepAns(1, "Value orientation", "Secondary")]);
  }
  if (state.stage === "Early commercialization" || state.stage === "Growth") {
    ask("C16", "Is it time for external verification?",
      "Have you considered an independent check (e.g. an LCA or a third-party review of your main claim) before the next funding round or a large customer contract?",
      [stepAns(1, "Development stage", state.stage)]);
  }
  const projectedN = Object.values(unc).filter(u => u.level === "Projected").length;
  if (projectedN && projectedN >= Object.keys(unc).length / 2) {
    ask("C17", "How will investors read this?",
      "Most of your claims are projected. Investors usually discount those heavily. Have you considered which single claim you most want measured by your next funding conversation?",
      [stepAns(4, "Projected claims", `${projectedN} of ${Object.keys(unc).length}`)]);
  }

  const strengths = actions.filter(a => a.type === "strength");
  const gaps = actions.filter(a => a.type !== "strength");
  return { actions: gaps.slice(0, SCORING.MAX_ACTIONS), more: Math.max(0, gaps.length - SCORING.MAX_ACTIONS),
    hidden: gaps.slice(SCORING.MAX_ACTIONS), strengths,
    consider: consider.slice(0, SCORING.MAX_CONSIDER), fired: [...fired] };
};
