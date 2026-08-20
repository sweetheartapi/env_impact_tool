"""
assistant.py: optional AI helper chat for the assessment tool.

A small chat panel (rendered in the sidebar) that answers user questions
about the framework: what the terms mean, why they were classified a
certain way, which indicators fit their startup, and so on. It is
grounded in the framework's own reference content plus the user's current
assessment state, so answers are contextual rather than generic.

Uses the Anthropic API. The panel degrades gracefully: without an API key
(ANTHROPIC_API_KEY in .streamlit/secrets.toml or the environment) it
shows setup instructions and the rest of the tool works unchanged.
"""

import os

import streamlit as st

from framework import reference as ref
from framework import scoring

try:
    import anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False

# Chosen for cost: Haiku is Anthropic's cheapest model and is well suited
# to explaining concepts. A typical Q&A here costs a fraction of a cent.
MODEL = "claude-haiku-4-5"
MAX_TOKENS = 1024
MAX_HISTORY = 12  # messages kept per conversation (6 exchanges)

# Chat avatar: if assets/assistant_icon.png exists (e.g. the original
# designed image dropped in by hand), it wins; otherwise the bundled
# vector recreation is used.
_ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
_ICON_PNG = os.path.join(_ASSETS, "assistant_icon.png")
_ICON = _ICON_PNG if os.path.exists(_ICON_PNG) else os.path.join(
    _ASSETS, "assistant_icon.svg")


def _api_key() -> str:
    try:
        key = st.secrets.get("ANTHROPIC_API_KEY", "")
    except Exception:  # no secrets.toml present
        key = ""
    return key or os.environ.get("ANTHROPIC_API_KEY", "")


# ---------------------------------------------------------------------------
# Knowledge base, built once from framework/reference.py so the assistant
# explains THIS framework's terminology, not generic definitions. Kept as a
# stable string so the API can cache it across questions.
# ---------------------------------------------------------------------------

def _build_knowledge() -> str:
    parts = [
        "You are the built-in help assistant of a Streamlit tool called "
        "'EIA: Startup Environmental Impact Assessment'. The tool implements "
        "a four-module, screening-level framework for environmental impact "
        "assessment in early-stage startups, based on the thesis 'A Proposed "
        "Framework for Environmental Impact Assessment in Early-Stage "
        "Startups'.",
        "",
        "Your job: answer users' questions about the framework and the tool. "
        "explain terminology in plain language, help them understand their "
        "classification, suggest which parts of the tool address their "
        "question, and clarify concepts like impact pathways, indicator "
        "scoring, and evidential confidence. Users are startup founders, not "
        "sustainability experts.",
        "",
        "Rules:",
        "- Be concise and friendly; prefer short paragraphs or a few bullets.",
        "- Ground every answer in the framework content below. If a question "
        "is outside the framework and tool (e.g. general business advice, "
        "unrelated topics), say so briefly and steer back.",
        "- Never invent framework rules, indicators, or thresholds that are "
        "not in the reference content.",
        "- This is a screening-level instrument: it does not replace full "
        "LCA (ISO 14040/44), GHG Protocol reporting, or regulatory "
        "compliance assessment, and it produces no composite score.",
        "",
        "== METHODOLOGY ==",
        ref.METHODOLOGY_NOTE,
        "",
        "== MODULE 1: STARTUP TYPOLOGY (2x2: impact mechanism x value orientation) ==",
        f"Diagnostic question for mechanism: {ref.DIAGNOSTIC_MECHANISM['question']}",
        f"Diagnostic question for orientation: {ref.DIAGNOSTIC_ORIENTATION['question']}",
    ]
    for (mech, ori), c in ref.CLASSIFICATION_MATRIX.items():
        parts.append(f"- {mech} + {ori} -> {c['label']}: {c['blurb']} "
                     f"Unit of analysis: {c['unit_of_analysis']}.")

    parts += ["", "== DEVELOPMENT STAGES (module emphasis varies by stage) =="]
    for stage, g in ref.STAGE_GUIDANCE.items():
        parts.append(f"- {stage} (priority modules "
                     f"{', '.join(str(m) for m in g['priority_modules'])}): {g['note']}")

    parts += [
        "",
        "== MODULE 2: IMPACT PATHWAY TEMPLATES ==",
    ]
    for t in ref.PATHWAY_TEMPLATES.values():
        stages = "; ".join(s for track in t["tracks"] for s, _ in track["stages"])
        parts.append(f"- {t['name']}: {t['description']} Stages: {stages}.")
    parts.append(
        "Each pathway stage gets a description, an explicit assumption linking "
        "it to the next stage, and an evidence-strength rating. Weak links "
        "(assumption only) are findings, not failures. They show where "
        "measurement is most needed.")

    parts += [
        "",
        "== MODULE 3: INDICATOR SELECTION (feasibility-relevance scoring) ==",
        "Each candidate indicator is scored on relevance (is it material to "
        "the impact pathway?) and feasibility (can the startup populate it "
        "with data it holds?). Bucketing rules: low relevance -> excluded "
        "regardless of feasibility (reporting available-but-immaterial "
        "metrics is a structural driver of greenwashing); high relevance + "
        "at least medium feasibility -> core set (recommended size 3-5 at "
        "early stages); high relevance + low feasibility -> aspirational "
        "(future indicator); medium relevance -> supplementary if highly "
        "feasible, otherwise optional.",
        "Indicator categories in the bank: "
        + "; ".join(ref.INDICATOR_BANK.keys()) + ".",
    ]
    for category, indicators in ref.INDICATOR_BANK.items():
        names = ", ".join(name for name, _, _, _ in indicators)
        parts.append(f"- {category}: {names}.")

    parts += ["", "== MODULE 4: EVIDENTIAL CONFIDENCE LEVELS =="]
    for lvl, desc in ref.CONFIDENCE_LEVELS.items():
        parts.append(f"- {lvl}: {desc}")

    parts += [
        "",
        "== TOOL STRUCTURE (5 steps) ==",
        "1 Profile & classify (name, sector, stage, two diagnostic questions "
        "-> classification); 2 Impact pathway (describe stages, assumptions, "
        "evidence strength, weakest links); 3 Select indicators (score, "
        "detail, scoring matrix, quick Scope 1+2 estimator with generic "
        "emission factors, so outputs are Modelled claims); 4 Label "
        "uncertainty (confidence level, claim, assumptions, conditions per "
        "indicator); 5 Review, report & export (integrity checks, next "
        "review milestone, Word/HTML/Markdown/JSON export; the JSON file "
        "re-imports to resume, and each re-import starts a new review cycle). "
        "Export is also available from the sidebar at any time once step 1 "
        "is complete. Progress is only saved via the exported JSON file.",
        "",
        "== INTEGRITY CHECKS (anti-greenwashing) ==",
        "The tool warns about: empty or oversized (>5) core sets; vanity "
        "metrics (high feasibility, low relevance); core claims without a "
        "confidence label; evidence bases consisting only of Projected "
        "claims; core indicators not linked to a pathway stage; and "
        "modelled/projected claims without documented assumptions. Warnings "
        "are guidance, not blockers.",
    ]
    return "\n".join(parts)


_KNOWLEDGE = _build_knowledge()


def _context_block(S) -> str:
    """Short description of the user's current assessment state, appended
    after the cached knowledge base so answers can be specific to them."""
    lines = ["== USER'S CURRENT ASSESSMENT STATE =="]
    lines.append(f"Currently on step {S.get('step', 1)} of 5.")
    if S.get("startup_name"):
        lines.append(f"Startup: {S['startup_name']}"
                     + (f" ({S['sector']})" if S.get("sector") else "")
                     + f", stage: {S.get('stage', '?')}.")
    if S.get("startup_desc"):
        lines.append(f"Description: {S['startup_desc']}")
    mech, ori = S.get("mechanism"), S.get("orientation")
    if mech and ori:
        cls = ref.CLASSIFICATION_MATRIX.get((mech, ori))
        if cls:
            lines.append(f"Classification: {mech} mechanism, {ori} orientation "
                         f"-> {cls['label']}"
                         + (" (hybrid)" if S.get("is_hybrid") else "") + ".")
    else:
        lines.append("Diagnostic questions not answered yet.")
    stages = [s for t in S.get("pathway", {}).values() for s in t]
    if stages:
        described = sum(1 for s in stages if s.get("description"))
        lines.append(f"Pathway: {described}/{len(stages)} stages described.")
    sel = S.get("selected_indicators", {})
    if sel:
        buckets = scoring.group_by_bucket(sel)
        core = [n for n, _ in buckets[scoring.BUCKET_CORE]]
        lines.append(f"Indicators selected: {len(sel)}; core set: "
                     + (", ".join(core) if core else "(empty)") + ".")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Chat panel
# ---------------------------------------------------------------------------

def panel(S):
    """Render the assistant chat panel (call inside the sidebar)."""
    with st.expander("💬 Ask the assistant"):
        if not _ANTHROPIC_AVAILABLE:
            st.caption("The AI assistant needs the `anthropic` package: "
                       "run `pip install -r requirements.txt` and restart.")
            return
        if not _api_key():
            c1, c2 = st.columns([1, 4])
            c1.image(_ICON, width=44)
            c2.caption(
                "**Optional AI helper, not set up yet.** It answers "
                "questions about the framework and your assessment. To "
                "enable it, add an Anthropic API key to "
                "`.streamlit/secrets.toml` (see the README for steps; "
                "roughly $5 one-time credit covers 1000+ questions).")
            return

        history = S.setdefault("chat_history", [])
        if not history:
            c1, c2 = st.columns([1, 4])
            c1.image(_ICON, width=44)
            c2.caption("Hi! Ask me anything about the framework or your "
                       "assessment. For example, *\"what does Modelled mean?\"* or "
                       "*\"why was I classified this way?\"*")
        for msg in history:
            avatar = _ICON if msg["role"] == "assistant" else None
            with st.chat_message(msg["role"], avatar=avatar):
                st.markdown(msg["content"])

        if history and st.button("Clear conversation", key="chat_clear"):
            S["chat_history"] = []
            st.rerun()

        question = st.chat_input("Ask about the framework…", key="chat_input")
        if not question:
            return

        history.append({"role": "user", "content": question})
        with st.chat_message("user"):
            st.markdown(question)

        client = anthropic.Anthropic(api_key=_api_key())
        api_messages = [{"role": m["role"], "content": m["content"]}
                        for m in history[-MAX_HISTORY:]]
        try:
            with st.chat_message("assistant", avatar=_ICON):
                with client.messages.stream(
                    model=MODEL,
                    max_tokens=MAX_TOKENS,
                    system=[
                        # stable knowledge base first (cacheable prefix),
                        # volatile per-user state after it
                        {"type": "text", "text": _KNOWLEDGE,
                         "cache_control": {"type": "ephemeral"}},
                        {"type": "text", "text": _context_block(S)},
                    ],
                    messages=api_messages,
                ) as stream:
                    answer = st.write_stream(stream.text_stream)
            history.append({"role": "assistant", "content": answer})
        except anthropic.AuthenticationError:
            history.pop()
            st.error("The API key was rejected. Check ANTHROPIC_API_KEY in "
                     ".streamlit/secrets.toml.")
        except anthropic.RateLimitError:
            history.pop()
            st.error("The AI service is rate-limited right now. Wait a "
                     "moment and try again.")
        except anthropic.APIConnectionError:
            history.pop()
            st.error("Could not reach the AI service. Check your internet "
                     "connection.")
        except anthropic.APIStatusError as exc:
            history.pop()
            st.error(f"The AI service returned an error ({exc.status_code}). "
                     "Try again in a moment.")
