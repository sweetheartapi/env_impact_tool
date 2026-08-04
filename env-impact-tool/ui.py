"""
ui.py — visual identity for the assessment tool.
=================================================
All styling lives here so the framework logic in `framework/` and the
flow in `app.py` stay untouched. Design language:

  paper   #F4F6F1   chalky field-green white
  ink     #182420   deep spruce
  fern    #2F6B4E   primary actions / progress
  moss    #E3EDE3   tinted surfaces
  amber   #DE9B33   priority + caution
  clay    #B4553B   errors / excluded

Type: Bricolage Grotesque (display) · Instrument Sans (body)
      · IBM Plex Mono (data, units, labels)

Signature element: the wizard is drawn as a connected pathway rail in
the sidebar — nodes joined by a line — mirroring the theory-of-change
causal chains the tool itself asks users to map.
"""

import streamlit as st

# ---------------------------------------------------------------------------

CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {
  --paper:  #F4F6F1;
  --ink:    #182420;
  --ink-2:  #45544C;
  --fern:   #2F6B4E;
  --fern-d: #24523C;
  --moss:   #E3EDE3;
  --line:   #DCE4DB;
  --amber:  #DE9B33;
  --amber-t:#FBF2DF;
  --clay:   #B4553B;
  --clay-t: #F8E9E4;
  --card:   #FFFFFF;
  --disp: "Bricolage Grotesque", "Instrument Sans", sans-serif;
  --body: "Instrument Sans", -apple-system, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, monospace;
}

html, body, [data-testid="stAppViewContainer"], .stMarkdown, p, li, label {
  font-family: var(--body) !important;
  color: var(--ink);
}
[data-testid="stAppViewContainer"] { background: var(--paper); }
.block-container { max-width: 1120px; padding-top: 1.6rem; }

h1, h2, h3, [data-testid="stMetricValue"] {
  font-family: var(--disp) !important;
  letter-spacing: -0.015em;
  color: var(--ink) !important;
}
h2 { font-weight: 650 !important; }
h3 { font-weight: 600 !important; font-size: 1.15rem !important; }

hr { border-color: var(--line) !important; }

/* ---------- module header -------------------------------------------- */
.eia-eyebrow {
  font-family: var(--mono); font-size: 0.72rem; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--fern);
  margin-bottom: .35rem;
}
.eia-title {
  font-family: var(--disp); font-size: clamp(1.7rem, 3.2vw, 2.35rem);
  font-weight: 700; line-height: 1.12; letter-spacing: -0.02em;
  margin: 0 0 .55rem 0;
}
.eia-lede { color: var(--ink-2); font-size: 1.0rem; line-height: 1.55;
  max-width: 62ch; margin-bottom: .4rem; }
.eia-progress { display: flex; gap: 6px; margin: 1rem 0 1.4rem 0; }
.eia-progress span {
  height: 5px; flex: 1; border-radius: 99px; background: var(--line);
}
.eia-progress span.done { background: var(--fern); }
.eia-progress span.now  { background: var(--amber); }

/* ---------- sidebar: dark spruce + pathway rail ----------------------- */
section[data-testid="stSidebar"] {
  background: #16211C;
  border-right: none;
  min-width: 300px;
}
section[data-testid="stSidebar"] * { color: #E9EFE9; }
section[data-testid="stSidebar"] .stMarkdown p,
section[data-testid="stSidebar"] [data-testid="stCaptionContainer"] p {
  color: #9FB2A6 !important;
}
.eia-brand { padding: .4rem 0 1.1rem 0; border-bottom: 1px solid #2A3830;
  margin-bottom: 1.1rem; }
.eia-brand .mark {
  font-family: var(--disp); font-weight: 700; font-size: 1.22rem;
  color: #F2F6F1; letter-spacing: -0.01em; display:flex; gap:.5rem;
  align-items:center;
}
.eia-brand .mark svg { flex: 0 0 auto; }
.eia-brand .sub { font-family: var(--mono); font-size: .68rem;
  letter-spacing: .12em; text-transform: uppercase; color: #7E947F;
  margin-top: .3rem; }

.eia-navlabel { font-family: var(--mono); font-size: .68rem;
  letter-spacing: .14em; text-transform: uppercase; color: #7E947F;
  margin: .2rem 0 .5rem 0; }

/* the rail: keyed container wraps the five nav buttons */
[class*="st-key-eia_nav_wrap"] { position: relative; counter-reset: eiastep; }
[class*="st-key-eia_nav_wrap"]::before {
  content: ""; position: absolute; left: 15px; top: 18px; bottom: 18px;
  width: 2px; background: #2E3E35; border-radius: 2px;
}
[class*="st-key-eia_nav_wrap"] [data-testid="stButton"] > button {
  position: relative; width: 100%; text-align: left; justify-content: flex-start;
  background: transparent; border: none; border-radius: 10px;
  padding: .5rem .6rem .5rem 2.6rem; min-height: 2.5rem;
  font-family: var(--body); font-weight: 500; font-size: .93rem;
  color: #C6D3C8; box-shadow: none;
}
[class*="st-key-eia_nav_wrap"] [data-testid="stButton"] > button:hover {
  background: #1E2C25; color: #FFFFFF;
}
[class*="st-key-eia_nav_wrap"] [data-testid="stButton"] > button::before {
  counter-increment: eiastep; content: counter(eiastep);
  position: absolute; left: 4px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-size: .7rem; font-weight: 600;
  background: #16211C; border: 2px solid #3A4C41; color: #8FA396;
}
/* visited steps: filled node with a check */
[class*="st-key-eia_nav_done"] button { color: #E9EFE9 !important; }
[class*="st-key-eia_nav_done"] button::before {
  content: "✓" !important; background: #2F6B4E !important;
  border-color: #2F6B4E !important; color: #F2F6F1 !important;
}
/* current step: amber node + tinted row */
[class*="st-key-eia_nav_now"] button {
  background: #223428 !important; color: #FFFFFF !important; font-weight: 600;
}
[class*="st-key-eia_nav_now"] button::before {
  background: var(--amber) !important; border-color: var(--amber) !important;
  color: #16211C !important;
}

.eia-stagechip {
  display: inline-flex; gap: .45rem; align-items: baseline;
  font-family: var(--mono); font-size: .72rem; letter-spacing: .05em;
  background: #1E2C25; border: 1px solid #2E3E35; border-radius: 8px;
  padding: .45rem .6rem; color: #C6D3C8 !important; margin: .7rem 0 .2rem 0;
  width: 100%;
}
.eia-stagechip b { color: #F2F6F1; font-weight: 600; }

section[data-testid="stSidebar"] [data-testid="stExpander"] {
  background: transparent; border: 1px solid #2A3830 !important;
  border-radius: 10px !important;
}
section[data-testid="stSidebar"] [data-testid="stExpander"] summary {
  color: #C6D3C8 !important; font-size: .88rem;
}
section[data-testid="stSidebar"] [data-testid="stFileUploaderDropzone"] {
  background: #1E2C25; border: 1px dashed #3A4C41; color: #C6D3C8;
}
section[data-testid="stSidebar"] [data-testid="stFileUploaderDropzone"] * {
  color: #C6D3C8 !important; font-size: .8rem;
}
section[data-testid="stSidebar"] [data-testid="stFileUploaderDropzone"] button {
  background: transparent; border: 1px solid #3A4C41; color: #E9EFE9;
}
section[data-testid="stSidebar"] [data-testid="stButton"] > button[kind="secondary"] {
  background: transparent; border: 1px solid #3A4C41; color: #C6D3C8;
  border-radius: 10px;
}
section[data-testid="stSidebar"] [data-testid="stButton"] > button[kind="secondary"]:hover {
  border-color: #7E947F; color: #FFFFFF;
}

/* ---------- buttons (main area) --------------------------------------- */
[data-testid="stAppViewBlockContainer"] .stButton > button,
.stDownloadButton > button {
  border-radius: 10px; font-family: var(--body); font-weight: 600;
  border: 1px solid var(--line); box-shadow: none;
}
.stButton > button[kind="primary"], .stDownloadButton > button[kind="primary"] {
  background: var(--fern); border-color: var(--fern); color: #fff;
}
.stButton > button[kind="primary"]:hover,
.stDownloadButton > button[kind="primary"]:hover {
  background: var(--fern-d); border-color: var(--fern-d);
}
[data-testid="stAppViewBlockContainer"] .stButton > button[kind="secondary"] {
  background: #fff; color: var(--ink);
}
[data-testid="stAppViewBlockContainer"] .stButton > button[kind="secondary"]:hover {
  border-color: var(--fern); color: var(--fern);
}

/* ---------- tabs ------------------------------------------------------- */
button[data-baseweb="tab"] {
  font-family: var(--mono) !important; font-size: .78rem !important;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink-2) !important; background: transparent !important;
}
button[data-baseweb="tab"][aria-selected="true"] { color: var(--fern) !important; }
div[data-baseweb="tab-highlight"] { background: var(--fern) !important; height: 3px; }
div[data-baseweb="tab-border"] { background: var(--line) !important; }

/* ---------- cards: expanders, bordered containers ---------------------- */
[data-testid="stExpander"] {
  border: 1px solid var(--line) !important; border-radius: 12px !important;
  background: var(--card); overflow: hidden;
}
[data-testid="stExpander"] summary {
  font-family: var(--body); font-weight: 600; color: var(--ink);
}
[data-testid="stExpander"] summary:hover { color: var(--fern) !important; }

[data-testid="stVerticalBlockBorderWrapper"] {
  border: 1px solid var(--line) !important; border-radius: 14px !important;
  background: var(--card);
}

/* ---------- inputs ------------------------------------------------------ */
[data-baseweb="input"], [data-baseweb="textarea"], [data-baseweb="select"] > div {
  border-radius: 9px !important; border-color: var(--line) !important;
  background: #fff !important;
}
[data-baseweb="input"]:focus-within, [data-baseweb="textarea"]:focus-within {
  border-color: var(--fern) !important;
}
[data-testid="stWidgetLabel"] p { font-weight: 500; color: var(--ink); }

/* ---------- alerts ------------------------------------------------------ */
div[data-testid="stAlert"] {
  border-radius: 12px; border: 1px solid var(--line);
  border-left-width: 4px !important;
}
div[data-testid="stAlert"]:has([data-testid="stAlertContentSuccess"]) {
  background: var(--moss); border-left-color: var(--fern) !important;
}
div[data-testid="stAlert"]:has([data-testid="stAlertContentWarning"]) {
  background: var(--amber-t); border-left-color: var(--amber) !important;
}
div[data-testid="stAlert"]:has([data-testid="stAlertContentInfo"]) {
  background: #EDF2EE; border-left-color: #7E947F !important;
}
div[data-testid="stAlert"]:has([data-testid="stAlertContentError"]) {
  background: var(--clay-t); border-left-color: var(--clay) !important;
}

/* ---------- metrics ----------------------------------------------------- */
[data-testid="stMetric"] {
  background: var(--card); border: 1px solid var(--line);
  border-radius: 12px; padding: .8rem 1rem;
}
[data-testid="stMetricValue"] {
  font-family: var(--mono) !important; font-weight: 600;
  color: var(--fern) !important; font-size: 1.5rem !important;
}
[data-testid="stMetricLabel"] p {
  font-family: var(--mono) !important; font-size: .72rem !important;
  letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2) !important;
}

/* captions */
[data-testid="stCaptionContainer"] p { color: var(--ink-2) !important; }
</style>
"""


def inject_css():
    st.markdown(CSS, unsafe_allow_html=True)


# ---------------------------------------------------------------------------

_LEAF = """<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
<path d="M12 21C6 17 4 12.5 4 8.5 4 5 7 3 12 3s8 2 8 5.5c0 4-2 8.5-8 12.5Z"
 stroke="#7EC79B" stroke-width="1.8" fill="none"/>
<path d="M12 21V8M12 12l3.5-2.5M12 15 8.5 12.5" stroke="#7EC79B"
 stroke-width="1.5" stroke-linecap="round"/></svg>"""


def sidebar_brand():
    st.markdown(
        f"""<div class="eia-brand">
              <div class="mark">{_LEAF}<span>Impact Assessment</span></div>
              <div class="sub">Early-stage startup framework</div>
            </div>""",
        unsafe_allow_html=True)


def stage_chip(stage, priority_modules):
    stars = " ".join(f"M{m}" for m in priority_modules)
    st.markdown(
        f"""<div class="eia-stagechip"><span>Stage</span><b>{stage}</b>
            <span style="margin-left:auto">★ {stars}</span></div>""",
        unsafe_allow_html=True)


def module_header(step, total, eyebrow, title, lede=""):
    segs = "".join(
        f'<span class="{"done" if i < step else "now" if i == step else ""}"></span>'
        for i in range(1, total + 1))
    lede_html = f'<p class="eia-lede">{lede}</p>' if lede else ""
    st.markdown(
        f"""<div class="eia-eyebrow">{eyebrow}</div>
            <h1 class="eia-title">{title}</h1>
            {lede_html}
            <div class="eia-progress">{segs}</div>""",
        unsafe_allow_html=True)
