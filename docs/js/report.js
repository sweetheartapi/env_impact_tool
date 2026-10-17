/*
 * report.js: builds the assessment report from app state. The report is
 * assembled as structured data, then rendered to Markdown, a printable HTML
 * document, a Word (.docx) file, and the JSON save file.
 *
 * A port of framework/report.py. The JSON save format is identical, so save
 * files from the Streamlit version load here and vice versa.
 */

const REPORT = {};

REPORT.today = () => {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

REPORT.assemble = function (state) {
  const cls = REF.CLASSIFICATION_MATRIX[`${state.mechanism}|${state.orientation}`];
  const buckets = SCORING.groupByBucket(state.selected_indicators);
  const checks = SCORING.integrityChecks(state.selected_indicators, state.uncertainty, state.pathway);
  const refs = new Set(["weiss1995", "mayne2008", "kellogg2004", "mclaughlin2015",
    "iso2015", "sahili2024", "lilin2025", "roomi2021", "weidema2018"]);
  Object.values(state.selected_indicators).forEach(e => { if (e.citation) refs.add(e.citation); });
  const references = {};
  [...refs].sort().forEach(k => { if (REF.REFERENCES[k]) references[k] = REF.REFERENCES[k]; });
  return {
    meta: {
      startup_name: state.startup_name,
      startup_desc: state.startup_desc,
      sector: state.sector || "",
      stage: state.stage,
      generated: REPORT.today(),
      assessment_version: state.assessment_version || 1,
      next_review_milestone: state.next_review_milestone || "",
      review_notes: state.review_notes || "",
    },
    customer: {
      types: state.customer_types || [],
      type_label: REF.customerTypeLabel(state.customer_types),
      profile: state.customer_profile || "",
      user: state.customer_user || "",
      actor: state.behaviour_actor || "",
      revenue: (state.revenue_models || []).map(k => (REF.REVENUE_MODELS.find(([v]) => v === k) || [k, k])[1]),
      drivers: (state.value_drivers || []).map(k => (REF.VALUE_DRIVERS.find(([v]) => v === k) || [k, k])[1]),
      value: state.customer_value || "",
    },
    classification: {
      mechanism: state.mechanism,
      orientation: state.orientation,
      is_hybrid: !!state.is_hybrid,
      secondary_mechanism: state.secondary_mechanism,
      label: cls.label,
      blurb: cls.blurb,
      unit_of_analysis: cls.unit_of_analysis,
    },
    pathway: state.pathway || {},
    weakest_links: state.weakest_links || "",
    buckets,
    uncertainty: state.uncertainty,
    integrity_checks: checks,
    claim_rows: Object.entries(state.uncertainty || {}).map(([n, u]) => {
      const e = (state.selected_indicators || {})[n] || {};
      const st = SCORING.pathwayStage(state.pathway, e.pathway_link);
      return { name: n, u, link: e.pathway_link || "", stage: st,
        gaps: SCORING.claimGaps(n, u, e, state.pathway) };
    }),
    next_steps: SCORING.nextSteps(state),
    alignment: SCORING.alignment(state),
    references,
    stage_note: REF.STAGE_GUIDANCE[state.stage].note,
  };
};

function levelCounts(r) {
  const counts = {};
  Object.values(r.uncertainty).forEach(u => {
    const k = u.level || "unlabelled";
    counts[k] = (counts[k] || 0) + 1;
  });
  return counts;
}

function evidenceLine(counts) {
  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k.toLowerCase()}`);
  return parts.length ? parts.join(", ") : "not yet labelled";
}

// Customer lines for section 1, as [label, value] pairs (empty ones dropped).
function customerLines(cu) {
  return [
    ["Customer segment", cu.type_label],
    ["Revenue model", (cu.revenue || []).join("; ")],
    ["Buyer (decides and pays)", cu.profile],
    ["User (day to day)", cu.user],
    ["Whose behaviour must change", cu.actor],
    ["Why customers buy it", cu.drivers.join("; ")],
    ["Customer value & environmental link", cu.value],
  ].filter(([, v]) => v);
}

const kindLabel = (n, e) => (REF.INDICATOR_KINDS[REF.indicatorKind(n, e)] || { label: "not set" }).label;
const kindReal = (n, e) => !!(REF.INDICATOR_KINDS[REF.indicatorKind(n, e)] || {}).real;

const qualityLabel = q => (REF.EVIDENCE_QUALITY.find(([k]) => k === (q || "")) || ["", "Not assessed yet"])[1];
const gapCount = row => row.gaps.filter(g => g.sev === "warning").length;

const ALIGN_VERDICT = { aligned: "Aligned", partly: "Partly aligned", independent: "Not linked", unclear: "Unclear" };
const alignStatus = k => (SCORING.ALIGN_STATUS.find(([v]) => v === k) || ["", "Not checked yet"])[1];
const ALIGN_SCOPE = "Where the environmental benefit depends on commercial assumptions. Not a commercial viability score and not business due diligence: commercial questions appear only where they decide whether the environmental benefit happens or can be evidenced.";

const INDICATOR_FIELDS = [["unit", "Unit"], ["current_value", "Current value"], ["target", "Target"],
  ["frequency", "Measured"], ["data_source", "Data source"], ["pathway_link", "Evidences pathway stage"]];

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

REPORT.toMarkdown = function (r) {
  const m = r.meta, c = r.classification, L = [];
  L.push(`# Environmental Impact Assessment: ${m.startup_name}`);
  L.push(`*Assessment version ${m.assessment_version} · Generated ${m.generated} · Development stage: ${m.stage}*\n`);
  if (m.startup_desc) L.push(`> ${m.startup_desc}\n`);
  if (m.sector) L.push(`**Sector:** ${m.sector}\n`);

  const core = r.buckets[SCORING.BUCKET_CORE];
  const counts = levelCounts(r);
  const warn = r.integrity_checks.filter(([s]) => s === "warning");
  L.push("## Executive Summary");
  L.push(`- **Classification:** ${c.label}`);
  L.push(`- **Primary unit of analysis:** ${c.unit_of_analysis}`);
  if (r.customer.type_label) L.push(`- **Customer:** ${r.customer.type_label}`);
  L.push(`- **Core indicator set:** ${core.length} indicator(s)` + (core.length ? ": " + core.map(([n]) => n).join("; ") : ""));
  if (Object.keys(counts).length) L.push(`- **Evidence base:** ${evidenceLine(counts)}`);
  L.push(`- **Integrity checks:** ${warn.length} warning(s)` + (warn.length ? ". See Section 5" : ""));
  if (r.next_steps.actions.length) L.push(`- **Next steps:** ${r.next_steps.actions.length} recommended. See Section 7`);
  if (r.alignment.applies) L.push(`- **Impact–business alignment:** ${ALIGN_VERDICT[r.alignment.verdict]}; ${r.alignment.assumptions.filter(a => a.status !== "validated").length} of ${r.alignment.assumptions.length} critical commercial assumptions not yet validated. See Section 6`);
  if (m.next_review_milestone) L.push(`- **Next scheduled review:** ${m.next_review_milestone}`);
  L.push("");

  L.push("## 1. Startup Profiling & Type Classification");
  L.push(`- **Impact mechanism:** ${c.mechanism}` + (c.is_hybrid ? ` (secondary track: ${c.secondary_mechanism})` : ""));
  L.push(`- **Value proposition orientation:** ${c.orientation}`);
  L.push(`- **Resulting type:** ${c.label}`);
  L.push(`- ${c.blurb}\n`);
  const cuL = customerLines(r.customer);
  if (cuL.length) {
    L.push("**Customer**");
    cuL.forEach(([k, v]) => L.push(`- **${k}:** ${v}`));
    L.push("");
  }
  L.push(`*Stage guidance (${m.stage}):* ${r.stage_note}\n`);

  L.push("## 2. Impact Pathway (Theory of Change)");
  Object.entries(r.pathway).forEach(([track, stages]) => {
    L.push(`### ${track}`);
    stages.forEach(s => {
      L.push(`- **${s.stage}**`);
      L.push(`  - Description: ${s.description || "_(not filled in)_"}`);
      L.push(`  - Underlying assumption: ${s.assumption || "_(not stated)_"}`);
      L.push(`  - Evidence strength: ${s.evidence || "Not rated"}`);
      if (s.change && s.change !== "none") L.push(`  - Depends on customers: ${REF.DEPENDENCE_SHORT[s.change]}`);
    });
  });
  const custMd = Object.values(r.pathway).flat().filter(s => s.change && s.change !== "none");
  L.push(`\n**Steps that depend on customers:** ` + (custMd.length ? custMd.map(s => `${s.stage} (${REF.DEPENDENCE_SHORT[s.change].toLowerCase()})`).join("; ") : "none marked"));
  if (r.weakest_links) L.push(`\n**Weakest link(s) in the chain:** ${r.weakest_links}`);
  L.push("");

  L.push("## 3. Indicator Set (Feasibility–Relevance Scoring)");
  SCORING.BUCKET_ORDER.forEach(b => {
    const items = r.buckets[b];
    if (!items.length) return;
    L.push(`### ${b}`);
    items.forEach(([n, e]) => {
      const d = [`Measures: ${kindLabel(n, e)}`, `Feasibility: ${e.feasibility}`, `Relevance: ${e.relevance}`];
      INDICATOR_FIELDS.forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${e[f]}`); });
      L.push(`- **${n}** (${e.category}): ` + d.join(" · "));
    });
  });
  L.push("");

  L.push("## 4. Claims & Evidence");
  if (!r.claim_rows.length) L.push("_No claims labelled yet._");
  else {
    L.push("| Indicator | Claim | Level | Quality | Baseline | Sources | Gaps |");
    L.push("| --- | --- | --- | --- | --- | --- | --- |");
    const cellMd = t => String(t || "").replace(/\|/g, "/").replace(/\n/g, " ");
    r.claim_rows.forEach(row => L.push(`| ${cellMd(row.name)} | ${cellMd(row.u.claim) || "—"} | ${row.u.level || "—"} | ${REF.QUALITY_SHORT[row.u.quality || ""]} | ${row.u.baseline ? "yes" : SCORING.COMPARATIVE.test(row.u.claim || "") ? "missing" : "not needed"} | ${row.u.sources ? "yes" : "missing"} | ${gapCount(row) || "none"} |`));
    L.push("");
  }
  r.claim_rows.forEach(row => {
    const u = row.u;
    L.push(`### ${row.name}`);
    const lvl = u.level || "unlabelled";
    L.push(`- **Evidential confidence:** ${lvl}` + (REF.CONFIDENCE_LEVELS[lvl] ? `. ${REF.CONFIDENCE_LEVELS[lvl]}` : ""));
    L.push(`- **Evidence quality:** ${qualityLabel(u.quality)}`);
    if (u.claim) L.push(`- **Claim as stated:** ${u.claim}`);
    L.push(`- **Baseline:** ${u.baseline || "_(not stated)_"}`);
    L.push(`- **Evidence and data sources:** ${u.sources || "_(not stated)_"}`);
    if (row.stage) L.push(`- **Relies on pathway step:** ${row.link}. Assumption: ${row.stage.assumption || "_(none stated)_"} (evidence: ${row.stage.evidence || "Not rated"})`);
    L.push(`- **Assumptions:** ${u.assumptions || "_(not filled in)_"}`);
    L.push(`- **Conditions under which the estimate could differ significantly:** ${u.conditions || "_(not filled in)_"}`);
    row.gaps.forEach(g => L.push(`- ${g.sev === "warning" ? "⚠️ **Gap:**" : "ℹ️"} ${g.msg}`));
  });
  L.push("");

  L.push("## 5. Integrity Checks");
  const sym = { warning: "⚠️", info: "ℹ️", ok: "✅" };
  r.integrity_checks.forEach(([s, msg]) => L.push(`- ${sym[s]} ${msg}`));
  L.push("");

  const al = r.alignment;
  L.push("## 6. Impact–Business Alignment");
  L.push(`_${ALIGN_SCOPE}_\n`);
  L.push(`- **Customer value:** ${al.customer_value || "_(not described)_"}`);
  L.push(`- **Environmental value:** ${al.env_value || "_(not described)_"}`);
  L.push(`- **Alignment:** ${ALIGN_VERDICT[al.verdict]}. ${al.verdict_text}\n`);
  if (al.assumptions.length) {
    L.push("**Critical assumptions**");
    al.assumptions.forEach(a => {
      L.push(`- **${a.text}** _(${alignStatus(a.status)})_` + (a.note ? ` — ${a.note}` : ""));
      L.push(`  - Why it matters: ${a.why}`);
      L.push(`  - How to check: ${a.test}`);
    });
  }
  L.push("");

  L.push("## 7. Recommendations & Points to Consider");
  if (r.next_steps.actions.length) {
    r.next_steps.actions.forEach((a, i) => {
      L.push(`### ${i + 1}. ${a.title} (${SCORING.PRIORITY_LABEL[a.priority]} priority)`);
      L.push(`- **Evidence gap:** ${a.gap}`);
      L.push(`- **What it means:** ${a.implication}`);
      L.push(`- **Recommended action:** ${a.action}`);
      L.push(`- **Why now (${r.meta.stage}):** ${a.why_now}`);
    });
    if (r.next_steps.more) L.push(`\n_${r.next_steps.more} lower-priority recommendation(s) not listed._`);
  } else L.push("_No open gaps found._");
  if (r.next_steps.consider.length) {
    L.push("\n**Points to consider** (questions worth a thought; ignore any that do not apply)");
    r.next_steps.consider.forEach(cq => L.push(`- **${cq.title}** ${cq.text}`));
  }
  L.push("");

  L.push("## 8. Review & Updating Plan");
  L.push("This assessment is designed for updating, not for completion. It should be revisited at defined milestones rather than filed as a one-time exercise.");
  L.push(`- **Next review milestone:** ${m.next_review_milestone || "_(not set)_"}`);
  if (m.review_notes) L.push(`- **Notes:** ${m.review_notes}`);
  L.push("");

  L.push("## Methodology");
  L.push(REF.METHODOLOGY_NOTE);
  L.push("");
  L.push("## References");
  Object.keys(r.references).sort().forEach(k => L.push(`- ${r.references[k]}`));
  return L.join("\n");
};

// ---------------------------------------------------------------------------
// HTML (self-contained, printable to PDF from the browser). The body part is
// also used for the in-app report preview.
// ---------------------------------------------------------------------------

const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

REPORT.CSS = `
body { font-family: Georgia, 'Times New Roman', serif; max-width: 820px;
       margin: 2.5rem auto; padding: 0 1.5rem; color: #1a2b23; line-height: 1.55; background: #fff; }
h1 { font-size: 1.7rem; border-bottom: 3px solid #2e6b4f; padding-bottom: .4rem; }
h2 { font-size: 1.25rem; color: #2e6b4f; margin-top: 2rem; border-bottom: 1px solid #cfe0d6; padding-bottom: .2rem; }
h3 { font-size: 1.02rem; margin-bottom: .2rem; }
.meta { color: #5a6b62; font-style: italic; }
blockquote { border-left: 4px solid #2e6b4f; margin: 1rem 0; padding: .3rem 1rem; background: #f2f7f4; }
ul { padding-left: 1.3rem; } li { margin: .25rem 0; }
.badge { display: inline-block; padding: .1rem .55rem; border-radius: 1rem; font-size: .8rem;
         font-family: Arial, sans-serif; color: #fff; vertical-align: middle; }
.b-Measured { background: #2e6b4f; } .b-Modelled { background: #b8860b; } .b-Projected { background: #8a5a9e; }
.b-q { background: #5a6b62; } .b-hi { background: #a33; }
table.claims { border-collapse: collapse; width: 100%; font-size: .88rem; margin: .5rem 0 1rem; font-family: Arial, sans-serif; }
table.claims th, table.claims td { border: 1px solid #cfe0d6; padding: .35rem .5rem; text-align: left; vertical-align: top; }
table.claims th { background: #2e6b4f; color: #fff; }
.warn { color: #a33; } .ok { color: #2e6b4f; } .info { color: #345d8a; }
footer { margin-top: 3rem; font-size: .85rem; color: #5a6b62; border-top: 1px solid #cfe0d6; padding-top: .8rem; }
.diagram svg { width: 100%; height: auto; display: block; margin: .4rem 0 .8rem; }
.dep { display: inline-block; padding: .05rem .5rem; border-radius: 1rem; font-size: .75rem;
       font-family: Arial, sans-serif; background: #D9661F; color: #fff; vertical-align: middle; }
@media print { body { margin: 0 auto; } .diagram { break-inside: avoid; } }
`;

REPORT.toHtmlBody = function (r) {
  const m = r.meta, c = r.classification, P = [];
  const li = items => "<ul>" + items.map(i => `<li>${i}</li>`).join("") + "</ul>";

  P.push(`<h1>Environmental Impact Assessment: ${esc(m.startup_name)}</h1>`);
  P.push(`<p class="meta">Assessment version ${m.assessment_version} · Generated ${m.generated} · Development stage: ${esc(m.stage)}` +
    (m.sector ? ` · Sector: ${esc(m.sector)}` : "") + "</p>");
  if (m.startup_desc) P.push(`<blockquote>${esc(m.startup_desc)}</blockquote>`);

  const core = r.buckets[SCORING.BUCKET_CORE];
  const warnN = r.integrity_checks.filter(([s]) => s === "warning").length;
  P.push("<h2>Executive Summary</h2>");
  P.push(li([
    `<b>Classification:</b> ${esc(c.label)}`,
    `<b>Primary unit of analysis:</b> ${esc(c.unit_of_analysis)}`,
    `<b>Core indicator set:</b> ${core.length} indicator(s)` + (core.length ? ": " + core.map(([n]) => esc(n)).join("; ") : ""),
    `<b>Evidence base:</b> ${esc(evidenceLine(levelCounts(r)))}`,
    `<b>Integrity checks:</b> ${warnN} warning(s)`,
  ].concat(r.customer.type_label ? [`<b>Customer:</b> ${esc(r.customer.type_label)}`] : [],
    r.next_steps.actions.length ? [`<b>Recommendations:</b> ${r.next_steps.actions.length} (Section 7)`] : [],
    r.alignment.applies ? [`<b>Impact–business alignment:</b> ${ALIGN_VERDICT[r.alignment.verdict]}; ${r.alignment.assumptions.filter(a => a.status !== "validated").length} of ${r.alignment.assumptions.length} critical assumptions not yet validated (Section 6)`] : [], [
    `<b>Next scheduled review:</b> ${esc(m.next_review_milestone) || "(not set)"}`,
  ])));

  P.push("<h2>1. Startup Profiling &amp; Type Classification</h2>");
  P.push(li([
    `<b>Impact mechanism:</b> ${esc(c.mechanism)}` + (c.is_hybrid ? ` (secondary track: ${esc(c.secondary_mechanism)})` : ""),
    `<b>Value proposition orientation:</b> ${esc(c.orientation)}`,
    `<b>Resulting type:</b> ${esc(c.label)}. ${esc(c.blurb)}`,
  ]));
  const cuH = customerLines(r.customer);
  if (cuH.length) {
    P.push("<h3>Customer</h3>");
    P.push(li(cuH.map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`)));
  }
  P.push(`<p class="meta">Stage guidance (${esc(m.stage)}): ${esc(r.stage_note)}</p>`);

  P.push("<h2>2. Impact Pathway (Theory of Change)</h2>");
  Object.entries(r.pathway).forEach(([track, stages]) => {
    P.push(`<h3>${esc(track)}</h3>`);
    if (typeof PATHWAY_DIAGRAM !== "undefined" && stages.length)
      P.push(`<div class="diagram">${PATHWAY_DIAGRAM.svg(track, stages, { actor: r.customer.actor }).svg}</div>`);
    P.push(li(stages.map(s => `<b>${esc(s.stage)}</b>` +
      (s.change && s.change !== "none" ? ` <span class="dep">${esc(REF.DEPENDENCE_SHORT[s.change])}</span>` : "") +
      `<br>Description: ${esc(s.description || "(not filled in)")}<br>` +
      `Assumption: ${esc(s.assumption || "(not stated)")}<br>Evidence strength: ${esc(s.evidence || "Not rated")}`)));
  });
  if (r.weakest_links) P.push(`<p><b>Weakest link(s):</b> ${esc(r.weakest_links)}</p>`);

  P.push("<h2>3. Indicator Set (Feasibility–Relevance Scoring)</h2>");
  let any = false;
  SCORING.BUCKET_ORDER.forEach(b => {
    const items = r.buckets[b];
    if (!items.length) return;
    any = true;
    P.push(`<h3>${esc(b)}</h3>`);
    P.push(li(items.map(([n, e]) => {
      const d = [`Measures: ${esc(kindLabel(n, e))}`, `Feasibility: ${e.feasibility}`, `Relevance: ${e.relevance}`];
      INDICATOR_FIELDS.forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${esc(e[f])}`); });
      return `<b>${esc(n)}</b> <i>(${esc(e.category)})</i>: ` + d.join(" · ");
    })));
  });
  if (!any) P.push("<p><i>No indicators selected.</i></p>");

  P.push("<h2>4. Claims &amp; Evidence</h2>");
  if (!r.claim_rows.length) P.push("<p><i>No claims labelled yet.</i></p>");
  else {
    P.push("<table class=\"claims\"><thead><tr><th>Indicator and claim</th><th>Level</th><th>Quality</th><th>Baseline</th><th>Sources</th><th>Gaps</th></tr></thead><tbody>" +
      r.claim_rows.map(row => `<tr><td><b>${esc(row.name)}</b>${row.u.claim ? `<br><i>“${esc(row.u.claim)}”</i>` : ""}</td>` +
        `<td>${esc(row.u.level || "—")}</td><td>${esc(REF.QUALITY_SHORT[row.u.quality || ""])}</td>` +
        `<td>${row.u.baseline ? "✓" : SCORING.COMPARATIVE.test(row.u.claim || "") ? "<span class=\"warn\">missing</span>" : "not needed"}</td><td>${row.u.sources ? "✓" : "<span class=\"warn\">missing</span>"}</td>` +
        `<td>${gapCount(row) ? `<span class="warn">${gapCount(row)}</span>` : "none"}</td></tr>`).join("") + "</tbody></table>");
  }
  r.claim_rows.forEach(row => {
    const u = row.u;
    const lvl = u.level || "unlabelled";
    const badge = REF.CONFIDENCE_LEVELS[lvl] ? `<span class="badge b-${lvl}">${esc(lvl)}</span>` : esc(lvl);
    P.push(`<h3>${esc(row.name)} ${badge} <span class="badge b-q">Quality: ${esc(REF.QUALITY_SHORT[u.quality || ""])}</span></h3>`);
    const rows = [];
    if (u.claim) rows.push(`<b>Claim as stated:</b> ${esc(u.claim)}`);
    rows.push(`<b>Baseline:</b> ${esc(u.baseline || "(not stated)")}`);
    rows.push(`<b>Evidence and data sources:</b> ${esc(u.sources || "(not stated)")}`);
    if (row.stage) rows.push(`<b>Relies on pathway step:</b> ${esc(row.link)}. Assumption: ${esc(row.stage.assumption || "(none stated)")} (evidence: ${esc(row.stage.evidence || "Not rated")})`);
    rows.push(`<b>Assumptions:</b> ${esc(u.assumptions || "(not filled in)")}`);
    rows.push(`<b>Conditions that could change the estimate:</b> ${esc(u.conditions || "(not filled in)")}`);
    row.gaps.forEach(g => rows.push(`<span class="${g.sev === "warning" ? "warn" : "info"}">${g.sev === "warning" ? "⚠ Gap: " : "ℹ "}${esc(g.msg)}</span>`));
    P.push(li(rows));
  });

  P.push("<h2>5. Integrity Checks</h2>");
  const cl = { warning: "warn", ok: "ok", info: "info" }, sym = { warning: "⚠", ok: "✔", info: "ℹ" };
  P.push(li(r.integrity_checks.map(([s, msg]) => `<span class="${cl[s]}">${sym[s]} ${esc(msg)}</span>`)));

  const alH = r.alignment;
  P.push("<h2>6. Impact–Business Alignment</h2>");
  P.push(`<p class="meta">${esc(ALIGN_SCOPE)}</p>`);
  P.push(`<table class="claims"><tr><th>Customer value</th><th>Environmental value</th></tr><tr><td>${esc(alH.customer_value || "(not described)")}</td><td>${esc(alH.env_value || "(not described)")}</td></tr></table>`);
  P.push(`<p><b>Alignment: ${esc(ALIGN_VERDICT[alH.verdict])}.</b> ${esc(alH.verdict_text)}</p>`);
  if (alH.assumptions.length) {
    P.push("<h3>Critical assumptions</h3>");
    P.push(li(alH.assumptions.map(a => `<b>${esc(a.text)}</b> <span class="badge ${a.status === "validated" ? "b-Measured" : a.status === "some" ? "b-Modelled" : "b-q"}">${esc(alignStatus(a.status))}</span>` +
      (a.note ? `<br><i>${esc(a.note)}</i>` : "") + `<br>Why it matters: ${esc(a.why)}<br>How to check: ${esc(a.test)}`)));
  }

  P.push("<h2>7. Recommendations &amp; Points to Consider</h2>");
  if (r.next_steps.actions.length) {
    r.next_steps.actions.forEach((a, i) => {
      P.push(`<h3>${i + 1}. ${esc(a.title)} <span class="badge ${a.priority === 3 ? "b-hi" : a.priority === 2 ? "b-Modelled" : "b-q"}">${esc(SCORING.PRIORITY_LABEL[a.priority])} priority</span></h3>`);
      P.push(li([`<b>Evidence gap:</b> ${esc(a.gap)}`, `<b>What it means:</b> ${esc(a.implication)}`,
        `<b>Recommended action:</b> ${esc(a.action)}`, `<b>Why now (${esc(r.meta.stage)}):</b> ${esc(a.why_now)}`]));
    });
    if (r.next_steps.more) P.push(`<p class="meta">${r.next_steps.more} lower-priority recommendation(s) not listed.</p>`);
  } else P.push("<p><i>No open gaps found.</i></p>");
  if (r.next_steps.consider.length) {
    P.push("<h3>Points to consider</h3><p class=\"meta\">Questions worth a thought. Ignore any that do not apply.</p>");
    P.push(li(r.next_steps.consider.map(cq => `<b>${esc(cq.title)}</b> ${esc(cq.text)}`)));
  }

  P.push("<h2>8. Review &amp; Updating Plan</h2>");
  P.push("<p>This assessment is designed for updating, not for completion; it should be revisited at defined milestones rather than filed as a one-time exercise.</p>");
  P.push(li([`<b>Next review milestone:</b> ${esc(m.next_review_milestone) || "(not set)"}`]
    .concat(m.review_notes ? [`<b>Notes:</b> ${esc(m.review_notes)}`] : [])));

  P.push("<h2>Methodology</h2>");
  P.push(`<p>${esc(REF.METHODOLOGY_NOTE)}</p>`);
  P.push("<h2>References</h2>");
  P.push(li(Object.keys(r.references).sort().map(k => esc(r.references[k]))));
  P.push("<footer>Generated with the four-module Environmental Impact Assessment tool, based on “A Proposed Framework for Environmental Impact Assessment in Early-Stage Startups”. Screening-level instrument that does not replace full LCA or GHG Protocol reporting.</footer>");
  return P.join("");
};

REPORT.toHtml = function (r) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>Environmental Impact Assessment: ${esc(r.meta.startup_name)}</title>` +
    `<style>${REPORT.CSS}</style></head><body>${REPORT.toHtmlBody(r)}</body></html>`;
};

// ---------------------------------------------------------------------------
// Word (.docx): the primary human-readable deliverable. Real heading styles,
// a table of contents field, styled indicator tables, colour-coded
// confidence badges, and a page-numbered footer. Uses the vendored docx.js
// library (window.docx).
// ---------------------------------------------------------------------------

const DOCX_C = {
  green: "2E6B4F", gold: "B8860B", purple: "8A5A9E", red: "AA3333",
  blue: "34608A", grey: "5A6B62", light: "EAF2ED", ink: "1C2A22",
};

// extras.diagrams: {trackName: {data: Uint8Array (PNG), width, height}}
REPORT.toDocx = async function (r, extras = {}) {
  const D = window.docx;
  if (!D) throw new Error("the Word export library did not load");
  const { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
    WidthType, ShadingType, AlignmentType, Footer, PageNumber, TableOfContents,
    PageBreak, BorderStyle, Packer, ImageRun, TableLayoutType } = D;
  // usable page width in twips (A4/Letter with 1" margins); tables get
  // explicit column widths, which Word and LibreOffice both respect
  const TABLE_TW = 9000;
  const twips = pcts => pcts.map(p => Math.round(TABLE_TW * p / 100));
  const m = r.meta, c = r.classification;
  const children = [];

  const h = (text, level) => new Paragraph({ text, heading: level });
  const bullet = (runs) => new Paragraph({
    bullet: { level: 0 },
    children: typeof runs === "string" ? [new TextRun(runs)] : runs,
  });
  const labelled = (label, value) => new Paragraph({
    children: [new TextRun({ text: label, bold: true }), new TextRun(value)],
  });

  // Title & meta
  children.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    children: [new TextRun({ text: "Environmental Impact Assessment", color: DOCX_C.green })],
  }));
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: m.startup_name || "Untitled startup", color: "333333" })],
  }));
  children.push(new Paragraph({
    children: [new TextRun({
      text: `Assessment version ${m.assessment_version}  ·  Generated ${m.generated}  ·  Development stage: ${m.stage}` +
        (m.sector ? `  ·  Sector: ${m.sector}` : ""),
      italics: true, size: 19, color: DOCX_C.grey,
    })],
  }));
  if (m.startup_desc) {
    children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: m.startup_desc, italics: true })] }));
  }
  children.push(new Paragraph(""));
  children.push(h("Table of Contents", HeadingLevel.HEADING_1));
  children.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Executive summary
  children.push(h("Executive Summary", HeadingLevel.HEADING_1));
  const core = r.buckets[SCORING.BUCKET_CORE];
  const warnN = r.integrity_checks.filter(([s]) => s === "warning").length;
  [
    `Classification: ${c.label}`,
    `Primary unit of analysis: ${c.unit_of_analysis}`,
    `Core indicator set: ${core.length} indicator(s)` + (core.length ? " — " + core.map(([n]) => n).join("; ") : ""),
    `Evidence base: ${evidenceLine(levelCounts(r))}`,
    `Integrity checks: ${warnN} warning(s)` + (warnN ? " — see Section 5" : ""),
    ...(r.customer.type_label ? [`Customer: ${r.customer.type_label}`] : []),
    ...(r.next_steps.actions.length ? [`Recommendations: ${r.next_steps.actions.length} — see Section 7`] : []),
    ...(r.alignment.applies ? [`Impact–business alignment: ${ALIGN_VERDICT[r.alignment.verdict]}; ${r.alignment.assumptions.filter(a => a.status !== "validated").length} of ${r.alignment.assumptions.length} critical assumptions not yet validated — see Section 6`] : []),
    `Next scheduled review: ${m.next_review_milestone || "(not set)"}`,
  ].forEach(t => children.push(bullet(t)));

  // Module 1
  children.push(h("1. Startup Profiling & Type Classification", HeadingLevel.HEADING_1));
  children.push(bullet(`Impact mechanism: ${c.mechanism}` + (c.is_hybrid ? ` (secondary track: ${c.secondary_mechanism})` : "")));
  children.push(bullet(`Value proposition orientation: ${c.orientation}`));
  children.push(bullet(`Resulting type: ${c.label}`));
  children.push(new Paragraph({ indent: { left: 200 }, children: [new TextRun(c.blurb)] }));
  const cuD = customerLines(r.customer);
  if (cuD.length) {
    children.push(h("Customer", HeadingLevel.HEADING_3));
    cuD.forEach(([k, v]) => children.push(bullet([new TextRun({ text: `${k}: `, bold: true }), new TextRun(v)])));
  }
  children.push(new Paragraph({
    children: [new TextRun({ text: `Stage guidance (${m.stage}): ${r.stage_note}`, italics: true, size: 19, color: DOCX_C.grey })],
  }));

  // Module 2
  children.push(h("2. Impact Pathway (Theory of Change)", HeadingLevel.HEADING_1));
  Object.entries(r.pathway).forEach(([track, stages]) => {
    children.push(h(track, HeadingLevel.HEADING_2));
    const dg = (extras.diagrams || {})[track];
    if (dg && ImageRun) {
      const w = 620;
      children.push(new Paragraph({
        children: [new ImageRun({ type: "png", data: dg.data, transformation: { width: w, height: Math.round(w * dg.height / dg.width) } })],
      }));
    }
    stages.forEach(s => {
      const dep = s.change && s.change !== "none";
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun(s.stage)].concat(dep ? [new TextRun({ text: `  [${REF.DEPENDENCE_SHORT[s.change].toUpperCase()}]`, bold: true, color: "D9661F" })] : []),
      }));
      children.push(bullet(`Description: ${s.description || "(not filled in)"}`));
      children.push(bullet(`Underlying assumption: ${s.assumption || "(not stated)"}`));
      children.push(bullet(`Evidence strength: ${s.evidence || "Not rated"}`));
    });
  });
  if (r.weakest_links) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `Weakest link(s) in the chain: ${r.weakest_links}`, bold: true, color: DOCX_C.red })],
    }));
  }

  // Module 3
  children.push(h("3. Indicator Set (Feasibility–Relevance Scoring)", HeadingLevel.HEADING_1));
  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "C9D8CE" };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const cell = (text, opts = {}) => new TableCell({
    borders,
    width: opts.width ? { size: Math.round(TABLE_TW * opts.width / 100), type: WidthType.DXA } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, color: "auto", fill: opts.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 19, bold: !!opts.bold, color: opts.color })] })],
  });
  const widths = [23, 14, 12, 9, 8, 34];
  let anyInd = false;
  SCORING.BUCKET_ORDER.forEach(b => {
    const items = r.buckets[b];
    if (!items.length) return;
    anyInd = true;
    children.push(h(b, HeadingLevel.HEADING_2));
    const rows = [new TableRow({
      tableHeader: true,
      children: ["Indicator", "Category", "Measures", "Feas.", "Rel.", "Details"].map((t, i) =>
        cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: widths[i] })),
    })];
    items.forEach(([n, e], idx) => {
      const d = [];
      [["unit", "Unit"], ["current_value", "Current"], ["target", "Target"], ["frequency", "Freq."],
        ["data_source", "Source"], ["pathway_link", "Evidences"]].forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${e[f]}`); });
      const fill = idx % 2 === 1 ? DOCX_C.light : undefined;
      rows.push(new TableRow({
        children: [n, e.category || "", kindLabel(n, e), e.feasibility || "", e.relevance || "", d.length ? d.join("; ") : "—"]
          .map((t, i) => cell(t, { fill, width: widths[i], color: i === 2 && kindReal(n, e) ? DOCX_C.green : undefined, bold: i === 2 && kindReal(n, e) })),
      }));
    });
    children.push(new Table({ rows, width: { size: TABLE_TW, type: WidthType.DXA }, columnWidths: twips(widths), layout: TableLayoutType.FIXED }));
    children.push(new Paragraph(""));
  });
  if (!anyInd) children.push(new Paragraph("No indicators selected."));

  // Module 4
  children.push(h("4. Claims & Evidence", HeadingLevel.HEADING_1));
  const confColor = { Measured: DOCX_C.green, Modelled: DOCX_C.gold, Projected: DOCX_C.purple };
  if (!r.claim_rows.length) children.push(new Paragraph("No claims labelled yet."));
  else {
    const cw = [34, 13, 12, 12, 12, 17];
    const trows = [new TableRow({
      tableHeader: true,
      children: ["Indicator and claim", "Level", "Quality", "Baseline", "Sources", "Gaps"].map((t, i) =>
        cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: cw[i] })),
    })];
    r.claim_rows.forEach((row, idx) => {
      const fill = idx % 2 === 1 ? DOCX_C.light : undefined;
      const g = gapCount(row);
      trows.push(new TableRow({ children: [
        cell(row.name + (row.u.claim ? ` — “${row.u.claim}”` : ""), { fill, width: cw[0] }),
        cell(row.u.level || "—", { fill, width: cw[1], bold: true, color: confColor[row.u.level] }),
        cell(REF.QUALITY_SHORT[row.u.quality || ""], { fill, width: cw[2] }),
        cell(row.u.baseline ? "✓" : SCORING.COMPARATIVE.test(row.u.claim || "") ? "missing" : "not needed", { fill, width: cw[3], color: row.u.baseline ? DOCX_C.green : SCORING.COMPARATIVE.test(row.u.claim || "") ? DOCX_C.red : DOCX_C.grey }),
        cell(row.u.sources ? "✓" : "missing", { fill, width: cw[4], color: row.u.sources ? DOCX_C.green : DOCX_C.red }),
        cell(g ? `${g} gap${g > 1 ? "s" : ""}` : "none", { fill, width: cw[5], bold: !!g, color: g ? DOCX_C.red : DOCX_C.green }),
      ] }));
    });
    children.push(new Table({ rows: trows, width: { size: TABLE_TW, type: WidthType.DXA }, columnWidths: twips(cw), layout: TableLayoutType.FIXED }));
    children.push(new Paragraph(""));
  }
  r.claim_rows.forEach(row => {
    const u = row.u;
    const lvl = u.level || "unlabelled";
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun(row.name), new TextRun({ text: `  [${lvl.toUpperCase()}]`, bold: true, color: confColor[lvl] || DOCX_C.grey }),
        new TextRun({ text: `  [QUALITY: ${REF.QUALITY_SHORT[u.quality || ""].toUpperCase()}]`, bold: true, color: DOCX_C.grey })],
    }));
    if (u.claim) children.push(labelled("Claim as stated: ", u.claim));
    children.push(labelled("Baseline: ", u.baseline || "(not stated)"));
    children.push(labelled("Evidence and data sources: ", u.sources || "(not stated)"));
    if (row.stage) children.push(labelled("Relies on pathway step: ", `${row.link}. Assumption: ${row.stage.assumption || "(none stated)"} (evidence: ${row.stage.evidence || "Not rated"})`));
    children.push(labelled("Assumptions: ", u.assumptions || "(not filled in)"));
    children.push(labelled("Conditions that could change the estimate: ", u.conditions || "(not filled in)"));
    row.gaps.forEach(g => children.push(bullet([new TextRun({ text: `${g.sev === "warning" ? "⚠ Gap: " : "ℹ "}${g.msg}`, color: g.sev === "warning" ? DOCX_C.red : DOCX_C.blue })])));
  });

  // Integrity checks
  children.push(h("5. Integrity Checks", HeadingLevel.HEADING_1));
  const chkColor = { warning: DOCX_C.red, info: DOCX_C.blue, ok: DOCX_C.green };
  const chkSym = { warning: "⚠", info: "ℹ", ok: "✓" };
  r.integrity_checks.forEach(([s, msg]) => children.push(bullet([new TextRun({ text: `${chkSym[s]}  ${msg}`, color: chkColor[s] })])));

  // Impact-business alignment
  const alD = r.alignment;
  children.push(h("6. Impact–Business Alignment", HeadingLevel.HEADING_1));
  children.push(new Paragraph({ children: [new TextRun({ text: ALIGN_SCOPE, italics: true, size: 19, color: DOCX_C.grey })] }));
  children.push(new Table({
    width: { size: TABLE_TW, type: WidthType.DXA }, columnWidths: twips([50, 50]), layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ tableHeader: true, children: ["Customer value", "Environmental value"].map(t => cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: 50 })) }),
      new TableRow({ children: [alD.customer_value || "(not described)", alD.env_value || "(not described)"].map(t => cell(t, { width: 50 })) }),
    ],
  }));
  children.push(new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: `Alignment: ${ALIGN_VERDICT[alD.verdict]}. `, bold: true }), new TextRun(alD.verdict_text)] }));
  if (alD.assumptions.length) {
    children.push(h("Critical assumptions", HeadingLevel.HEADING_2));
    const stColor = { validated: DOCX_C.green, some: DOCX_C.gold, unchecked: "D9661F" };
    alD.assumptions.forEach(a => {
      children.push(new Paragraph({ spacing: { before: 120 }, children: [
        new TextRun({ text: a.status === "validated" ? "✓  " : "!  ", bold: true, color: stColor[a.status] }),
        new TextRun({ text: a.text, bold: true }),
        new TextRun({ text: `  [${alignStatus(a.status).toUpperCase()}]`, bold: true, color: stColor[a.status], size: 18 })] }));
      if (a.note) children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: a.note, italics: true })] }));
      children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: "Why it matters: ", bold: true }), new TextRun(a.why)] }));
      children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: "How to check: ", bold: true }), new TextRun(a.test)] }));
    });
  }

  // Recommendations & points to consider
  children.push(h("7. Recommendations & Points to Consider", HeadingLevel.HEADING_1));
  if (!r.next_steps.actions.length) children.push(new Paragraph("No open gaps found."));
  const prColor = { 3: DOCX_C.red, 2: DOCX_C.gold, 1: DOCX_C.grey };
  r.next_steps.actions.forEach((a, i) => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun(`${i + 1}. ${a.title}`), new TextRun({ text: `  [${SCORING.PRIORITY_LABEL[a.priority].toUpperCase()} PRIORITY]`, bold: true, color: prColor[a.priority] })],
    }));
    [["Evidence gap: ", a.gap], ["What it means: ", a.implication], ["Recommended action: ", a.action], [`Why now (${m.stage}): `, a.why_now]]
      .forEach(([k, v]) => children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: k, bold: true }), new TextRun(v)] })));
  });
  if (r.next_steps.more) children.push(new Paragraph({ children: [new TextRun({ text: `${r.next_steps.more} lower-priority recommendation(s) not listed.`, italics: true, color: DOCX_C.grey })] }));
  if (r.next_steps.consider.length) {
    children.push(h("Points to consider", HeadingLevel.HEADING_2));
    children.push(new Paragraph({ children: [new TextRun({ text: "Questions worth a thought. Ignore any that do not apply.", italics: true, size: 19, color: DOCX_C.grey })] }));
    r.next_steps.consider.forEach(cq => children.push(bullet([new TextRun({ text: `${cq.title}  `, bold: true }), new TextRun(cq.text)])));
  }

  // Review plan
  children.push(h("8. Review & Updating Plan", HeadingLevel.HEADING_1));
  children.push(new Paragraph("This assessment is designed for updating, not for completion: it should be revisited at defined milestones rather than filed as a one-time exercise."));
  children.push(bullet(`Next review milestone: ${m.next_review_milestone || "(not set)"}`));
  if (m.review_notes) children.push(bullet(`Notes: ${m.review_notes}`));

  // Methodology & references
  children.push(h("Methodology", HeadingLevel.HEADING_1));
  children.push(new Paragraph(REF.METHODOLOGY_NOTE));
  children.push(h("References", HeadingLevel.HEADING_1));
  Object.keys(r.references).sort().forEach(k => children.push(bullet(r.references[k])));
  children.push(new Paragraph({
    children: [new TextRun({
      text: "Generated with the four-module Environmental Impact Assessment tool, based on “A Proposed Framework for Environmental Impact Assessment in Early-Stage Startups”. Screening-level instrument — does not replace full LCA or GHG Protocol reporting.",
      italics: true, size: 17, color: DOCX_C.grey,
    })],
  }));

  const doc = new Document({
    creator: "EIA tool",
    title: `Environmental Impact Assessment: ${m.startup_name}`,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: "Calibri", size: 21 }, paragraph: { spacing: { after: 120 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, color: DOCX_C.green }, paragraph: { spacing: { before: 360, after: 120 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, color: DOCX_C.ink }, paragraph: { spacing: { before: 240, after: 100 } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 23, bold: true, color: DOCX_C.ink }, paragraph: { spacing: { before: 200, after: 80 } } },
      ],
    },
    sections: [{
      properties: {},
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 17, color: DOCX_C.grey })],
          })],
        }),
      },
      children,
    }],
  });
  return Packer.toBlob(doc);
};

// ---------------------------------------------------------------------------
// JSON save file (same format as the Streamlit version)
// ---------------------------------------------------------------------------

REPORT.PERSISTED_KEYS = [
  "startup_name", "startup_desc", "sector", "stage",
  "customer_types", "revenue_models", "customer_profile", "customer_user", "behaviour_actor",
  "value_drivers", "customer_value",
  "mechanism", "orientation", "is_hybrid", "secondary_mechanism",
  "pathway", "weakest_links",
  "selected_indicators", "custom_indicators", "custom_kinds", "uncertainty",
  "assessment_version", "next_review_milestone", "review_notes", "alignment",
];

REPORT.exportState = function (state) {
  const out = {};
  REPORT.PERSISTED_KEYS.forEach(k => { out[k] = state[k] === undefined ? null : state[k]; });
  // the pathway hint text is UI-only; keep save files lean
  if (out.pathway) {
    const p = {};
    Object.entries(out.pathway).forEach(([t, stages]) => {
      p[t] = stages.map(({ hint, ...rest }) => rest);
    });
    out.pathway = p;
  }
  return JSON.stringify({
    format: "startup-env-impact-assessment",
    format_version: 2,
    exported: REPORT.today(),
    state: out,
  }, null, 2);
};

REPORT.importState = function (raw) {
  const payload = JSON.parse(raw);
  if (!payload || payload.format !== "startup-env-impact-assessment" || !payload.state)
    throw new Error("Not a recognised assessment file.");
  const state = payload.state;
  // bump the version on re-import: this is a new review cycle
  state.assessment_version = (parseInt(state.assessment_version, 10) || 1) + 1;
  return state;
};
