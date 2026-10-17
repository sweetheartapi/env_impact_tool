/*
 * report.js: builds the assessment report from app state. The report is
 * assembled as structured data, then rendered to Markdown, a printable HTML
 * document, a Word (.docx) file, and the JSON save file.
 *
 * The report comes out in the interface language (English or Czech, see
 * i18n.js). The JSON save file never depends on the language: it stores the
 * same English keys and values either way.
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
        gaps: SCORING.claimGaps(n, u, e, state.pathway), kind: REF.indicatorKind(n, e) };
    }),
    next_steps: SCORING.nextSteps(state),
    plan: state.plan || {},
    alignment: SCORING.alignment(state),
    references,
    stage_note: REF.STAGE_GUIDANCE[state.stage].note,
  };
};

// ---------------------------------------------------------------------------
// Shared wording
// ---------------------------------------------------------------------------

const T = {
  title: L("Environmental Impact Assessment", "Hodnocení environmentálního dopadu"),
  version: L("Assessment version", "Verze hodnocení"),
  generated: L("Generated", "Vytvořeno"),
  stage: L("Development stage", "Fáze vývoje"),
  sector: L("Sector", "Odvětví"),
  toc: L("Table of Contents", "Obsah"),
  exec: L("Executive Summary", "Shrnutí"),
  classification: L("Classification", "Klasifikace"),
  unit: L("Primary unit of analysis", "Hlavní jednotka analýzy"),
  customer: L("Customer", "Zákazník"),
  coreSet: L("Core indicator set", "Klíčová sada indikátorů"),
  evidenceBase: L("Evidence base", "Podklady"),
  readiness: L("Evidence readiness", "Připravenost důkazů"),
  integrity: L("Integrity checks", "Kontroly integrity"),
  nextReview: L("Next scheduled review", "Další plánovaná revize"),
  s1: L("1. Startup Profiling & Type Classification", "1. Profil startupu a klasifikace typu"),
  mechanism: L("Impact mechanism", "Mechanismus dopadu"),
  secondaryTrack: L("secondary track", "sekundární linie"),
  orientation: L("Value proposition orientation", "Orientace hodnotové nabídky"),
  resultingType: L("Resulting type", "Výsledný typ"),
  stageGuidance: L("Stage guidance", "Doporučení pro fázi"),
  s2: L("2. Impact Pathway (Theory of Change)", "2. Cesta dopadu (teorie změny)"),
  description: L("Description", "Popis"),
  assumption: L("Underlying assumption", "Výchozí předpoklad"),
  assumptionShort: L("Assumption", "Předpoklad"),
  evidenceStrength: L("Evidence strength", "Síla důkazů"),
  dependsOn: L("Depends on customers", "Závisí na zákaznících"),
  custSteps: L("Steps that depend on customers", "Kroky závislé na zákaznících"),
  noneMarked: L("none marked", "žádný neoznačen"),
  weakest: L("Weakest link(s) in the chain", "Nejslabší článek (články) řetězce"),
  weakestShort: L("Weakest link(s)", "Nejslabší článek (články)"),
  s3: L("3. Indicator Set (Feasibility–Relevance Scoring)", "3. Sada indikátorů (hodnocení proveditelnosti a relevance)"),
  measures: L("Measures", "Měří"),
  feasibility: L("Feasibility", "Proveditelnost"),
  relevance: L("Relevance", "Relevance"),
  noIndicators: L("No indicators selected.", "Nejsou vybrány žádné indikátory."),
  s4: L("4. Claims & Evidence", "4. Tvrzení a důkazy"),
  noClaims: L("No claims labelled yet.", "Zatím nejsou označena žádná tvrzení."),
  indicator: L("Indicator", "Indikátor"),
  indicatorClaim: L("Indicator and claim", "Indikátor a tvrzení"),
  claim: L("Claim", "Tvrzení"),
  level: L("Level", "Podloženost"),
  quality: L("Quality", "Kvalita"),
  baseline: L("Baseline", "Výchozí stav"),
  sources: L("Sources", "Zdroje"),
  issues: L("Issues", "Nesoulady"),
  confidence: L("Evidential confidence", "Míra podloženosti"),
  evQuality: L("Evidence quality", "Kvalita důkazů"),
  claimStated: L("Claim as stated", "Tvrzení, jak zní"),
  evSources: L("Evidence and data sources", "Důkazy a zdroje dat"),
  boundary: L("Boundary", "Hranice"),
  reliesOn: L("Relies on pathway step", "Opírá se o krok cesty dopadu"),
  evidenceWord: L("evidence", "důkazy"),
  assumptions: L("Assumptions", "Předpoklady"),
  conditions: L("Conditions under which the estimate could differ significantly", "Podmínky, za kterých by se odhad mohl výrazně lišit"),
  conditionsShort: L("Conditions that could change the estimate", "Podmínky, které by mohly odhad změnit"),
  gap: L("Gap", "Nesoulad"),
  s5: L("5. Integrity Checks", "5. Kontroly integrity"),
  s6: L("6. Impact–Business Alignment", "6. Soulad dopadu a byznysu"),
  custValue: L("Customer value", "Hodnota pro zákazníka"),
  envValue: L("Environmental value", "Environmentální hodnota"),
  alignment: L("Alignment", "Soulad"),
  critical: L("Critical assumptions", "Kritické předpoklady"),
  whyMatters: L("Why it matters", "Proč na tom záleží"),
  howCheck: L("How to check", "Jak to ověřit"),
  s7: L("7. Recommendations & Points to Consider", "7. Doporučení a body ke zvážení"),
  rulesNote: L("Generated by fixed decision rules (see the appendix), each traced to the answers that triggered it.",
    "Vytvořeno pevnými rozhodovacími pravidly (viz příloha); každé doporučení je dohledatelné k odpovědím, které ho spustily."),
  actionPlan: L("Action plan", "Akční plán"),
  actionPlanNote: L("the three highest-priority actions", "tři kroky s nejvyšší prioritou"),
  action: L("Action", "Krok"),
  priority: L("Priority", "Priorita"),
  owner: L("Owner", "Odpovědná osoba"),
  deadline: L("Deadline", "Termín"),
  doneWhen: L("Done when / evidence", "Hotovo, když / doklad"),
  whyThese: L("Why these actions", "Proč právě tyto kroky"),
  whyTheseNote: L("all recommendations, highest priority first", "všechna doporučení, od nejvyšší priority"),
  detected: L("Detected condition", "Zjištěný stav"),
  recAction: L("Recommended action", "Doporučený krok"),
  whyNow: L("Why now", "Proč teď"),
  basedOn: L("Based on", "Na základě"),
  rule: L("rule", "pravidlo"),
  strength: L("Strength", "Silná stránka"),
  priorityWord: L("priority", "priorita"),
  noGaps: L("No open gaps found.", "Nebyly nalezeny žádné otevřené mezery."),
  canShow: L("What you can already show", "Co už můžete doložit"),
  consider: L("Points to consider", "Ke zvážení"),
  considerNote: L("Questions worth a thought. Ignore any that do not apply.", "Otázky k zamyšlení. Ty, které se vás netýkají, klidně přeskočte."),
  shownBecause: L("shown because", "zobrazeno, protože"),
  s8: L("8. Review & Updating Plan", "8. Plán revizí a aktualizací"),
  reviewIntro: L("This assessment is designed for updating, not for completion. It should be revisited at defined milestones rather than filed as a one-time exercise.",
    "Toto hodnocení je určeno k průběžné aktualizaci, ne k jednorázovému dokončení. Mělo by se k němu vracet při stanovených milnících, ne ho jednou vyplnit a založit."),
  nextMilestone: L("Next review milestone", "Milník další revize"),
  notes: L("Notes", "Poznámky"),
  appendix: L("Appendix: Recommendation Rules", "Příloha: Pravidla pro doporučení"),
  appendixNote: L("Every rule the tool applies, and whether it applied to this assessment.", "Všechna pravidla, která nástroj používá, a zda se uplatnila v tomto hodnocení."),
  ruleH: L("Rule", "Pravidlo"),
  recommendation: L("Recommendation", "Doporučení"),
  firesWhen: L("Fires when", "Uplatní se, když"),
  appliesHere: L("Applies here", "Platí zde"),
  applies: L("Applies", "Platí"),
  yes: L("yes", "ano"),
  methodology: L("Methodology", "Metodika"),
  references: L("References", "Literatura"),
  notFilled: L("(not filled in)", "(nevyplněno)"),
  notStated: L("(not stated)", "(neuvedeno)"),
  noneStated: L("(none stated)", "(neuvedeno)"),
  notDescribed: L("(not described)", "(nepopsáno)"),
  notSet: L("(not set)", "(nenastaveno)"),
  missing: L("missing", "chybí"),
  notNeeded: L("not needed", "není potřeba"),
  untitled: L("Untitled startup", "Startup bez názvu"),
  footer: L("Generated with the four-module Environmental Impact Assessment tool, based on “A Proposed Framework for Environmental Impact Assessment in Early-Stage Startups”. Screening-level instrument that does not replace full LCA or GHG Protocol reporting.",
    "Vytvořeno čtyřmodulovým nástrojem pro hodnocení environmentálního dopadu, založeným na práci „A Proposed Framework for Environmental Impact Assessment in Early-Stage Startups“. Orientační nástroj, který nenahrazuje úplné LCA ani výkaznictví podle GHG Protocol."),
  page: L("Page", "Strana"),
  of: L("of", "z"),
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
  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k === "unlabelled" ? L("unlabelled", "bez označení") : tr(k).toLowerCase()}`);
  return parts.length ? parts.join(", ") : L("not yet labelled", "zatím neoznačeno");
}

// Customer lines for section 1, as [label, value] pairs (empty ones dropped).
function customerLines(cu) {
  return [
    [L("Customer segment", "Zákaznický segment"), cu.type_label],
    [L("Revenue model", "Model příjmů"), (cu.revenue || []).join("; ")],
    [L("Buyer (decides and pays)", "Kupující (rozhoduje a platí)"), cu.profile],
    [L("User (day to day)", "Uživatel (každodenní)"), cu.user],
    [L("Whose behaviour must change", "Kdo musí změnit chování"), cu.actor],
    [L("Why customers buy it", "Proč zákazníci kupují"), cu.drivers.join("; ")],
    [L("Customer value & environmental link", "Hodnota pro zákazníka a vazba na životní prostředí"), cu.value],
  ].filter(([, v]) => v);
}

const kindLabel = (n, e) => (REF.INDICATOR_KINDS[REF.indicatorKind(n, e)] || { label: L("not set", "nenastaveno") }).label;
const kindReal = (n, e) => !!(REF.INDICATOR_KINDS[REF.indicatorKind(n, e)] || {}).real;

const qualityLabel = q => (REF.EVIDENCE_QUALITY.find(([k]) => k === (q || "")) || ["", L("Not assessed yet", "Zatím neposouzeno")])[1];
const gapCount = row => row.gaps.filter(g => g.sev === "warning").length;
const levelName = lvl => (lvl && lvl !== "unlabelled") ? tr(lvl) : L("unlabelled", "bez označení");

// Evidence readiness: plain counts, never a score (mirrors step 5).
function readinessLine(r) {
  const rows = r.claim_rows;
  const mo = rows.filter(x => x.u.level === "Measured" && x.kind === "outcome").length;
  const hq = rows.filter(x => x.u.quality === "high").length;
  return L(`${mo} measured real-world outcome claim(s); ${hq} of ${rows.length} claim(s) with high-quality evidence; ` +
    `${r.alignment.verified} of ${r.alignment.assumptions.length} commercial assumption(s) verified. Counts, not a score.`,
    `měřená tvrzení o skutečném výsledku: ${mo}; tvrzení s vysokou kvalitou důkazů: ${hq} z ${rows.length}; ` +
    `ověřené obchodní předpoklady: ${r.alignment.verified} z ${r.alignment.assumptions.length}. Jde o počty, ne o skóre.`);
}
const planRows = r => r.next_steps.actions.slice(0, SCORING.PLAN_SIZE).map((a, i) => {
  const p = r.plan[a.id] || {};
  return { n: i + 1, a, owner: p.owner || "", due: p.due || "", done: p.done_evidence || "" };
});
const issueCell = row => {
  const g = gapCount(row);
  if (g) return L(`${g} issue${g > 1 ? "s" : ""}`, `${g} ${I18N.plural(g, "nesoulad", "nesoulady", "nesouladů")}`);
  return SCORING.claimWritten(row.u) ? L("none found", "nenalezeny") : L("not checked", "nezkontrolováno");
};
const baselineCell = row => row.u.baseline ? "✓" : SCORING.COMPARATIVE.test(row.u.claim || "") ? T.missing : T.notNeeded;
const alignStatus = k => (SCORING.ALIGN_STATUS.find(([v]) => v === k) || ["", L("Not checked yet", "Zatím neověřeno")])[1];
const ALIGN_SCOPE = L("Where the environmental benefit depends on commercial assumptions. Not a commercial viability score and not business due diligence: commercial questions appear only where they decide whether the environmental benefit happens or can be evidenced.",
  "Kde environmentální přínos závisí na obchodních předpokladech. Nejde o skóre obchodní životaschopnosti ani o obchodní due diligence: obchodní otázky se objevují jen tam, kde rozhodují o tom, zda environmentální přínos nastane nebo zda ho lze doložit.");
const prioLabel = a => a.type === "strength" ? T.strength : `${SCORING.PRIORITY_LABEL[a.priority]} ${T.priorityWord}`;
const quoted = t => L(`“${t}”`, `„${t}“`);

const INDICATOR_FIELDS = [["unit", L("Unit", "Jednotka")], ["current_value", L("Current value", "Současná hodnota")], ["target", L("Target", "Cíl")],
  ["frequency", L("Measured", "Měřeno")], ["data_source", L("Data source", "Zdroj dat")], ["pathway_link", L("Evidences pathway stage", "Dokládá krok cesty dopadu")]];
// stored values that have a display form (frequency, default units and
// sources, pathway links); free text the user typed passes through unchanged
const fieldValue = (f, v) => tr(v);

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

REPORT.toMarkdown = function (r) {
  const m = r.meta, c = r.classification, out = [];
  out.push(`# ${T.title}: ${m.startup_name}`);
  out.push(`*${T.version} ${m.assessment_version} · ${T.generated} ${m.generated} · ${T.stage}: ${tr(m.stage)}*\n`);
  if (m.startup_desc) out.push(`> ${m.startup_desc}\n`);
  if (m.sector) out.push(`**${T.sector}:** ${m.sector}\n`);

  const core = r.buckets[SCORING.BUCKET_CORE];
  const counts = levelCounts(r);
  const warn = r.integrity_checks.filter(([s]) => s === "warning");
  out.push(`## ${T.exec}`);
  out.push(`- **${T.classification}:** ${c.label}`);
  out.push(`- **${T.unit}:** ${c.unit_of_analysis}`);
  if (r.customer.type_label) out.push(`- **${T.customer}:** ${r.customer.type_label}`);
  out.push(`- **${T.coreSet}:** ` + L(`${core.length} indicator(s)`, `${core.length} ${I18N.plural(core.length, "indikátor", "indikátory", "indikátorů")}`) +
    (core.length ? ": " + core.map(([n]) => tr(n)).join("; ") : ""));
  if (Object.keys(counts).length) out.push(`- **${T.evidenceBase}:** ${evidenceLine(counts)}`);
  out.push(`- **${T.readiness}:** ${readinessLine(r)}`);
  out.push(`- **${T.integrity}:** ` + L(`${warn.length} warning(s)`, `varování: ${warn.length}`) + (warn.length ? L(". See Section 5", ". Viz oddíl 5") : ""));
  if (r.next_steps.actions.length) out.push(`- **${L("Next steps", "Další kroky")}:** ` + L(`${r.next_steps.actions.length} recommended. See Section 7`, `doporučeno ${r.next_steps.actions.length}. Viz oddíl 7`));
  if (r.alignment.applies) {
    const open = r.alignment.assumptions.filter(a => a.status !== "validated").length;
    out.push(`- **${L("Impact–business alignment", "Soulad dopadu a byznysu")}:** ${r.alignment.verdict_label}; ` +
      L(`${open} of ${r.alignment.assumptions.length} critical commercial assumptions not yet validated. See Section 6`,
        `neověřeno ${open} z ${r.alignment.assumptions.length} kritických obchodních předpokladů. Viz oddíl 6`));
  }
  if (m.next_review_milestone) out.push(`- **${T.nextReview}:** ${tr(m.next_review_milestone)}`);
  out.push("");

  out.push(`## ${T.s1}`);
  out.push(`- **${T.mechanism}:** ${tr(c.mechanism)}` + (c.is_hybrid ? ` (${T.secondaryTrack}: ${tr(c.secondary_mechanism)})` : ""));
  out.push(`- **${T.orientation}:** ${tr(c.orientation)}`);
  out.push(`- **${T.resultingType}:** ${c.label}`);
  out.push(`- ${c.blurb}\n`);
  const cuL = customerLines(r.customer);
  if (cuL.length) {
    out.push(`**${T.customer}**`);
    cuL.forEach(([k, v]) => out.push(`- **${k}:** ${v}`));
    out.push("");
  }
  out.push(`*${T.stageGuidance} (${tr(m.stage)}):* ${r.stage_note}\n`);

  out.push(`## ${T.s2}`);
  Object.entries(r.pathway).forEach(([track, stages]) => {
    out.push(`### ${tr(track)}`);
    stages.forEach(s => {
      out.push(`- **${tr(s.stage)}**`);
      out.push(`  - ${T.description}: ${s.description || `_${T.notFilled}_`}`);
      out.push(`  - ${T.assumption}: ${s.assumption || `_${T.notStated}_`}`);
      out.push(`  - ${T.evidenceStrength}: ${tr(s.evidence || "Not rated")}`);
      if (s.change && s.change !== "none") out.push(`  - ${T.dependsOn}: ${REF.DEPENDENCE_SHORT[s.change]}`);
    });
  });
  const custMd = Object.values(r.pathway).flat().filter(s => s.change && s.change !== "none");
  out.push(`\n**${T.custSteps}:** ` + (custMd.length ? custMd.map(s => `${tr(s.stage)} (${REF.DEPENDENCE_SHORT[s.change].toLowerCase()})`).join("; ") : T.noneMarked));
  if (r.weakest_links) out.push(`\n**${T.weakest}:** ${r.weakest_links}`);
  out.push("");

  out.push(`## ${T.s3}`);
  SCORING.BUCKET_ORDER.forEach(b => {
    const items = r.buckets[b];
    if (!items.length) return;
    out.push(`### ${tr(b)}`);
    items.forEach(([n, e]) => {
      const d = [`${T.measures}: ${kindLabel(n, e)}`, `${T.feasibility}: ${tr(e.feasibility)}`, `${T.relevance}: ${tr(e.relevance)}`];
      INDICATOR_FIELDS.forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${fieldValue(f, e[f])}`); });
      out.push(`- **${tr(n)}** (${tr(e.category)}): ` + d.join(" · "));
    });
  });
  out.push("");

  out.push(`## ${T.s4}`);
  if (!r.claim_rows.length) out.push(`_${T.noClaims}_`);
  else {
    out.push(`| ${T.indicator} | ${T.claim} | ${T.level} | ${T.quality} | ${T.baseline} | ${T.sources} | ${T.issues} |`);
    out.push("| --- | --- | --- | --- | --- | --- | --- |");
    const cellMd = t => String(t || "").replace(/\|/g, "/").replace(/\n/g, " ");
    r.claim_rows.forEach(row => out.push(`| ${cellMd(tr(row.name))} | ${cellMd(row.u.claim) || "—"} | ${row.u.level ? tr(row.u.level) : "—"} | ${REF.QUALITY_SHORT[row.u.quality || ""]} | ${row.u.baseline ? T.yes : baselineCell(row)} | ${row.u.sources ? T.yes : T.missing} | ${issueCell(row)} |`));
    out.push("");
  }
  r.claim_rows.forEach(row => {
    const u = row.u;
    out.push(`### ${tr(row.name)}`);
    const lvl = u.level || "unlabelled";
    out.push(`- **${T.confidence}:** ${levelName(lvl)}` + (REF.CONFIDENCE_LEVELS[lvl] ? `. ${REF.CONFIDENCE_LEVELS[lvl]}` : ""));
    out.push(`- **${T.evQuality}:** ${qualityLabel(u.quality)}`);
    if (u.claim) out.push(`- **${T.claimStated}:** ${u.claim}`);
    out.push(`- **${T.baseline}:** ${u.baseline || `_${T.notStated}_`}`);
    out.push(`- **${T.evSources}:** ${u.sources || `_${T.notStated}_`}`);
    out.push(`- **${T.boundary}:** ${u.boundary || `_${T.notStated}_`}`);
    if (row.stage) out.push(`- **${T.reliesOn}:** ${tr(row.link)}. ${T.assumptionShort}: ${row.stage.assumption || `_${T.noneStated}_`} (${T.evidenceWord}: ${tr(row.stage.evidence || "Not rated")})`);
    out.push(`- **${T.assumptions}:** ${u.assumptions || `_${T.notFilled}_`}`);
    out.push(`- **${T.conditions}:** ${u.conditions || `_${T.notFilled}_`}`);
    row.gaps.forEach(g => out.push(`- ${g.sev === "warning" ? `⚠️ **${T.gap}:**` : "ℹ️"} ${g.msg}`));
  });
  out.push("");

  out.push(`## ${T.s5}`);
  const sym = { warning: "⚠️", info: "ℹ️", ok: "✅" };
  r.integrity_checks.forEach(([s, msg]) => out.push(`- ${sym[s]} ${msg}`));
  out.push("");

  const al = r.alignment;
  out.push(`## ${T.s6}`);
  out.push(`_${ALIGN_SCOPE}_\n`);
  out.push(`- **${T.custValue}:** ${al.customer_value || `_${T.notDescribed}_`}`);
  out.push(`- **${T.envValue}:** ${al.env_value || `_${T.notDescribed}_`}`);
  out.push(`- **${T.alignment}:** ${al.verdict_label}. ${al.verdict_text}\n`);
  if (al.assumptions.length) {
    out.push(`**${T.critical}**`);
    al.assumptions.forEach(a => {
      out.push(`- **${a.text}** _(${alignStatus(a.status)})_` + (a.note ? ` — ${a.note}` : ""));
      out.push(`  - ${T.whyMatters}: ${a.why}`);
      out.push(`  - ${T.howCheck}: ${a.test}`);
    });
  }
  out.push("");

  out.push(`## ${T.s7}`);
  out.push(`_${T.rulesNote}_\n`);
  if (r.next_steps.actions.length) {
    out.push(`**${T.actionPlan}** (${T.actionPlanNote})\n`);
    out.push(`| # | ${T.action} | ${T.priority} | ${T.owner} | ${T.deadline} | ${T.doneWhen} |`);
    out.push("| --- | --- | --- | --- | --- | --- |");
    const c2 = t => String(t || "").replace(/\|/g, "/");
    planRows(r).forEach(p => out.push(`| ${p.n} | **${c2(p.a.title)}.** ${c2(p.a.action)} | ${SCORING.PRIORITY_LABEL[p.a.priority]} | ${c2(p.owner) || "—"} | ${p.due || "—"} | ${c2(p.done) || "—"} |`));
    out.push(`\n**${T.whyThese}** (${T.whyTheseNote})\n`);
  }
  const mdRec = (a, i) => {
    out.push(`### ${i + 1}. ${a.title} (${prioLabel(a).toLowerCase()}, ${T.rule} ${a.id.split(".")[0]})`);
    out.push(`- **${T.detected}:** ${a.condition}`);
    out.push(`- **${T.recAction}:** ${a.action}`);
    out.push(`- **${T.whyMatters}:** ${a.implication}`);
    out.push(`- **${T.whyNow} (${tr(r.meta.stage)}):** ${a.why_now}`);
    if (a.trace.length) out.push(`- **${T.basedOn}:** ${a.trace.join("; ")}`);
  };
  if (r.next_steps.actions.length) {
    r.next_steps.actions.forEach(mdRec);
    if (r.next_steps.more) out.push(`\n_${L(`${r.next_steps.more} lower-priority recommendation(s) not listed.`, `Další doporučení s nižší prioritou (${r.next_steps.more}) nejsou uvedena.`)}_`);
  } else out.push(`_${T.noGaps}_`);
  if (r.next_steps.strengths.length) {
    out.push(`\n**${T.canShow}**`);
    r.next_steps.strengths.forEach(mdRec);
  }
  if (r.next_steps.consider.length) {
    out.push(`\n**${T.consider}** (${T.considerNote.toLowerCase()})`);
    r.next_steps.consider.forEach(cq => out.push(`- **${cq.title}** ${cq.text} _(${cq.id}; ${T.shownBecause}: ${cq.trace.join("; ")})_`));
  }
  out.push("");

  out.push(`## ${T.s8}`);
  out.push(T.reviewIntro);
  out.push(`- **${T.nextMilestone}:** ${m.next_review_milestone ? tr(m.next_review_milestone) : `_${T.notSet}_`}`);
  if (m.review_notes) out.push(`- **${T.notes}:** ${m.review_notes}`);
  out.push("");

  out.push(`## ${T.appendix}`);
  out.push(`| ${T.ruleH} | ${T.recommendation} | ${T.firesWhen} | ${T.appliesHere} |`);
  out.push("| --- | --- | --- | --- |");
  const firedMd = new Set(r.next_steps.fired);
  SCORING.RULES.forEach(([id, , title, cond]) => out.push(`| ${id} | ${title} | ${cond.replace(/\|/g, "/")} | ${firedMd.has(id) ? T.yes : "–"} |`));
  out.push("");

  out.push(`## ${T.methodology}`);
  out.push(REF.METHODOLOGY_NOTE);
  out.push("");
  out.push(`## ${T.references}`);
  Object.keys(r.references).sort().forEach(k => out.push(`- ${r.references[k]}`));
  return out.join("\n");
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

  P.push(`<h1>${T.title}: ${esc(m.startup_name)}</h1>`);
  P.push(`<p class="meta">${T.version} ${m.assessment_version} · ${T.generated} ${m.generated} · ${T.stage}: ${esc(tr(m.stage))}` +
    (m.sector ? ` · ${T.sector}: ${esc(m.sector)}` : "") + "</p>");
  if (m.startup_desc) P.push(`<blockquote>${esc(m.startup_desc)}</blockquote>`);

  const core = r.buckets[SCORING.BUCKET_CORE];
  const warnN = r.integrity_checks.filter(([s]) => s === "warning").length;
  const open = r.alignment.assumptions.filter(a => a.status !== "validated").length;
  P.push(`<h2>${T.exec}</h2>`);
  P.push(li([
    `<b>${T.classification}:</b> ${esc(c.label)}`,
    `<b>${T.unit}:</b> ${esc(c.unit_of_analysis)}`,
    `<b>${T.coreSet}:</b> ` + L(`${core.length} indicator(s)`, `${core.length} ${I18N.plural(core.length, "indikátor", "indikátory", "indikátorů")}`) +
      (core.length ? ": " + core.map(([n]) => esc(tr(n))).join("; ") : ""),
    `<b>${T.evidenceBase}:</b> ${esc(evidenceLine(levelCounts(r)))}`,
    `<b>${T.readiness}:</b> ${esc(readinessLine(r))}`,
    `<b>${T.integrity}:</b> ` + L(`${warnN} warning(s)`, `varování: ${warnN}`),
  ].concat(r.customer.type_label ? [`<b>${T.customer}:</b> ${esc(r.customer.type_label)}`] : [],
    r.next_steps.actions.length ? [`<b>${L("Recommendations", "Doporučení")}:</b> ${r.next_steps.actions.length} (${L("Section 7", "oddíl 7")})`] : [],
    r.alignment.applies ? [`<b>${L("Impact–business alignment", "Soulad dopadu a byznysu")}:</b> ${esc(r.alignment.verdict_label)}; ` +
      L(`${open} of ${r.alignment.assumptions.length} critical assumptions not yet validated (Section 6)`,
        `neověřeno ${open} z ${r.alignment.assumptions.length} kritických předpokladů (oddíl 6)`)] : [], [
    `<b>${T.nextReview}:</b> ${m.next_review_milestone ? esc(tr(m.next_review_milestone)) : T.notSet}`,
  ])));

  P.push(`<h2>${esc(T.s1)}</h2>`);
  P.push(li([
    `<b>${T.mechanism}:</b> ${esc(tr(c.mechanism))}` + (c.is_hybrid ? ` (${T.secondaryTrack}: ${esc(tr(c.secondary_mechanism))})` : ""),
    `<b>${T.orientation}:</b> ${esc(tr(c.orientation))}`,
    `<b>${T.resultingType}:</b> ${esc(c.label)}. ${esc(c.blurb)}`,
  ]));
  const cuH = customerLines(r.customer);
  if (cuH.length) {
    P.push(`<h3>${T.customer}</h3>`);
    P.push(li(cuH.map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`)));
  }
  P.push(`<p class="meta">${T.stageGuidance} (${esc(tr(m.stage))}): ${esc(r.stage_note)}</p>`);

  P.push(`<h2>${esc(T.s2)}</h2>`);
  Object.entries(r.pathway).forEach(([track, stages]) => {
    P.push(`<h3>${esc(tr(track))}</h3>`);
    if (typeof PATHWAY_DIAGRAM !== "undefined" && stages.length)
      P.push(`<div class="diagram">${PATHWAY_DIAGRAM.svg(track, stages, { actor: r.customer.actor }).svg}</div>`);
    P.push(li(stages.map(s => `<b>${esc(tr(s.stage))}</b>` +
      (s.change && s.change !== "none" ? ` <span class="dep">${esc(REF.DEPENDENCE_SHORT[s.change])}</span>` : "") +
      `<br>${T.description}: ${esc(s.description || T.notFilled)}<br>` +
      `${T.assumptionShort}: ${esc(s.assumption || T.notStated)}<br>${T.evidenceStrength}: ${esc(tr(s.evidence || "Not rated"))}`)));
  });
  if (r.weakest_links) P.push(`<p><b>${T.weakestShort}:</b> ${esc(r.weakest_links)}</p>`);

  P.push(`<h2>${esc(T.s3)}</h2>`);
  let any = false;
  SCORING.BUCKET_ORDER.forEach(b => {
    const items = r.buckets[b];
    if (!items.length) return;
    any = true;
    P.push(`<h3>${esc(tr(b))}</h3>`);
    P.push(li(items.map(([n, e]) => {
      const d = [`${T.measures}: ${esc(kindLabel(n, e))}`, `${T.feasibility}: ${esc(tr(e.feasibility))}`, `${T.relevance}: ${esc(tr(e.relevance))}`];
      INDICATOR_FIELDS.forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${esc(fieldValue(f, e[f]))}`); });
      return `<b>${esc(tr(n))}</b> <i>(${esc(tr(e.category))})</i>: ` + d.join(" · ");
    })));
  });
  if (!any) P.push(`<p><i>${T.noIndicators}</i></p>`);

  P.push(`<h2>${esc(T.s4)}</h2>`);
  if (!r.claim_rows.length) P.push(`<p><i>${T.noClaims}</i></p>`);
  else {
    P.push(`<table class="claims"><thead><tr><th>${T.indicatorClaim}</th><th>${T.level}</th><th>${T.quality}</th><th>${T.baseline}</th><th>${T.sources}</th><th>${T.issues}</th></tr></thead><tbody>` +
      r.claim_rows.map(row => `<tr><td><b>${esc(tr(row.name))}</b>${row.u.claim ? `<br><i>${esc(quoted(row.u.claim))}</i>` : ""}</td>` +
        `<td>${esc(row.u.level ? tr(row.u.level) : "—")}</td><td>${esc(REF.QUALITY_SHORT[row.u.quality || ""])}</td>` +
        `<td>${baselineCell(row) === T.missing ? `<span class="warn">${T.missing}</span>` : esc(baselineCell(row))}</td><td>${row.u.sources ? "✓" : `<span class="warn">${T.missing}</span>`}</td>` +
        `<td>${gapCount(row) ? `<span class="warn">${esc(issueCell(row))}</span>` : esc(issueCell(row))}</td></tr>`).join("") + "</tbody></table>");
  }
  r.claim_rows.forEach(row => {
    const u = row.u;
    const lvl = u.level || "unlabelled";
    const badge = REF.CONFIDENCE_LEVELS[lvl] ? `<span class="badge b-${lvl}">${esc(tr(lvl))}</span>` : esc(levelName(lvl));
    P.push(`<h3>${esc(tr(row.name))} ${badge} <span class="badge b-q">${T.quality}: ${esc(REF.QUALITY_SHORT[u.quality || ""])}</span></h3>`);
    const rows = [];
    if (u.claim) rows.push(`<b>${T.claimStated}:</b> ${esc(u.claim)}`);
    rows.push(`<b>${T.baseline}:</b> ${esc(u.baseline || T.notStated)}`);
    rows.push(`<b>${T.evSources}:</b> ${esc(u.sources || T.notStated)}`);
    rows.push(`<b>${T.boundary}:</b> ${esc(u.boundary || T.notStated)}`);
    if (row.stage) rows.push(`<b>${T.reliesOn}:</b> ${esc(tr(row.link))}. ${T.assumptionShort}: ${esc(row.stage.assumption || T.noneStated)} (${T.evidenceWord}: ${esc(tr(row.stage.evidence || "Not rated"))})`);
    rows.push(`<b>${T.assumptions}:</b> ${esc(u.assumptions || T.notFilled)}`);
    rows.push(`<b>${T.conditionsShort}:</b> ${esc(u.conditions || T.notFilled)}`);
    row.gaps.forEach(g => rows.push(`<span class="${g.sev === "warning" ? "warn" : "info"}">${g.sev === "warning" ? `⚠ ${T.gap}: ` : "ℹ "}${esc(g.msg)}</span>`));
    P.push(li(rows));
  });

  P.push(`<h2>${esc(T.s5)}</h2>`);
  const cl = { warning: "warn", ok: "ok", info: "info" }, sym = { warning: "⚠", ok: "✔", info: "ℹ" };
  P.push(li(r.integrity_checks.map(([s, msg]) => `<span class="${cl[s]}">${sym[s]} ${esc(msg)}</span>`)));

  const alH = r.alignment;
  P.push(`<h2>${esc(T.s6)}</h2>`);
  P.push(`<p class="meta">${esc(ALIGN_SCOPE)}</p>`);
  P.push(`<table class="claims"><tr><th>${T.custValue}</th><th>${T.envValue}</th></tr><tr><td>${esc(alH.customer_value || T.notDescribed)}</td><td>${esc(alH.env_value || T.notDescribed)}</td></tr></table>`);
  P.push(`<p><b>${T.alignment}: ${esc(alH.verdict_label)}.</b> ${esc(alH.verdict_text)}</p>`);
  if (alH.assumptions.length) {
    P.push(`<h3>${T.critical}</h3>`);
    P.push(li(alH.assumptions.map(a => `<b>${esc(a.text)}</b> <span class="badge ${a.status === "validated" ? "b-Measured" : a.status === "some" ? "b-Modelled" : "b-q"}">${esc(alignStatus(a.status))}</span>` +
      (a.note ? `<br><i>${esc(a.note)}</i>` : "") + `<br>${T.whyMatters}: ${esc(a.why)}<br>${T.howCheck}: ${esc(a.test)}`)));
  }

  P.push(`<h2>${esc(T.s7)}</h2>`);
  P.push(`<p class="meta">${esc(T.rulesNote)}</p>`);
  if (r.next_steps.actions.length) {
    P.push(`<h3>${T.actionPlan}</h3><table class="claims"><thead><tr><th>#</th><th>${T.action}</th><th>${T.priority}</th><th>${T.owner}</th><th>${T.deadline}</th><th>${esc(T.doneWhen)}</th></tr></thead><tbody>` +
      planRows(r).map(p => `<tr><td>${p.n}</td><td><b>${esc(p.a.title)}.</b> ${esc(p.a.action)}</td><td>${esc(SCORING.PRIORITY_LABEL[p.a.priority])}</td><td>${esc(p.owner) || "—"}</td><td>${esc(p.due) || "—"}</td><td>${esc(p.done) || "—"}</td></tr>`).join("") +
      `</tbody></table><h3>${T.whyThese}</h3>`);
  }
  const htmlRec = (a, i) => {
    const badge = a.type === "strength" ? `<span class="badge b-Measured">${T.strength}</span>` :
      `<span class="badge ${a.priority === 3 ? "b-hi" : a.priority === 2 ? "b-Modelled" : "b-q"}">${esc(prioLabel(a))}</span>`;
    P.push(`<h3>${i + 1}. ${esc(a.title)} ${badge} <span class="meta">${T.rule} ${esc(a.id.split(".")[0])}</span></h3>`);
    P.push(li([`<b>${T.detected}:</b> ${esc(a.condition)}`, `<b>${T.recAction}:</b> ${esc(a.action)}`,
      `<b>${T.whyMatters}:</b> ${esc(a.implication)}`, `<b>${T.whyNow} (${esc(tr(r.meta.stage))}):</b> ${esc(a.why_now)}`]
      .concat(a.trace.length ? [`<b>${T.basedOn}:</b> ${esc(a.trace.join("; "))}`] : [])));
  };
  if (r.next_steps.actions.length) {
    r.next_steps.actions.forEach(htmlRec);
    if (r.next_steps.more) P.push(`<p class="meta">${esc(L(`${r.next_steps.more} lower-priority recommendation(s) not listed.`, `Další doporučení s nižší prioritou (${r.next_steps.more}) nejsou uvedena.`))}</p>`);
  } else P.push(`<p><i>${T.noGaps}</i></p>`);
  if (r.next_steps.strengths.length) {
    P.push(`<h3>${T.canShow}</h3>`);
    r.next_steps.strengths.forEach(htmlRec);
  }
  if (r.next_steps.consider.length) {
    P.push(`<h3>${T.consider}</h3><p class="meta">${esc(T.considerNote)}</p>`);
    P.push(li(r.next_steps.consider.map(cq => `<b>${esc(cq.title)}</b> ${esc(cq.text)} <span class="meta">(${esc(cq.id)}; ${T.shownBecause}: ${esc(cq.trace.join("; "))})</span>`)));
  }

  P.push(`<h2>${esc(T.s8)}</h2>`);
  P.push(`<p>${esc(T.reviewIntro)}</p>`);
  P.push(li([`<b>${T.nextMilestone}:</b> ${m.next_review_milestone ? esc(tr(m.next_review_milestone)) : T.notSet}`]
    .concat(m.review_notes ? [`<b>${T.notes}:</b> ${esc(m.review_notes)}`] : [])));

  P.push(`<h2>${esc(T.appendix)}</h2>`);
  const firedH = new Set(r.next_steps.fired);
  P.push(`<table class="claims"><thead><tr><th>${T.ruleH}</th><th>${T.recommendation}</th><th>${T.firesWhen}</th><th>${T.appliesHere}</th></tr></thead><tbody>` +
    SCORING.RULES.map(([id, , title, cond]) => `<tr><td><b>${esc(id)}</b></td><td>${esc(title)}</td><td>${esc(cond)}</td><td>${firedH.has(id) ? T.yes : "–"}</td></tr>`).join("") + "</tbody></table>");

  P.push(`<h2>${T.methodology}</h2>`);
  P.push(`<p>${esc(REF.METHODOLOGY_NOTE)}</p>`);
  P.push(`<h2>${T.references}</h2>`);
  P.push(li(Object.keys(r.references).sort().map(k => esc(r.references[k]))));
  P.push(`<footer>${esc(T.footer)}</footer>`);
  return P.join("");
};

REPORT.toHtml = function (r) {
  return `<!DOCTYPE html><html lang="${I18N.lang}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${T.title}: ${esc(r.meta.startup_name)}</title>` +
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
  if (!D) throw new Error(L("the Word export library did not load", "knihovna pro export do Wordu se nenačetla"));
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
    children: [new TextRun({ text: T.title, color: DOCX_C.green })],
  }));
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: m.startup_name || T.untitled, color: "333333" })],
  }));
  children.push(new Paragraph({
    children: [new TextRun({
      text: `${T.version} ${m.assessment_version}  ·  ${T.generated} ${m.generated}  ·  ${T.stage}: ${tr(m.stage)}` +
        (m.sector ? `  ·  ${T.sector}: ${m.sector}` : ""),
      italics: true, size: 19, color: DOCX_C.grey,
    })],
  }));
  if (m.startup_desc) {
    children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: m.startup_desc, italics: true })] }));
  }
  children.push(new Paragraph(""));
  children.push(h(T.toc, HeadingLevel.HEADING_1));
  children.push(new TableOfContents(T.toc, { hyperlink: true, headingStyleRange: "1-3" }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Executive summary
  children.push(h(T.exec, HeadingLevel.HEADING_1));
  const core = r.buckets[SCORING.BUCKET_CORE];
  const warnN = r.integrity_checks.filter(([s]) => s === "warning").length;
  const open = r.alignment.assumptions.filter(a => a.status !== "validated").length;
  [
    `${T.classification}: ${c.label}`,
    `${T.unit}: ${c.unit_of_analysis}`,
    `${T.coreSet}: ` + L(`${core.length} indicator(s)`, `${core.length} ${I18N.plural(core.length, "indikátor", "indikátory", "indikátorů")}`) +
      (core.length ? " — " + core.map(([n]) => tr(n)).join("; ") : ""),
    `${T.evidenceBase}: ${evidenceLine(levelCounts(r))}`,
    `${T.readiness}: ${readinessLine(r)}`,
    `${T.integrity}: ` + L(`${warnN} warning(s)`, `varování: ${warnN}`) + (warnN ? L(" — see Section 5", " — viz oddíl 5") : ""),
    ...(r.customer.type_label ? [`${T.customer}: ${r.customer.type_label}`] : []),
    ...(r.next_steps.actions.length ? [`${L("Recommendations", "Doporučení")}: ${r.next_steps.actions.length} — ${L("see Section 7", "viz oddíl 7")}`] : []),
    ...(r.alignment.applies ? [`${L("Impact–business alignment", "Soulad dopadu a byznysu")}: ${r.alignment.verdict_label}; ` +
      L(`${open} of ${r.alignment.assumptions.length} critical assumptions not yet validated — see Section 6`,
        `neověřeno ${open} z ${r.alignment.assumptions.length} kritických předpokladů — viz oddíl 6`)] : []),
    `${T.nextReview}: ${m.next_review_milestone ? tr(m.next_review_milestone) : T.notSet}`,
  ].forEach(t => children.push(bullet(t)));

  // Module 1
  children.push(h(T.s1, HeadingLevel.HEADING_1));
  children.push(bullet(`${T.mechanism}: ${tr(c.mechanism)}` + (c.is_hybrid ? ` (${T.secondaryTrack}: ${tr(c.secondary_mechanism)})` : "")));
  children.push(bullet(`${T.orientation}: ${tr(c.orientation)}`));
  children.push(bullet(`${T.resultingType}: ${c.label}`));
  children.push(new Paragraph({ indent: { left: 200 }, children: [new TextRun(c.blurb)] }));
  const cuD = customerLines(r.customer);
  if (cuD.length) {
    children.push(h(T.customer, HeadingLevel.HEADING_3));
    cuD.forEach(([k, v]) => children.push(bullet([new TextRun({ text: `${k}: `, bold: true }), new TextRun(v)])));
  }
  children.push(new Paragraph({
    children: [new TextRun({ text: `${T.stageGuidance} (${tr(m.stage)}): ${r.stage_note}`, italics: true, size: 19, color: DOCX_C.grey })],
  }));

  // Module 2
  children.push(h(T.s2, HeadingLevel.HEADING_1));
  Object.entries(r.pathway).forEach(([track, stages]) => {
    children.push(h(tr(track), HeadingLevel.HEADING_2));
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
        children: [new TextRun(tr(s.stage))].concat(dep ? [new TextRun({ text: `  [${REF.DEPENDENCE_SHORT[s.change].toUpperCase()}]`, bold: true, color: "D9661F" })] : []),
      }));
      children.push(bullet(`${T.description}: ${s.description || T.notFilled}`));
      children.push(bullet(`${T.assumption}: ${s.assumption || T.notStated}`));
      children.push(bullet(`${T.evidenceStrength}: ${tr(s.evidence || "Not rated")}`));
    });
  });
  if (r.weakest_links) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `${T.weakest}: ${r.weakest_links}`, bold: true, color: DOCX_C.red })],
    }));
  }

  // Module 3
  children.push(h(T.s3, HeadingLevel.HEADING_1));
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
    children.push(h(tr(b), HeadingLevel.HEADING_2));
    const rows = [new TableRow({
      tableHeader: true,
      children: [T.indicator, L("Category", "Kategorie"), T.measures, L("Feas.", "Prov."), L("Rel.", "Rel."), L("Details", "Podrobnosti")].map((t, i) =>
        cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: widths[i] })),
    })];
    items.forEach(([n, e], idx) => {
      const d = [];
      [["unit", L("Unit", "Jednotka")], ["current_value", L("Current", "Současně")], ["target", L("Target", "Cíl")], ["frequency", L("Freq.", "Četnost")],
        ["data_source", L("Source", "Zdroj")], ["pathway_link", L("Evidences", "Dokládá")]].forEach(([f, lbl]) => { if (e[f]) d.push(`${lbl}: ${fieldValue(f, e[f])}`); });
      const fill = idx % 2 === 1 ? DOCX_C.light : undefined;
      rows.push(new TableRow({
        children: [tr(n), tr(e.category || ""), kindLabel(n, e), tr(e.feasibility || ""), tr(e.relevance || ""), d.length ? d.join("; ") : "—"]
          .map((t, i) => cell(t, { fill, width: widths[i], color: i === 2 && kindReal(n, e) ? DOCX_C.green : undefined, bold: i === 2 && kindReal(n, e) })),
      }));
    });
    children.push(new Table({ rows, width: { size: TABLE_TW, type: WidthType.DXA }, columnWidths: twips(widths), layout: TableLayoutType.FIXED }));
    children.push(new Paragraph(""));
  });
  if (!anyInd) children.push(new Paragraph(T.noIndicators));

  // Module 4
  children.push(h(T.s4, HeadingLevel.HEADING_1));
  const confColor = { Measured: DOCX_C.green, Modelled: DOCX_C.gold, Projected: DOCX_C.purple };
  if (!r.claim_rows.length) children.push(new Paragraph(T.noClaims));
  else {
    const cw = [34, 13, 12, 12, 12, 17];
    const trows = [new TableRow({
      tableHeader: true,
      children: [T.indicatorClaim, T.level, T.quality, T.baseline, T.sources, T.issues].map((t, i) =>
        cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: cw[i] })),
    })];
    r.claim_rows.forEach((row, idx) => {
      const fill = idx % 2 === 1 ? DOCX_C.light : undefined;
      const g = gapCount(row);
      const bl = baselineCell(row);
      trows.push(new TableRow({ children: [
        cell(tr(row.name) + (row.u.claim ? ` — ${quoted(row.u.claim)}` : ""), { fill, width: cw[0] }),
        cell(row.u.level ? tr(row.u.level) : "—", { fill, width: cw[1], bold: true, color: confColor[row.u.level] }),
        cell(REF.QUALITY_SHORT[row.u.quality || ""], { fill, width: cw[2] }),
        cell(bl, { fill, width: cw[3], color: bl === "✓" ? DOCX_C.green : bl === T.missing ? DOCX_C.red : DOCX_C.grey }),
        cell(row.u.sources ? "✓" : T.missing, { fill, width: cw[4], color: row.u.sources ? DOCX_C.green : DOCX_C.red }),
        cell(issueCell(row), { fill, width: cw[5], bold: !!g, color: g ? DOCX_C.red : DOCX_C.grey }),
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
      children: [new TextRun(tr(row.name)), new TextRun({ text: `  [${levelName(lvl).toUpperCase()}]`, bold: true, color: confColor[lvl] || DOCX_C.grey }),
        new TextRun({ text: `  [${T.quality.toUpperCase()}: ${REF.QUALITY_SHORT[u.quality || ""].toUpperCase()}]`, bold: true, color: DOCX_C.grey })],
    }));
    if (u.claim) children.push(labelled(`${T.claimStated}: `, u.claim));
    children.push(labelled(`${T.baseline}: `, u.baseline || T.notStated));
    children.push(labelled(`${T.evSources}: `, u.sources || T.notStated));
    children.push(labelled(`${T.boundary}: `, u.boundary || T.notStated));
    if (row.stage) children.push(labelled(`${T.reliesOn}: `, `${tr(row.link)}. ${T.assumptionShort}: ${row.stage.assumption || T.noneStated} (${T.evidenceWord}: ${tr(row.stage.evidence || "Not rated")})`));
    children.push(labelled(`${T.assumptions}: `, u.assumptions || T.notFilled));
    children.push(labelled(`${T.conditionsShort}: `, u.conditions || T.notFilled));
    row.gaps.forEach(g => children.push(bullet([new TextRun({ text: `${g.sev === "warning" ? `⚠ ${T.gap}: ` : "ℹ "}${g.msg}`, color: g.sev === "warning" ? DOCX_C.red : DOCX_C.blue })])));
  });

  // Integrity checks
  children.push(h(T.s5, HeadingLevel.HEADING_1));
  const chkColor = { warning: DOCX_C.red, info: DOCX_C.blue, ok: DOCX_C.green };
  const chkSym = { warning: "⚠", info: "ℹ", ok: "✓" };
  r.integrity_checks.forEach(([s, msg]) => children.push(bullet([new TextRun({ text: `${chkSym[s]}  ${msg}`, color: chkColor[s] })])));

  // Impact-business alignment
  const alD = r.alignment;
  children.push(h(T.s6, HeadingLevel.HEADING_1));
  children.push(new Paragraph({ children: [new TextRun({ text: ALIGN_SCOPE, italics: true, size: 19, color: DOCX_C.grey })] }));
  children.push(new Table({
    width: { size: TABLE_TW, type: WidthType.DXA }, columnWidths: twips([50, 50]), layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ tableHeader: true, children: [T.custValue, T.envValue].map(t => cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: 50 })) }),
      new TableRow({ children: [alD.customer_value || T.notDescribed, alD.env_value || T.notDescribed].map(t => cell(t, { width: 50 })) }),
    ],
  }));
  children.push(new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: `${T.alignment}: ${alD.verdict_label}. `, bold: true }), new TextRun(alD.verdict_text)] }));
  if (alD.assumptions.length) {
    children.push(h(T.critical, HeadingLevel.HEADING_2));
    const stColor = { validated: DOCX_C.green, some: DOCX_C.gold, unchecked: "D9661F" };
    alD.assumptions.forEach(a => {
      children.push(new Paragraph({ spacing: { before: 120 }, children: [
        new TextRun({ text: a.status === "validated" ? "✓  " : "!  ", bold: true, color: stColor[a.status] }),
        new TextRun({ text: a.text, bold: true }),
        new TextRun({ text: `  [${alignStatus(a.status).toUpperCase()}]`, bold: true, color: stColor[a.status], size: 18 })] }));
      if (a.note) children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: a.note, italics: true })] }));
      children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: `${T.whyMatters}: `, bold: true }), new TextRun(a.why)] }));
      children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: `${T.howCheck}: `, bold: true }), new TextRun(a.test)] }));
    });
  }

  // Recommendations & points to consider
  children.push(h(T.s7, HeadingLevel.HEADING_1));
  children.push(new Paragraph({ children: [new TextRun({ text: T.rulesNote, italics: true, size: 19, color: DOCX_C.grey })] }));
  if (r.next_steps.actions.length) {
    children.push(h(T.actionPlan, HeadingLevel.HEADING_2));
    const pw = [5, 45, 11, 12, 11, 16];
    children.push(new Table({
      width: { size: TABLE_TW, type: WidthType.DXA }, columnWidths: twips(pw), layout: TableLayoutType.FIXED,
      rows: [new TableRow({ tableHeader: true, children: ["#", T.action, T.priority, T.owner, T.deadline, T.doneWhen].map((t, i) => cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: pw[i] })) })]
        .concat(planRows(r).map(p => new TableRow({ children: [
          cell(String(p.n), { width: pw[0], bold: true }), cell(`${p.a.title}. ${p.a.action}`, { width: pw[1] }),
          cell(SCORING.PRIORITY_LABEL[p.a.priority], { width: pw[2] }), cell(p.owner || "—", { width: pw[3] }),
          cell(p.due || "—", { width: pw[4] }), cell(p.done || "—", { width: pw[5] })] }))),
    }));
    children.push(h(T.whyThese, HeadingLevel.HEADING_2));
  }
  const prColor = { 3: DOCX_C.red, 2: DOCX_C.gold, 1: DOCX_C.grey };
  const BASED = `${T.basedOn}: `;
  const docxRec = (a, i) => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun(`${i + 1}. ${a.title}`),
        new TextRun({ text: `  [${prioLabel(a).toUpperCase()}]`, bold: true, color: a.type === "strength" ? DOCX_C.green : prColor[a.priority] }),
        new TextRun({ text: `  ${T.rule} ${a.id.split(".")[0]}`, color: DOCX_C.grey, size: 18 })],
    }));
    [[`${T.detected}: `, a.condition], [`${T.recAction}: `, a.action], [`${T.whyMatters}: `, a.implication], [`${T.whyNow} (${tr(m.stage)}): `, a.why_now]]
      .concat(a.trace.length ? [[BASED, a.trace.join("; ")]] : [])
      .forEach(([k, v]) => children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: k, bold: true }), new TextRun({ text: v, color: k === BASED ? DOCX_C.grey : undefined, size: k === BASED ? 18 : undefined })] })));
  };
  if (!r.next_steps.actions.length) children.push(new Paragraph(T.noGaps));
  r.next_steps.actions.forEach(docxRec);
  if (r.next_steps.more) children.push(new Paragraph({ children: [new TextRun({ text: L(`${r.next_steps.more} lower-priority recommendation(s) not listed.`, `Další doporučení s nižší prioritou (${r.next_steps.more}) nejsou uvedena.`), italics: true, color: DOCX_C.grey })] }));
  if (r.next_steps.strengths.length) {
    children.push(h(T.canShow, HeadingLevel.HEADING_2));
    r.next_steps.strengths.forEach(docxRec);
  }
  if (r.next_steps.consider.length) {
    children.push(h(T.consider, HeadingLevel.HEADING_2));
    children.push(new Paragraph({ children: [new TextRun({ text: T.considerNote, italics: true, size: 19, color: DOCX_C.grey })] }));
    r.next_steps.consider.forEach(cq => children.push(bullet([new TextRun({ text: `${cq.title}  `, bold: true }), new TextRun(cq.text),
      new TextRun({ text: `  (${cq.id}; ${T.shownBecause}: ${cq.trace.join("; ")})`, color: DOCX_C.grey, size: 17 })])));
  }

  // Review plan
  children.push(h(T.s8, HeadingLevel.HEADING_1));
  children.push(new Paragraph(T.reviewIntro));
  children.push(bullet(`${T.nextMilestone}: ${m.next_review_milestone ? tr(m.next_review_milestone) : T.notSet}`));
  if (m.review_notes) children.push(bullet(`${T.notes}: ${m.review_notes}`));

  // Appendix: the decision rules
  children.push(h(T.appendix, HeadingLevel.HEADING_1));
  children.push(new Paragraph({ children: [new TextRun({ text: T.appendixNote, italics: true, size: 19, color: DOCX_C.grey })] }));
  const firedD = new Set(r.next_steps.fired);
  const rw = [9, 28, 51, 12];
  children.push(new Table({
    width: { size: TABLE_TW, type: WidthType.DXA }, columnWidths: twips(rw), layout: TableLayoutType.FIXED,
    rows: [new TableRow({ tableHeader: true, children: [T.ruleH, T.recommendation, T.firesWhen, T.applies].map((t, i) => cell(t, { bold: true, fill: DOCX_C.green, color: "FFFFFF", width: rw[i] })) })]
      .concat(SCORING.RULES.map(([id, , title, cond]) => {
        const on = firedD.has(id), fill = on ? DOCX_C.light : undefined;
        return new TableRow({ children: [cell(id, { fill, width: rw[0], bold: true }), cell(title, { fill, width: rw[1] }), cell(cond, { fill, width: rw[2] }),
          cell(on ? T.yes : "–", { fill, width: rw[3], bold: on, color: on ? DOCX_C.green : DOCX_C.grey })] });
      })),
  }));

  // Methodology & references
  children.push(h(T.methodology, HeadingLevel.HEADING_1));
  children.push(new Paragraph(REF.METHODOLOGY_NOTE));
  children.push(h(T.references, HeadingLevel.HEADING_1));
  Object.keys(r.references).sort().forEach(k => children.push(bullet(r.references[k])));
  children.push(new Paragraph({
    children: [new TextRun({ text: T.footer, italics: true, size: 17, color: DOCX_C.grey })],
  }));

  const lang = I18N.lang === "cs" ? "cs-CZ" : "en-GB";
  const doc = new Document({
    creator: "EIA tool",
    title: `${T.title}: ${m.startup_name}`,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: "Calibri", size: 21, language: { value: lang } }, paragraph: { spacing: { after: 120 } } } },
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
            children: [new TextRun({ children: [`${T.page} `, PageNumber.CURRENT, ` ${T.of} `, PageNumber.TOTAL_PAGES], size: 17, color: DOCX_C.grey })],
          })],
        }),
      },
      children,
    }],
  });
  return Packer.toBlob(doc);
};

// ---------------------------------------------------------------------------
// JSON save file (language-independent; same format as the Streamlit version)
// ---------------------------------------------------------------------------

REPORT.PERSISTED_KEYS = [
  "startup_name", "startup_desc", "sector", "stage",
  "customer_types", "revenue_models", "customer_profile", "customer_user", "behaviour_actor",
  "value_drivers", "customer_value",
  "mechanism", "orientation", "is_hybrid", "secondary_mechanism",
  "pathway", "weakest_links",
  "selected_indicators", "custom_indicators", "custom_kinds", "uncertainty",
  "assessment_version", "next_review_milestone", "review_notes", "alignment", "plan",
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
    throw new Error(L("Not a recognised assessment file.", "Nejde o rozpoznatelný soubor s hodnocením."));
  const state = payload.state;
  // bump the version on re-import: this is a new review cycle
  state.assessment_version = (parseInt(state.assessment_version, 10) || 1) + 1;
  return state;
};
