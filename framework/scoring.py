"""
framework.scoring
=================
Feasibility-relevance scoring logic and automated integrity checks.
Kept separate from the UI so the rules are auditable and testable.
"""

LEVELS = ["Low", "Medium", "High"]

BUCKET_CORE = "Core set"
BUCKET_ASPIRATIONAL = "Aspirational (future indicator)"
BUCKET_SUPPLEMENTARY = "Supplementary"
BUCKET_OPTIONAL = "Optional"
BUCKET_EXCLUDED = "Excluded (low relevance)"

BUCKET_ORDER = [BUCKET_CORE, BUCKET_ASPIRATIONAL, BUCKET_SUPPLEMENTARY,
                BUCKET_OPTIONAL, BUCKET_EXCLUDED]


def bucket_indicator(feasibility: str, relevance: str) -> str:
    """
    Thesis scoring rules (Ch. 6.3 / Module 3):
      - High relevance + at least moderate feasibility  -> core set
      - High relevance + low feasibility                -> aspirational / future
      - Low relevance, regardless of feasibility        -> excluded
      - Medium relevance                                -> supplementary if
        readily feasible, otherwise optional (not part of the core set)
    """
    if relevance == "Low":
        return BUCKET_EXCLUDED
    if relevance == "High":
        return BUCKET_CORE if feasibility in ("High", "Medium") else BUCKET_ASPIRATIONAL
    # Medium relevance
    return BUCKET_SUPPLEMENTARY if feasibility == "High" else BUCKET_OPTIONAL


def group_by_bucket(selected: dict) -> dict:
    """selected: {name: {feasibility, relevance, ...}} -> {bucket: [(name, entry)]}"""
    out = {b: [] for b in BUCKET_ORDER}
    for name, entry in selected.items():
        out[bucket_indicator(entry["feasibility"], entry["relevance"])].append((name, entry))
    return out


# ---------------------------------------------------------------------------
# Integrity checks: operationalize the anti-greenwashing findings.
# Each check returns (severity, message) tuples; severity in {"warning", "info", "ok"}.
# ---------------------------------------------------------------------------

def run_integrity_checks(selected: dict, uncertainty: dict,
                         pathway_stage_names: list) -> list:
    checks = []
    buckets = group_by_bucket(selected)
    core = buckets[BUCKET_CORE]

    # 1. Core set size (proportionality)
    if len(core) == 0:
        checks.append(("warning",
                       "No core indicators. Select at least one indicator that is "
                       "highly relevant and at least moderately feasible."))
    elif len(core) > 5:
        checks.append(("warning",
                       f"Core set contains {len(core)} indicators. The framework "
                       "recommends no more than 3–5 at early stages "
                       "(proportionality principle). Consider trimming."))
    else:
        checks.append(("ok", f"Core set size ({len(core)}) is within the recommended 3–5 range."))

    # 2. Vanity metrics: easy to measure but not material
    vanity = [n for n, e in selected.items()
              if e["feasibility"] == "High" and e["relevance"] == "Low"]
    if vanity:
        checks.append(("warning",
                       "Possible vanity metrics selected (high feasibility, low "
                       "relevance): " + "; ".join(vanity) + ". Reporting metrics "
                       "that are available rather than meaningful is a structural "
                       "driver of greenwashing, and the framework excludes these."))
    else:
        checks.append(("ok", "No vanity metrics (high feasibility / low relevance) in the selection."))

    # 3. Evidence base composition
    labelled = {n: uncertainty.get(n, {}).get("level") for n, _ in core}
    if core:
        unlabelled = [n for n, lvl in labelled.items() if not lvl]
        if unlabelled:
            checks.append(("warning",
                           "Core indicators without an evidential confidence label: "
                           + "; ".join(unlabelled)))
        projected_core = [n for n, lvl in labelled.items() if lvl == "Projected"]
        measured_or_modelled = [n for n, lvl in labelled.items() if lvl in ("Measured", "Modelled")]
        if projected_core and not measured_or_modelled:
            checks.append(("warning",
                           "All labelled core claims are Projected. Projected claims "
                           "belong in the impact-pathway narrative, not in the "
                           "evidence base. Consider whether any indicator can be "
                           "grounded in operational data, or state clearly that the "
                           "assessment is prospective."))
        elif projected_core:
            checks.append(("info",
                           "Projected claims in the core set: " + "; ".join(projected_core)
                           + ". Report these in the narrative, clearly separated from "
                           "measured/modelled evidence."))

    # 4. Materiality linkage: indicators should trace to the impact pathway
    unlinked = [n for n, e in selected.items()
                if bucket_indicator(e["feasibility"], e["relevance"]) == BUCKET_CORE
                and not e.get("pathway_link")]
    if unlinked:
        checks.append(("info",
                       "Core indicators not linked to a pathway stage: "
                       + "; ".join(unlinked) + ". Linking each indicator to the "
                       "step of the causal chain it evidences strengthens the "
                       "materiality of the indicator set."))
    elif core:
        checks.append(("ok", "All core indicators are linked to an impact-pathway stage."))

    # 5. Missing assumption documentation on non-measured claims
    undocumented = [n for n, u in uncertainty.items()
                    if u.get("level") in ("Modelled", "Projected")
                    and not u.get("assumptions", "").strip()]
    if undocumented:
        checks.append(("warning",
                       "Modelled/Projected claims without documented assumptions: "
                       + "; ".join(undocumented) + ". Transparency over precision: "
                       "every non-measured claim must state its driving assumptions."))
    return checks
