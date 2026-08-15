"""
ui.py — visual layer for the assessment tool.

All styling and presentational HTML lives here so app.py stays focused on
flow and logic. Palette and layout follow the approved design mockup:
warm paper background, white cards, deep forest green, a numbered
workflow rail on the left, and a contextual info rail on the right.
"""

import streamlit as st

# ---------------------------------------------------------------------------
# Design tokens
# ---------------------------------------------------------------------------

GREEN = "#1E6A47"
GREEN_DARK = "#155034"
SAGE = "#E9F2EB"
PAPER = "#F7F7F1"
CARD = "#FFFFFF"
BORDER = "#E7E7DB"
INK = "#1C2A22"
MUTED = "#67736B"
GOLD = "#A97B0F"
PURPLE = "#7C5296"
RED = "#A23B3B"
BLUE = "#34608A"

STEP_META = {
    1: ("Profile & classify", "Understand your startup"),
    2: ("Impact pathway", "Map your impact"),
    3: ("Select indicators", "Choose what to measure"),
    4: ("Label uncertainty", "Assess confidence"),
    5: ("Report & export", "Review and export"),
}

_HERO_ART = """
<svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="230" cy="70" r="52" fill="#F2EBD9"/>
  <path d="M0 150 C 70 96, 150 128, 200 112 C 258 94, 292 120, 320 108 L 320 150 Z" fill="#DCE9DD"/>
  <path d="M0 150 C 90 120, 190 140, 320 124 L 320 150 Z" fill="#CBDFD2"/>
  <g stroke="#1E6A47" stroke-width="2.4" fill="none" stroke-linecap="round">
    <path d="M56 118 q 2 -22 0 -34"/>
    <path d="M56 96 q -12 -6 -14 -18 q 12 2 14 12"/>
    <path d="M56 88 q 12 -8 13 -20 q -12 2 -13 14"/>
    <path d="M262 116 q 2 -16 0 -24"/>
    <path d="M262 102 q -9 -4 -10 -13 q 9 1 10 9"/>
  </g>
  <g stroke="#8FB8A1" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M300 40 q 8 -4 14 -1 M303 47 q 9 -3 14 1" />
    <path d="M22 34 q 7 -4 13 -1 M25 41 q 8 -3 13 1" />
  </g>
</svg>
"""


# ---------------------------------------------------------------------------
# CSS
# ---------------------------------------------------------------------------

def _nav_rules(active_step: int, statuses: dict) -> str:
    """Per-row nav styling. A step is ticked only when its content is
    actually (minimally) filled in — see step_status() — never merely
    because the user navigated past it. Each row also gets a completion
    chip showing the step's fill percentage."""
    rules = []
    for i in range(1, 6):
        stt = statuses.get(i, {"pct": 0, "done": False})
        rules.append(f"""
        .st-key-navrow{i} button::before {{
            content: "{i}";
            display: inline-flex; align-items: center; justify-content: center;
            width: 1.55rem; height: 1.55rem; margin-right: .6rem;
            border-radius: 999px; font-size: .78rem; font-weight: 700;
            background: {CARD}; color: {MUTED};
            border: 1.5px solid {BORDER};
            flex: 0 0 auto;
        }}
        .st-key-navrow{i} button::after {{
            content: "{stt['pct']}%";
            margin-left: auto; flex: 0 0 auto;
            font-size: .66rem; font-weight: 700;
            border-radius: 999px; padding: .12rem .5rem;
            background: {SAGE if stt['done'] else '#ECECE2'};
            color: {GREEN if stt['done'] else MUTED};
        }}""")
        if stt["done"]:
            rules.append(f"""
            .st-key-navrow{i} button::before {{
                content: "\\2713";
                background: {SAGE}; color: {GREEN}; border-color: {SAGE};
            }}""")
    rules.append(f"""
    .st-key-navrow{active_step} button {{
        background: {SAGE} !important;
        font-weight: 600 !important; color: {INK} !important;
    }}
    .st-key-navrow{active_step} button::before {{
        background: {GREEN}; color: #fff; border-color: {GREEN};
    }}""")
    return "\n".join(rules)


def inject_css(active_step: int, statuses: dict):
    st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {{ color-scheme: light; }}
/* Fluid scaling: the entire UI (Streamlit widgets included) is sized in
   rem, so scaling the root font size with the viewport scales text and
   components together. ~15px on small laptops, ~16.5px at 1440px,
   ~18.5px at 1920px, capped at 21px on very large monitors. */
html {{ font-size: clamp(15px, 11.4px + 0.34vw, 21px) !important; }}
html, body, [data-testid="stAppViewContainer"] {{
    font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
    background: {PAPER};
    color: {INK};
}}
#MainMenu, footer {{ visibility: hidden; }}
header[data-testid="stHeader"] {{ background: transparent; }}

.block-container {{
    padding-top: 1.2rem; padding-bottom: 3rem;
    /* let the content area breathe on wide monitors */
    max-width: max(1250px, min(78vw, 1750px));
}}

/* ---------- sidebar ---------- */
[data-testid="stSidebar"] {{
    background: #FCFCF8;
    border-right: 1px solid {BORDER};
    min-width: 19rem !important;  /* scales with the fluid root font size */
}}
[data-testid="stSidebar"] .block-container {{ padding-top: 1.4rem; }}
[data-testid="stSidebar"] hr {{ margin: .8rem 0; }}

.eia-brand {{ display: flex; gap: .65rem; align-items: center; margin-bottom: 1.4rem; }}
.eia-brand .logo {{
    width: 2.6rem; height: 2.6rem; border-radius: .8rem;
    background: {SAGE}; display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
}}
.eia-brand .word {{ font-size: 1.45rem; font-weight: 800; color: {GREEN}; line-height: 1; }}
.eia-brand .sub {{ font-size: .68rem; color: {MUTED}; line-height: 1.25; margin-top: .2rem; }}

.eia-eyebrow {{
    font-size: .68rem; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: {MUTED}; margin: .4rem 0 .5rem 0;
}}

/* nav buttons */
[data-testid="stSidebar"] .stButton > button {{
    display: flex; align-items: center;
    width: 100%; justify-content: flex-start; text-align: left;
    background: transparent; border: none; border-radius: .7rem;
    padding: .5rem .6rem; color: {INK}; font-weight: 500;
    box-shadow: none; opacity: 1; cursor: pointer;
}}
[data-testid="stSidebar"] .stButton > button p {{ color: {INK}; }}
[data-testid="stSidebar"] .stButton > button:hover {{
    background: {SAGE}; color: {INK}; border: none;
}}
{_nav_rules(active_step, statuses)}

/* sidebar cards */
.eia-sidecard {{
    background: {CARD}; border: 1px solid {BORDER}; border-radius: .9rem;
    padding: .85rem .95rem; margin: .65rem 0; font-size: .8rem; color: {MUTED};
}}
.eia-sidecard b {{ color: {INK}; font-size: .84rem; }}
.eia-sidecard .chip {{
    display: inline-block; background: {SAGE}; color: {GREEN};
    border-radius: 999px; padding: .05rem .55rem; font-size: .68rem;
    font-weight: 700; margin-left: .3rem;
}}
.eia-footer {{ font-size: .72rem; color: {MUTED}; margin-top: 1rem; }}

/* ---------- top bar ---------- */
.eia-topbar {{
    display: flex; justify-content: space-between; align-items: center;
    background: {CARD}; border: 1px solid {BORDER}; border-radius: 1rem;
    padding: .7rem 1.1rem; margin-bottom: 1.3rem;
}}
.eia-topbar .hello {{ display: flex; gap: .7rem; align-items: center; font-weight: 500; }}
.eia-topbar .hello .dot {{
    width: 2.1rem; height: 2.1rem; border-radius: .7rem; background: {SAGE};
    display: flex; align-items: center; justify-content: center;
}}
.eia-topbar .cycle {{
    border: 1px solid {BORDER}; border-radius: .7rem; padding: .35rem .8rem;
    font-size: .8rem; font-weight: 600; color: {INK}; background: #FCFCF8;
}}

/* ---------- hero ---------- */
.eia-hero {{ position: relative; margin-bottom: 1.2rem; }}
.eia-hero .step {{
    font-size: .7rem; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: {GREEN}; margin-bottom: .3rem;
}}
.eia-hero h1 {{
    font-size: 2.15rem; font-weight: 800; letter-spacing: -.02em;
    margin: 0 0 .45rem 0; color: {INK}; line-height: 1.12;
}}
.eia-hero p {{ color: {MUTED}; font-size: .95rem; max-width: 46rem; margin: 0; }}
.eia-hero .art {{
    position: absolute; right: 0; top: -1.4rem; width: 300px; opacity: .95;
    pointer-events: none;
}}
@media (max-width: 1100px) {{ .eia-hero .art {{ display:none; }} }}

/* ---------- cards / containers ---------- */
[data-testid="stVerticalBlockBorderWrapper"] {{
    background: {CARD}; border: 1px solid {BORDER} !important;
    border-radius: 1rem !important; padding: .4rem .6rem;
}}
.eia-card {{
    background: {CARD}; border: 1px solid {BORDER}; border-radius: 1rem;
    padding: 1rem 1.15rem; margin-bottom: .9rem; font-size: .85rem;
}}
.eia-card h4 {{
    margin: 0 0 .55rem 0; font-size: .92rem; font-weight: 700; color: {INK};
    display: flex; align-items: center; gap: .5rem;
}}
.eia-card .kv {{ display: flex; justify-content: space-between; padding: .28rem 0;
                 color: {MUTED}; border-bottom: 1px dashed {BORDER}; }}
.eia-card .kv:last-of-type {{ border-bottom: none; }}
.eia-card .kv b {{ color: {INK}; font-weight: 600; text-align: right; max-width: 60%; }}
.eia-card.quiet {{ background: #FBFBF6; }}
.eia-muted {{ color: {MUTED}; }}

/* progress */
.eia-progress-track {{
    height: .5rem; background: #ECECE2; border-radius: 999px; overflow: hidden;
    margin-top: .55rem;
}}
.eia-progress-fill {{ height: 100%; background: {GREEN}; border-radius: 999px; }}

/* tip banner */
.eia-tip {{
    display: flex; gap: .8rem; align-items: flex-start;
    background: {CARD}; border: 1px solid {BORDER}; border-radius: 1rem;
    padding: .85rem 1.1rem; margin-top: 1.2rem; font-size: .84rem; color: {MUTED};
}}
.eia-tip b {{ color: {INK}; display: block; margin-bottom: .15rem; }}

/* ---------- widgets ---------- */
/* Force light, high-contrast form fields regardless of the browser/OS
   dark-mode preference: white background, visible border, dark text. */
div[data-baseweb="input"], div[data-baseweb="textarea"],
div[data-baseweb="select"] > div {{
    background: #FFFFFF !important;
    border: 1px solid {BORDER} !important;
    color: {INK} !important;
}}
[data-testid="stTextInput"] input, [data-testid="stTextArea"] textarea,
[data-testid="stNumberInput"] input {{
    background: #FFFFFF !important; color: {INK} !important;
    caret-color: {INK};
}}
[data-testid="stTextInput"] input::placeholder,
[data-testid="stTextArea"] textarea::placeholder {{
    color: {MUTED} !important; opacity: 1;
}}
[data-testid="stNumberInput"] button {{ background: #FFFFFF; color: {INK}; }}
[data-testid="stSelectbox"] div[data-baseweb="select"] div {{ color: {INK}; }}
[data-testid="stSelectbox"] svg {{ fill: {MUTED}; }}
/* dropdown menus (rendered in a portal outside the app container) */
div[data-baseweb="popover"] [data-baseweb="menu"],
div[data-baseweb="popover"] ul {{ background: #FFFFFF !important; }}
div[data-baseweb="popover"] li {{ color: {INK} !important; }}
div[data-baseweb="popover"] li:hover {{ background: {SAGE} !important; }}

/* Clear, standard field labels — dark, semibold, always visible. */
[data-testid="stWidgetLabel"] p {{
    color: {INK} !important; font-weight: 600; font-size: .84rem;
}}
[data-testid="stWidgetLabel"] {{ opacity: 1 !important; }}

/* Radio groups (diagnostic questions, confidence levels): distinct panel,
   bold question, readable options. */
[data-testid="stRadio"] {{
    background: #FBFBF6; border: 1px solid {BORDER};
    border-radius: .8rem; padding: .7rem .9rem .55rem .9rem;
}}
[data-testid="stRadio"] [data-testid="stWidgetLabel"] p {{
    font-size: .95rem; font-weight: 700; color: {INK} !important;
    line-height: 1.45;
}}
[data-testid="stRadio"] label p,
[data-testid="stCheckbox"] label p {{
    color: {INK} !important; font-size: .9rem;
}}

/* plain-language term lists in side cards */
.eia-terms {{ margin: 0; padding-left: 1.05rem; }}
.eia-terms li {{ margin: .4rem 0; color: {MUTED}; }}
.eia-terms b, .eia-terms i {{ color: {INK}; }}

.stButton > button {{
    border-radius: 999px; border: 1px solid {BORDER};
    background: {CARD}; color: {INK}; font-weight: 600;
    padding: .45rem 1.1rem;
}}
.stButton > button:hover {{ border-color: {GREEN}; color: {GREEN}; }}
.stButton > button[kind="primary"] {{
    background: {GREEN}; border-color: {GREEN}; color: #fff;
}}
.stButton > button[kind="primary"]:hover {{ background: {GREEN_DARK}; border-color: {GREEN_DARK}; color:#fff; }}
.stDownloadButton > button {{
    border-radius: 999px; border: 1px solid {BORDER}; font-weight: 600;
}}
.stDownloadButton > button[kind="primary"] {{ background: {GREEN}; border-color: {GREEN}; color: #fff; }}

div[data-baseweb="input"], div[data-baseweb="textarea"], div[data-baseweb="select"] > div {{
    border-radius: .65rem !important;
}}

/* tabs -> pills */
[data-testid="stTabs"] [data-baseweb="tab-list"] {{
    gap: .4rem; background: transparent; border-bottom: none;
}}
[data-testid="stTabs"] button[data-baseweb="tab"] {{
    background: {CARD}; border: 1px solid {BORDER}; border-radius: 999px;
    padding: .3rem 1rem; font-weight: 600; color: {MUTED};
}}
[data-testid="stTabs"] button[data-baseweb="tab"][aria-selected="true"] {{
    background: {SAGE}; color: {GREEN}; border-color: {SAGE};
}}
[data-testid="stTabs"] [data-baseweb="tab-highlight"],
[data-testid="stTabs"] [data-baseweb="tab-border"] {{ display: none; }}

/* expanders */
[data-testid="stExpander"] {{
    border: 1px solid {BORDER}; border-radius: .9rem; background: {CARD};
    overflow: hidden;
}}
[data-testid="stExpander"] summary {{ font-weight: 600; }}
[data-testid="stExpander"] summary,
[data-testid="stExpander"] summary p {{ color: {INK} !important; }}
[data-testid="stExpander"] summary svg {{ fill: {MUTED}; }}

/* alerts softened; text forced dark — the tinted backgrounds stay light,
   so dark-mode browsers must not inject light text on them */
[data-testid="stAlert"] {{ border-radius: .9rem; }}
[data-testid="stAlert"] p, [data-testid="stAlert"] li,
[data-testid="stAlert"] [data-testid="stMarkdownContainer"] {{
    color: {INK} !important;
}}

/* other theme-text leaks in dark-mode browsers (Edge, Chrome dark theme) */
[data-testid="stMetricValue"], [data-testid="stMetricLabel"] p {{
    color: {INK} !important;
}}
[data-testid="stCaptionContainer"], [data-testid="stCaptionContainer"] p,
[data-testid="stCaptionContainer"] span {{
    color: {MUTED} !important;
}}
[data-testid="stMarkdownContainer"] {{ color: {INK}; }}
[data-testid="stFileUploaderDropzone"] {{
    background: #FFFFFF !important; color: {INK} !important;
    border: 1px dashed {BORDER};
}}
[data-testid="stFileUploaderDropzone"] span,
[data-testid="stFileUploaderDropzone"] small {{ color: {MUTED} !important; }}
[data-testid="stFileUploader"] section button {{
    background: #FFFFFF; color: {INK}; border: 1px solid {BORDER};
}}
/* keep primary button labels white — they sit on the green fill */
.stButton > button[kind="primary"] p,
.stDownloadButton > button[kind="primary"] p {{ color: #fff !important; }}
</style>
""", unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Components
# ---------------------------------------------------------------------------

def nav_status_css(active_step: int, statuses: dict):
    """Re-inject the nav-rail status rules. Called at the END of the script
    run, so checkmarks and completion chips reflect values entered during
    this run rather than lagging one interaction behind (the base CSS from
    inject_css keeps the rail styled until this override arrives)."""
    st.markdown(f"<style>{_nav_rules(active_step, statuses)}</style>",
                unsafe_allow_html=True)


def sidebar_brand():
    st.markdown(f"""
    <div class="eia-brand">
      <div class="logo">🌿</div>
      <div>
        <div class="word">EIA</div>
        <div class="sub">Startup Environmental<br>Impact Assessment</div>
      </div>
    </div>""", unsafe_allow_html=True)


def sidebar_stage_card(stage: str, priority_modules, note: str):
    prio = " & ".join(str(m) for m in priority_modules)
    st.markdown(f"""
    <div class="eia-sidecard">
      <div class="eia-eyebrow" style="margin-top:0">Development stage</div>
      <b>{stage}</b><span class="chip">Priority: {prio}</span>
      <div style="margin-top:.45rem">{note}</div>
    </div>""", unsafe_allow_html=True)


def topbar(version: int, greeting: str):
    st.markdown(f"""
    <div class="eia-topbar">
      <div class="hello"><div class="dot">🌿</div>{greeting}</div>
      <div class="cycle">📅 Review cycle v{version}</div>
    </div>""", unsafe_allow_html=True)


def hero(step: int, title: str, subtitle: str, art: bool = True):
    art_html = f'<div class="art">{_HERO_ART}</div>' if art else ""
    st.markdown(f"""
    <div class="eia-hero">
      {art_html}
      <div class="step">Step {step} of 5</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>""", unsafe_allow_html=True)


def card(title: str, body_html: str, icon: str = "", quiet: bool = False):
    cls = "eia-card quiet" if quiet else "eia-card"
    icon_html = f"<span>{icon}</span>" if icon else ""
    st.markdown(f"""
    <div class="{cls}"><h4>{icon_html}{title}</h4>{body_html}</div>
    """, unsafe_allow_html=True)


def kv_rows(pairs) -> str:
    return "".join(
        f'<div class="kv"><span>{k}</span><b>{v}</b></div>' for k, v in pairs
    )


def sidebar_progress(pct: int):
    """Overall assessment progress, shown directly under the workflow rail
    so steps and progress are visible in one place."""
    st.markdown(f"""
    <div class="eia-sidecard">
      <b>Assessment progress</b>
      <div class="eia-muted" style="text-align:right;font-size:.72rem">{pct}% complete</div>
      <div class="eia-progress-track"><div class="eia-progress-fill" style="width:{pct}%"></div></div>
    </div>""", unsafe_allow_html=True)


def tip_banner(text: str, title: str = "Tip for best results"):
    st.markdown(f"""
    <div class="eia-tip">💡<div><b>{title}</b>{text}</div></div>
    """, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Progress — based on content actually filled in, not on navigation
# ---------------------------------------------------------------------------

def step_status(S) -> dict:
    """Per-step completion, computed from the assessment content itself.

    Returns {step: {"pct": int, "done": bool}}. "done" means the step's
    minimal required content exists (e.g. at least one pathway stage
    described), so a step never counts as completed just because it was
    visited.
    """
    out = {}

    # Step 1 — profile & classification
    fields = [bool(S.get("startup_name")), bool(S.get("sector")),
              bool(S.get("startup_desc")),
              S.get("mechanism") is not None, S.get("orientation") is not None]
    out[1] = {"pct": round(100 * sum(fields) / len(fields)),
              "done": bool(S.get("startup_name")) and S.get("mechanism") is not None
                      and S.get("orientation") is not None}

    # Step 2 — pathway: at least one stage described
    stages = [s for t in S.get("pathway", {}).values() for s in t]
    if stages:
        described = sum(1 for s in stages if s.get("description"))
        rated = sum(1 for s in stages if s.get("evidence") not in (None, "", "Not rated"))
        pct = (55 * described / len(stages) + 30 * rated / len(stages)
               + (15 if S.get("weakest_links") else 0))
        out[2] = {"pct": round(pct), "done": described >= 1}
    else:
        out[2] = {"pct": 0, "done": False}

    # Step 3 — indicators: at least one selected
    sel = S.get("selected_indicators", {})
    if sel:
        detailed = sum(1 for e in sel.values()
                       if e.get("data_source") or e.get("unit") or e.get("current_value"))
        out[3] = {"pct": round(50 + 50 * detailed / len(sel)), "done": True}
    else:
        out[3] = {"pct": 0, "done": False}

    # Step 4 — uncertainty: at least one claim actually documented.
    # (Entries are created with defaults on render, so mere visiting of the
    # step must not count — only typed content does.)
    unc = S.get("uncertainty", {})
    documented = sum(1 for u in unc.values()
                     if (u.get("assumptions") or "").strip()
                     or (u.get("claim") or "").strip()
                     or (u.get("conditions") or "").strip())
    out[4] = {"pct": round(100 * documented / len(unc)) if unc else 0,
              "done": documented >= 1}

    # Step 5 — review plan: milestone explicitly chosen
    done5 = bool(S.get("next_review_milestone"))
    out[5] = {"pct": 100 if done5 else 0, "done": done5}
    return out


def overall_pct(statuses: dict) -> int:
    weights = {1: 25, 2: 25, 3: 20, 4: 20, 5: 10}
    total = sum(statuses[i]["pct"] * w for i, w in weights.items()) / sum(weights.values())
    return min(100, int(round(total)))
