"""
framework.reference
===================
Reference data for the four-module environmental impact assessment
framework. All content is derived from the thesis "A Proposed Framework
for Environmental Impact Assessment in Early-Stage Startups" and the
sources cited therein. Edit this file to refine wording, add indicators,
or adjust templates without touching UI logic.
"""

# ---------------------------------------------------------------------------
# Module 1 — Startup typology (2x2: impact mechanism x value orientation)
# ---------------------------------------------------------------------------

CLASSIFICATION_MATRIX = {
    ("Direct", "Primary"): {
        "label": "Directly Environmental Startup (Core Cleantech)",
        "blurb": (
            "The core product or service is explicitly designed to deliver "
            "immediate environmental improvements. Direct environmental impact "
            "is central to the value proposition."
        ),
        "unit_of_analysis": "The product / service itself (full life cycle)",
        "pathway_template": "lifecycle",
    },
    ("Enabling", "Primary"): {
        "label": "Enabling Startup",
        "blurb": (
            "The startup is not itself environmental technology, but allows "
            "other actors to reduce their environmental impact. The benefit "
            "depends on adoption and behavior change by customers or partners."
        ),
        "unit_of_analysis": "The adoption pathway",
        "pathway_template": "adoption",
    },
    ("Direct", "Secondary"): {
        "label": "General-Purpose Startup (direct footprint focus)",
        "blurb": (
            "The technology or business model is not intrinsically "
            "environmental; environmental effects are a secondary outcome of "
            "a primarily commercial offering. Assessment distinguishes the "
            "operational footprint from externalities of the product/service."
        ),
        "unit_of_analysis": "Operational footprint + product/service externalities (dual track)",
        "pathway_template": "dual_track",
    },
    ("Enabling", "Secondary"): {
        "label": "Incidental Enabler (General-Purpose)",
        "blurb": (
            "Environmental effects arise as a by-product of commercial "
            "activity through enabling others, rather than as an explicit "
            "value proposition. Assessed via the operational footprint with "
            "light-touch screening of enabling effects."
        ),
        "unit_of_analysis": "Operational footprint + light-touch adoption screening (dual track)",
        "pathway_template": "dual_track",
    },
}

# Diagnostic questions used to *derive* the classification rather than
# asking users to self-label in abstract terms.
DIAGNOSTIC_MECHANISM = {
    "question": (
        "If your product or service works exactly as intended, but none of "
        "your customers or partners change their behavior, does the "
        "environmental benefit still occur?"
    ),
    "options": {
        "Yes — the benefit is inherent in the product/service itself": "Direct",
        "No — the benefit only materializes if customers/partners adopt it and change what they do": "Enabling",
    },
}

DIAGNOSTIC_ORIENTATION = {
    "question": (
        "Imagine removing every environmental claim from your pitch. Would "
        "the core commercial case for your product still stand on its own?"
    ),
    "options": {
        "No — environmental improvement IS the value proposition": "Primary",
        "Yes — the offering is primarily commercial; environmental benefit is a secondary outcome": "Secondary",
    },
}

# ---------------------------------------------------------------------------
# Development stages and stage-dependent module emphasis (thesis Figure 11)
# ---------------------------------------------------------------------------

STAGES = ["Ideation", "Validation / MVP", "Early commercialization", "Growth"]

STAGE_GUIDANCE = {
    "Ideation": {
        "priority_modules": [1, 2],
        "note": (
            "At ideation, Modules 1 and 2 are the priority: getting the impact "
            "logic right matters more than populating metrics that do not yet "
            "have data behind them. Keep Module 3 to a shortlist of intended "
            "indicators; treat most claims as projected."
        ),
    },
    "Validation / MVP": {
        "priority_modules": [1, 2, 3],
        "note": (
            "Refine the impact pathway with first evidence from pilots. Begin "
            "populating the most feasible indicators; expect most claims to be "
            "modelled or projected."
        ),
    },
    "Early commercialization": {
        "priority_modules": [3],
        "note": (
            "Module 3 becomes the central activity as first operational data "
            "becomes available. Move indicators from modelled toward measured "
            "where data systems allow."
        ),
    },
    "Growth": {
        "priority_modules": [3, 4],
        "note": (
            "Module 4 gains importance as the startup faces greater scrutiny "
            "from investors, corporate customers, and regulators. Uncertainty "
            "labeling and honest communication become critical."
        ),
    },
}

REVIEW_MILESTONES = [
    "Product launch",
    "First significant commercial scale",
    "New funding round",
    "Major regulatory change",
    "Annual review",
    "Other (specify in notes)",
]

# ---------------------------------------------------------------------------
# Module 2 — Impact pathway templates (theory-of-change logic models)
# ---------------------------------------------------------------------------
# Each template is a list of stages; each stage gets a description, an
# underlying assumption, and an evidence-strength rating in the UI.

PATHWAY_TEMPLATES = {
    "lifecycle": {
        "name": "Product life-cycle pathway (directly environmental startups)",
        "description": (
            "The impact pathway covers the complete product life cycle. Make "
            "explicit what happens at each phase and which assumptions link "
            "the phases to the claimed environmental improvement."
        ),
        "tracks": [
            {
                "track": "Product life cycle",
                "stages": [
                    ("Activities: product design & development",
                     "What design choices create the environmental improvement?"),
                    ("Outputs: production",
                     "What is produced, from what materials, with what process?"),
                    ("Outcomes: use phase",
                     "What happens when the product is used? What does it replace?"),
                    ("Impact: full life-cycle environmental effect",
                     "What is the net environmental effect across the life cycle, incl. end-of-life?"),
                ],
            }
        ],
    },
    "adoption": {
        "name": "Adoption-dependent pathway (enabling startups)",
        "description": (
            "The impact runs through customer adoption and behavior change. "
            "The links between adoption, behavior, and avoided harm carry the "
            "key assumptions — typically the weakest part of the chain and the "
            "point where contribution analysis is most needed."
        ),
        "tracks": [
            {
                "track": "Adoption chain",
                "stages": [
                    ("Activities: product features / service delivered",
                     "What exactly does the product enable users to do differently?"),
                    ("Outputs: customer adoption",
                     "Who adopts it, at what rate, and how is adoption evidenced?"),
                    ("Outcomes: customer behavior change",
                     "What behavior actually changes? How do you know users follow through?"),
                    ("Impact: avoided environmental harm",
                     "What environmental harm is avoided per unit of changed behavior, relative to what baseline?"),
                ],
            }
        ],
    },
    "dual_track": {
        "name": "Dual-track pathway (general-purpose startups)",
        "description": (
            "General-purpose ventures are assessed on two tracks: their own "
            "operational footprint, and the externalities (positive or "
            "negative) generated through the product or service."
        ),
        "tracks": [
            {
                "track": "Track A: Operational footprint",
                "stages": [
                    ("Activities: operations",
                     "Offices, cloud/compute, logistics, travel, production — what drives your footprint?"),
                    ("Outputs: resource use & emissions",
                     "Energy, materials, waste, Scope 1 & 2 emissions."),
                    ("Impact: direct environmental effect",
                     "Net direct effect of running the company."),
                ],
            },
            {
                "track": "Track B: Product/service externalities",
                "stages": [
                    ("Activities: product or service in the market",
                     "What does deployment of your product cause in the world?"),
                    ("Outcomes: induced changes",
                     "Positive or negative environmental changes induced in customers or systems (incl. rebound effects)."),
                    ("Impact: net externality",
                     "Net environmental externality of the product/service at current scale."),
                ],
            },
        ],
    },
}

# ---------------------------------------------------------------------------
# Module 3 — Indicator bank (thesis Chapter 6, six categories)
# Each entry: (indicator, typical data source, typical unit, citation key)
# ---------------------------------------------------------------------------

INDICATOR_BANK = {
    "Resource & Energy Input": [
        ("Total energy use over a defined period",
         "Utility invoices, production records", "kWh / period", "neumann2023"),
        ("Energy intensity per unit of output",
         "Utility invoices + production volumes", "kWh / unit", "neumann2023"),
        ("Share of renewable energy in total consumption",
         "Utility invoices / supplier data", "%", "neumann2023"),
        ("Water consumption",
         "Utility invoices", "m³ / period", "iso2015"),
    ],
    "Emissions & Waste Output": [
        ("Scope 1 direct GHG emissions (fuel combustion, company vehicles)",
         "Fuel records", "t CO₂e / yr", "ghgprotocol"),
        ("Scope 2 indirect emissions (purchased electricity & heat)",
         "Utility invoices × emission factors", "t CO₂e / yr", "ghgprotocol"),
        ("Scope 3 value-chain emissions (screening level)",
         "Spend data × generic factors; supplier data", "t CO₂e / yr", "ghgprotocol"),
        ("Total waste generated",
         "Internal operational records", "kg / period", "neumann2023"),
        ("Proportion of waste recycled",
         "Internal operational records", "%", "neumann2023"),
    ],
    "Product-Level Performance & Avoided Impact": [
        ("GHG emissions per functional unit (simplified / screening LCA)",
         "Design docs, bill of materials, LCA databases", "kg CO₂e / functional unit", "goyal2024"),
        ("Avoided emissions vs. conventional reference technology",
         "Scenario-based calculation, contribution analysis", "t CO₂e avoided / yr", "goyal2024"),
        ("Avoided physical harm per unit of adoption (domain-specific)",
         "Operational data + contribution analysis", "domain-specific (e.g. kg pesticide avoided / ha)", "mayne2008"),
    ],
    "Materials & Circularity": [
        ("Share of recycled or biobased materials in products",
         "Bill of materials, supplier data", "%", "vanstijn2021"),
        ("Expected product lifetime vs. standard alternatives",
         "Product specifications, testing", "years (vs. baseline)", "vanstijn2021"),
        ("Proportion of components designed for reuse / repair / remanufacture",
         "Design documentation", "%", "vanstijn2021"),
    ],
    "Strategic & Governance": [
        ("Explicit environmental mission or quantified targets in place",
         "Internal documents (self-assessment)", "yes/no + description", "neumann2023"),
        ("Assigned responsibility for sustainability within the team",
         "Self-assessment", "yes/no + role", "neumann2023"),
        ("Environmental criteria formally integrated into product development or partner selection",
         "Self-assessment, process documentation", "yes/no + description", "neumann2023"),
    ],
    "Systemic & Enabling Contribution": [
        ("Number / type of customers or partners using the solution for environmental purposes",
         "CRM / sales data", "count + segmentation", "markard2012"),
        ("Adoption rate of the solution",
         "Product analytics, sales data", "% of target market or growth rate", "roomi2021"),
        ("Quality / reliability of adoption evidence",
         "Product analytics, user studies", "qualitative rating + evidence description", "mayne2008"),
        ("Alignment with specific transition pathways or policy targets",
         "Strategy documents (self-assessment)", "qualitative + referenced target", "markard2012"),
    ],
}

# ---------------------------------------------------------------------------
# Module 4 — Evidential confidence levels
# ---------------------------------------------------------------------------

CONFIDENCE_LEVELS = {
    "Measured": (
        "Supported by startup-held operational data directly linked to the "
        "impact indicator. Can be reported as evidence."
    ),
    "Modelled": (
        "Derived from industry averages, supplier data, or simplified "
        "lifecycle calculations that introduce additional assumptions. Report "
        "with the assumptions stated."
    ),
    "Projected": (
        "Relies on adoption scenarios and theory-of-change reasoning about "
        "future or indirect impacts. Legitimate, but belongs in the impact "
        "pathway narrative — not in the evidence base."
    ),
}

# ---------------------------------------------------------------------------
# Quick Scope 1 & 2 estimator — generic emission factors.
# Indicative, screening-level values (order of magnitude consistent with
# DEFRA / EEA published conversion factors). Results are MODELLED claims.
# Users should replace with country- and year-specific factors for reporting.
# ---------------------------------------------------------------------------

EMISSION_FACTORS = {
    "Grid electricity (kWh)": {"factor": 0.25, "unit_note": "kg CO₂e/kWh — EU-average order of magnitude; replace with your national grid factor", "scope": 2},
    "Natural gas (kWh)": {"factor": 0.18, "unit_note": "kg CO₂e/kWh", "scope": 1},
    "Diesel (litres)": {"factor": 2.68, "unit_note": "kg CO₂e/litre", "scope": 1},
    "Petrol (litres)": {"factor": 2.31, "unit_note": "kg CO₂e/litre", "scope": 1},
    "District heating (kWh)": {"factor": 0.15, "unit_note": "kg CO₂e/kWh — highly network-dependent", "scope": 2},
}

# ---------------------------------------------------------------------------
# References (for the report's reference list; keyed by citation key)
# ---------------------------------------------------------------------------

REFERENCES = {
    "ghgprotocol": "World Resources Institute & WBCSD (2013). The Greenhouse Gas Protocol: A Corporate Accounting and Reporting Standard.",
    "goyal2024": "Goyal, S. & Mahmoudzadeh, A. (2024). [Product-level performance and avoided impact assessment for cleantech startups].",
    "iso2006": "ISO (2006). ISO 14040/14044: Environmental management — Life cycle assessment.",
    "iso2015": "ISO (2015). ISO 14031: Environmental management — Environmental performance evaluation.",
    "kellogg2004": "W.K. Kellogg Foundation (2004). Logic Model Development Guide.",
    "markard2012": "Markard, J., Raven, R. & Truffer, B. (2012). Sustainability transitions: An emerging field of research and its prospects. Research Policy 41(6).",
    "mayne2008": "Mayne, J. (2008). Contribution analysis: An approach to exploring cause and effect. ILAC Brief 16.",
    "mclaughlin2015": "McLaughlin, J.A. & Jordan, G.B. (2015). Using logic models. In Handbook of Practical Program Evaluation.",
    "neumann2023": "Neumann, T. (2023). [Environmental performance indicators for young ventures].",
    "roomi2021": "Roomi, M.A. et al. (2021). [Indicator sets for sustainable entrepreneurship].",
    "vanstijn2021": "Van Stijn, A. et al. (2021). [Circularity metrics for modular and reusable products].",
    "weidema2018": "Weidema, B.P. et al. (2018). [Progressive data collection and hybrid assessment].",
    "weiss1995": "Weiss, C.H. (1995). Nothing as practical as good theory. In New Approaches to Evaluating Community Initiatives.",
    "sahili2024": "Sahili, Z. & Barrales-Molina, V. (2024). [Lean environmental assessment in young firms].",
    "lilin2025": "Li, X. & Lin, Y. (2025). [Relevance criteria for environmental indicators].",
    "finnveden2009": "Finnveden, G. et al. (2009). Recent developments in Life Cycle Assessment. Journal of Environmental Management 91(1).",
}

METHODOLOGY_NOTE = (
    "This assessment follows a four-module framework for environmental "
    "impact assessment in early-stage startups: (1) startup profiling and "
    "type classification; (2) impact pathway mapping grounded in theory-of-"
    "change / logic-model reasoning (Weiss 1995; Mayne 2008; W.K. Kellogg "
    "Foundation 2004; McLaughlin & Jordan 2015); (3) indicator selection via "
    "two-dimensional feasibility–relevance scoring; and (4) uncertainty "
    "acknowledgement using three levels of evidential confidence (measured, "
    "modelled, projected). The framework is governed by four principles: "
    "proportionality, type-differentiation, transparency over precision, and "
    "design for updating rather than completion. It is a screening-level "
    "instrument: it does not replace full LCA (ISO 14040/44), comprehensive "
    "GHG Protocol reporting, or regulatory compliance assessment, and it "
    "does not produce a composite score."
)
