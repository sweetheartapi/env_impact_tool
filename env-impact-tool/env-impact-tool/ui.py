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

def _nav_rules(active_step: int) -> str:
    rules = []
    for i in range(1, 6):
        rules.append(f"""
        .st-key-navrow{i} button::before {{
            content: "{i}";
            display: inline-flex; align-items: center; justify-content: center;
            width: 1.55rem; height: 1.55rem; margin-right: .6rem;
            border-radius: 999px; font-size: .78rem; font-weight: 700;
            background: {CARD}; color: {MUTED};
            border: 1.5px solid {BORDER};
            flex: 0 0 auto;
        }}""")
        if i < active_step:
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


def inject_css(active_step: int):
    st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body, [data-testid="stAppViewContainer"] {{
    font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
    background: {PAPER};
    color: {INK};
}}
#MainMenu, footer {{ visibility: hidden; }}
header[data-testid="stHeader"] {{ background: transparent; }}

.block-container {{ padding-top: 1.2rem; padding-bottom: 3rem; max-width: 1250px; }}

/* ---------- sidebar ---------- */
[data-testid="stSidebar"] {{
    background: #FCFCF8;
    border-right: 1px solid {BORDER};
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
    width: 100%; justify-content: flex-start; text-align: left;
    background: transparent; border: none; border-radius: .7rem;
    padding: .5rem .6rem; color: {INK}; font-weight: 500;
    box-shadow: none;
}}
[data-testid="stSidebar"] .stButton > button:hover {{
    background: {SAGE}; color: {INK}; border: none;
}}
{_nav_rules(active_step)}

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

/* alerts softened */
[data-testid="stAlert"] {{ border-radius: .9rem; }}
</style>
""", unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Components
# ---------------------------------------------------------------------------

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


def progress_card(pct: int):
    card("Assessment progress",
         f"""<div class="eia-muted" style="text-align:right;font-size:.78rem">{pct}% complete</div>
             <div class="eia-progress-track"><div class="eia-progress-fill" style="width:{pct}%"></div></div>""")


def tip_banner(text: str, title: str = "Tip for best results"):
    st.markdown(f"""
    <div class="eia-tip">💡<div><b>{title}</b>{text}</div></div>
    """, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Progress heuristic
# ---------------------------------------------------------------------------

def progress_pct(S) -> int:
    pts = 0.0
    if S.get("startup_name"): pts += 8
    if S.get("startup_desc"): pts += 6
    if S.get("sector"): pts += 4
    pts += 2  # classification derived once name entered
    stages = [s for t in S.get("pathway", {}).values() for s in t]
    if stages:
        filled = sum(1 for s in stages if s.get("description"))
        rated = sum(1 for s in stages if s.get("evidence") not in (None, "", "Not rated"))
        pts += 15 * filled / len(stages) + 10 * rated / len(stages)
    sel = S.get("selected_indicators", {})
    if sel:
        pts += 10
        detailed = sum(1 for e in sel.values() if e.get("data_source") or e.get("unit"))
        pts += min(10, 10 * detailed / len(sel))
    unc = S.get("uncertainty", {})
    if unc:
        labeled = sum(1 for u in unc.values() if u.get("level"))
        documented = sum(1 for u in unc.values() if u.get("assumptions"))
        pts += 10 * labeled / max(1, len(unc)) + 10 * documented / max(1, len(unc))
    if S.get("next_review_milestone"): pts += 5
    return min(100, int(round(pts)))
