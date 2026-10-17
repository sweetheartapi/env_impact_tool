**Live app (GitHub Pages):** https://sweetheartapi.github.io/env_impact_tool/

# Startup Environmental Impact Assessment Tool (v3.2)

## v3.1: customer profile and next steps (feedback from SIC, Oct 2026)

Changes to the web version, from the expert consultation with the
Central Bohemian Innovation Centre (SIC):

- **Customer profile in step 1.** Customer segment (B2B, B2C, B2G or a mix)
  and, separately, the revenue model (subscription, device + subscription,
  one-off sale, licensing, pay per use, fees, commission). Three roles are
  asked apart: the buyer, the day-to-day user, and whoever must change their
  behaviour for the environmental benefit to happen (a municipality may buy
  software that only saves fuel if its employees use it). Plus why customers
  buy and how that links to the environmental benefit. All optional, so
  existing save files still load.
- **Next steps and points to consider.** Step 5 and every report format now
  end with concrete next steps drawn from the gaps in the assessment (weakest
  links, missing baselines, unmeasured core claims, aspirational indicators,
  a missing customer or commercial reason to adopt) and with "Have you
  considered…?" prompts that depend on the customer type, impact mechanism
  and stage. The rules are in `SCORING.nextSteps` in `docs/js/framework.js`.
- **Cause-and-effect diagram in step 2.** The impact pathway is drawn in
  three lanes: what the startup controls, what customers and users must do,
  and the environmental effect. Each pathway step has a new question, "Does
  this step depend on customers?" (no / adoption / behaviour change),
  pre-filled from the template. Customer steps are marked in orange, and the
  arrow where the technology hands over to customers is highlighted: a good
  technological solution is not yet a viable product. The diagram is also in
  the Word and HTML/PDF reports (`docs/js/diagram.js`). If no customer step
  has solid evidence, step 2 warns and the report adds a next step.
- **Indicators that reflect real impact (step 3).** Every indicator is tagged
  by what it measures: real-world outcome, adoption & use, technology /
  product only, own operations, or governance. Outcome and adoption
  indicators are highlighted. New bank entries: real-world outcome per
  participating customer, active use rate, customer retention, share of
  products actually returned or recycled, and (as a contrast) units
  produced or installed. These additions carry no thesis citation. Custom
  indicators must say what they measure. A new integrity check warns when
  no core indicator measures adoption or a real-world outcome, and the Word
  report's indicator tables gain a "Measures" column.
- **Claims & evidence (step 4).** Measured / modelled / projected stays.
  Evidence quality (low / medium / high) is a separate rating: a
  self-reported survey is measured data of low quality. Each claim now has
  a baseline ("compared with what?") and its evidence sources, and shows
  the assumption of the pathway step it relies on (from step 2). A
  claim–evidence check flags gaps: projected claims worded as fact,
  comparisons without a baseline, measured claims of low quality, claims
  without sources, and indicators that contradict a weak step-2 rating. A
  "Claims and evidence at a glance" table sits at the top of step 4 and in
  section 4 of the report; gaps also feed the integrity checks and next
  steps. Word tables now keep their column widths.
- **Impact–business alignment (step 5, report section 6).** Sets the
  customer value next to the environmental value, says whether the
  customer's reason to buy is tied to the environmental benefit, and lists
  only the commercial assumptions the benefit depends on (customers find it
  worth paying for, use turns into behaviour change, the saving and the
  impact come from the same change, rebound, retention, the adoption a
  projection assumes). The team marks each as not checked / some evidence /
  validated. Not a viability score and not business due diligence.
- **Structured recommendations (step 5, report section 7).** Each
  recommendation states the evidence gap, what it means, the recommended
  action, and why it matters at the current development stage; they are
  prioritised (high / medium / low) by stage. Unvalidated alignment
  assumptions become recommendations too. "Points to consider" stay.
  Report sections are now: 1 profile, 2 pathway, 3 indicators, 4 claims &
  evidence, 5 integrity checks, 6 impact–business alignment,
  7 recommendations, 8 review plan.
- **Traceable decision rules.** Recommendations and points to consider
  come from a fixed rule set (`SCORING.RULES` in `docs/js/framework.js`:
  R01–R16 recommendations, S01 strength, C01–C17 points to consider), not
  from a language model. Each recommendation shows its rule ID, the
  detected condition, the recommended action, why it matters, why now, and
  "based on": the exact assessment answers that triggered it. A strength
  rule (S01) fires when a claim is measured, high quality, sourced and
  documented, suggesting an evidence summary. Step 5 has a "How
  recommendations are made" table of all rules and which ones apply, and
  the report ends with the same table as an appendix.
- **Positioning.** The homepage now leads with "Understand your impact.
  Strengthen your claims. Know what comes next." and addresses founders
  first, with a "Who it is for" section (founders as primary users;
  accelerators and incubators; impact-oriented investors; conventional
  investors where environmental impact is relevant), instead of framing
  the report mainly as something to show investors.
- **Ready-to-explore demo.** "Explore a finished example" on the homepage
  opens the fictional FieldSense assessment (`docs/samples/FieldSense.json`)
  in one click, with a banner and a "Start your own assessment" button.
  It asks before replacing a real assessment in progress.
- **Calculation boundaries.** Each claim in step 4 records what the figure
  includes and leaves out (period, sites or customers, life-cycle stages);
  measured or modelled claims without one get a note.
- **Proportional reassurance (review round 2).** The alignment headline
  says "Potential alignment: n of m assumptions verified" until every
  critical assumption is validated; "saves them money" is split into savings
  on the same resource (counts towards alignment) and savings in labour or
  time (does not). The sidebar shows "Form completion", explicitly not
  evidence; step 5 adds "Evidence readiness" counts (measured outcomes,
  high-quality claims, assumptions verified, issues), never a score.
  "No gaps" became "No issues detected by these automated checks".
- **Stricter checks.** Blank claims are "not checked" rather than clean;
  the evidence-summary strength (S01) needs a written claim, boundary and a
  valid pathway link; the wording prompt checks each comparative sentence,
  and "can"/"will" no longer count as hedges; missing quality or boundary
  is a warning; pathway links to deleted steps are reported.
- **Action plan.** Step 5 leads with the three highest-priority actions,
  each with owner, deadline and "done when / evidence"; the reasoning is
  expandable and the rest sit under "More recommendations". Duplicate
  weak-link recommendations are merged. The report opens section 7 with
  the action plan table.
- **Classification examples.** The orientation question has contrasting
  examples and a note for products where both answers seem true.
- Save files gain optional keys: `customer_types`, `revenue_models`,
  `customer_profile` (the buyer), `customer_user`, `behaviour_actor`,
  `value_drivers`, `customer_value`, `custom_kinds`, `change` on each pathway
  stage, `kind` on each selected indicator, and `quality`, `baseline`,
  `sources`, `boundary` on each claim, `alignment` and `plan`.
  Older files load without them.


## v3.0: static web version on GitHub Pages

The tool now runs as a static website in [`docs/`](docs/), served by GitHub
Pages. There is no server: everything runs in the browser, which fixes the
Streamlit version's reload lag, dark-mode rendering glitches and cold starts.

- **Same framework, same rules.** `docs/js/framework.js` is a direct port of
  `framework/reference.py` and `framework/scoring.py`; `docs/js/report.js`
  ports `framework/report.py` (Markdown, HTML, Word and JSON).
- **Save files:** the web version reads Streamlit save files (same
  `startup-env-impact-assessment` format). The reverse is no longer true:
  the Streamlit version does not know the fields added in v3.1 (customer,
  revenue model, alignment, action plan, evidence quality, boundaries…) and
  drops them on export. The Streamlit version is retired; use the web
  version.
- **Progress saves automatically** in the browser (localStorage), so a reload
  or closed tab loses nothing. The JSON save file is still the way to move an
  assessment between devices or keep it long-term.
- **Word export** is generated in the browser with the bundled
  [docx](https://github.com/dolanmiu/docx) library (`docs/vendor/`), with
  headings, a table of contents, indicator tables, colour-coded confidence
  badges and page numbers. PDF export uses the browser's print dialog.
- **Works on phones**: the step list becomes a slide-out drawer.
- Not carried over: the optional AI assistant panel. It needs a secret API key,
  which a public static site cannot keep private.

To edit content (wording, indicators, rules), change `docs/js/framework.js`.
To preview locally:

```bash
python -m http.server 8000 --directory docs
```

then open http://localhost:8000. Pushing to `main` redeploys the site.

Tests for the browser rules: `node --test tests/web/*.test.mjs` (no
dependencies; also run by GitHub Actions on every push). The Python tests in
`tests/` cover only the retired Streamlit implementation.

The original Streamlit app (below) is retired: unchanged, not maintained,
and it does not have any of the v3.1 features.

---

# Streamlit version (v2.1.1)

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
