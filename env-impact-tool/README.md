# Startup Environmental Impact Assessment Tool (v2)

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

## Deployment (when you want it online)

1. Push this folder to a GitHub repository.
2. On Streamlit Community Cloud, create an app pointing at `app.py`.
   That's it — free, HTTPS, shareable link.
3. Later, if usage grows: add persistence (database), auth, and consider
   a proper domain. The `framework/` package would carry over unchanged
   to any future Flask/FastAPI + JS rewrite.
