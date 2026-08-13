# -*- coding: utf-8 -*-
"""
Builds three realistic, founder-filled sample assessments — one per major
classification quadrant — and exports each through the actual app
pipeline (framework.report.assemble + to_docx), exactly as app.py does.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from framework import report as rpt

samples = {}

# ===========================================================================
# SAMPLE 1 — AquaCarbon (Direct + Primary -> Core Cleantech)
# Stage: Early commercialization
# ===========================================================================

samples["AquaCarbon"] = {
    "startup_name": "AquaCarbon",
    "startup_desc": (
        "AquaCarbon captures CO2 from the aeration tanks of municipal wastewater "
        "treatment plants and mineralizes it with calcium byproducts into a solid "
        "aggregate used as a partial sand/gravel replacement in concrete."
    ),
    "sector": "Climate tech / carbon capture & construction materials",
    "stage": "Early commercialization",
    "mechanism": "Direct", "orientation": "Primary",
    "is_hybrid": False, "secondary_mechanism": None,
    "pathway": {
        "Product life cycle": [
            {"stage": "Activities: product design & development",
             "description": "Modular CO2 capture units retrofitted onto existing "
                            "aeration tanks; a mineralization reactor converts "
                            "captured CO2 plus a calcium byproduct stream into a "
                            "solid aggregate.",
             "assumption": "Capture units maintain >60% CO2 capture efficiency at "
                           "the CO2 concentrations typical of municipal aeration "
                           "tanks, as shown in our 2025 pilot.",
             "evidence": "Moderate (some evidence)"},
            {"stage": "Outputs: production",
             "description": "Units are manufactured by a contract fabricator in "
                            "Rotterdam; 40 units are currently deployed across 6 "
                            "wastewater plants in the Netherlands and Germany.",
             "assumption": "The fabrication partner's QC process keeps membrane "
                           "seal failures — the main cause of efficiency loss — "
                           "below 5% of deployed units.",
             "evidence": "Strong (validated / observed)"},
            {"stage": "Outcomes: use phase",
             "description": "The aggregate is sold to two regional concrete "
                            "producers as a partial replacement for quarried sand "
                            "and gravel.",
             "assumption": "Concrete producers can substitute our aggregate at up "
                           "to a 15% ratio without falling outside structural "
                           "specification.",
             "evidence": "Moderate (some evidence)"},
            {"stage": "Impact: full life-cycle environmental effect",
             "description": "Net effect is the CO2 mineralized into the aggregate, "
                            "minus the embodied emissions of unit manufacture, "
                            "transport, and reactor energy use.",
             "assumption": "Grid electricity powering the mineralization reactor "
                           "is majority renewable at each deployment site.",
             "evidence": "Weak (assumption only)"},
        ]
    },
    "weakest_links": (
        "The full life-cycle net-negative claim rests on an unverified assumption "
        "about renewable electricity share at each site. We use national grid "
        "averages, not site-metered mix, and this varies significantly by country "
        "and season — this is the single assumption most likely to move the "
        "headline number."
    ),
    "selected_indicators": {
        "GHG emissions per functional unit (simplified / screening LCA)": {
            "category": "Product-Level Performance & Avoided Impact",
            "feasibility": "Medium", "relevance": "High",
            "unit": "t CO2e / t aggregate produced (net)",
            "current_value": "\u22120.31 (net sequestering)", "target": "\u22120.45 by 2027",
            "frequency": "Quarterly",
            "data_source": "Inline capture-flow sensors + reactor energy meters + "
                           "ecoinvent factors for embodied manufacturing emissions",
            "pathway_link": "Product life cycle \u2192 Impact: full life-cycle environmental effect",
            "citation": "goyal2024",
        },
        "Total energy use over a defined period": {
            "category": "Resource & Energy Input",
            "feasibility": "High", "relevance": "Medium",
            "unit": "kWh / month", "current_value": "18,400", "target": "",
            "frequency": "Monthly", "data_source": "Utility invoices across 6 sites",
            "pathway_link": "Product life cycle \u2192 Activities: product design & development",
            "citation": "neumann2023",
        },
        "Avoided emissions vs. conventional reference technology": {
            "category": "Product-Level Performance & Avoided Impact",
            "feasibility": "Low", "relevance": "High",
            "unit": "t CO2e avoided / unit / yr", "current_value": "",
            "target": "Independent third-party verified avoided-emissions certification",
            "frequency": "Annually",
            "data_source": "Comparison to quarried aggregate production emission factors (not yet independently verified)",
            "pathway_link": "Product life cycle \u2192 Outcomes: use phase",
            "citation": "goyal2024",
        },
        "Explicit environmental mission or quantified targets in place": {
            "category": "Strategic & Governance",
            "feasibility": "High", "relevance": "Medium",
            "unit": "yes/no + description",
            "current_value": "Yes \u2014 public target of 100kt CO2 sequestered by 2028",
            "target": "", "frequency": "Annually",
            "data_source": "Company impact report", "pathway_link": "",
            "citation": "neumann2023",
        },
    },
    "custom_indicators": {},
    "uncertainty": {
        "GHG emissions per functional unit (simplified / screening LCA)": {
            "level": "Modelled",
            "claim": "AquaCarbon's process is net CO2-negative at \u22120.31 t CO2e "
                     "per tonne of aggregate produced.",
            "assumptions": "Captured CO2 volume from inline flow sensors; embodied "
                          "manufacturing emissions from ecoinvent database; reactor "
                          "electricity assumed at national grid average, not "
                          "site-metered.",
            "conditions": "The net figure would be less favourable at sites with a "
                         "higher fossil share in the local grid, or if capture "
                         "efficiency degrades faster in the field than pilot data "
                         "suggests.",
        },
        "Avoided emissions vs. conventional reference technology": {
            "level": "Projected",
            "claim": "Each deployed unit avoids approximately 85 t CO2e/year "
                     "relative to conventional quarried aggregate.",
            "assumptions": "Based on published emission factors for quarried "
                          "aggregate production; not yet validated against which "
                          "material our customers actually displace on site.",
            "conditions": "Depends heavily on which conventional material is "
                         "actually displaced at each customer's concrete mix \u2014 "
                         "not yet tracked per order.",
        },
        "Total energy use over a defined period": {
            "level": "Measured",
            "claim": "18,400 kWh/month across 6 operating sites.",
            "assumptions": "Aggregated from monthly utility invoices.",
            "conditions": "",
        },
        "Explicit environmental mission or quantified targets in place": {
            "level": "Measured",
            "claim": "Public target of 100kt CO2 sequestered by 2028.",
            "assumptions": "Published in the company's annual impact report.",
            "conditions": "",
        },
    },
    "assessment_version": 1,
    "next_review_milestone": "New funding round",
    "review_notes": "Revisit the avoided-emissions indicator once the third-party "
                    "LCA verification underway with TU Delft is complete.",
}

# ===========================================================================
# SAMPLE 2 — FieldSense (Enabling + Primary -> Enabling Startup)
# Stage: Validation / MVP
# ===========================================================================

samples["FieldSense"] = {
    "startup_name": "FieldSense",
    "startup_desc": (
        "FieldSense sells wireless soil-moisture sensors and a mobile irrigation "
        "scheduling app that helps small and mid-size farms cut water use without "
        "losing yield."
    ),
    "sector": "AgTech / precision irrigation",
    "stage": "Validation / MVP",
    "mechanism": "Enabling", "orientation": "Primary",
    "is_hybrid": False, "secondary_mechanism": None,
    "pathway": {
        "Adoption chain": [
            {"stage": "Activities: product features / service delivered",
             "description": "Wireless soil-moisture sensors feed a mobile app that "
                            "generates daily irrigation recommendations calibrated "
                            "to crop type and soil profile.",
             "assumption": "Recommendations are accurate and trustworthy enough "
                           "that farmers follow them instead of habitual watering "
                           "schedules.",
             "evidence": "Weak (assumption only)"},
            {"stage": "Outputs: customer adoption",
             "description": "62 farms enrolled across the pilot region (up from "
                            "40 six months ago), averaging 3.2 sensors per farm.",
             "assumption": "Enrolled farms are reasonably representative of "
                           "typical smallholder operations in the region, not "
                           "just early-adopter outliers.",
             "evidence": "Moderate (some evidence)"},
            {"stage": "Outcomes: customer behavior change",
             "description": "Pilot farmers report checking the app before "
                            "irrigating and anecdotally watering less often.",
             "assumption": "App engagement actually translates into reduced water "
                           "applied, not just reduced perceived need to water.",
             "evidence": "Weak (assumption only)"},
            {"stage": "Impact: avoided environmental harm",
             "description": "Reduced groundwater and surface-water withdrawal per "
                            "irrigated hectare.",
             "assumption": "Water savings are not offset by farmers expanding "
                           "their irrigated area with the water they save "
                           "(rebound effect).",
             "evidence": "Not rated"},
        ]
    },
    "weakest_links": (
        "The behavior-change assumption is the weakest link in the chain. We have "
        "solid enrollment numbers, but no water-meter data yet confirming that "
        "farmers actually reduce withdrawal rather than just feeling more "
        "informed \u2014 and we don't yet track whether saved water gets used to "
        "expand irrigated area instead."
    ),
    "selected_indicators": {
        "Adoption rate of the solution": {
            "category": "Systemic & Enabling Contribution",
            "feasibility": "High", "relevance": "High",
            "unit": "farms enrolled / hectares covered",
            "current_value": "62 farms, ~410 hectares", "target": "150 farms by end of season",
            "frequency": "Monthly", "data_source": "CRM enrollment records",
            "pathway_link": "Adoption chain \u2192 Outputs: customer adoption",
            "citation": "roomi2021",
        },
        "Quality / reliability of adoption evidence": {
            "category": "Systemic & Enabling Contribution",
            "feasibility": "Medium", "relevance": "High",
            "unit": "qualitative rating + evidence description",
            "current_value": "Self-reported survey (n=22 of 62): 71% report "
                             "reduced irrigation frequency; no independent "
                             "verification yet",
            "target": "Move to metered verification on a subset of farms",
            "frequency": "Quarterly", "data_source": "Farmer survey (self-report)",
            "pathway_link": "Adoption chain \u2192 Outcomes: customer behavior change",
            "citation": "mayne2008",
        },
        "Avoided physical harm per unit of adoption (domain-specific)": {
            "category": "Product-Level Performance & Avoided Impact",
            "feasibility": "Low", "relevance": "High",
            "unit": "% reduction in water withdrawal / hectare",
            "current_value": "",
            "target": "Install water-flow meters on pilot farms' pumps",
            "frequency": "Annually",
            "data_source": "Not yet metered \u2014 currently estimated from published agronomic studies",
            "pathway_link": "Adoption chain \u2192 Impact: avoided environmental harm",
            "citation": "mayne2008",
        },
    },
    "custom_indicators": {},
    "uncertainty": {
        "Adoption rate of the solution": {
            "level": "Measured",
            "claim": "62 enrolled farms covering approximately 410 hectares as of this month.",
            "assumptions": "CRM enrollment and onboarding records.",
            "conditions": "",
        },
        "Quality / reliability of adoption evidence": {
            "level": "Modelled",
            "claim": "71% of surveyed farmers self-report reduced irrigation frequency.",
            "assumptions": "Self-reported survey of 22 of 62 enrolled farms; "
                          "social-desirability bias likely inflates positive "
                          "responses somewhat.",
            "conditions": "Would look different with a larger, randomly sampled "
                         "survey, or with metered verification instead of self-report.",
        },
        "Avoided physical harm per unit of adoption (domain-specific)": {
            "level": "Projected",
            "claim": "We estimate an approximate 18% reduction in water "
                     "withdrawal per irrigated hectare versus the regional baseline.",
            "assumptions": "Based on published agronomic studies of comparable "
                          "sensor-guided irrigation systems elsewhere \u2014 not yet "
                          "based on FieldSense's own metered data.",
            "conditions": "Actual savings could be considerably lower if farmers "
                         "under-trust recommendations during high-risk growth "
                         "stages (e.g. flowering) and over-water as a precaution.",
        },
    },
    "assessment_version": 1,
    "next_review_milestone": "Product launch",
    "review_notes": "Install water-flow meters on at least 10 pilot farms before "
                    "the next review, to convert the core avoided-harm claim from "
                    "projected to measured.",
}

# ===========================================================================
# SAMPLE 3 — RouteWise (Enabling + Secondary -> Incidental Enabler)
# Stage: Growth
# ===========================================================================

samples["RouteWise"] = {
    "startup_name": "RouteWise",
    "startup_desc": (
        "RouteWise sells route-optimization software to mid-size delivery fleets, "
        "marketed primarily on fuel-cost and time savings. Reduced emissions are a "
        "secondary effect of more efficient routing, not the sales pitch."
    ),
    "sector": "Logistics SaaS",
    "stage": "Growth",
    "mechanism": "Enabling", "orientation": "Secondary",
    "is_hybrid": False, "secondary_mechanism": None,
    "pathway": {
        "Track A: Operational footprint": [
            {"stage": "Activities: operations",
             "description": "Cloud-hosted SaaS platform on AWS; a single office "
                            "in Prague; no delivery fleet of our own.",
             "assumption": "Cloud compute is the dominant driver of our own "
                           "footprint, not office energy use.",
             "evidence": "Moderate (some evidence)"},
            {"stage": "Outputs: resource use & emissions",
             "description": "AWS compute and storage, plus office energy and "
                            "commuting for 34 staff.",
             "assumption": "AWS's reported carbon accounting reasonably reflects "
                           "the actual regional grid mix behind our workloads.",
             "evidence": "Moderate (some evidence)"},
            {"stage": "Impact: direct environmental effect",
             "description": "Estimated 42 t CO2e/year (cloud Scope 2 plus office "
                            "Scope 1 and 2).",
             "assumption": "",
             "evidence": "Moderate (some evidence)"},
        ],
        "Track B: Product/service externalities": [
            {"stage": "Activities: product or service in the market",
             "description": "Route optimization reduces total distance driven and "
                            "idle time for customer delivery fleets.",
             "assumption": "Drivers actually follow the optimized routes rather "
                           "than overriding them with manual choices.",
             "evidence": "Weak (assumption only)"},
            {"stage": "Outcomes: induced changes",
             "description": "Customer fleets self-report roughly 9% lower fuel "
                            "consumption per delivery after adoption.",
             "assumption": "Fuel savings are banked as a reduction, not spent on "
                           "expanding delivery volume or service area (rebound effect).",
             "evidence": "Weak (assumption only)"},
            {"stage": "Impact: net externality",
             "description": "Net fuel and emissions effect across the customer "
                            "fleet base, after netting out any rebound-driven "
                            "volume growth.",
             "assumption": "",
             "evidence": "Not rated"},
        ],
    },
    "weakest_links": (
        "The rebound effect on Track B is unverified. Several of our largest "
        "customers have grown their delivery volume alongside adopting RouteWise, "
        "and we cannot yet separate 'lower emissions per delivery' from 'more "
        "total deliveries eating into that per-unit gain.'"
    ),
    "selected_indicators": {
        "Scope 2 indirect emissions (purchased electricity & heat)": {
            "category": "Emissions & Waste Output",
            "feasibility": "High", "relevance": "Medium",
            "unit": "t CO2e / yr", "current_value": "31 (cloud) + 11 (office) = 42",
            "target": "", "frequency": "Quarterly",
            "data_source": "AWS Customer Carbon Footprint Tool + office utility invoices",
            "pathway_link": "Track A: Operational footprint \u2192 Impact: direct environmental effect",
            "citation": "ghgprotocol",
        },
        "Avoided emissions vs. conventional reference technology": {
            "category": "Product-Level Performance & Avoided Impact",
            "feasibility": "Medium", "relevance": "High",
            "unit": "% fuel reduction / delivery",
            "current_value": "~9% average, self-reported by 14 of 60 active customers",
            "target": "Third-party validated savings figure, verified via telematics",
            "frequency": "Annually",
            "data_source": "Customer self-report survey; raw telematics cross-check from 3 customers",
            "pathway_link": "Track B: Product/service externalities \u2192 Outcomes: induced changes",
            "citation": "goyal2024",
        },
        # Deliberately included to demonstrate the tool's vanity-metric flag:
        # easy to report, but not material to RouteWise's actual impact story.
        "Total waste generated": {
            "category": "Emissions & Waste Output",
            "feasibility": "High", "relevance": "Low",
            "unit": "kg / yr", "current_value": "", "target": "",
            "frequency": "", "data_source": "Office recycling records",
            "pathway_link": "", "citation": "neumann2023",
        },
        "Number/type of customers or partners using solution for environmental purposes": {
            "category": "Systemic & Enabling Contribution",
            "feasibility": "High", "relevance": "Low",
            "unit": "count", "current_value": "", "target": "",
            "frequency": "", "data_source": "CRM notes on stated purchase motivation",
            "pathway_link": "", "citation": "markard2012",
        },
    },
    "custom_indicators": {},
    "uncertainty": {
        "Scope 2 indirect emissions (purchased electricity & heat)": {
            "level": "Measured",
            "claim": "42 t CO2e/year total (31 t cloud + 11 t office).",
            "assumptions": "AWS Customer Carbon Footprint Tool for cloud; utility "
                          "invoices for the Prague office.",
            "conditions": "",
        },
        "Avoided emissions vs. conventional reference technology": {
            "level": "Modelled",
            "claim": "Customer fleets report an average 9% reduction in fuel "
                     "consumption per delivery after adopting RouteWise.",
            "assumptions": "Self-reported by 14 of 60 active customers; only 3 "
                          "customers share raw telematics data for cross-check "
                          "against the self-reported figure.",
            "conditions": "True figure could be lower if only satisfied customers "
                         "respond to the survey (self-selection bias), or the "
                         "telematics-verified subset could be unrepresentative "
                         "of the wider customer base either way.",
        },
    },
    "assessment_version": 1,
    "next_review_milestone": "Annual review",
    "review_notes": "Get telematics-verified fuel savings data from more than 3 "
                    "customers before the next review, and investigate the "
                    "rebound effect against delivery-volume growth.",
}

# ===========================================================================
# Generate all three
# ===========================================================================

if __name__ == "__main__":
    outdir = os.path.join(os.path.dirname(__file__), "sample_reports")
    os.makedirs(outdir, exist_ok=True)
    for name, state in samples.items():
        state["pathway_stage_names"] = [
            f"{track} \u2192 {s['stage']}" for track, stages in state["pathway"].items() for s in stages
        ]
        data = rpt.assemble(state)
        docx_bytes = rpt.to_docx(data)
        path = os.path.join(outdir, f"{name}_impact_report.docx")
        with open(path, "wb") as f:
            f.write(docx_bytes)
        print(f"Wrote {path} ({len(docx_bytes)} bytes)")

        # also dump the JSON so these can be loaded straight into the live app
        json_path = os.path.join(outdir, f"{name}_assessment_v1.json")
        with open(json_path, "w") as f:
            f.write(rpt.export_state(state))
        print(f"Wrote {json_path}")
