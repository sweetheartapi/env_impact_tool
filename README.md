App published on **Streamlit:** https://eiatool.streamlit.app/

# Startup Environmental Impact Assessment Tool (v2.1.1)

## Fixed bugs (v2.1.1)
- Unclear/black input fields — inputs, dropdowns, and labels now forced light with white backgrounds, visible borders, and dark semibold labels regardless of the browser's dark-mode setting.
- Development stage not updating dynamically — the sidebar stage card now updates in the same interaction, and the stage guidance also appears directly under the selector on step
- Diagnostic classification too subtle — each diagnostic question now has its own bordered panel with a bold question and high-contrast answer options.
- Diagnostic classification skippable — no more preselected answers; "Save & continue" stays disabled and steps 2–5 are blocked until the name and both questions are answered.
- Progress counted by navigation, not completion — a step is only marked ✓ when its content is actually filled in (e.g. at least one pathway stage described); merely visiting a step does nothing.
- Navigation looks inactive/faded — every step in the rail now shows a completion-percentage chip, full-contrast text, hover states, and a checkmark only when genuinely complete 
- Assessment progress positioning — the overall progress bar moved to the left sidebar, directly under the step list.
- Export not accessible earlier — the sidebar now has an Export section available from any step (once step 1 is minimally complete).
- Export flow too complicated — the complete Word report is a single click, both from the sidebar and on step 5; other formats are secondary.
- Technical terminology too difficult — a "Key terms, in plain language" card on step 1 explains mechanism, orientation, impact pathway, and hybrid in non-expert wording.

# Startup Environmental Impact Assessment Tool (v2.1)

**v2.1** adds a polished visual design: branded sidebar with a numbered
workflow rail, a contextual right-hand panel (live classification preview,
progress, guidance cards), hero headers, and a warm paper/forest-green
theme. All functionality is unchanged from v2; all widget keys are stable,
so saved JSON assessments from v2 load without modification.

An interactive implementation of the four-module framework from the thesis
*"A Proposed Framework for Environmental Impact Assessment in Early-Stage
Startups."* Screening-level by design: it does not replace full LCA or
GHG Protocol reporting.

## Run it

```powershell
pip install -r requirements.txt
python -m streamlit run app.py
```

## Project structure

```
app.py                     — Streamlit UI (the 5-step wizard)
ui.py                      — visual layer: design tokens, CSS, card
                             components, progress heuristic
.streamlit/config.toml     — theme (palette, fonts)
framework/
  reference.py             — all framework content: typology, diagnostic
                             questions, pathway templates, indicator bank
                             (with citations), stage guidance, emission
                             factors, references
  scoring.py               — feasibility–relevance bucketing + automated
                             integrity (anti-greenwashing) checks
  report.py                — Markdown / HTML / **Word (.docx)** / JSON
                             report builders and save/load persistence
tests/test_framework.py    — unit tests for scoring, persistence, and the
                             Word export (including edge cases with no
                             data filled in)
```

Content and logic are deliberately separated from the UI: to refine
wording, add indicators, or change a rule, edit `framework/` — the app
picks it up automatically.

## What changed vs. v1 (and why)

| Change | Grounding in the framework |
|---|---|
| **Diagnostic classification questions** instead of abstract self-labels ("if nobody changes behavior, does the benefit still occur?") | Reduces misclassification; Module 1 drives everything downstream |
| **Development-stage selector** with adaptive guidance (priority modules starred per stage) | Figure 11: module depth varies across ideation → growth |
| **Dual-track pathway template** for general-purpose startups (operational footprint + product externalities, incl. rebound effects) | Figure 8 lists three pathway structures; v1 only had two |
| **Per-stage assumptions + evidence strength** in the pathway; weak links surface automatically | Theory-of-change logic: assumptions must be explicit; weakest links are where contribution analysis is needed |
| **Indicator details**: unit, current value, target, frequency, data source, and a **link to the pathway stage it evidences** | Materiality: indicators must trace to the impact pathway, not float free |
| **Visual Feasibility–Relevance matrix** (Figure 9 rendered live) | Makes the scoring outcome inspectable at a glance |
| **Quick Scope 1+2 estimator** with generic factors, output explicitly labelled *Modelled* | Demonstrates the measured/modelled distinction in practice; screening-level GHG accounting |
| **Automated integrity checks**: vanity metrics (high feasibility / low relevance), core set >5, projected-claims-as-evidence, unlinked indicators, undocumented assumptions | Directly operationalizes the empirically observed greenwashing drivers |
| **Save / load + versioning + next-review milestone** | Principle 4: designed for updating, not completion — assessments are revisited at milestones, each reload starts a new review cycle |
| **Professional report**: executive summary, integrity-check results, methodology note, reference list; exports as **Word (.docx)**, HTML (printable to PDF), Markdown, or JSON | Credible communication to investors/incubators; academic traceability |
| **Package structure + unit tests** | Auditable, extensible codebase |

## The Word (.docx) report

The recommended export format. Built with `python-docx` at download time —
no separate conversion step, no LibreOffice/Word installation needed on
the user's machine. It includes:

- Real Word heading styles (Title, Heading 1–3), so the document has a
  proper outline in Word's Navigation Pane
- A **table of contents field** — on first opening in Word, right-click it
  and choose "Update Field" to populate it (standard behaviour for any
  TOC generated outside Word itself)
- Styled tables for each indicator bucket (zebra-striped, with feasibility/
  relevance/unit/target/data-source/pathway-link columns)
- Colour-coded confidence badges — green `[MEASURED]`, amber `[MODELLED]`,
  purple `[PROJECTED]` — and colour-coded integrity-check results, matching
  the in-app HTML report's visual language
- Page numbers in the footer

If `to_docx()` ever raises an exception, the app catches it and shows the
error inline on the Review page rather than crashing — the other three
export formats stay available regardless.

To verify template changes by eye rather than just by tests:

```bash
python -c "
from framework import report
data = report.assemble(some_state_dict)
open('out.docx', 'wb').write(report.to_docx(data))
"
soffice --headless --convert-to pdf out.docx
pdftoppm -jpeg -r 100 out.pdf page
# then open page-1.jpg, page-2.jpg, ...
```

## Notes & limitations

- **Emission factors** in the quick estimator are generic, indicative
  values for screening only. Replace with national, year-specific published
  factors (e.g. your national inventory, DEFRA, EEA) before any external
  reporting. All estimator outputs are *modelled* claims.
- **State is in-memory per browser session.** Persistence works via the
  JSON export/import (which also implements the milestone review cycle).
  For a public multi-user tool, add a database (SQLite → Postgres) and
  simple auth.
- **Reference list**: several thesis citations are included with
  author/year only where the full bibliographic details weren't in the
  extracted text — complete them from your thesis bibliography in
  `framework/reference.py` → `REFERENCES`.
