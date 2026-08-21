"""
ui.py: visual layer for the assessment tool.

All styling and presentational HTML lives here so app.py stays focused on
flow and logic. Palette and layout follow the approved design mockup:
warm paper background, white cards, deep forest green, a numbered
workflow rail on the left, and a contextual info rail on the right.
"""

import base64
import os

import streamlit as st

_ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")


def _brand_image_tag(width_css: str = "100%") -> str:
    """If a bitmap logo has been dropped into assets/ use it verbatim,
    otherwise fall back to the built-in vector mark. Lets the exact design
    file be used without redrawing it as SVG."""
    for name, mime in (("logo.png", "image/png"), ("logo.jpg", "image/jpeg"),
                       ("logo.webp", "image/webp")):
        path = os.path.join(_ASSETS, name)
        if os.path.exists(path):
            with open(path, "rb") as fh:
                b64 = base64.b64encode(fh.read()).decode("ascii")
            return (f'<img src="data:{mime};base64,{b64}" alt="EIA" '
                    f'style="width:{width_css};height:auto;display:block">')
    return ""

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

# Hero scene (vector recreation of the approved artwork): filled-blade wind
# turbines on soft hills, a growth curve with data nodes sprouting leaves,
# rising as an arrow into the sun.
_HERO_ART = """
<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <style>
    .eia-rotor { animation: eia-spin 12s linear infinite; transform-origin: 0 0; }
    .eia-rotor.slow { animation-duration: 18s; animation-delay: -5s; }
    @keyframes eia-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .eia-rotor { animation: none; } }
  </style>
  <defs>
    <linearGradient id="eiaFadeX" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.12" stop-color="#fff"/>
      <stop offset="0.9" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <linearGradient id="eiaFadeY" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.8" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <mask id="eiaMaskX"><rect width="320" height="160" fill="url(#eiaFadeX)"/></mask>
    <mask id="eiaMaskY"><rect width="320" height="160" fill="url(#eiaFadeY)"/></mask>
  </defs>
  <circle cx="256" cy="58" r="38" fill="#F2E7CF"/>
  <!-- ground scene, double-masked so the grass dissolves into the page
       background at the left, right and bottom edges -->
  <g mask="url(#eiaMaskX)"><g mask="url(#eiaMaskY)">
  <path d="M0 132 C 60 116, 130 134, 200 122 C 255 112, 295 126, 320 118 L 320 160 L 0 160 Z" fill="#DFEAE0"/>
  <path d="M0 146 C 90 132, 210 150, 320 136 L 320 160 L 0 160 Z" fill="#CFE0D2"/>
  <!-- large turbine -->
  <polygon points="73,148 75.4,88 78.6,88 81,148" fill="#2F5D40"/>
  <g transform="translate(77,84)">
    <g class="eia-rotor" fill="#2F5D40">
      <path transform="rotate(15)" d="M0 0 C -3.2 -10, -3.2 -26, 0 -34 C 3.2 -26, 3.2 -10, 0 0 Z"/>
      <path transform="rotate(135)" d="M0 0 C -3.2 -10, -3.2 -26, 0 -34 C 3.2 -26, 3.2 -10, 0 0 Z"/>
      <path transform="rotate(255)" d="M0 0 C -3.2 -10, -3.2 -26, 0 -34 C 3.2 -26, 3.2 -10, 0 0 Z"/>
    </g>
  </g>
  <circle cx="77" cy="84" r="4.5" fill="#2F5D40"/>
  <circle cx="77" cy="84" r="1.8" fill="#A7C4AF"/>
  <!-- small turbine behind the hill -->
  <polygon points="124,146 125.4,106 126.6,106 128,146" fill="#8FB8A1"/>
  <g transform="translate(126,104)">
    <g class="eia-rotor slow" fill="#8FB8A1">
      <path transform="rotate(60)" d="M0 0 C -2.2 -7, -2.2 -18, 0 -23 C 2.2 -18, 2.2 -7, 0 0 Z"/>
      <path transform="rotate(180)" d="M0 0 C -2.2 -7, -2.2 -18, 0 -23 C 2.2 -18, 2.2 -7, 0 0 Z"/>
      <path transform="rotate(300)" d="M0 0 C -2.2 -7, -2.2 -18, 0 -23 C 2.2 -18, 2.2 -7, 0 0 Z"/>
    </g>
  </g>
  <circle cx="126" cy="104" r="3" fill="#8FB8A1"/>
  <!-- sprout -->
  <path d="M50 148 C 50 142, 50 138, 50 134" stroke="#2F5D40" stroke-width="2.5"
        fill="none" stroke-linecap="round"/>
  <path d="M50 138 C 47 131, 41 126, 34 127 C 35 133, 42 138, 50 138 Z" fill="#2F5D40"/>
  <path d="M50 132 C 52 126, 57 122, 63 123 C 62 128, 56 132, 50 132 Z" fill="#2F5D40"/>
  </g></g>
  <!-- growth curve with nodes, leaves and arrowhead -->
  <path d="M138 146 C 172 140, 205 124, 243 96" stroke="#2F5D40"
        stroke-width="3.6" fill="none" stroke-linecap="round"/>
  <polygon points="252,89 244.2,103.3 243.7,95.4 236.2,93.1" fill="#2F5D40"/>
  <circle cx="170" cy="135" r="4.5" fill="#7FA98C"/>
  <circle cx="208" cy="122" r="4.5" fill="#7FA98C"/>
  <path d="M190 128 C 187 119, 179 112, 169 112 C 170 121, 178 128, 190 128 Z" fill="#2F5D40"/>
  <path d="M233 100 C 230 92, 223 86, 214 86 C 215 94, 222 100, 233 100 Z" fill="#2F5D40"/>
  <!-- birds -->
  <g stroke="#8FB8A1" stroke-width="2.2" fill="none" stroke-linecap="round">
    <path d="M34 36 q 9 -6 18 -2 M38 46 q 8 -5 16 -1"/>
    <path d="M290 34 q 9 -6 18 -2 M294 44 q 8 -5 16 -1"/>
  </g>
</svg>
"""

# App-icon tile distilled from the hero scene: rounded square with soft
# hills and sun, a node-studded growth arrow and a sage leaf. Used for the
# sidebar brand and top bar.
_LOGO_MARK = """
<svg viewBox="0 0 48 48" width="48" height="48"
     xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="eiaTileBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EEF5EF"/>
      <stop offset="1" stop-color="#E1EDE4"/>
    </linearGradient>
    <clipPath id="eiaTile"><rect width="48" height="48" rx="12.5"/></clipPath>
    <filter id="eiaTileShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.2"
                    flood-color="#6E8A76" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g filter="url(#eiaTileShadow)">
    <g clip-path="url(#eiaTile)">
      <rect width="48" height="48" fill="url(#eiaTileBg)"/>
      <!-- sun, sitting behind the curve -->
      <circle cx="25.4" cy="16.2" r="8.6" fill="#F6E4C2"/>
      <!-- two soft hill layers -->
      <path d="M0 32.6 C 8 30.4, 15 33.6, 24 32 C 33 30.4, 41 33.2, 48 31.4 L48 48 L0 48 Z"
            fill="#D6E5D9"/>
      <path d="M0 38.6 C 10 36.4, 20 39.6, 31 38 C 39 36.9, 44 38.6, 48 37.7 L48 48 L0 48 Z"
            fill="#BED5C3"/>
    </g>
  </g>
  <!-- growth curve rising to the arrowhead -->
  <path d="M7.6 39.4 C 15 37.6, 24 32.4, 30.4 25.6 C 34.6 21.2, 38.4 16.6, 41.6 13.2"
        stroke="#2E5D43" stroke-width="2.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M41.9 12.9 L34.3 14.6 M41.9 12.9 L40.2 20.5"
        stroke="#2E5D43" stroke-width="2.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <!-- data nodes along the curve -->
  <circle cx="7.6" cy="39.4" r="2.4" fill="#2E5D43"/>
  <circle cx="18.4" cy="34.1" r="2.4" fill="#2E5D43"/>
  <circle cx="30.4" cy="25.6" r="2.4" fill="#2E5D43"/>
  <!-- leaf growing off the curve, with a pale vein -->
  <path d="M18.4 32.2 C 17.3 27.2, 13.9 24.1, 10.7 25.2
           C 11.3 29.2, 14.3 32.1, 18.4 32.2 Z" fill="#4E8C60"/>
  <path d="M17.9 31.6 C 15.9 29.4, 13.4 27.2, 11.1 25.6"
        stroke="#D9EADD" stroke-width="0.9" fill="none" stroke-linecap="round"/>
</svg>
"""

# Small floating leaves that accompany the EIA wordmark.
_WORD_LEAVES = """
<svg viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M11.4 10.2 C 12.6 4.6, 17.2 0.8, 22.6 1.1
           C 22.2 6.4, 17.6 10.3, 11.4 10.2 Z" fill="#7FA98C"/>
  <path d="M9.6 19.4 C 10.6 14.3, 14.6 10.7, 19.8 10.9
           C 19.4 15.7, 15.2 19.4, 9.6 19.4 Z" fill="#B5CFBC"/>
</svg>
"""


# ---------------------------------------------------------------------------
# CSS
# ---------------------------------------------------------------------------

def _nav_rules(active_step: int, statuses: dict) -> str:
    """Per-row nav styling. A step is ticked only when its content is
    actually (minimally) filled in (see step_status()), never merely
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

.eia-brand {{ display: flex; gap: .8rem; align-items: center; margin-bottom: 1.5rem; }}
.eia-brand .logo {{
    width: 3.9rem; height: 3.9rem; flex: 0 0 auto;
    display: flex; align-items: center; justify-content: center;
}}
.eia-brand .logo svg, .eia-brand .logo img {{
    width: 100%; height: 100%; object-fit: contain; border-radius: .8rem;
}}
.eia-brand-lockup {{ margin-bottom: 1.5rem; }}
.eia-brand-lockup img {{ width: 100%; max-width: 15rem; height: auto; display: block; }}
.eia-brand .word {{
    display: flex; align-items: flex-start; gap: .12rem;
    font-size: 2.15rem; font-weight: 800; letter-spacing: -.015em;
    color: #245139; line-height: .95;
}}
.eia-brand .word svg {{ width: 1.05rem; height: auto; margin-top: .12rem; flex: 0 0 auto; }}
.eia-brand .sub {{
    font-size: .8rem; font-weight: 600; color: #37474A;
    line-height: 1.32; margin-top: .32rem;
}}

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

/* ---------- hero ---------- */
/* Text and artwork sit side by side in a flex row, so they can never
   overlap; the artwork width is fluid (rem + vw) and grows to fill the
   space on large displays. */
.eia-hero {{
    display: flex; align-items: center; gap: 2.5rem;
    margin-bottom: 1.2rem;
}}
.eia-hero .txt {{ flex: 1 1 auto; min-width: 0; }}
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
    flex: 0 1 auto;
    width: clamp(17rem, 28vw, 31rem);
    margin: -1.1rem 0 -.6rem;
    opacity: .95; pointer-events: none;
}}
.eia-hero .art svg {{ width: 100%; height: auto; display: block; }}
@media (max-width: 980px) {{ .eia-hero .art {{ display: none; }} }}

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

/* tip banner: sage fill + green rule so it reads as guidance rather than
   fading into the page (it previously blended into the card background) */
.eia-tip {{
    display: flex; gap: .8rem; align-items: flex-start;
    background: {SAGE}; border: 1px solid #CFE2D5;
    border-left: 4px solid {GREEN}; border-radius: .8rem;
    padding: .9rem 1.15rem; margin-top: 1.2rem; font-size: .86rem;
    color: #3C5647;
}}
.eia-tip b {{ color: {GREEN_DARK}; display: block; margin-bottom: .2rem; }}

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
/* selectbox control (react-aria ComboBox in Streamlit >= 1.5x): the dark
   background sits on the group wrapper and the inner input */
[data-testid="stSelectbox"] .react-aria-ComboBox div[role="group"] {{
    background: #FFFFFF !important; border-color: {BORDER};
}}
[data-testid="stSelectbox"] .react-aria-ComboBox input {{
    background: transparent !important; color: {INK} !important;
    caret-color: {INK};
}}
[data-testid="stSelectbox"] .react-aria-ComboBox button {{
    background: transparent !important; color: {MUTED} !important;
}}
[data-testid="stTooltipIcon"] button {{
    background: transparent !important; color: {MUTED} !important;
}}

/* radio marks: white ring when unchecked, brand-green dot when checked
   (the dark theme otherwise renders them as solid black shapes) */
[data-testid="stRadioOption"] > div > div > div:first-child {{
    background-color: #FFFFFF !important;
    border: 2px solid #A2AFA6 !important;
}}
[data-testid="stRadioOption"] > div > div > div:first-child > div {{
    background-color: transparent !important;
}}
[data-testid="stRadioOption"]:has(input:checked) > div > div > div:first-child {{
    border-color: {GREEN} !important;
}}
[data-testid="stRadioOption"]:has(input:checked) > div > div > div:first-child > div {{
    background-color: {GREEN} !important;
}}

/* checkbox box: white when unchecked, brand green when checked */
[data-testid="stCheckbox"] label > div:first-of-type {{
    background-color: #FFFFFF !important;
    border: 2px solid #A2AFA6 !important;
    border-radius: .3rem;
}}
[data-testid="stCheckbox"] label:has(input:checked) > div:first-of-type {{
    background-color: {GREEN} !important; border-color: {GREEN} !important;
    color: #FFFFFF !important;
}}

/* dropdown lists (rendered in a portal outside the app container) */
div[role="listbox"] {{ background: #FFFFFF !important; border-color: {BORDER}; }}
div[role="listbox"] [role="option"] {{
    color: {INK} !important; background: transparent;
}}
div[role="listbox"] [role="option"]:hover,
div[role="listbox"] [role="option"][aria-selected="true"] {{
    background: {SAGE} !important;
}}

/* Clear, standard field labels: dark, semibold, always visible. */
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
/* download buttons: same light styling as regular buttons. Without an
   explicit background/color the dark theme renders them near-black */
.stDownloadButton > button {{
    border-radius: 999px; border: 1px solid {BORDER}; font-weight: 600;
    background: {CARD}; color: {INK};
}}
.stDownloadButton > button p {{ color: {INK}; }}
.stDownloadButton > button:hover {{ border-color: {GREEN}; color: {GREEN}; }}
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

/* alerts softened; text forced dark, because the tinted backgrounds stay light,
   so dark-mode browsers must not inject light text on them */
[data-testid="stAlert"] {{ border-radius: .9rem; }}
[data-testid="stAlert"] p, [data-testid="stAlert"] li,
[data-testid="stAlert"] [data-testid="stMarkdownContainer"] {{
    color: {INK} !important;
}}

/* assistant chat panel: force light fields like the rest of the app */
[data-testid="stChatInput"] {{ background: #FFFFFF !important; }}
[data-testid="stChatInput"] textarea {{
    background: #FFFFFF !important; color: {INK} !important;
    caret-color: {INK};
}}
[data-testid="stChatInput"] textarea::placeholder {{ color: {MUTED} !important; }}
[data-testid="stChatMessage"] {{ background: transparent; }}
[data-testid="stChatMessage"] p {{ color: {INK}; font-size: .86rem; }}

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
/* Hand-off overlay. Painted by the browser as soon as the button is
   pressed, so the round trip to the server happens behind it. */
.eia-launch {{
    position: fixed; inset: 0; z-index: 99999;
    background: {PAPER};
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 1.1rem;
    animation: eia-launch-in .2s ease both;
}}
@keyframes eia-launch-in {{ from {{ opacity: 0 }} to {{ opacity: 1 }} }}
.eia-launch .mk {{
    width: 5.4rem; line-height: 0;
    animation: eia-launch-rise 2.4s ease-in-out infinite;
}}
.eia-launch .mk svg {{ width: 100%; height: auto; display: block; }}
@keyframes eia-launch-rise {{
    0%, 100% {{ transform: translateY(0); }}
    50%      {{ transform: translateY(-7px); }}
}}
.eia-launch .msg {{
    font-size: 1rem; font-weight: 600; color: {GREEN_DARK};
}}
.eia-launch .bar {{
    width: 13rem; height: 4px; border-radius: 999px;
    background: #E2EADF; overflow: hidden;
}}
.eia-launch .bar i {{
    display: block; width: 40%; height: 100%; border-radius: 999px;
    background: {GREEN};
    animation: eia-launch-slide 1.15s ease-in-out infinite;
}}
@keyframes eia-launch-slide {{
    0%   {{ transform: translateX(-105%); }}
    100% {{ transform: translateX(255%); }}
}}
@media (prefers-reduced-motion: reduce) {{
    .eia-launch .mk, .eia-launch .bar i {{ animation: none; }}
    .eia-launch .bar i {{ width: 100%; }}
}}

/* keep primary button labels white, they sit on the green fill */
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


def logo_mark() -> str:
    """The square brand mark, as inline SVG (or the bitmap override when
    assets/logo.png is present). Exposed so other pages can reuse it."""
    return _brand_image_tag() or _LOGO_MARK


def sidebar_brand():
    # assets/lockup.png (icon + wordmark in one image) replaces the whole
    # block; assets/logo.png replaces just the square mark.
    lockup = os.path.join(_ASSETS, "lockup.png")
    if os.path.exists(lockup):
        with open(lockup, "rb") as fh:
            b64 = base64.b64encode(fh.read()).decode("ascii")
        st.markdown(
            f'<div class="eia-brand-lockup">'
            f'<img src="data:image/png;base64,{b64}" alt="EIA — Startup '
            f'Environmental Impact Assessment"></div>',
            unsafe_allow_html=True)
        return

    mark = _brand_image_tag() or _LOGO_MARK
    st.markdown(f"""
    <div class="eia-brand">
      <div class="logo">{mark}</div>
      <div>
        <div class="word">EIA{_WORD_LEAVES}</div>
        <div class="sub">Startup Environmental<br>Impact Assessment</div>
      </div>
    </div>""", unsafe_allow_html=True)


def hero(step: int, title: str, subtitle: str, art: bool = True):
    art_html = f'<div class="art">{_HERO_ART}</div>' if art else ""
    st.markdown(f"""
    <div class="eia-hero">
      <div class="txt">
        <div class="step">Step {step} of 5</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {art_html}
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
# Progress: based on content actually filled in, not on navigation
# ---------------------------------------------------------------------------

def step_status(S) -> dict:
    """Per-step completion, computed from the assessment content itself.

    Returns {step: {"pct": int, "done": bool}}. "done" means the step's
    minimal required content exists (e.g. at least one pathway stage
    described), so a step never counts as completed just because it was
    visited.
    """
    out = {}

    # Step 1: profile & classification
    fields = [bool(S.get("startup_name")), bool(S.get("sector")),
              bool(S.get("startup_desc")),
              S.get("mechanism") is not None, S.get("orientation") is not None]
    out[1] = {"pct": round(100 * sum(fields) / len(fields)),
              "done": bool(S.get("startup_name")) and S.get("mechanism") is not None
                      and S.get("orientation") is not None}

    # Step 2: pathway needs at least one stage described
    stages = [s for t in S.get("pathway", {}).values() for s in t]
    if stages:
        described = sum(1 for s in stages if s.get("description"))
        rated = sum(1 for s in stages if s.get("evidence") not in (None, "", "Not rated"))
        pct = (55 * described / len(stages) + 30 * rated / len(stages)
               + (15 if S.get("weakest_links") else 0))
        out[2] = {"pct": round(pct), "done": described >= 1}
    else:
        out[2] = {"pct": 0, "done": False}

    # Step 3: indicators need at least one selected
    sel = S.get("selected_indicators", {})
    if sel:
        detailed = sum(1 for e in sel.values()
                       if e.get("data_source") or e.get("unit") or e.get("current_value"))
        out[3] = {"pct": round(50 + 50 * detailed / len(sel)), "done": True}
    else:
        out[3] = {"pct": 0, "done": False}

    # Step 4: uncertainty needs at least one claim actually documented.
    # (Entries are created with defaults on render, so mere visiting of the
    # step must not count, only typed content does.)
    unc = S.get("uncertainty", {})
    documented = sum(1 for u in unc.values()
                     if (u.get("assumptions") or "").strip()
                     or (u.get("claim") or "").strip()
                     or (u.get("conditions") or "").strip())
    out[4] = {"pct": round(100 * documented / len(unc)) if unc else 0,
              "done": documented >= 1}

    # Step 5: review plan needs a milestone explicitly chosen
    done5 = bool(S.get("next_review_milestone"))
    out[5] = {"pct": 100 if done5 else 0, "done": done5}
    return out


def overall_pct(statuses: dict) -> int:
    weights = {1: 25, 2: 25, 3: 20, 4: 20, 5: 10}
    total = sum(statuses[i]["pct"] * w for i, w in weights.items()) / sum(weights.values())
    return min(100, int(round(total)))
