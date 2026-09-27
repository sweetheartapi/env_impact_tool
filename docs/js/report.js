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
  const checks = SCORING.integrityChecks(state.selected_indicators, state.uncertainty);
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
  L.push(`- **Core indicator set:** ${core.length} indicator(s)` + (core.length ? ": " + core.map(([n]) => n).join("; ") : ""));
  if (Object.keys(counts).length) L.push(`- **Evidence base:** ${evidenceLine(counts)}`);
  L.push(`- **Integrity checks:** ${warn.length} warning(s)` + (warn.length ? ". See Section 5" : ""));
  if (m.next_review_milestone) L.push(`- **Next scheduled review:** ${m.next_review_milestone}`);
  L.push("");

  L.push("## 1. Startup Profiling & Type Classification");
  L.push(`- **Impact mechanism:** ${c.mechanism}` + (c.is_hybrid ? ` (secondary track: ${c.secondary_mechanism})` : ""));
  L.push(`- **Value proposition orientation:** ${c.orientation}`);
  L.push(`- **Resulting type:** ${c.label}`);
  L.push(`- ${c.blurb}\n`);
  L.push(`*Stage guidance (${m.stage}):* ${r.stage_note}\n`);

  L.push("## 2. Impact Pathway (Theory of Change)");
  Object.entries(r.pathway).forEach(([track, stages]) => {
    L.push(`### ${track}`);
    stages.forEach(s => {
      L.push(`- **${s.stage}**`);
      L.push(`  - Description: ${s.description || "_(not filled in)_"}`);
      L.push(`  - Underlying assumption: ${s.assumption || "_(not stated)_"}`);
      L.push(`  - Evidence strength: ${s.evidence || "Not rated"}`);
    });
  });
  if (r.weakest_links) L.push(`\n**Weakest link(s) in the chain:** ${r.weakest_links}`);
  L.push("");

  L.push("## 3. Indicator Set (Feasibility–Relevance Scoring)");
  SCORING.BUCKET_ORDER.forEach(b => {
    const items = r.buckets[b];
    if (!items.length) return;
    L.push(`### ${b}`);
    items.forEach(([n, e]) => {
      const d = [`Feasibility: ${e.feasibility}`, `Relevance: ${e.relevance}`];
      INDICATOR_FIELDS.forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${e[f]}`); });
      L.push(`- **${n}** (${e.category}): ` + d.join(" · "));
    });
  });
  L.push("");

  L.push("## 4. Uncertainty Acknowledgement");
  if (!Object.keys(r.uncertainty).length) L.push("_No claims labelled yet._");
  Object.entries(r.uncertainty).forEach(([n, u]) => {
    L.push(`### ${n}`);
    const lvl = u.level || "unlabelled";
    L.push(`- **Evidential confidence:** ${lvl}` + (REF.CONFIDENCE_LEVELS[lvl] ? `. ${REF.CONFIDENCE_LEVELS[lvl]}` : ""));
    if (u.claim) L.push(`- **Claim as stated:** ${u.claim}`);
    L.push(`- **Assumptions & data sources:** ${u.assumptions || "_(not filled in)_"}`);
    L.push(`- **Conditions under which the estimate could differ significantly:** ${u.conditions || "_(not filled in)_"}`);
  });
  L.push("");

  L.push("## 5. Integrity Checks");
  const sym = { warning: "⚠️", info: "ℹ️", ok: "✅" };
  r.integrity_checks.forEach(([s, msg]) => L.push(`- ${sym[s]} ${msg}`));
  L.push("");

  L.push("## 6. Review & Updating Plan");
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
.warn { color: #a33; } .ok { color: #2e6b4f; } .info { color: #345d8a; }
footer { margin-top: 3rem; font-size: .85rem; color: #5a6b62; border-top: 1px solid #cfe0d6; padding-top: .8rem; }
@media print { body { margin: 0 auto; } }
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
    `<b>Next scheduled review:</b> ${esc(m.next_review_milestone) || "(not set)"}`,
  ]));

  P.push("<h2>1. Startup Profiling &amp; Type Classification</h2>");
  P.push(li([
    `<b>Impact mechanism:</b> ${esc(c.mechanism)}` + (c.is_hybrid ? ` (secondary track: ${esc(c.secondary_mechanism)})` : ""),
    `<b>Value proposition orientation:</b> ${esc(c.orientation)}`,
    `<b>Resulting type:</b> ${esc(c.label)}. ${esc(c.blurb)}`,
  ]));
  P.push(`<p class="meta">Stage guidance (${esc(m.stage)}): ${esc(r.stage_note)}</p>`);

  P.push("<h2>2. Impact Pathway (Theory of Change)</h2>");
  Object.entries(r.pathway).forEach(([track, stages]) => {
    P.push(`<h3>${esc(track)}</h3>`);
    P.push(li(stages.map(s => `<b>${esc(s.stage)}</b><br>Description: ${esc(s.description || "(not filled in)")}<br>` +
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
      const d = [`Feasibility: ${e.feasibility}`, `Relevance: ${e.relevance}`];
      INDICATOR_FIELDS.forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${esc(e[f])}`); });
      return `<b>${esc(n)}</b> <i>(${esc(e.category)})</i>: ` + d.join(" · ");
    })));
  });
  if (!any) P.push("<p><i>No indicators selected.</i></p>");

  P.push("<h2>4. Uncertainty Acknowledgement</h2>");
  if (!Object.keys(r.uncertainty).length) P.push("<p><i>No claims labelled yet.</i></p>");
  Object.entries(r.uncertainty).forEach(([n, u]) => {
    const lvl = u.level || "unlabelled";
    const badge = REF.CONFIDENCE_LEVELS[lvl] ? `<span class="badge b-${lvl}">${esc(lvl)}</span>` : esc(lvl);
    P.push(`<h3>${esc(n)} ${badge}</h3>`);
    const rows = [];
    if (u.claim) rows.push(`<b>Claim as stated:</b> ${esc(u.claim)}`);
    rows.push(`<b>Assumptions &amp; data sources:</b> ${esc(u.assumptions || "(not filled in)")}`);
    rows.push(`<b>Conditions that could change the estimate:</b> ${esc(u.conditions || "(not filled in)")}`);
    P.push(li(rows));
  });

  P.push("<h2>5. Integrity Checks</h2>");
  const cl = { warning: "warn", ok: "ok", info: "info" }, sym = { warning: "⚠", ok: "✔", info: "ℹ" };
  P.push(li(r.integrity_checks.map(([s, msg]) => `<span class="${cl[s]}">${sym[s]} ${esc(msg)}</span>`)));

  P.push("<h2>6. Review &amp; Updating Plan</h2>");
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

REPORT.toDocx = async function (r) {
  const D = window.docx;
  if (!D) throw new Error("the Word export library did not load");
  const { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
    WidthType, ShadingType, AlignmentType, Footer, PageNumber, TableOfContents,
    PageBreak, BorderStyle, Packer } = D;
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
    `Next scheduled review: ${m.next_review_milestone || "(not set)"}`,
  ].forEach(t => children.push(bullet(t)));

  // Module 1
  children.push(h("1. Startup Profiling & Type Classification", HeadingLevel.HEADING_1));
  children.push(bullet(`Impact mechanism: ${c.mechanism}` + (c.is_hybrid ? ` (secondary track: ${c.secondary_mechanism})` : "")));
  children.push(bullet(`Value proposition orientation: ${c.orientation}`));
  children.push(bullet(`Resulting type: ${c.label}`));
  children.push(new Paragraph({ indent: { left: 200 }, children: [new TextRun(c.blurb)] }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Stage guidance (${m.stage}): ${r.stage_note}`, italics: true, size: 19, color: DOCX_C.grey })],
  }));

  // Module 2
  children.push(h("2. Impact Pathway (Theory of Change)", HeadingLevel.HEADING_1));
  Object.entries(r.pathway).forEach(([track, stages]) => {
    children.push(h(track, HeadingLevel.HEADING_2));
    stages.forEach(s => {
      children.push(h(s.stage, HeadingLevel.HEADING_3));
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
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, color: "auto", fill: opts.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 19, bold: !!opts.bold, color: opts.color })] })],
  });
  const widths = [30, 18, 8, 8, 36];
  let anyInd = false;
  SCORING.BUCKET_ORDER.forEach(b => {
    const items = r.buckets[b];
    if (!items.length) return;
    anyInd = true;
    children.push(h(b, HeadingLevel.HEADING_2));
    const rows = [new TableRow({
      tableHeader: true,
      children: ["Indicator", "Category", "Feas.", "Rel.", "Details"].map((t, i) =>
        cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: widths[i] })),
    })];
    items.forEach(([n, e], idx) => {
      const d = [];
      [["unit", "Unit"], ["current_value", "Current"], ["target", "Target"], ["frequency", "Freq."],
        ["data_source", "Source"], ["pathway_link", "Evidences"]].forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${e[f]}`); });
      const fill = idx % 2 === 1 ? DOCX_C.light : undefined;
      rows.push(new TableRow({
        children: [n, e.category || "", e.feasibility || "", e.relevance || "", d.length ? d.join("; ") : "—"]
          .map((t, i) => cell(t, { fill, width: widths[i] })),
      }));
    });
    children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph(""));
  });
  if (!anyInd) children.push(new Paragraph("No indicators selected."));

  // Module 4
  children.push(h("4. Uncertainty Acknowledgement", HeadingLevel.HEADING_1));
  if (!Object.keys(r.uncertainty).length) children.push(new Paragraph("No claims labelled yet."));
  const confColor = { Measured: DOCX_C.green, Modelled: DOCX_C.gold, Projected: DOCX_C.purple };
  Object.entries(r.uncertainty).forEach(([n, u]) => {
    const lvl = u.level || "unlabelled";
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun(n), new TextRun({ text: `  [${lvl.toUpperCase()}]`, bold: true, color: confColor[lvl] || DOCX_C.grey })],
    }));
    if (u.claim) children.push(labelled("Claim as stated: ", u.claim));
    children.push(labelled("Assumptions & data sources: ", u.assumptions || "(not filled in)"));
    children.push(labelled("Conditions that could change the estimate: ", u.conditions || "(not filled in)"));
  });

  // Integrity checks
  children.push(h("5. Integrity Checks", HeadingLevel.HEADING_1));
  const chkColor = { warning: DOCX_C.red, info: DOCX_C.blue, ok: DOCX_C.green };
  const chkSym = { warning: "⚠", info: "ℹ", ok: "✓" };
  r.integrity_checks.forEach(([s, msg]) => children.push(bullet([new TextRun({ text: `${chkSym[s]}  ${msg}`, color: chkColor[s] })])));

  // Review plan
  children.push(h("6. Review & Updating Plan", HeadingLevel.HEADING_1));
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
  "mechanism", "orientation", "is_hybrid", "secondary_mechanism",
  "pathway", "weakest_links",
  "selected_indicators", "custom_indicators", "uncertainty",
  "assessment_version", "next_review_milestone", "review_notes",
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
