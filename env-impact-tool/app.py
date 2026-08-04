"""
Startup Environmental Impact Assessment Tool (v2)
=================================================
A guided implementation of the four-module framework from
"A Proposed Framework for Environmental Impact Assessment in
Early-Stage Startups".

Run with:
    pip install -r requirements.txt
    python -m streamlit run app.py
"""

import pandas as pd
import streamlit as st
import altair as alt

from framework import reference as ref
from framework import scoring
from framework import report as rpt
import ui

st.set_page_config(page_title="Startup Environmental Impact Assessment",
                   page_icon="🌱", layout="wide",
                   initial_sidebar_state="expanded")
ui.inject_css()

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

DEFAULTS = {
    "step": 1,
    "startup_name": "",
    "startup_desc": "",
    "sector": "",
    "stage": "Ideation",
    "mechanism": "Direct",
    "orientation": "Primary",
    "is_hybrid": False,
    "secondary_mechanism": None,
    "pathway": {},               # {track_name: [{stage, hint, description, assumption, evidence}]}
    "weakest_links": "",
    "selected_indicators": {},   # name -> {category, feasibility, relevance, unit, current_value,
                                 #          target, frequency, data_source, pathway_link, citation}
    "custom_indicators": {},     # category -> [names]
    "uncertainty": {},           # indicator -> {level, claim, assumptions, conditions}
    "assessment_version": 1,
    "next_review_milestone": "",
    "review_notes": "",
}


def init_state():
    for k, v in DEFAULTS.items():
        if k not in st.session_state:
            st.session_state[k] = v


init_state()
S = st.session_state


def goto(step):
    S["step"] = step
    st.rerun()


def current_classification():
    return ref.CLASSIFICATION_MATRIX[(S["mechanism"], S["orientation"])]


def pathway_stage_names():
    names = []
    for track, stages in S["pathway"].items():
        for s in stages:
            names.append(f"{track} → {s['stage']}")
    return names


def state_dict():
    d = {k: S[k] for k in DEFAULTS}
    d["pathway_stage_names"] = pathway_stage_names()
    return d


# ---------------------------------------------------------------------------
# Sidebar: navigation, stage guidance, save / load
# ---------------------------------------------------------------------------

STEP_NAMES = {
    1: "Profile & classify",
    2: "Impact pathway",
    3: "Select indicators",
    4: "Label uncertainty",
    5: "Report & export",
}

with st.sidebar:
    ui.sidebar_brand()

    st.markdown('<div class="eia-navlabel">Assessment steps</div>',
                unsafe_allow_html=True)
    with st.container(key="eia_nav_wrap"):
        for s_num, name in STEP_NAMES.items():
            if s_num < S["step"]:
                state = "done"
            elif s_num == S["step"]:
                state = "now"
            else:
                state = "todo"
            module_num = s_num if s_num <= 4 else None
            highlight = (module_num in ref.STAGE_GUIDANCE[S["stage"]]["priority_modules"]
                         if module_num else False)
            label = name + ("  ★" if highlight else "")
            if st.button(label, key=f"eia_nav_{state}_{s_num}",
                         use_container_width=True):
                goto(s_num)
    st.caption("★ priority module at your development stage")

    ui.stage_chip(S["stage"], ref.STAGE_GUIDANCE[S["stage"]]["priority_modules"])

    with st.expander(f"Resume, save state & restart · v{S['assessment_version']}"):
        st.caption("Your work lives in this browser session. Export the JSON "
                   "assessment file on the last step to save it; upload it here "
                   "to resume — each reload starts a new review cycle.")
        up = st.file_uploader("Resume a saved assessment (JSON)", type=["json"])
        if up is not None and not S.get("_imported"):
            try:
                loaded = rpt.import_state(up.read().decode("utf-8"))
                for k, v in loaded.items():
                    if k in DEFAULTS and v is not None:
                        S[k] = v
                S["_imported"] = True
                st.success(f"Assessment loaded — now on review cycle "
                           f"v{S['assessment_version']}.")
                st.rerun()
            except Exception as exc:
                st.error(f"Could not load file: {exc}")

        if st.button("Restart from scratch", use_container_width=True):
            for k in list(st.session_state.keys()):
                del st.session_state[k]
            init_state()
            st.rerun()

step = S["step"]

# Stage guidance banner shown on every module page
if step <= 4:
    g = ref.STAGE_GUIDANCE[S["stage"]]
    if step in g["priority_modules"]:
        st.info(f"⭐ **Priority module at the {S['stage']} stage.** {g['note']}")

# ===========================================================================
# STEP 1 — Profiling & classification
# ===========================================================================

if step == 1:
    ui.module_header(
        1, 5, "Module 1 of 4 · Step 1 of 5",
        "Startup profiling & type classification",
        "The classification determines which subsequent modules matter most and "
        "what the primary unit of analysis should be: the product, the adoption "
        "pathway, or the operational footprint.")

    c1, c2 = st.columns(2)
    with c1:
        S["startup_name"] = st.text_input("Startup name", value=S["startup_name"])
        S["sector"] = st.text_input("Sector / domain (e.g. AgTech, packaging, SaaS)",
                                    value=S["sector"])
    with c2:
        S["stage"] = st.selectbox("Current development stage", ref.STAGES,
                                  index=ref.STAGES.index(S["stage"]),
                                  help="The framework adapts its guidance: module "
                                       "depth varies by development stage.")
    S["startup_desc"] = st.text_area(
        "Describe in 1–3 sentences what the startup does and for whom",
        value=S["startup_desc"])

    st.subheader("Dimension 1 · How does environmental impact arise?")
    mech_opts = list(ref.DIAGNOSTIC_MECHANISM["options"].keys())
    mech_idx = 0 if S["mechanism"] == "Direct" else 1
    mech_answer = st.radio(ref.DIAGNOSTIC_MECHANISM["question"], mech_opts, index=mech_idx)
    derived_mechanism = ref.DIAGNOSTIC_MECHANISM["options"][mech_answer]

    S["is_hybrid"] = st.checkbox(
        "Hybrid: a meaningful share of the impact also arises through the *other* "
        "mechanism (e.g. an enabling startup with a measurable direct footprint, or "
        "hardware with both direct and enabling effects)",
        value=S["is_hybrid"])
    S["mechanism"] = derived_mechanism
    S["secondary_mechanism"] = (
        ("Enabling" if derived_mechanism == "Direct" else "Direct") if S["is_hybrid"] else None
    )
    if S["is_hybrid"]:
        st.caption(f"Primary track: **{S['mechanism']}** · Secondary track "
                   f"(lighter-touch screening): **{S['secondary_mechanism']}**")

    st.subheader("Dimension 2 · Is environmental improvement the value proposition?")
    ori_opts = list(ref.DIAGNOSTIC_ORIENTATION["options"].keys())
    ori_idx = 0 if S["orientation"] == "Primary" else 1
    ori_answer = st.radio(ref.DIAGNOSTIC_ORIENTATION["question"], ori_opts, index=ori_idx)
    S["orientation"] = ref.DIAGNOSTIC_ORIENTATION["options"][ori_answer]

    cls = current_classification()
    st.success(f"**Classification: {cls['label']}**\n\n{cls['blurb']}")
    st.caption(f"Primary unit of analysis: {cls['unit_of_analysis']}")

    _, nxt = st.columns([2, 1])
    with nxt:
        if st.button("Next · Impact pathway →", type="primary",
                     use_container_width=True, disabled=not S["startup_name"]):
            goto(2)
    if not S["startup_name"]:
        st.info("Enter a startup name to continue.")

# ===========================================================================
# STEP 2 — Impact pathway mapping
# ===========================================================================

elif step == 2:
    cls = current_classification()
    template = ref.PATHWAY_TEMPLATES[cls["pathway_template"]]

    ui.module_header(
        2, 5, "Module 2 of 4 · Step 2 of 5",
        "Impact pathway mapping",
        "Map the causal chain from what the startup does, through its outputs "
        "and outcomes, to the intended environmental impact. For every step, "
        "state the assumption that links it to the next and rate how strong the "
        "evidence currently is — this keeps impact claims honest and shows where "
        "measurement is most feasible.")
    st.markdown(f"**Template applied ({cls['label']}):** {template['name']}")
    st.caption(template["description"])

    # Build/refresh the pathway structure from the template, preserving text
    def ensure_track(track_def):
        track_name = track_def["track"]
        existing = {s["stage"]: s for s in S["pathway"].get(track_name, [])}
        S["pathway"][track_name] = [
            existing.get(stage, {"stage": stage, "description": "",
                                 "assumption": "", "evidence": "Not rated"})
            | {"hint": hint}
            for stage, hint in track_def["stages"]
        ]

    expected_tracks = [t["track"] for t in template["tracks"]]
    # If a hybrid secondary track applies, add a light-touch secondary chain
    if S["is_hybrid"] and S["secondary_mechanism"]:
        sec_template = ref.PATHWAY_TEMPLATES[
            "lifecycle" if S["secondary_mechanism"] == "Direct" else "adoption"]
        sec_track = dict(sec_template["tracks"][0])
        sec_track["track"] = f"Secondary track (light-touch): {sec_track['track']}"
        template_tracks = template["tracks"] + [sec_track]
        expected_tracks.append(sec_track["track"])
    else:
        template_tracks = template["tracks"]

    # drop tracks that no longer apply (e.g. classification changed)
    for stale in [t for t in S["pathway"] if t not in expected_tracks]:
        del S["pathway"][stale]
    for t in template_tracks:
        ensure_track(t)

    EVIDENCE = ["Not rated", "Weak (assumption only)", "Moderate (some evidence)",
                "Strong (validated / observed)"]

    for track_name, stages in S["pathway"].items():
        st.subheader(track_name)
        for i, s in enumerate(stages):
            with st.container(border=True):
                st.markdown(f"**{s['stage']}**")
                st.caption(s.get("hint", ""))
                s["description"] = st.text_area(
                    "Description", value=s["description"],
                    key=f"pw_{track_name}_{i}_desc", height=68)
                cA, cB = st.columns([3, 2])
                s["assumption"] = cA.text_input(
                    "Assumption linking this step to the next",
                    value=s["assumption"], key=f"pw_{track_name}_{i}_ass")
                s["evidence"] = cB.selectbox(
                    "Evidence strength", EVIDENCE,
                    index=EVIDENCE.index(s["evidence"]) if s["evidence"] in EVIDENCE else 0,
                    key=f"pw_{track_name}_{i}_ev")

    weak = [f"{t} → {s['stage']}" for t, stages in S["pathway"].items()
            for s in stages if s["evidence"] == "Weak (assumption only)"]
    if weak:
        st.warning("Weakest links (assumption only): " + "; ".join(weak)
                   + ". These are the points where contribution analysis and "
                     "future measurement are most needed.")
    S["weakest_links"] = st.text_area(
        "Summarize the weakest link(s) and why they are uncertain",
        value=S["weakest_links"],
        placeholder="e.g. The assumption that farmers follow dosing recommendations "
                    "is the weakest link: adoption ≠ behavior change.")

    b1, _, b2 = st.columns([1, 2, 1])
    if b1.button("← Back", use_container_width=True):
        goto(1)
    if b2.button("Next · Indicators →", type="primary", use_container_width=True):
        goto(3)

# ===========================================================================
# STEP 3 — Indicator selection
# ===========================================================================

elif step == 3:
    ui.module_header(
        3, 5, "Module 3 of 4 · Step 3 of 5",
        "Indicator selection & scoring",
        "Score each candidate indicator on relevance (does it track something "
        "material to your impact pathway?) and feasibility (can you populate it "
        "with data you hold or can generate cheaply?). Aim for a core set of "
        "3–5. Easy-to-measure but immaterial indicators are excluded by design — "
        "reporting available rather than meaningful metrics is a structural "
        "driver of greenwashing.")

    tab_select, tab_detail, tab_matrix, tab_calc = st.tabs(
        ["① Select & score", "② Indicator details", "③ Scoring matrix", "④ Quick Scope 1+2 estimator"])

    # --- Tab 1: selection + scoring -------------------------------------
    with tab_select:
        for category, indicators in ref.INDICATOR_BANK.items():
            with st.expander(category, expanded=False):
                custom_list = S["custom_indicators"].setdefault(category, [])
                rows = list(indicators) + [(n, "Custom indicator", "", None) for n in custom_list]
                for name, source_hint, unit_hint, citation in rows:
                    cols = st.columns([4, 2, 2, 3])
                    checked = name in S["selected_indicators"]
                    use_it = cols[0].checkbox(name, value=checked, key=f"chk_{name}")
                    cols[0].caption(f"Data source: {source_hint}"
                                    + (f" · typical unit: {unit_hint}" if unit_hint else ""))
                    if use_it:
                        entry = S["selected_indicators"].get(name, {
                            "category": category, "feasibility": "Medium",
                            "relevance": "Medium", "unit": unit_hint,
                            "current_value": "", "target": "", "frequency": "",
                            "data_source": source_hint, "pathway_link": "",
                            "citation": citation,
                        })
                        entry["feasibility"] = cols[1].selectbox(
                            "Feasibility", scoring.LEVELS,
                            index=scoring.LEVELS.index(entry["feasibility"]),
                            key=f"feas_{name}")
                        entry["relevance"] = cols[2].selectbox(
                            "Relevance", scoring.LEVELS,
                            index=scoring.LEVELS.index(entry["relevance"]),
                            key=f"rel_{name}")
                        bucket = scoring.bucket_indicator(entry["feasibility"], entry["relevance"])
                        cols[3].markdown(f"**→ {bucket}**")
                        S["selected_indicators"][name] = entry
                    else:
                        S["selected_indicators"].pop(name, None)

                new_custom = st.text_input(f"Add custom indicator to “{category}”",
                                           key=f"custom_in_{category}")
                if st.button("Add", key=f"add_{category}"):
                    if new_custom and new_custom not in custom_list:
                        custom_list.append(new_custom)
                        st.rerun()

        if S["selected_indicators"]:
            st.divider()
            buckets = scoring.group_by_bucket(S["selected_indicators"])
            core_n = len(buckets[scoring.BUCKET_CORE])
            (st.success if 1 <= core_n <= 5 else st.warning)(
                f"Core set: {core_n} indicator(s). Recommended: 3–5 at early stages.")
            for b in scoring.BUCKET_ORDER:
                if buckets[b]:
                    st.markdown(f"**{b}** — " + "; ".join(n for n, _ in buckets[b]))

    # --- Tab 2: details ---------------------------------------------------
    with tab_detail:
        if not S["selected_indicators"]:
            st.info("Select indicators in the first tab.")
        stage_options = ["(not linked)"] + pathway_stage_names()
        for name, entry in S["selected_indicators"].items():
            with st.expander(f"{name} — "
                             f"{scoring.bucket_indicator(entry['feasibility'], entry['relevance'])}"):
                c1, c2, c3 = st.columns(3)
                entry["unit"] = c1.text_input("Unit", value=entry.get("unit") or "",
                                              key=f"unit_{name}")
                entry["current_value"] = c2.text_input(
                    "Current value (leave blank if none yet)",
                    value=entry.get("current_value", ""), key=f"val_{name}")
                entry["target"] = c3.text_input("Target (optional)",
                                                value=entry.get("target", ""),
                                                key=f"tgt_{name}")
                c4, c5 = st.columns(2)
                entry["frequency"] = c4.selectbox(
                    "Measurement frequency",
                    ["", "Monthly", "Quarterly", "Annually", "Per milestone"],
                    index=["", "Monthly", "Quarterly", "Annually", "Per milestone"].index(
                        entry.get("frequency", "")),
                    key=f"freq_{name}")
                entry["data_source"] = c5.text_input(
                    "Actual data source you will use",
                    value=entry.get("data_source", ""), key=f"src_{name}")
                link = entry.get("pathway_link") or "(not linked)"
                entry["pathway_link"] = st.selectbox(
                    "Which impact-pathway stage does this indicator evidence?",
                    stage_options,
                    index=stage_options.index(link) if link in stage_options else 0,
                    key=f"link_{name}")
                if entry["pathway_link"] == "(not linked)":
                    entry["pathway_link"] = ""

    # --- Tab 3: matrix ------------------------------------------------------
    with tab_matrix:
        if not S["selected_indicators"]:
            st.info("Select indicators in the first tab to see the matrix.")
        else:
            lvl_num = {"Low": 1, "Medium": 2, "High": 3}
            rows = []
            for name, e in S["selected_indicators"].items():
                rows.append({
                    "Indicator": name,
                    "Feasibility": lvl_num[e["feasibility"]],
                    "Relevance": lvl_num[e["relevance"]],
                    "Bucket": scoring.bucket_indicator(e["feasibility"], e["relevance"]),
                })
            df = pd.DataFrame(rows)
            chart = (
                alt.Chart(df)
                .mark_circle(size=220)
                .encode(
                    x=alt.X("Feasibility:Q", scale=alt.Scale(domain=[0.5, 3.5]),
                            axis=alt.Axis(values=[1, 2, 3],
                                          labelExpr="datum.value == 1 ? 'Low' : datum.value == 2 ? 'Medium' : 'High'")),
                    y=alt.Y("Relevance:Q", scale=alt.Scale(domain=[0.5, 3.5]),
                            axis=alt.Axis(values=[1, 2, 3],
                                          labelExpr="datum.value == 1 ? 'Low' : datum.value == 2 ? 'Medium' : 'High'")),
                    color=alt.Color(
                        "Bucket:N",
                        scale=alt.Scale(
                            domain=scoring.BUCKET_ORDER,
                            range=["#2F6B4E", "#DE9B33", "#7E947F",
                                   "#A9B8AE", "#B4553B"]),
                        legend=alt.Legend(orient="bottom")),
                    tooltip=["Indicator", "Bucket"],
                    xOffset=alt.XOffset("Indicator:N"),
                )
                .properties(height=420, title="Feasibility–Relevance Scoring Matrix")
            )
            st.altair_chart(chart, use_container_width=True)
            st.caption("Top-right = core set. Top-left = aspirational (relevant but "
                       "not yet feasible). Bottom row = excluded regardless of "
                       "feasibility. Points are offset slightly where scores coincide.")

    # --- Tab 4: quick Scope 1+2 estimator ------------------------------------
    with tab_calc:
        st.write(
            "Screening-level estimate of operational Scope 1 & 2 emissions using "
            "**generic emission factors**. Results are **modelled** claims: replace "
            "the factors with country- and year-specific published values before "
            "external reporting."
        )
        total_s1 = total_s2 = 0.0
        for source, meta in ref.EMISSION_FACTORS.items():
            c1, c2 = st.columns([2, 3])
            qty = c1.number_input(f"{source} per year", min_value=0.0, value=0.0,
                                  key=f"ef_{source}")
            kg = qty * meta["factor"]
            c2.caption(f"× {meta['factor']} {meta['unit_note']} → "
                       f"**{kg / 1000:.2f} t CO₂e** (Scope {meta['scope']})")
            if meta["scope"] == 1:
                total_s1 += kg
            else:
                total_s2 += kg
        st.metric("Estimated Scope 1", f"{total_s1 / 1000:.2f} t CO₂e / yr")
        st.metric("Estimated Scope 2 (location-based)", f"{total_s2 / 1000:.2f} t CO₂e / yr")
        st.caption("If you use these values to populate an emissions indicator, "
                   "label the claim **Modelled** in Module 4 and record the factors "
                   "used as its assumptions.")

    b1, _, b2 = st.columns([1, 2, 1])
    if b1.button("← Back", use_container_width=True):
        goto(2)
    if b2.button("Next · Uncertainty →", type="primary", use_container_width=True):
        goto(4)

# ===========================================================================
# STEP 4 — Uncertainty acknowledgement
# ===========================================================================

elif step == 4:
    ui.module_header(
        4, 5, "Module 4 of 4 · Step 4 of 5",
        "Uncertainty acknowledgement",
        "Every impact claim carries an explicit characterization of its "
        "uncertainty: the assumptions behind it, the data it relies on, and the "
        "conditions under which it could differ. Label each claim measured, "
        "modelled, or projected — all three are legitimate early on, but only "
        "measured claims count as evidence; projected claims belong in the "
        "impact-pathway narrative.")

    buckets = scoring.group_by_bucket(S["selected_indicators"])
    to_label = [n for b in (scoring.BUCKET_CORE, scoring.BUCKET_ASPIRATIONAL,
                            scoring.BUCKET_SUPPLEMENTARY)
                for n, _ in buckets[b]]

    # prune uncertainty entries for deselected indicators
    for gone in [n for n in S["uncertainty"] if n not in to_label]:
        del S["uncertainty"][gone]

    if not to_label:
        st.warning("No core/aspirational/supplementary indicators yet — go back to "
                   "Module 3 and select some.")
    for name in to_label:
        entry = S["selected_indicators"][name]
        bucket = scoring.bucket_indicator(entry["feasibility"], entry["relevance"])
        u = S["uncertainty"].get(name, {"level": "Modelled", "claim": "",
                                        "assumptions": "", "conditions": ""})
        with st.container(border=True):
            st.markdown(f"**{name}**  \n:gray[{entry['category']} · {bucket}"
                        + (f" · current value: {entry['current_value']} {entry.get('unit','')}"
                           if entry.get("current_value") else "") + "]")
            u["claim"] = st.text_input(
                "The impact claim as you would state it publicly (optional)",
                value=u.get("claim", ""), key=f"claim_{name}",
                placeholder="e.g. “Our users reduce pesticide application by 14% per hectare.”")
            u["level"] = st.radio(
                "Evidential confidence", list(ref.CONFIDENCE_LEVELS.keys()),
                index=list(ref.CONFIDENCE_LEVELS.keys()).index(u["level"]),
                horizontal=True, key=f"lvl_{name}")
            st.caption(ref.CONFIDENCE_LEVELS[u["level"]])
            if u["level"] == "Projected":
                st.warning("Projected: report this in the impact-pathway narrative, "
                           "clearly separated from evidence.", icon="⚠️")
            u["assumptions"] = st.text_area(
                "Assumptions and data sources driving this estimate",
                value=u["assumptions"], key=f"ass_{name}", height=68)
            u["conditions"] = st.text_area(
                "Conditions under which the estimate could be significantly different",
                value=u["conditions"], key=f"cond_{name}", height=68)
            S["uncertainty"][name] = u

    b1, _, b2 = st.columns([1, 2, 1])
    if b1.button("← Back", use_container_width=True):
        goto(3)
    if b2.button("Next · Review & report →", type="primary", use_container_width=True):
        goto(5)

# ===========================================================================
# STEP 5 — Review, report & export
# ===========================================================================

elif step == 5:
    ui.module_header(
        5, 5, "Synthesis · Step 5 of 5",
        "Review, report & export",
        "Run the automated integrity checks, schedule the next review "
        "milestone, then export the assessment as a report.")

    # Review plan (design-for-updating principle)
    st.subheader("Review & updating plan")
    st.write("The framework is designed for updating, not for completion: schedule "
             "the next milestone at which this assessment will be revisited.")
    c1, c2 = st.columns([1, 2])
    milestone = c1.selectbox(
        "Next review milestone", ref.REVIEW_MILESTONES,
        index=ref.REVIEW_MILESTONES.index(S["next_review_milestone"])
        if S["next_review_milestone"] in ref.REVIEW_MILESTONES else 0)
    S["next_review_milestone"] = milestone
    S["review_notes"] = c2.text_input("Notes for the next review (optional)",
                                      value=S["review_notes"])

    # Integrity checks
    st.subheader("Integrity checks")
    checks = scoring.run_integrity_checks(S["selected_indicators"], S["uncertainty"],
                                          pathway_stage_names())
    for sev, msg in checks:
        {"warning": st.warning, "info": st.info, "ok": st.success}[sev](msg)

    st.divider()

    # Report
    data = rpt.assemble(state_dict())
    report_md = rpt.to_markdown(data)
    report_html = rpt.to_html(data)
    report_json = rpt.export_state(state_dict())
    try:
        report_docx = rpt.to_docx(data)
        docx_error = None
    except Exception as exc:
        report_docx = None
        docx_error = str(exc)

    st.subheader("Report preview")
    with st.container(border=True):
        st.markdown(report_md)

    st.subheader("Export")
    name_slug = (S["startup_name"] or "assessment").replace(" ", "_")

    st.markdown("**Recommended: Word document** — headings, a table of contents, "
               "styled indicator tables, and colour-coded confidence badges. The "
               "easiest format to read, comment on, or hand to an investor.")
    if report_docx is not None:
        st.download_button("Download Word report (.docx)", data=report_docx,
                           file_name=f"{name_slug}_impact_report.docx",
                           mime="application/vnd.openxmlformats-officedocument"
                                ".wordprocessingml.document",
                           use_container_width=True, type="primary")
        st.caption("On first opening in Word: right-click the table of contents "
                   "and choose “Update Field” to populate it.")
    else:
        st.error(f"Word export failed: {docx_error}")

    with st.expander("Other export formats (HTML, Markdown, JSON)"):
        c2, c3, c4 = st.columns(3)
        c2.download_button("HTML (print to PDF)", data=report_html,
                           file_name=f"{name_slug}_impact_report.html",
                           mime="text/html", use_container_width=True)
        c3.download_button("Markdown", data=report_md,
                           file_name=f"{name_slug}_impact_report.md",
                           mime="text/markdown", use_container_width=True)
        c4.download_button("Assessment file (JSON)",
                           data=report_json,
                           file_name=f"{name_slug}_assessment_v{S['assessment_version']}.json",
                           mime="application/json", use_container_width=True)
        st.caption("Keep the JSON file (not the Word doc) to resume the assessment "
                   "later — it's the only format that round-trips back into the tool.")

    if st.button("← Back", use_container_width=False):
        goto(4)
