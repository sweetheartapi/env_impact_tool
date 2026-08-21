"""
welcome.py: the introduction page shown before the assessment itself.

Explains why the tool exists, what you get, the five steps, and the limits
of a screening-level assessment, then hands over to the tool. Sections fade
and lift into place as the reader scrolls, driven by an IntersectionObserver
against Streamlit's scroll container. The effect is progressive enhancement:
sections are visible by default and the script arms the hidden state itself,
so if it never runs, nothing is ever hidden.

Content is adapted from the project's user guide.
"""

import streamlit as st

import ui

# ---------------------------------------------------------------------------
# Styles: palette shared with ui.py, plus the scroll-reveal animation
# ---------------------------------------------------------------------------

_CSS = f"""
<style>
.eia-welcome {{
    max-width: 52rem;
    margin: 0 auto;
    color: {ui.INK};
    font-size: 1rem;
    line-height: 1.62;
    position: relative;
    z-index: 1;
}}

/* Ambient landscape behind the reading column. Fixed so it stays put while
   the text scrolls over it; decorative only, so it never takes pointer
   events and is hidden from assistive tech. */
.eia-backdrop {{
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
}}
/* A soft wash keeps the text column legible over the artwork. */
.eia-backdrop::after {{
    content: "";
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 46rem 100% at 50% 40%,
                rgba(247,247,241,.92) 0%, rgba(247,247,241,.72) 55%,
                rgba(247,247,241,0) 100%);
}}
@media (max-width: 900px) {{
    /* On narrow screens the artwork would sit under the text, so fade it. */
    .eia-backdrop {{ opacity: .45; }}
}}

/* Scroll reveal, progressively enhanced. Sections are visible by default,
   so if the script does not run nothing is ever hidden. The script adds
   .eia-js to the wrapper, which arms the hidden state, then adds .is-in to
   each section as it scrolls into view. */
.eia-welcome.eia-js .reveal {{
    opacity: 0;
    transform: translateY(26px);
    transition: opacity .62s cubic-bezier(.22,.61,.36,1),
                transform .62s cubic-bezier(.22,.61,.36,1);
    will-change: opacity, transform;
}}
.eia-welcome.eia-js .reveal.is-in {{ opacity: 1; transform: none; }}
@media (prefers-reduced-motion: reduce) {{
    .eia-welcome.eia-js .reveal {{
        opacity: 1; transform: none; transition: none;
    }}
}}

/* brand lockup above the headline: bare mark, wordmark, divider, subtitle */
.eia-welcome .lockup {{
    display: flex; align-items: center; justify-content: center;
    gap: .7rem; margin-bottom: 1.6rem;
}}
.eia-welcome .lockup .lmark {{ width: 3.9rem; flex: 0 0 auto; }}
.eia-welcome .lockup .lmark svg {{ width: 100%; height: auto; display: block; }}
.eia-welcome .lockup .lword {{
    font-size: 2.55rem; font-weight: 800; letter-spacing: -.02em;
    color: #245139; line-height: 1;
}}
.eia-welcome .lockup .lbar {{
    width: 1px; height: 2.5rem; background: #C6D0C1; flex: 0 0 auto;
    margin: 0 .35rem;
}}
.eia-welcome .lockup .lsub {{
    text-align: left; font-size: .95rem; font-weight: 600;
    color: #3A4A42; line-height: 1.32;
}}
@media (max-width: 640px) {{
    .eia-welcome .lockup .lword {{ font-size: 2rem; }}
    .eia-welcome .lockup .lsub {{ font-size: .82rem; }}
}}

/* hero */
.eia-welcome .hero {{ text-align: center; padding: 1rem 0 2.4rem; }}
.eia-welcome .hero .mark {{ width: 5.2rem; margin: 0 auto .9rem; }}
.eia-welcome .hero .mark svg {{ width: 100%; height: auto; display: block; }}
.eia-welcome .hero h1 {{
    font-size: 2.7rem; font-weight: 800; letter-spacing: -.02em;
    color: #245139; margin: 0 0 .5rem; line-height: 1.08;
    text-wrap: balance;
}}
.eia-welcome .hero .tagline {{
    font-size: 1.16rem; color: #37474A; font-weight: 500;
    max-width: 32rem; margin: 0 auto;
    text-wrap: balance;
}}
.eia-welcome .hero .meta {{
    margin-top: 1.3rem; display: inline-flex; gap: .5rem; flex-wrap: wrap;
    justify-content: center;
}}
.eia-welcome .hero .meta span {{
    background: {ui.SAGE}; color: {ui.GREEN_DARK}; border-radius: 999px;
    padding: .3rem .85rem; font-size: .8rem; font-weight: 600;
}}

/* section rhythm */
.eia-welcome section {{ padding: 2.1rem 0; border-top: 1px solid {ui.BORDER}; }}
.eia-welcome h2 {{
    font-size: 1.5rem; font-weight: 800; color: {ui.INK};
    margin: 0 0 .8rem; letter-spacing: -.01em;
}}
.eia-welcome h3 {{
    font-size: 1.02rem; font-weight: 700; color: {ui.GREEN_DARK}; margin: 0 0 .35rem;
}}
.eia-welcome p {{ margin: 0 0 .85rem; }}
.eia-welcome .lead {{ font-size: 1.05rem; color: #3C4A42; }}
.eia-welcome strong {{ color: {ui.INK}; font-weight: 700; }}
.eia-welcome em {{ color: {ui.MUTED}; }}

/* the three-options block */
.eia-welcome .options {{ display: grid; gap: .7rem; margin: 1rem 0 1.2rem; }}
.eia-welcome .option {{
    display: flex; gap: .85rem; align-items: flex-start;
    background: rgba(255,255,255,.82); border: 1px solid {ui.BORDER};
    border-radius: .8rem; padding: .9rem 1.05rem;
    font-size: .93rem; backdrop-filter: blur(2px);
}}
.eia-welcome .option b {{ display: block; color: {ui.INK}; margin-bottom: .15rem; }}

/* round icon chip used by option and feature cards */
.eia-welcome .ico {{
    flex: 0 0 auto;
    width: 2.3rem; height: 2.3rem; border-radius: 999px;
    background: {ui.SAGE}; color: {ui.GREEN};
    display: inline-flex; align-items: center; justify-content: center;
}}
.eia-welcome .ico svg {{ width: 1.2rem; height: 1.2rem; }}

/* cards */
.eia-welcome .cards {{ display: grid; gap: .85rem; }}
.eia-welcome .card {{
    background: rgba(255,255,255,.86); border: 1px solid {ui.BORDER};
    border-radius: .9rem; padding: 1.05rem 1.2rem;
    backdrop-filter: blur(2px);
}}
.eia-welcome .card .num {{
    display: inline-flex; align-items: center; justify-content: center;
    width: 1.7rem; height: 1.7rem; border-radius: 999px;
    background: {ui.GREEN}; color: #fff; font-size: .82rem; font-weight: 700;
    margin-right: .55rem; flex: 0 0 auto;
}}
.eia-welcome .card .head {{ display: flex; align-items: center; margin-bottom: .45rem; }}
.eia-welcome .card .head h3 {{ margin: 0; font-size: 1.06rem; color: {ui.INK}; }}
.eia-welcome .card p {{ margin: 0 0 .5rem; font-size: .94rem; }}
.eia-welcome .card p:last-child {{ margin-bottom: 0; }}
.eia-welcome .card .why {{ color: {ui.MUTED}; }}

/* two-column feature grid */
.eia-welcome .features {{
    /* Four cards: a fixed 2x2 keeps the rows balanced. auto-fit gave three
       across and left the fourth stranded on its own row. */
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .9rem;
}}
@media (max-width: 640px) {{
    .eia-welcome .features {{ grid-template-columns: 1fr; }}
}}
.eia-welcome .feature {{
    background: rgba(233,242,235,.9); border-radius: .85rem;
    padding: 1.05rem 1.15rem; font-size: .93rem; color: #33493C;
}}
.eia-welcome .feature .ico {{
    background: rgba(255,255,255,.85); margin-bottom: .6rem;
}}
.eia-welcome .feature b {{ display: block; color: {ui.GREEN_DARK}; margin-bottom: .2rem; }}

/* confidence chips */
.eia-welcome .levels {{ display: grid; gap: .5rem; margin: .3rem 0 .9rem; }}
.eia-welcome .level {{
    display: flex; gap: .6rem; align-items: baseline; font-size: .93rem;
}}
.eia-welcome .level .dot {{
    width: .62rem; height: .62rem; border-radius: 999px; flex: 0 0 auto;
    transform: translateY(-.05rem);
}}

/* "what this is not" */
.eia-welcome .limits {{ display: grid; gap: .55rem; }}
.eia-welcome .limit {{
    font-size: .93rem; padding-left: 1.4rem; position: relative; color: #4A5750;
}}
.eia-welcome .limit::before {{
    content: "\\00d7"; position: absolute; left: .35rem; top: -.05rem;
    color: {ui.RED}; font-weight: 700;
}}
.eia-welcome .limit b {{ color: {ui.INK}; }}

/* FAQ */
.eia-welcome details {{
    background: rgba(255,255,255,.86); border: 1px solid {ui.BORDER};
    border-radius: .75rem; padding: .1rem .95rem; margin-bottom: .5rem;
    backdrop-filter: blur(2px);
}}
.eia-welcome summary {{
    cursor: pointer; font-weight: 600; color: {ui.INK};
    padding: .7rem 0; font-size: .96rem; list-style: none;
}}
.eia-welcome summary::-webkit-details-marker {{ display: none; }}
.eia-welcome summary::before {{
    content: "+"; color: {ui.GREEN}; font-weight: 700; margin-right: .55rem;
}}
.eia-welcome details[open] summary::before {{ content: "\\2013"; }}
.eia-welcome details p {{
    margin: 0 0 .8rem; font-size: .93rem; color: #46534C;
}}

/* Smooth open/close. A native <details> snaps, because its content is not
   rendered while closed. ::details-content plus interpolate-size lets the
   panel animate to its natural height. Browsers without support simply
   keep the instant open, which is the current behaviour. */
:root {{ interpolate-size: allow-keywords; }}
.eia-welcome details::details-content {{
    block-size: 0;
    overflow: hidden;
    opacity: 0;
    transition: block-size .36s cubic-bezier(.22,.61,.36,1),
                opacity .28s ease .06s,
                content-visibility .36s allow-discrete;
}}
.eia-welcome details[open]::details-content {{
    block-size: auto;
    opacity: 1;
}}
.eia-welcome details {{
    transition: border-color .25s ease, box-shadow .25s ease;
}}
.eia-welcome details[open] {{
    border-color: #CFE0D5;
    box-shadow: 0 2px 10px rgba(90,120,98,.07);
}}
.eia-welcome summary {{ transition: color .2s ease; }}
.eia-welcome summary:hover {{ color: {ui.GREEN}; }}
.eia-welcome summary::before {{
    display: inline-block; transition: transform .28s ease, color .2s ease;
}}
.eia-welcome details[open] summary::before {{ transform: rotate(180deg); }}
@media (prefers-reduced-motion: reduce) {{
    .eia-welcome details::details-content,
    .eia-welcome summary::before {{ transition: none; }}
}}


/* closing */
.eia-welcome .closing {{
    text-align: center; padding: 2.4rem 0 .6rem; border-top: 1px solid {ui.BORDER};
}}
.eia-welcome .closing h2 {{ margin-bottom: .5rem; }}
.eia-welcome .closing p {{ color: {ui.MUTED}; max-width: 30rem; margin: 0 auto; }}
</style>
"""

# ---------------------------------------------------------------------------
# Ambient artwork. A pale landscape sits behind the reading column: sun,
# layered hills, a winding path and botanical sprigs down both margins.
# Inline SVG, so it needs no image files and scales to any screen.
# ---------------------------------------------------------------------------

_BG_ART = """
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice"
     xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="eiaSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7F7F1"/>
      <stop offset="0.62" stop-color="#F2F5EE"/>
      <stop offset="1" stop-color="#EAF1E6"/>
    </linearGradient>
    <radialGradient id="eiaSunGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#F6EEDA"/>
      <stop offset="1" stop-color="#F6EEDA" stop-opacity="0"/>
    </radialGradient>

    <g id="eiaSprig">
      <path d="M0 0 C -2 -32, -4 -64, -3 -96" stroke="#C7DBC3"
            stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M-2 -20 C -17 -25, -28 -40, -26 -56 C -11 -51, -2 -36, -2 -20 Z" fill="#D8E8D4"/>
      <path d="M-2 -40 C 13 -45, 24 -60, 22 -76 C 7 -71, -2 -56, -2 -40 Z" fill="#CCE0C8"/>
      <path d="M-3 -60 C -18 -65, -28 -80, -26 -96 C -11 -91, -3 -76, -3 -60 Z" fill="#D8E8D4"/>
      <path d="M-3 -78 C 11 -83, 21 -96, 19 -110 C 6 -105, -3 -92, -3 -78 Z" fill="#CCE0C8"/>
    </g>

    <g id="eiaShrub">
      <path d="M0 0 C -22 -8, -38 -30, -34 -54 C -12 -46, 2 -24, 0 0 Z" fill="#D3E4CF"/>
      <path d="M0 0 C 20 -10, 34 -32, 28 -54 C 8 -44, -2 -22, 0 0 Z" fill="#C6DBC2"/>
      <path d="M0 0 C -8 -18, -6 -42, 4 -58 C 12 -40, 10 -16, 0 0 Z" fill="#DCEAD8"/>
    </g>
  </defs>

  <rect width="1600" height="900" fill="url(#eiaSky)"/>

  <path d="M0 596 C 190 540, 372 618, 556 588 C 754 556, 902 612, 1102 582
           C 1300 552, 1452 604, 1600 574 L1600 900 L0 900 Z" fill="#E6EFE3"/>
  <path d="M0 682 C 246 632, 424 704, 648 672 C 884 638, 1058 700, 1286 668
           C 1424 648, 1524 684, 1600 668 L1600 900 L0 900 Z" fill="#DBE8D7"/>

  <path d="M812 900 C 862 812, 946 772, 1042 748 C 1140 724, 1214 700, 1262 664"
        stroke="#F1EEE0" stroke-width="34" fill="none"
        stroke-linecap="round" opacity="0.9"/>

  <path d="M0 772 C 260 736, 470 792, 700 768 C 940 742, 1120 790, 1340 768
           C 1450 757, 1530 776, 1600 766 L1600 900 L0 900 Z" fill="#CFE1CB"/>

  <use href="#eiaSprig" x="96"  y="838" transform="rotate(-7 96 838)"/>
  <use href="#eiaSprig" x="152" y="868" transform="rotate(6 152 868)"/>
  <use href="#eiaSprig" x="232" y="886" transform="rotate(-13 232 886) scale(.84)"/>
  <use href="#eiaShrub" x="64"  y="884"/>
  <use href="#eiaShrub" x="292" y="896" transform="scale(.88) translate(40 122)"/>

  <use href="#eiaSprig" x="1512" y="836" transform="rotate(9 1512 836)"/>
  <use href="#eiaSprig" x="1450" y="872" transform="rotate(-6 1450 872) scale(.92)"/>
  <use href="#eiaSprig" x="1372" y="890" transform="rotate(14 1372 890) scale(.78)"/>
  <use href="#eiaShrub" x="1548" y="888"/>

</svg>
"""


def _bg_data_uri() -> str:
    """Base64 data URI for the backdrop.

    The artwork is delivered through CSS rather than as inline markup:
    Streamlit sanitises HTML and strips <path>/<rect>/<use> out of a large
    inline SVG, but it does not touch CSS property values.
    """
    import base64
    raw = _BG_ART.strip().encode("utf-8")
    return "data:image/svg+xml;base64," + base64.b64encode(raw).decode("ascii")


# Hero banner pieces. Each is small and delivered as a CSS background so the
# moving parts can be animated with plain CSS transforms.
_HERO_SUN = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" aria-hidden="true">
  <defs>
    <radialGradient id="hs" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#F4E3C4"/>
      <stop offset="0.62" stop-color="#F4E3C4" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#F4E3C4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="150" cy="150" r="150" fill="url(#hs)"/>
  <circle cx="150" cy="150" r="86" fill="#F2DFBE" opacity="0.55"/>
</svg>
"""

def _bird_svg(path: str) -> str:
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 22"'
            ' aria-hidden="true"><path d="' + path + '" fill="#9DB897"/></svg>')


# Same bird, wings raised / level / lowered. Swapping between these three is
# what produces the wingbeat; scaling the sprite only ever squashed it.
_BIRD_UP = _bird_svg(
    "M2 17 C 7 5, 14 3, 22 12 C 30 3, 37 5, 42 17 "
    "C 35 9, 29 9, 22 15 C 15 9, 9 9, 2 17 Z")
_BIRD_MID = _bird_svg(
    "M1 11 C 8 7, 15 9, 22 12 C 29 9, 36 7, 43 11 "
    "C 36 13, 29 12, 22 15.5 C 15 12, 8 13, 1 11 Z")
_BIRD_DOWN = _bird_svg(
    "M3 7 C 8 14, 15 17, 22 12 C 29 17, 36 14, 41 7 "
    "C 36 16, 29 20, 22 15.5 C 15 20, 8 16, 3 7 Z")

# The sidebar uses the mark inside a rounded tile. On the welcome page the
# lockup reads better with the artwork sitting straight on the background,
# so this variant drops the tile and the hills.
_MARK_BARE = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"
     width="48" height="48" aria-hidden="true">
  <circle cx="25.4" cy="16.2" r="8.6" fill="#F6E4C2"/>
  <ellipse cx="20" cy="43.4" rx="15" ry="3.4" fill="#DCEAD7"/>
  <path d="M7.6 39.4 C 15 37.6, 24 32.4, 30.4 25.6
           C 34.6 21.2, 38.4 16.6, 41.6 13.2"
        stroke="#2E5D43" stroke-width="2.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M41.9 12.9 L34.3 14.6 M41.9 12.9 L40.2 20.5"
        stroke="#2E5D43" stroke-width="2.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="7.6" cy="39.4" r="2.4" fill="#2E5D43"/>
  <circle cx="18.4" cy="34.1" r="2.4" fill="#2E5D43"/>
  <circle cx="30.4" cy="25.6" r="2.4" fill="#2E5D43"/>
  <path d="M18.4 32.2 C 17.3 27.2, 13.9 24.1, 10.7 25.2
           C 11.3 29.2, 14.3 32.1, 18.4 32.2 Z" fill="#4E8C60"/>
  <path d="M17.9 31.6 C 15.9 29.4, 13.4 27.2, 11.1 25.6"
        stroke="#D9EADD" stroke-width="0.9" fill="none" stroke-linecap="round"/>
</svg>
"""

def _svg_uri(svg: str) -> str:
    """Encode a small SVG for use in a CSS url(). Kept out of the markup so
    Streamlit's HTML sanitiser cannot strip the shapes."""
    import base64
    return ("data:image/svg+xml;base64,"
            + base64.b64encode(svg.strip().encode("utf-8")).decode("ascii"))


def _leaf_uri(color: str = "#2E7D52") -> str:
    """A single sprout leaf, used for headings, dividers and the hero badge."""
    return _svg_uri(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
        '<path d="M20 3C10.5 3.6 4.8 8.7 5 17.2c0 .6.1 1.2.3 1.8'
        'C12 19.6 19 14.9 20 6.1c.1-1 .1-2 0-3.1z" fill="' + color + '"/>'
        '<path d="M6.2 20.5C8.6 15.6 12 11.8 16.4 8.7" stroke="#FFFFFF"'
        ' stroke-width="1.5" stroke-linecap="round" fill="none"'
        ' opacity=".55"/></svg>')

# Small line icons used in the option and feature cards.
_ICON = {
    "audit": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z"/>
        <path d="M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/>
        <path d="M9 11h6M9 15h4"/></svg>""",
    "diy": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>
        <path d="M16 6.2a3 3 0 0 1 0 5.6M18.6 4a6 6 0 0 1 0 10"/></svg>""",
    "silent": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>
        <path d="M9 10.5h6"/></svg>""",
    # adapts: one path branching into two
    "adapt": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.2 11.1C10.2 8.5 13.2 6.8 16.6 6.2"/>
        <path d="M7.2 12.9C10.2 15.5 13.2 17.2 16.6 17.8"/>
        <circle cx="4.6" cy="12" r="2.2" fill="currentColor" stroke="none"/>
        <circle cx="19" cy="6" r="2.2" fill="#A9CDB4"/>
        <circle cx="19" cy="18" r="2.2" fill="#A9CDB4"/></svg>""",
    # proportionate: balance scales with weighted pans
    "scale": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5.4V19M8 19.6h8M3.4 8.2h17.2"/>
        <circle cx="12" cy="4.2" r="1.3" fill="currentColor" stroke="none"/>
        <path d="M1 12.4 3.4 8.2l2.4 4.2a2.4 2.4 0 0 1-4.8 0z" fill="#A9CDB4"/>
        <path d="M18.2 12.4l2.4-4.2 2.4 4.2a2.4 2.4 0 0 1-4.8 0z" fill="#A9CDB4"/>
        </svg>""",
    # protects: shield sheltering one bold leaf
    "shield": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.4 4.4 5.2v6.2c0 4.7 3.2 8.9 7.6 10.2
                 4.4-1.3 7.6-5.5 7.6-10.2V5.2z"/>
        <path d="M16.8 7.4c-4.8.3-7.7 2.8-7.7 6.5 0 .9.2 1.7.6 2.4
                 4.5-.5 7.4-3.8 7.5-7.8 0-.4 0-.8-.4-1.1z"
              fill="#A9CDB4" stroke="none"/></svg>""",
    # uncertainty: a magnifier over a small chart
    "gauge": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="10.4" cy="10.4" r="6.7"/>
        <path d="M15.3 15.3 21 21"/>
        <rect x="7.2" y="10.6" width="1.9" height="3.4" rx=".5"
              fill="#A9CDB4" stroke="none"/>
        <rect x="9.6" y="8.4" width="1.9" height="5.6" rx=".5"
              fill="#A9CDB4" stroke="none"/>
        <rect x="12" y="6.4" width="1.9" height="7.6" rx=".5"
              fill="currentColor" stroke="none" opacity=".85"/></svg>""",
}

# key, tone (left border), title, body
_OPTIONS = (
    ("audit", "#C9A227", "Commission a full LCA or GHG Protocol audit.",
     "Rigorous and credible, but typically far too slow and expensive at your "
     "stage, especially when the product still changes every few months."),
    ("diy", "#4E8C60", "Put together some numbers yourself.",
     "Fast, but you end up reporting whatever data you happen to have rather "
     "than what actually matters. That is how well-meaning founders "
     "accidentally end up greenwashing."),
    ("silent", "#B25B4E", "Say nothing specific.",
     "Safe, but it makes a genuinely good venture look like it has nothing "
     "to show."),
)

_FEATURES = (
    ("adapt", "It adapts to your company",
     "Four startup types, three pathway structures, guidance that shifts with "
     "your development stage. Not a generic form."),
    ("scale", "It is proportionate",
     "Three to five well-chosen indicators, not a corporate checklist. At "
     "ideation, getting the logic right matters more than having numbers."),
    ("shield", "It protects you from greenwashing",
     "Not a warning in the footer, but scoring rules that exclude vanity "
     "metrics and checks that catch known failure patterns."),
    ("gauge", "It treats uncertainty as a feature",
     "Being precise about how confident you are is more honest, and in front "
     "of a sophisticated investor, more persuasive."),
)


def _bird_css() -> str:
    """Rules for the flock. Kept out of the %-formatted stylesheet because the
    wing frames are data URIs and would collide with the format string."""
    up, mid, down = (_svg_uri(_BIRD_UP), _svg_uri(_BIRD_MID),
                     _svg_uri(_BIRD_DOWN))
    # element drifts; pseudo-element cycles the wing frames
    css = (
        ".eia-backdrop .bird{position:absolute;"
        "animation:eia-drift 26s ease-in-out infinite}"
        ".eia-backdrop .bird::before{content:'';position:absolute;inset:0;"
        "background-position:center;background-size:contain;"
        "background-repeat:no-repeat;background-image:url('" + mid + "');"
        "animation:eia-flap 1.1s steps(1,end) infinite}"
        "@keyframes eia-flap{"
        "0%{background-image:url('" + up + "')}"
        "28%{background-image:url('" + mid + "')}"
        "52%{background-image:url('" + down + "')}"
        "76%{background-image:url('" + mid + "')}"
        "100%{background-image:url('" + up + "')}}"
    )
    # position, scale, opacity and timing per bird so the flock never
    # beats in unison
    flock = (
        ("b1", "19%", "12%", "2.7rem", "1.35rem", ".82", "26s", "1.02s", "0s"),
        ("b2", "13%", "18.5%", "2.1rem", "1.05rem", ".68", "31s", "1.28s", "-.35s"),
        ("b3", "25%", "20%", "1.7rem", ".85rem", ".56", "35s", "1.5s", "-.7s"),
        ("b4", "30%", "14.5%", "2.3rem", "1.15rem", ".62", "29s", "1.16s", "-.5s"),
        ("b5", "9%", "24%", "1.5rem", ".75rem", ".48", "38s", "1.62s", "-.9s"),
    )
    for name, right, top, w, h, op, drift, flap, delay in flock:
        css += (".eia-backdrop .%s{right:%s;top:%s;width:%s;height:%s;"
                "opacity:%s;animation-duration:%s}"
                ".eia-backdrop .%s::before{animation-duration:%s;"
                "animation-delay:%s}"
                % (name, right, top, w, h, op, drift, name, flap, delay))
    return css

def _options_html() -> str:
    return "".join(
        '<div class="option" style="border-left-color:{}">'
        '<span class="ico">{}</span>'
        '<span><b>{}</b>{}</span></div>'.format(tone, _ICON[k], title, body)
        for k, tone, title, body in _OPTIONS)


def _features_html() -> str:
    return "".join(
        '<div class="feature reveal"><span class="ico">{}</span>'
        '<b>{}</b>{}</div>'.format(_ICON[k], title, body)
        for k, title, body in _FEATURES)

_LEVELS = (
    ("#2E7D52", "Measured", "you have your own operational data behind this"),
    ("#B8860B", "Modelled", "it comes from industry averages, supplier data, "
                            "or a simplified calculation"),
    ("#7C5296", "Projected", "it rests on assumptions about future adoption or scale"),
)

_STEPS = (
    ("Profile &amp; classify your startup",
     "Enter your startup's details, then answer two plain-language questions "
     "about how your environmental benefit actually arises.",
     "These two answers determine how your startup should be assessed at all. "
     "A company that captures carbon directly should be measured very "
     "differently from software that helps customers waste less fuel. Most "
     "tools apply the same checklist to everyone; this one branches."),
    ("Map your impact pathway",
     "The tool loads the right template for your type and walks you through "
     "each stage: what happens, the assumption linking it to the next stage, "
     "and how strong your evidence is.",
     "This is the heart of it. Impact claims fall apart at the joints, not in "
     "the middle. An agtech company can have flawless sensor data and still be "
     "wrong, because the real question is whether farmers change what they do. "
     "Any link you rate as weak gets flagged automatically."),
    ("Select your indicators",
     "Browse a bank of indicators across six categories, then score each on "
     "relevance and feasibility.",
     "The instinct is to measure everything you can measure, and that instinct "
     "is backwards. An office recycling rate is easy to report and tells nobody "
     "anything about whether your product helps the planet. Low relevance gets "
     "excluded no matter how easy it is to measure. That rule is deliberate."),
    ("Label your uncertainty",
     "Write each claim as you would say it out loud, then label how confident "
     "you are and note the assumptions behind it.",
     "All three confidence levels are legitimate for an early-stage company. "
     "What destroys credibility is mixing them up. Labelling them separately "
     "makes your strong claims stronger: when a reader sees you were scrupulous "
     "about the soft numbers, they trust the hard ones."),
    ("Review, report &amp; export",
     "Set the milestone when you will revisit this, read the automated "
     "integrity checks, and download your report.",
     "The integrity checks are the tool reviewing your work before anyone else "
     "does: vanity metrics, a core set grown too big, claims that are all "
     "projections, estimates with no documented assumptions."),
)

_FAQ = (
    ("How long does this take?",
     "About 45 to 60 minutes for a first pass. You can stop at any point, save "
     "your progress, and come back to it."),
    ("Do I need perfect data to start?",
     "No. Bring whatever you already have: utility bills, a bill of materials, "
     "cloud dashboards, customer numbers. Honesty about what you do not know "
     "matters more than the data, and the tool is built to make gaps visible "
     "rather than paper over them."),
    ("Do I need an environmental consultant?",
     "No. The questions are in plain language and the tool explains each concept "
     "as you go. There is a key-terms panel on the first step, and nothing here "
     "assumes a sustainability background."),
    ("Is this a replacement for a full LCA?",
     "No, and it does not pretend to be. This is a screening-level assessment "
     "that gives you a structured, defensible account of your impact. It does "
     "not replace ISO 14040/14044 assessment or comprehensive GHG accounting."),
    ("Can I come back and update it later?",
     "Yes, and that is the intended use. Download the JSON save file at the end, "
     "then upload it when your next review milestone arrives. The tool picks up "
     "where you left off and bumps you to the next review cycle automatically."),
    ("Is there a single score at the end?",
     "Deliberately not. Reducing environmental impact to one figure is precisely "
     "what makes impact claims misleading. You get a classification, a pathway, "
     "a focused indicator set, and an honest confidence label on every claim."),
    ("Can I get it wrong on the first pass?",
     "There is genuinely no way to. Every answer can be changed later, and "
     "nothing is locked in. The only real mistake is being less honest than you "
     "could have been, and the tool is built to make that harder."),
)


_SCROLL_JS = """
<script>
(function () {
  function arm() {
    var wrap = document.querySelector('.eia-welcome');
    if (!wrap || wrap.dataset.eiaArmed === '1') return !!wrap;
    var items = wrap.querySelectorAll('.reveal');
    if (!items.length) return false;
    wrap.dataset.eiaArmed = '1';

    // Only hide once we know the script is running and can reveal again.
    wrap.classList.add('eia-js');

    var root = document.querySelector('section[data-testid="stMain"]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return true;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);   // reveal once, never re-hide
        }
      });
    }, { root: root || null, rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    items.forEach(function (el) { io.observe(el); });

    // Backstop: reveal anything that is on screen, on scroll and on a short
    // timer. The observer normally does this first; the backstop guarantees
    // content can never stay invisible if the observer misses an element.
    var scroller = root || window;
    var queued = false;
    function sweep() {
      queued = false;
      var pending = wrap.querySelectorAll('.reveal:not(.is-in)');
      if (!pending.length) {
        scroller.removeEventListener('scroll', onScroll);
        return;
      }
      var limit = (root ? root.getBoundingClientRect().bottom : window.innerHeight) + 40;
      pending.forEach(function (el) {
        if (el.getBoundingClientRect().top < limit) el.classList.add('is-in');
      });
    }
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(sweep, 900);
    return true;
  }

  if (!arm()) {
    // Streamlit may still be painting the block; retry briefly.
    var tries = 0;
    var t = setInterval(function () {
      if (arm() || ++tries > 40) clearInterval(t);
    }, 50);
  }
})();
</script>
"""

def _steps_html() -> str:
    out = []
    for i, (title, what, why) in enumerate(_STEPS, start=1):
        out.append(
            f'<div class="card reveal"><div class="head">'
            f'<span class="num">{i}</span><h3>{title}</h3></div>'
            f'<p>{what}</p><p class="why"><em>{why}</em></p></div>')
    return "".join(out)


def _faq_html() -> str:
    return "".join(
        f"<details class='reveal'><summary>{q}</summary><p>{a}</p></details>"
        for q, a in _FAQ)


def _levels_html() -> str:
    return "".join(
        f'<div class="level"><span class="dot" style="background:{c}"></span>'
        f'<span><b>{name}</b>: {desc}</span></div>'
        for c, name, desc in _LEVELS)


def _script(js: str) -> None:
    """Run a small script, tolerating Streamlit versions without support.

    Everything scripted here is decoration (scroll reveals, the hand-off
    overlay). If the runtime cannot execute it the page still works, so a
    version gap must not take the whole app down.
    """
    try:
        st.html(js, unsafe_allow_javascript=True)
    except TypeError:
        pass

def page(on_start, on_resume=None):
    """Render the welcome page. `on_start` is called when the reader clicks
    through to the assessment."""
    st.markdown(_CSS, unsafe_allow_html=True)
    # Artwork and leaf ornaments ride in as CSS background images. They are
    # built here rather than in _CSS because the data URIs are large and
    # depend on helpers defined further down the module.
    leaf = _leaf_uri(ui.GREEN)
    st.markdown(
        "<style>"
        # full-page landscape
        ".eia-backdrop{background-image:url('%s');background-size:cover;"
        "background-position:center bottom;background-repeat:no-repeat}"
        # sun and birds sit in the background layer, high and to the right,
        # well clear of the reading column, and drift gently
        ".eia-backdrop .sun{position:absolute;right:7%%;top:5%%;"
        "width:17rem;height:17rem;background:url('%s') center/contain "
        "no-repeat;animation:eia-breathe 10s ease-in-out infinite}"
        "@keyframes eia-breathe{0%%,100%%{transform:scale(1);opacity:.75}"
        "50%%{transform:scale(1.05);opacity:.95}}"
        "@keyframes eia-drift{0%%{transform:translate(0,0)}"
        "50%%{transform:translate(-3rem,-1.1rem)}"
        "100%%{transform:translate(0,0)}}"
        "@media (prefers-reduced-motion:reduce){"
        ".eia-backdrop .sun,.eia-backdrop .bird,"
        ".eia-backdrop .bird::before{animation:none}}"
        "@media (max-width:820px){.eia-backdrop .sun,"
        ".eia-backdrop .bird{display:none}}"
        # small leaf chip beside every section heading
        ".eia-welcome h2{display:flex;align-items:center;gap:.7rem}"
        ".eia-welcome h2::before{content:'';flex:0 0 auto;width:2rem;"
        "height:2rem;border-radius:999px;background:%s url('%s') "
        "center/1.05rem no-repeat}"
        % (_bg_data_uri(), _svg_uri(_HERO_SUN), ui.SAGE, leaf)
        + _bird_css() + "</style>",
        unsafe_allow_html=True)

    st.markdown(f"""
<div class="eia-backdrop" aria-hidden="true"><span class="sun"></span><span class="bird b1"></span><span class="bird b2"></span><span class="bird b3"></span><span class="bird b4"></span><span class="bird b5"></span></div>

<div class="eia-welcome">

  <div class="hero reveal">
    <div class="lockup">
      <span class="lmark" style="width:3.9rem">{_MARK_BARE}</span>
      <span class="lword">EIA</span>
      <span class="lbar"></span>
      <span class="lsub">Startup Environmental<br>Impact Assessment</span>
    </div>
    <h1>Prove your environmental impact honestly</h1>
    <p class="tagline">A structured, defensible account of your startup's
       environmental impact that you can put in front of an investor without
       overstating anything.</p>
    <div class="meta">
      <span>About 45&ndash;60 minutes</span>
      <span>No consultant needed</span>
      <span>Ends in a Word report</span>
    </div>
  </div>

  <section class="reveal">
    <h2>Why this exists</h2>
    <p class="lead">If your startup makes any kind of environmental claim, you
       have probably run into the same wall. An investor, an accelerator, or a
       corporate customer asks: <em>"Can you show us your impact numbers?"</em>
       And your options look like this:</p>
    <div class="options">{_options_html()}</div>
    <p>This tool is built for that gap. It is a <strong>screening-level
       assessment</strong>: it will not replace a full LCA, and it does not
       pretend to. What it gives you is a structured account of what you claim,
       why you believe it, and how confident you actually are.</p>
    <p>The framework behind it comes from academic research on environmental
       impact assessment in early-stage ventures. The tool makes it something
       you can sit down and fill out.</p>
  </section>

  <section class="reveal">
    <h2>What you get at the end</h2>
    <p>A <strong>Word report</strong> you can send to an investor, an
       accelerator, or your board, containing your impact classification, your
       impact pathway, a short and focused set of indicators, every claim
       labelled with how confident you are, and an automated integrity check
       that flags the weak spots before someone else does.</p>
    <p>Plus a <strong>save file</strong>, so you can return and update the
       assessment as your company grows rather than starting from scratch.</p>
  </section>

  <section class="reveal">
    <h2>Before you start</h2>
    <p>You do not need an environmental consultant, and you do not need perfect
       data. Bring about an hour, whatever operational data you already have,
       and honesty about what you do not know. That last one matters most: a
       report that admits uncertainty is far more credible than one that
       does not.</p>
  </section>

  <section>
    <h2 class="reveal">The five steps</h2>
    <div class="cards">{_steps_html()}</div>
  </section>

  <section class="reveal">
    <h2>How confidence is labelled</h2>
    <p>Every claim you make gets one of three labels. All three are perfectly
       legitimate for an early-stage company:</p>
    <div class="levels">{_levels_html()}</div>
    <p>Nobody expects a seed-stage startup to have audited figures for
       everything. What destroys credibility is presenting a projection as if it
       were a measurement.</p>
  </section>

  <section>
    <h2 class="reveal">What makes this different</h2>
    <div class="features">{_features_html()}</div>
  </section>

  <section class="reveal">
    <h2>What this is not</h2>
    <div class="limits">
      <div class="limit"><b>Not a full LCA.</b> It does not replace ISO
        14040/14044 assessment.</div>
      <div class="limit"><b>Not comprehensive GHG accounting.</b> The built-in
        estimator is a screening tool using generic emission factors. Swap in
        national, year-specific factors before reporting externally.</div>
      <div class="limit"><b>Not a certification.</b> Nobody audits your inputs.
        Its credibility comes from transparency about method and confidence.</div>
      <div class="limit"><b>Not a score.</b> There is no single number at the
        end, deliberately.</div>
    </div>
  </section>

  <section>
    <h2 class="reveal">Questions</h2>
    {_faq_html()}
  </section>

  <div class="closing reveal">
    <h2>Ready?</h2>
    <p>Put in your startup's name and answer the first question. You can change
       everything afterwards, and there is no way to get it wrong on the
       first pass.</p>
  </div>

</div>

<div id="eia-launch-template" style="display:none" aria-hidden="true">
  <div class="mk">{_MARK_BARE}</div>
  <div class="msg">Preparing your assessment</div>
  <div class="bar"><i></i></div>
</div>
""", unsafe_allow_html=True)

    # Scripts only execute through st.html; markdown would strip them.
    _script(_SCROLL_JS)

    # Show the overlay the instant the button is pressed, so the round trip
    # to the server happens behind it. The script carries no markup: an
    # earlier version embedded the mark's SVG and Streamlit stripped the
    # whole script, so the markup is rendered above and cloned from here.
    _script("""
<script>
(function () {
  // The template below is rendered and owned by Streamlit's React tree, so
  // it must not be moved: relocating it makes React's next removeChild fail
  // against a node that is no longer where it left it. Clone instead.
  function overlay() {
    if (document.getElementById('eia-instant')) return;
    var tpl = document.getElementById('eia-launch-template');
    if (!tpl) return;
    var d = tpl.cloneNode(true);
    d.id = 'eia-instant';
    d.className = 'eia-launch';
    d.style.display = 'flex';
    document.body.appendChild(d);
    var m = document.querySelector('section[data-testid="stMain"]');
    if (m) m.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  function wire() {
    var found = false;
    document.querySelectorAll('button').forEach(function (b) {
      var t = (b.innerText || '').trim();
      if (t === 'Start the assessment' || t.indexOf('save file to resume') > -1) {
        found = true;
        if (!b.dataset.eiaWired) {
          b.dataset.eiaWired = '1';
          b.addEventListener('click', overlay);
        }
      }
    });
    return found;
  }
  if (!wire()) {
    var n = 0;
    var t = setInterval(function () {
      if (wire() || ++n > 60) clearInterval(t);
    }, 50);
  }
})();
</script>
""")

    left, right = st.columns([1, 1])
    with left:
        if st.button("Start the assessment", type="primary",
                     width="stretch", key="welcome_start"):
            on_start()
    with right:
        if on_resume is not None:
            if st.button("I have a save file to resume",
                         width="stretch",
                         key="welcome_resume"):
                on_resume()
