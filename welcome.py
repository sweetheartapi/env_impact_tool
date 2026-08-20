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

/* hero */
.eia-welcome .hero {{ text-align: center; padding: 1rem 0 2.4rem; }}
.eia-welcome .hero .mark {{ width: 5.2rem; margin: 0 auto .9rem; }}
.eia-welcome .hero .mark svg {{ width: 100%; height: auto; display: block; }}
.eia-welcome .hero h1 {{
    font-size: 2.7rem; font-weight: 800; letter-spacing: -.02em;
    color: #245139; margin: 0 0 .5rem; line-height: 1.08;
}}
.eia-welcome .hero .tagline {{
    font-size: 1.16rem; color: #37474A; font-weight: 500;
    max-width: 34rem; margin: 0 auto;
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
    background: #FCFCF8; border: 1px solid {ui.BORDER};
    border-left: 3px solid #C9B27A; border-radius: .7rem; padding: .8rem 1rem;
    font-size: .93rem;
}}
.eia-welcome .option b {{ display: block; color: {ui.INK}; margin-bottom: .15rem; }}

/* cards */
.eia-welcome .cards {{ display: grid; gap: .85rem; }}
.eia-welcome .card {{
    background: {ui.CARD}; border: 1px solid {ui.BORDER};
    border-radius: .9rem; padding: 1.05rem 1.2rem;
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
    display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: .9rem;
}}
.eia-welcome .feature {{
    background: {ui.SAGE}; border-radius: .8rem; padding: .95rem 1.1rem;
    font-size: .93rem; color: #33493C;
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
    background: {ui.CARD}; border: 1px solid {ui.BORDER};
    border-radius: .75rem; padding: .1rem .95rem; margin-bottom: .5rem;
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

/* closing */
.eia-welcome .closing {{
    text-align: center; padding: 2.4rem 0 .6rem; border-top: 1px solid {ui.BORDER};
}}
.eia-welcome .closing h2 {{ margin-bottom: .5rem; }}
.eia-welcome .closing p {{ color: {ui.MUTED}; max-width: 30rem; margin: 0 auto; }}
</style>
"""

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


def page(on_start, on_resume=None):
    """Render the welcome page. `on_start` is called when the reader clicks
    through to the assessment."""
    st.html(_CSS)

    st.html(f"""
<div class="eia-welcome">

  <div class="hero reveal">
    <div class="mark">{ui.logo_mark()}</div>
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
    <div class="options">
      <div class="option"><b>Commission a full LCA or GHG Protocol audit.</b>
        Rigorous and credible, but typically far too slow and expensive at your
        stage, especially when the product still changes every few months.</div>
      <div class="option"><b>Put together some numbers yourself.</b> Fast, but
        you end up reporting whatever data you happen to have rather than what
        actually matters. That is how well-meaning founders accidentally end up
        greenwashing.</div>
      <div class="option"><b>Say nothing specific.</b> Safe, but it makes a
        genuinely good venture look like it has nothing to show.</div>
    </div>
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
    <div class="features">
      <div class="feature reveal"><b>It adapts to your company</b>Four startup
        types, three pathway structures, guidance that shifts with your
        development stage. Not a generic form.</div>
      <div class="feature reveal"><b>It is proportionate</b>Three to five
        well-chosen indicators, not a corporate checklist. At ideation, getting
        the logic right matters more than having numbers.</div>
      <div class="feature reveal"><b>It protects you from greenwashing</b>Not a
        warning in the footer, but scoring rules that exclude vanity metrics and
        checks that catch known failure patterns.</div>
      <div class="feature reveal"><b>It treats uncertainty as a feature</b>Being
        precise about how confident you are is more honest, and in front of a
        sophisticated investor, more persuasive.</div>
    </div>
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
""")

    st.html(_SCROLL_JS, unsafe_allow_javascript=True)

    left, right = st.columns([1, 1])
    with left:
        if st.button("Start the assessment", type="primary", width="stretch",
                     key="welcome_start"):
            on_start()
    with right:
        if on_resume is not None:
            if st.button("I have a save file to resume", width="stretch",
                         key="welcome_resume"):
                on_resume()
