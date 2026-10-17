// Regression tests for the browser version's rules (docs/js/framework.js and
// docs/js/report.js). Run with:  node --test tests/web/*.test.mjs
// No dependencies: the scripts are loaded into a sandbox the way the
// browser loads them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ctx = vm.createContext({ window: {}, console });
for (const f of ["docs/js/i18n.js", "docs/js/framework.js", "docs/js/report.js"]) {
  vm.runInContext(readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
}
vm.runInContext("this.REF = REF; this.SCORING = SCORING; this.REPORT = REPORT;", ctx);
const { REF, SCORING, REPORT } = ctx;

const fieldsense = () => {
  const st = JSON.parse(readFileSync(path.join(root, "docs/samples/FieldSense.json"), "utf8")).state;
  // what the app's ensurePathway() adds: customer dependence from the template
  Object.values(st.pathway).flat().forEach(s => {
    s.change = s.change || (/^Outputs/.test(s.stage) ? "adoption" : /^Outcomes/.test(s.stage) ? "behaviour" : "none");
  });
  return st;
};

const baseState = (over = {}) => Object.assign({
  startup_name: "T", stage: "Validation / MVP", mechanism: "Enabling", orientation: "Primary",
  customer_types: ["B2B"], revenue_models: ["subscription"], customer_profile: "Farm owners",
  customer_user: "same as buyer", behaviour_actor: "Farm managers", value_drivers: ["cost"],
  pathway: { "Adoption chain": [
    { stage: "Outputs: customer adoption", description: "x", assumption: "a", evidence: "Moderate (some evidence)", change: "adoption" },
    { stage: "Impact: avoided environmental harm", description: "y", assumption: "b", evidence: "Moderate (some evidence)", change: "none" },
  ] },
  selected_indicators: {}, uncertainty: {}, alignment: {}, next_review_milestone: "Product launch",
}, over);

const ind = (over = {}) => Object.assign({ category: "Systemic & Enabling Contribution", feasibility: "High", relevance: "High",
  current_value: "62 farms", pathway_link: "Adoption chain → Outputs: customer adoption" }, over);

const fullClaim = (over = {}) => Object.assign({
  level: "Measured", quality: "high", claim: "62 farms with an active account use the app weekly.",
  baseline: "", sources: "CRM records", boundary: "Active accounts, October 2026", assumptions: "Weekly login means use.",
  conditions: "",
}, over);

// ---------------------------------------------------------------- claims --

test("a blank claim is not reported as free of issues", () => {
  const u = fullClaim({ claim: "" });
  const gaps = SCORING.claimGaps("Adoption rate of the solution", u, ind(), baseState().pathway);
  assert.ok(gaps.some(g => g.kind === "blank"));
  const checks = SCORING.integrityChecks({ "Adoption rate of the solution": ind() }, { "Adoption rate of the solution": u }, baseState().pathway);
  assert.ok(!checks.some(([, m]) => /No issues detected/.test(m)), "no reassurance when nothing was checked");
  assert.ok(checks.some(([, m]) => /No claim written yet/.test(m)));
});

test("a blank Measured/High claim does not trigger the evidence-summary strength", () => {
  const n = "Adoption rate of the solution";
  const st = baseState({ selected_indicators: { [n]: ind() }, uncertainty: { [n]: fullClaim({ claim: "" }) } });
  const ns = SCORING.nextSteps(st);
  assert.ok(!ns.fired.includes("S01"));
  // and the same claim, written out, does
  st.uncertainty[n] = fullClaim();
  assert.ok(SCORING.nextSteps(st).fired.includes("S01"));
});

test("S01 needs a boundary and a pathway link that exists", () => {
  const n = "Adoption rate of the solution";
  const noBoundary = baseState({ selected_indicators: { [n]: ind() }, uncertainty: { [n]: fullClaim({ boundary: "" }) } });
  assert.ok(!SCORING.nextSteps(noBoundary).fired.includes("S01"));
  const deadLink = baseState({ selected_indicators: { [n]: ind({ pathway_link: "Adoption chain → Gone" }) }, uncertainty: { [n]: fullClaim() } });
  assert.ok(!SCORING.nextSteps(deadLink).fired.includes("S01"));
});

test("a hedge word in an unrelated sentence does not excuse a projected claim", () => {
  const u = { level: "Projected", quality: "medium", baseline: "2025 average", sources: "", boundary: "",
    claim: "Our app can be installed in minutes. Farmers use 18% less water per hectare." };
  const gaps = SCORING.claimGaps("x", u, null, {});
  assert.ok(gaps.some(g => g.kind === "wording" && g.sev === "warning"));
});

test("a projection worded as a possibility passes the wording prompt", () => {
  const u = { level: "Projected", quality: "medium", baseline: "2025 average", boundary: "2027 season",
    claim: "Water use per hectare could fall by up to 18% by 2027 if farms follow the recommendations." };
  assert.ok(!SCORING.claimGaps("x", u, null, {}).some(g => g.kind === "wording"));
});

test("'will' states a projection as certain and is flagged", () => {
  const u = { level: "Projected", quality: "medium", baseline: "b", claim: "FieldSense will cut water use by 18% per hectare." };
  assert.ok(SCORING.claimGaps("x", u, null, {}).some(g => g.kind === "wording"));
});

test("missing quality and boundary are warnings, not just notes", () => {
  const u = fullClaim({ quality: "", boundary: "" });
  const sev = SCORING.claimGaps("x", u, null, {}).filter(g => g.sev === "warning").map(g => g.msg);
  assert.ok(sev.some(m => /quality is not assessed/i.test(m)));
  assert.ok(sev.some(m => /No boundary/.test(m)));
});

test("a comparative claim without baseline is flagged", () => {
  const u = fullClaim({ claim: "Customers use 20% less water per hectare.", baseline: "" });
  assert.ok(SCORING.claimGaps("x", u, null, {}).some(g => /no baseline/i.test(g.msg)));
});

test("measured low-quality data is an info note only when the wording discloses it", () => {
  const disclosed = fullClaim({ quality: "low", claim: "In a survey, 71% of farmers say they irrigate less often." });
  const hidden = fullClaim({ quality: "low", claim: "71% of farmers irrigate less often with our product." });
  const w = u => SCORING.claimGaps("x", u, null, {}).filter(g => g.sev === "warning" && /quality is low/.test(g.msg)).length;
  assert.equal(w(disclosed), 0);
  assert.equal(w(hidden), 1);
});

test("a pathway link to a step that no longer exists is reported", () => {
  const st = baseState();
  const n = "Adoption rate of the solution";
  const e = ind({ pathway_link: "Adoption chain → Removed step" });
  assert.ok(SCORING.claimGaps(n, fullClaim(), e, st.pathway).some(g => /no longer exists/.test(g.msg)));
  const checks = SCORING.integrityChecks({ [n]: e }, { [n]: fullClaim() }, st.pathway);
  assert.ok(checks.some(([, m]) => /not linked to a pathway stage/.test(m)));
});

// ------------------------------------------------------------- alignment --

test("alignment is only 'Aligned' once every critical assumption is validated", () => {
  const st = baseState();
  let a = SCORING.alignment(st);
  assert.equal(a.verdict, "aligned");
  assert.match(a.verdict_label, /^Potential alignment/);
  st.alignment = Object.fromEntries(a.assumptions.map(x => [x.key, { status: "validated" }]));
  a = SCORING.alignment(st);
  assert.match(a.verdict_label, /^Aligned: key assumptions validated/);
});

test("savings in labour or time do not count as aligned with the environmental benefit", () => {
  const a = SCORING.alignment(baseState({ value_drivers: ["cost_other"] }));
  assert.equal(a.verdict, "independent");
  assert.ok(!a.assumptions.some(x => x.key === "same_change"));
});

// ------------------------------------------------------- recommendations --

test("every recommendation and prompt comes from a registered rule and carries a trace", () => {
  const ids = new Set(SCORING.RULES.map(r => r[0]));
  for (const st of [fieldsense(), baseState(), baseState({ value_drivers: [], customer_types: [], pathway: {} })]) {
    const ns = SCORING.nextSteps(st);
    for (const id of ns.fired) assert.ok(ids.has(id), `unregistered rule ${id}`);
    for (const a of ns.actions.concat(ns.hidden, ns.strengths)) {
      assert.ok(a.trace.length, `${a.id} has no "based on"`);
      for (const k of ["condition", "action", "implication", "why_now"]) assert.ok(a[k], `${a.id} lacks ${k}`);
    }
  }
});

test("recommendation titles are distinct (weak links are merged)", () => {
  const ns = SCORING.nextSteps(fieldsense());
  const titles = ns.actions.concat(ns.hidden).map(a => a.title);
  assert.equal(new Set(titles).size, titles.length, titles.join(" | "));
  assert.equal(ns.actions.filter(a => a.id === "R03").length, 1);
});

test("business benefit unclear fires for any mechanism (R14)", () => {
  for (const mechanism of ["Direct", "Enabling"]) {
    assert.ok(SCORING.nextSteps(baseState({ mechanism, value_drivers: ["none"] })).fired.includes("R14"));
  }
});

test("customer adoption not validated (R04)", () => {
  const st = baseState();
  st.pathway["Adoption chain"][0].evidence = "Not rated";
  assert.ok(SCORING.nextSteps(st).fired.includes("R04"));
});

test("priorities follow the development stage", () => {
  const st = baseState({ selected_indicators: { A: ind({ current_value: "" }) }, uncertainty: { A: fullClaim() } });
  const prio = stage => SCORING.nextSteps(Object.assign({}, st, { stage })).actions.find(a => a.id === "R08").priority;
  assert.equal(prio("Ideation"), 1);
  assert.equal(prio("Validation / MVP"), 3);
});

// ---------------------------------------------------------------- sample --

test("FieldSense teaches the evidence distinctions", () => {
  const st = fieldsense();
  const survey = st.uncertainty["Quality / reliability of adoption evidence"];
  assert.equal(survey.level, "Measured");
  assert.equal(survey.quality, "low");
  const proj = st.uncertainty["Avoided physical harm per unit of adoption (domain-specific)"];
  assert.equal(proj.level, "Projected");
  assert.match(proj.claim, /2027/);
  assert.ok(!SCORING.claimGaps("p", proj, null, st.pathway).some(g => g.kind === "wording"));
  assert.match(SCORING.alignment(st).verdict_label, /^Potential alignment/);
});

// ------------------------------------------------------------- save file --

test("the save file keeps the newer fields", () => {
  const st = fieldsense();
  st.plan = { R03: { owner: "Ana", due: "2026-11-30", done_evidence: "test results" } };
  st.alignment = { value: { status: "some", note: "3 LOIs" } };
  const back = REPORT.importState(REPORT.exportState(st));
  for (const k of ["customer_types", "revenue_models", "customer_user", "behaviour_actor", "value_drivers", "plan", "alignment", "custom_kinds"]) {
    assert.ok(k in back, `${k} missing from save file`);
  }
  assert.equal(back.plan.R03.owner, "Ana");
  assert.equal(back.assessment_version, (st.assessment_version || 1) + 1);
});

test("the Markdown report renders and contains the action plan", () => {
  const md = REPORT.toMarkdown(REPORT.assemble(fieldsense()));
  assert.match(md, /\*\*Action plan\*\*/);
  assert.match(md, /Evidence readiness/);
  assert.match(md, /Appendix: Recommendation Rules/);
  assert.doesNotMatch(md, /undefined/);
});

// ------------------------------------------------------------------ Czech --
// A second sandbox with the language forced to Czech. The rules must fire the
// same way; only the wording changes. Stored values stay English.

const loadIn = lang => {
  const c = vm.createContext({ window: {}, console, EIA_LANG: lang });
  for (const f of ["docs/js/i18n.js", "docs/js/framework.js", "docs/js/report.js"]) {
    vm.runInContext(readFileSync(path.join(root, f), "utf8"), c, { filename: f });
  }
  vm.runInContext("this.SCORING = SCORING; this.REPORT = REPORT; this.I18N = I18N;", c);
  return c;
};
const CS = loadIn("cs");

test("Czech mode fires the same rules as English", () => {
  assert.equal(CS.I18N.lang, "cs");
  for (const st of [fieldsense(), baseState()]) {
    const en = SCORING.nextSteps(st), cs = CS.SCORING.nextSteps(st);
    const j = x => JSON.stringify([...x]);   // arrays from another sandbox: compare as JSON
    assert.equal(j(cs.fired), j(en.fired));
    assert.equal(j(cs.actions.map(a => a.id)), j(en.actions.map(a => a.id)));
    assert.notEqual(j(cs.actions.map(a => a.title)), j(en.actions.map(a => a.title)));
  }
});

test("Czech claim wording is checked like English", () => {
  const base = { level: "Projected", quality: "medium", baseline: "průměr 2025", boundary: "sezóna 2027" };
  const firm = CS.SCORING.claimGaps("x", { ...base, claim: "FieldSense sníží spotřebu vody o 18 % na hektar." }, null, {});
  assert.ok(firm.some(g => g.kind === "wording"), "a firm Czech projection is flagged");
  const hedged = CS.SCORING.claimGaps("x", { ...base, claim: "Spotřeba vody na hektar by mohla do roku 2027 klesnout až o 18 %." }, null, {});
  assert.ok(!hedged.some(g => g.kind === "wording"), "a hedged Czech projection passes");
  // Czech 'by' must not excuse an English claim
  assert.ok(SCORING.claimGaps("x", { ...base, claim: "FieldSense will cut water use by 18% per hectare." }, null, {}).some(g => g.kind === "wording"));
});

test("the Czech report is Czech, and the save file stays language-independent", () => {
  const st = fieldsense();
  const md = CS.REPORT.toMarkdown(CS.REPORT.assemble(st));
  assert.match(md, /Akční plán/);
  assert.doesNotMatch(md, /undefined|\*\*Action plan\*\*/);
  const back = CS.REPORT.importState(CS.REPORT.exportState(st));
  assert.equal(back.stage, st.stage);
  assert.equal(JSON.stringify(Object.keys(back.selected_indicators)), JSON.stringify(Object.keys(st.selected_indicators)));
});

test("the Czech FieldSense sample has the same answers as the English one", () => {
  const en = JSON.parse(readFileSync(path.join(root, "docs/samples/FieldSense.json"), "utf8")).state;
  const cs = JSON.parse(readFileSync(path.join(root, "docs/samples/FieldSense.cs.json"), "utf8")).state;
  for (const k of ["stage", "mechanism", "orientation", "customer_types", "revenue_models", "value_drivers"]) assert.deepEqual(cs[k], en[k], k);
  assert.deepEqual(Object.keys(cs.selected_indicators), Object.keys(en.selected_indicators));
  for (const [k, u] of Object.entries(en.uncertainty)) assert.equal(cs.uncertainty[k].level, u.level, k);
});
