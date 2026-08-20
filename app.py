"""
Startup Environmental Impact Assessment Tool (v2.1, polished UI)
==================================================================
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
import assistant
import ui
import welcome

st.set_page_config(page_title="EIA: Startup Environmental Impact Assessment",
                   page_icon="🌿", layout="wide")

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

DEFAULTS = {
    "step": 1,
    # the intro page is shown first; set once the reader continues
    "seen_welcome": False,
    "startup_name": "",
    "startup_desc": "",
    "sector": "",
    "stage": "Ideation",
    # None until the user answers the diagnostic questions. The
    # classification is required input, so it must never be silently
    # defaulted and skipped over.
    "mechanism": None,
    "orientation": None,
    "is_hybrid": False,
    "secondary_mechanism": None,
    "pathway": {},
    "weakest_links": "",
    "selected_indicators": {},
    "custom_indicators": {},
    "uncertainty": {},
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


def classified() -> bool:
    """Both diagnostic questions answered. Required before steps 2-5."""
    return (S["mechanism"] in ("Direct", "Enabling")
            and S["orientation"] in ("Primary", "Secondary"))


def current_classification():
    return ref.CLASSIFICATION_MATRIX[(S["mechanism"], S["orientation"])]


def require_profile():
    """Steps 2-5 depend on the name and the diagnostic classification.
    Block the step (navigation itself stays possible) until step 1 has the
    minimal required input."""
    missing = []
    if not S["startup_name"]:
        missing.append("the startup name")
    if not classified():
        missing.append("the two diagnostic questions")
    if missing:
        st.warning("**Complete step 1 first.** Still missing: "
                   + " and ".join(missing) + ". The classification determines which pathway "
                   "template, indicators, and guidance apply to your startup, so "
                   "the assessment cannot continue without it.", icon="🧭")
        if st.button("← Go to step 1 (Profile & classify)", type="primary"):
            goto(1)
        finalize_chrome()
        st.stop()


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


step = S["step"]
step_statuses = ui.step_status(S)
ui.inject_css(active_step=step, statuses=step_statuses)


def _leave_welcome(target_step=1):
    S["seen_welcome"] = True
    S["step"] = target_step
    st.rerun()


# The introduction page stands in front of the tool on a first visit, and
# stays reachable afterwards from the sidebar.
if not S["seen_welcome"]:
    welcome.page(on_start=_leave_welcome,
                 on_resume=lambda: _leave_welcome(1))
    st.stop()

# ---------------------------------------------------------------------------
# Sidebar: brand, workflow rail, stage card, save & resume
# ---------------------------------------------------------------------------

with st.sidebar:
    ui.sidebar_brand()
    st.markdown('<div class="eia-eyebrow">Workflow</div>', unsafe_allow_html=True)

    for s_num in range(1, 6):
        name, _sub = ui.STEP_META[s_num]
        with st.container(key=f"navrow{s_num}"):
            if st.button(name, key=f"navbtn{s_num}", use_container_width=True):
                goto(s_num)

    # Progress and export are filled in at the END of the script run (see
    # finalize_chrome) so they reflect values entered during this run instead
    # of lagging one interaction behind.
    prog_slot = st.container()

    export_slot = st.container()

    assistant.panel(S)

    st.markdown(
        '<div class="eia-sidecard"><b>Save & resume</b>'
        '<div style="margin-top:.35rem">Progress lives in this browser session. '
        'Download the assessment file (JSON) above at any time; re-import it '
        'here to resume or start a new review cycle.</div></div>',
        unsafe_allow_html=True,
    )
    with st.expander("⬆️ Import assessment (JSON)"):
        up = st.file_uploader("Assessment file", type=["json"],
                              label_visibility="collapsed")
        if up is not None and not S.get("_imported"):
            try:
                loaded = rpt.import_state(up.read().decode("utf-8"))
                for k, v in loaded.items():
                    if k in DEFAULTS and v is not None:
                        S[k] = v
                # drop the stage widget's mirror state so the selectbox
                # re-initializes from the imported value
                S.pop("stage_widget", None)
                S["_imported"] = True
                st.success(f"Loaded. You are now on review cycle v{S['assessment_version']}.")
                st.rerun()
            except Exception as exc:
                st.error(f"Could not load file: {exc}")

    if st.button("📖 Introduction & guide", key="show_guide",
                 use_container_width=True):
        S["seen_welcome"] = False
        st.rerun()

    if st.button("↺ Restart assessment", key="restart", use_container_width=True):
        for k in list(st.session_state.keys()):
            del st.session_state[k]
        init_state()
        st.rerun()

    st.markdown(f'<div class="eia-footer">v2.1 · Review cycle v{S["assessment_version"]}</div>',
                unsafe_allow_html=True)


def finalize_chrome():
    """Fill the deferred sidebar slots (progress, export) and refresh the
    nav-rail completion styling using the state as it stands AFTER this
    run's widgets have written their values."""
    statuses = ui.step_status(S)
    with prog_slot:
        ui.sidebar_progress(ui.overall_pct(statuses))
    with export_slot:
        st.markdown('<div class="eia-eyebrow">Export</div>', unsafe_allow_html=True)
        if S["startup_name"] and classified():
            name_slug = S["startup_name"].replace(" ", "_")
            data = rpt.assemble(state_dict())
            try:
                st.download_button(
                    "📄 Word report (.docx)", data=rpt.to_docx(data),
                    file_name=f"{name_slug}_impact_report.docx",
                    mime="application/vnd.openxmlformats-officedocument"
                         ".wordprocessingml.document",
                    use_container_width=True, type="primary", key="side_docx")
            except Exception as exc:
                st.caption(f"Word export unavailable: {exc}")
            st.download_button(
                "💾 Save progress (.json)", data=rpt.export_state(state_dict()),
                file_name=f"{name_slug}_assessment_v{S['assessment_version']}.json",
                mime="application/json", use_container_width=True, key="side_json")
            st.caption("**JSON is the save file**: re-import it under "
                       "“Save & resume” to continue this assessment later. "
                       "The Word report is the finished document to share.")
        else:
            st.caption("Complete step 1 (name + the two diagnostic questions) "
                       "to unlock export.")
    ui.nav_status_css(step, statuses)

# ===========================================================================
# STEP 1: Profiling & classification
# ===========================================================================

if step == 1:
    ui.hero(1, "Profile & classify your startup",
            "Tell us about your startup and answer two diagnostic questions. "
            "This classifies your impact pathway and tailors the whole assessment.")

    left, right = st.columns([1.85, 1], gap="large")

    with left:
        with st.container(border=True):
            st.markdown("#### About your startup")
            c1, c2 = st.columns(2)
            with c1:
                S["startup_name"] = st.text_input(
                    "Startup name", value=S["startup_name"],
                    placeholder="e.g., GreenPack Solutions")
                S["sector"] = st.text_input(
                    "Sector / domain", value=S["sector"],
                    placeholder="e.g., AgTech, packaging, SaaS")
            with c2:
                def _sync_stage():
                    S["stage"] = S["stage_widget"]

                S["stage"] = st.selectbox(
                    "Development stage", ref.STAGES,
                    index=ref.STAGES.index(S["stage"]),
                    key="stage_widget", on_change=_sync_stage,
                    help="The framework adapts its guidance: module depth "
                         "varies by development stage.")
                st.caption(ref.STAGE_SHORT[S["stage"]])
            S["startup_desc"] = st.text_area(
                "Short description", value=S["startup_desc"],
                placeholder="What does your startup do, and for whom? (1–3 sentences)")

        with st.container(border=True):
            st.markdown("#### Diagnostic classification")
            st.caption("**Both questions are required.** Your answers classify "
                       "your impact mechanism and drive the whole assessment.")
            st.caption("*Why this matters:* a clear classification now makes "
                       "your indicators, data, and claims more credible and "
                       "defensible later.")

            mech_opts = list(ref.DIAGNOSTIC_MECHANISM["options"].keys())
            mech_idx = {"Direct": 0, "Enabling": 1}.get(S["mechanism"])
            mech_answer = st.radio(ref.DIAGNOSTIC_MECHANISM["question"],
                                   mech_opts, index=mech_idx)
            if mech_answer is not None:
                S["mechanism"] = ref.DIAGNOSTIC_MECHANISM["options"][mech_answer]

            if S["mechanism"] is not None:
                S["is_hybrid"] = st.checkbox(
                    "Hybrid: a meaningful share of the impact also arises through the "
                    "*other* mechanism",
                    value=S["is_hybrid"],
                    help="e.g. an enabling startup with a measurable direct footprint, "
                         "or hardware with both direct and enabling effects. The "
                         "secondary track gets lighter-touch screening.")
                S["secondary_mechanism"] = (
                    ("Enabling" if S["mechanism"] == "Direct" else "Direct")
                    if S["is_hybrid"] else None)
                if S["is_hybrid"]:
                    st.caption(f"Primary track: **{S['mechanism']}** · Secondary track "
                               f"(light-touch): **{S['secondary_mechanism']}**")

            ori_opts = list(ref.DIAGNOSTIC_ORIENTATION["options"].keys())
            ori_idx = {"Primary": 0, "Secondary": 1}.get(S["orientation"])
            ori_answer = st.radio(ref.DIAGNOSTIC_ORIENTATION["question"],
                                  ori_opts, index=ori_idx)
            if ori_answer is not None:
                S["orientation"] = ref.DIAGNOSTIC_ORIENTATION["options"][ori_answer]

        # The next action sits directly below the form it completes, and
        # stays disabled until the required fields are filled in.
        ready = bool(S["startup_name"]) and classified()
        if st.button("Save & continue →", type="primary",
                     use_container_width=True, disabled=not ready):
            goto(2)
        if not ready:
            missing = []
            if not S["startup_name"]:
                missing.append("enter a startup name")
            if not classified():
                missing.append("answer both diagnostic questions")
            st.caption("To continue: " + " and ".join(missing) + ".")

    with right:
        ui.card("Key terms", """
            <ul class="eia-terms">
              <li><b>Impact mechanism</b>: how the environmental benefit comes
                  about. <i>Direct</i>: your product or service delivers it by
                  itself. <i>Enabling</i>: it only happens when customers adopt
                  your solution and change what they do.</li>
              <li><b>Value orientation</b>. <i>Primary</i>: environmental
                  improvement is the point of your offering. <i>Secondary</i>:
                  your offering is commercial, and the environmental effect is a
                  by-product.</li>
              <li><b>Impact pathway</b>: the step-by-step cause-and-effect
                  chain from what you do to the environmental impact you claim
                  (mapped in step 2).</li>
              <li><b>Hybrid</b>: a meaningful share of the impact arises through
                  both mechanisms; the secondary one gets a lighter check.</li>
            </ul>""", quiet=True)

# ===========================================================================
# STEP 2: Impact pathway mapping
# ===========================================================================

elif step == 2:
    require_profile()
    cls = current_classification()
    template = ref.PATHWAY_TEMPLATES[cls["pathway_template"]]

    ui.hero(2, "Map your impact pathway",
            "Trace the causal chain from what you do to the environmental impact "
            "you claim, and state the assumption behind every link. This is what "
            "makes impact claims honest.")

    left, right = st.columns([1.85, 1], gap="large")

    with left:
        st.markdown(f"**Template applied ({cls['label']}):** {template['name']}")
        st.caption(template["description"])

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
        if S["is_hybrid"] and S["secondary_mechanism"]:
            sec_template = ref.PATHWAY_TEMPLATES[
                "lifecycle" if S["secondary_mechanism"] == "Direct" else "adoption"]
            sec_track = dict(sec_template["tracks"][0])
            sec_track["track"] = f"Secondary track (light-touch): {sec_track['track']}"
            template_tracks = template["tracks"] + [sec_track]
            expected_tracks.append(sec_track["track"])
        else:
            template_tracks = template["tracks"]

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
            placeholder="e.g. The assumption that farmers follow dosing "
                        "recommendations is the weakest link: adoption ≠ behavior change.")

        b1, _, b2 = st.columns([1, 2, 1])
        if b1.button("← Back", use_container_width=True):
            goto(1)
        if b2.button("Save & continue →", type="primary", use_container_width=True):
            goto(3)

    with right:
        stages_flat = [s for t in S["pathway"].values() for s in t]
        described = sum(1 for s in stages_flat if s.get("description"))
        weak_n = sum(1 for s in stages_flat if s.get("evidence") == "Weak (assumption only)")
        ui.card("Pathway at a glance", ui.kv_rows([
            ("Tracks", str(len(S["pathway"]))),
            ("Stages described", f"{described} / {len(stages_flat)}"),
            ("Weak links flagged", str(weak_n)),
        ]), icon="🗺️")
        ui.card("Why this matters",
                "Every stage carries an assumption. Naming the weak ones now is "
                "not a weakness. It tells you exactly where measurement is "
                "most needed.", icon="❝", quiet=True)

    ui.tip_banner("A weak link is a finding, not a failure. Investors trust an "
                  "honest chain more than a perfect story.")

# ===========================================================================
# STEP 3: Indicator selection
# ===========================================================================

elif step == 3:
    require_profile()
    ui.hero(3, "Select your indicators",
            "Score each candidate on relevance (is it material to your pathway?) "
            "and feasibility (can you populate it with data you hold?). Aim for a "
            "core set of 3–5.")

    left, right = st.columns([1.85, 1], gap="large")

    with left:
        tab_select, tab_detail, tab_matrix, tab_calc = st.tabs(
            ["① Select & score", "② Indicator details", "③ Scoring matrix",
             "④ Quick Scope 1+2 estimator"])

        with tab_select:
            for category, indicators in ref.INDICATOR_BANK.items():
                with st.expander(category, expanded=False):
                    custom_list = S["custom_indicators"].setdefault(category, [])
                    rows = list(indicators) + [(n, "Custom indicator", "", None)
                                               for n in custom_list]
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
                            bucket = scoring.bucket_indicator(entry["feasibility"],
                                                              entry["relevance"])
                            cols[3].markdown(f"**→ {bucket}**")
                            S["selected_indicators"][name] = entry
                        else:
                            S["selected_indicators"].pop(name, None)

                    new_custom = st.text_input(
                        f"Add custom indicator to “{category}”",
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
                        st.markdown(f"**{b}**: " + "; ".join(n for n, _ in buckets[b]))

        with tab_detail:
            if not S["selected_indicators"]:
                st.info("Select indicators in the first tab.")
            stage_options = ["(not linked)"] + pathway_stage_names()
            for name, entry in S["selected_indicators"].items():
                with st.expander(
                        f"{name}: "
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
                        index=["", "Monthly", "Quarterly", "Annually",
                               "Per milestone"].index(entry.get("frequency", "")),
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
                        color=alt.Color("Bucket:N", legend=alt.Legend(orient="bottom")),
                        tooltip=["Indicator", "Bucket"],
                        xOffset=alt.XOffset("Indicator:N"),
                    )
                    .properties(height=420, title="Feasibility–Relevance Scoring Matrix")
                    # Colours pinned to the app palette so the chart renders
                    # identically whatever theme Streamlit resolves, because Vega
                    # otherwise inherits a dark theme in dark-mode browsers.
                    .configure(background="white")
                    .configure_view(fill="white", stroke=ui.BORDER)
                    .configure_axis(labelColor=ui.INK, titleColor=ui.INK,
                                    gridColor="#ECECE2", domainColor=ui.BORDER,
                                    tickColor=ui.BORDER)
                    .configure_legend(labelColor=ui.INK, titleColor=ui.INK)
                    .configure_title(color=ui.INK)
                )
                # theme=None keeps Streamlit from re-theming the chart on top
                # of the explicit configuration above.
                st.altair_chart(chart, use_container_width=True, theme=None)
                st.caption("Top-right = core set. Top-left = aspirational (relevant "
                           "but not yet feasible). Bottom row = excluded regardless "
                           "of feasibility.")

        with tab_calc:
            st.write(
                "Screening-level estimate of operational Scope 1 & 2 emissions "
                "using **generic emission factors**. Results are **modelled** "
                "claims: replace the factors with country- and year-specific "
                "published values before external reporting."
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
            st.metric("Estimated Scope 2 (location-based)",
                      f"{total_s2 / 1000:.2f} t CO₂e / yr")
            st.caption("If you use these values to populate an emissions indicator, "
                       "label the claim **Modelled** in step 4 and record the "
                       "factors used as its assumptions.")

        b1, _, b2 = st.columns([1, 2, 1])
        if b1.button("← Back ", use_container_width=True):
            goto(2)
        if b2.button("Save & continue →", type="primary", use_container_width=True):
            goto(4)

    with right:
        buckets = scoring.group_by_bucket(S["selected_indicators"])
        core_n = len(buckets[scoring.BUCKET_CORE])
        ui.card("Indicator set", ui.kv_rows([
            ("Selected", str(len(S["selected_indicators"]))),
            ("Core set", f"{core_n} (aim for 3–5)"),
            ("Aspirational", str(len(buckets[scoring.BUCKET_ASPIRATIONAL]))),
            ("Excluded", str(len(buckets[scoring.BUCKET_EXCLUDED]))),
        ]), icon="🎯")
        ui.card("Why this matters",
                "Metrics that are easy to report but not material are how "
                "greenwashing happens by accident. The scoring excludes them "
                "by design.", icon="❝", quiet=True)

    ui.tip_banner("Fewer, well-evidenced indicators beat a long list. Link each "
                  "core indicator to the pathway stage it proves.")

# ===========================================================================
# STEP 4: Uncertainty acknowledgement
# ===========================================================================

elif step == 4:
    require_profile()
    ui.hero(4, "Label your uncertainty",
            "Every impact claim gets an evidential confidence level (measured, "
            "modelled, or projected) plus the assumptions behind it. All three "
            "are legitimate; conflating them is not.")

    left, right = st.columns([1.85, 1], gap="large")

    with left:
        buckets = scoring.group_by_bucket(S["selected_indicators"])
        to_label = [n for b in (scoring.BUCKET_CORE, scoring.BUCKET_ASPIRATIONAL,
                                scoring.BUCKET_SUPPLEMENTARY)
                    for n, _ in buckets[b]]

        for gone in [n for n in S["uncertainty"] if n not in to_label]:
            del S["uncertainty"][gone]

        if not to_label:
            st.warning("No core/aspirational/supplementary indicators yet. Go "
                       "back to step 3 and select some.")
        for name in to_label:
            entry = S["selected_indicators"][name]
            bucket = scoring.bucket_indicator(entry["feasibility"], entry["relevance"])
            u = S["uncertainty"].get(name, {"level": "Modelled", "claim": "",
                                            "assumptions": "", "conditions": ""})
            with st.container(border=True):
                st.markdown(f"**{name}**  \n:gray[{entry['category']} · {bucket}"
                            + (f" · current value: {entry['current_value']} {entry.get('unit', '')}"
                               if entry.get("current_value") else "") + "]")
                u["claim"] = st.text_input(
                    "The impact claim as you would state it publicly (optional)",
                    value=u.get("claim", ""), key=f"claim_{name}",
                    placeholder="e.g. “Our users reduce pesticide application by "
                                "14% per hectare.”")
                u["level"] = st.radio(
                    "Evidential confidence", list(ref.CONFIDENCE_LEVELS.keys()),
                    index=list(ref.CONFIDENCE_LEVELS.keys()).index(u["level"]),
                    horizontal=True, key=f"lvl_{name}")
                st.caption(ref.CONFIDENCE_LEVELS[u["level"]])
                if u["level"] == "Projected":
                    st.warning("Projected: report this in the impact-pathway "
                               "narrative, clearly separated from evidence.", icon="⚠️")
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
        if b2.button("Save & continue →", type="primary", use_container_width=True):
            goto(5)

    with right:
        counts = {"Measured": 0, "Modelled": 0, "Projected": 0}
        for u in S["uncertainty"].values():
            if u.get("level") in counts:
                counts[u["level"]] += 1
        ui.card("Evidence mix", ui.kv_rows([
            ("🟢 Measured", str(counts["Measured"])),
            ("🟡 Modelled", str(counts["Modelled"])),
            ("🟣 Projected", str(counts["Projected"])),
        ]), icon="⚖️")
        ui.card("Why this matters",
                "Only measured claims count as evidence. Projected claims belong "
                "in the narrative. Labelling the difference is what makes the "
                "report trustworthy.", icon="❝", quiet=True)

    ui.tip_banner("A modelled or projected claim is fine. An unlabelled one "
                  "is not. State the assumptions and move on.")

# ===========================================================================
# STEP 5: Review, report & export
# ===========================================================================

elif step == 5:
    require_profile()
    ui.hero(5, "Review, report & export",
            "Set the next review milestone, run the integrity checks, and export "
            "your report. This assessment is designed for updating, not for "
            "completion.", art=False)

    left, right = st.columns([1.85, 1], gap="large")

    with left:
        with st.container(border=True):
            st.markdown("#### Review & updating plan")
            c1, c2 = st.columns([1, 2])
            milestone = c1.selectbox(
                "Next review milestone", ref.REVIEW_MILESTONES,
                index=ref.REVIEW_MILESTONES.index(S["next_review_milestone"])
                if S["next_review_milestone"] in ref.REVIEW_MILESTONES else None,
                placeholder="Select a milestone…")
            S["next_review_milestone"] = milestone or ""
            S["review_notes"] = c2.text_input("Notes for the next review (optional)",
                                              value=S["review_notes"])

        st.markdown("#### Integrity checks")
        checks = scoring.run_integrity_checks(S["selected_indicators"],
                                              S["uncertainty"], pathway_stage_names())
        for sev, msg in checks:
            {"warning": st.warning, "info": st.info, "ok": st.success}[sev](msg)

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

        with st.expander("📄 Report preview", expanded=False):
            st.markdown(report_md)

        st.markdown("#### Export")
        name_slug = (S["startup_name"] or "assessment").replace(" ", "_")

        # Two files, two distinct jobs, stated side by side so the JSON's
        # role as the save/resume format is unmistakable.
        e1, e2 = st.columns(2)
        with e1:
            st.markdown("**📄 The report, for sharing**")
            if report_docx is not None:
                st.download_button("Download Word report (.docx)", data=report_docx,
                                   file_name=f"{name_slug}_impact_report.docx",
                                   mime="application/vnd.openxmlformats-officedocument"
                                        ".wordprocessingml.document",
                                   use_container_width=True, type="primary")
                st.caption("The complete document: headings, table of contents, "
                           "indicator tables, confidence badges. On first "
                           "opening in Word, right-click the table of contents "
                           "and choose “Update Field” to populate it.")
            else:
                st.error(f"Word export failed: {docx_error}")
        with e2:
            st.markdown("**💾 The save file, for continuing later**")
            st.download_button("Save progress (.json)", data=report_json,
                               file_name=f"{name_slug}_assessment_v{S['assessment_version']}.json",
                               mime="application/json", use_container_width=True)
            st.caption("**JSON is the only format that loads back into the "
                       "tool.** Keep it to resume this assessment at your next "
                       "review milestone. Re-import it under “Save & resume” "
                       "in the sidebar, which starts a new review cycle.")

        with st.expander("Other formats (HTML, Markdown)"):
            c2, c3 = st.columns(2)
            c2.download_button("⬇️ HTML (print to PDF)", data=report_html,
                               file_name=f"{name_slug}_impact_report.html",
                               mime="text/html", use_container_width=True)
            c3.download_button("⬇️ Markdown", data=report_md,
                               file_name=f"{name_slug}_impact_report.md",
                               mime="text/markdown", use_container_width=True)
            st.caption("Alternative formats of the same report. Neither can be "
                       "re-imported. Use the JSON save file for that.")

        if st.button("← Back", use_container_width=False):
            goto(4)

    with right:
        warn_n = sum(1 for sev, _ in checks if sev == "warning")
        buckets = scoring.group_by_bucket(S["selected_indicators"])
        ui.card("Assessment summary", ui.kv_rows([
            ("Startup", S["startup_name"] or "Not set"),
            ("Classification", current_classification()["label"]),
            ("Core indicators", str(len(buckets[scoring.BUCKET_CORE]))),
            ("Warnings", str(warn_n)),
            ("Next review", S["next_review_milestone"] or "Not set"),
        ]), icon="📋")
        ui.card("Review cycles",
                f"You are on review cycle <b>v{S['assessment_version']}</b>. "
                "Re-importing the exported JSON later starts cycle "
                f"v{S['assessment_version'] + 1}. The framework treats this as "
                "a living document.", icon="🔁", quiet=True)

    ui.tip_banner("Warnings are guidance, not blockers, but each one you "
                  "resolve makes the report harder to challenge.",
                  title="Before you export")

finalize_chrome()
