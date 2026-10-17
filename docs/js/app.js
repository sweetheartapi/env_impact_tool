/*
 * app.js: the five-step assessment wizard.
 *
 * Plain JavaScript, no build step. State lives in one object (S) that is
 * saved to localStorage on every change, so progress survives a reload.
 * Text fields update state and the "live" regions (sidebar, side cards,
 * warnings) in place; choices that change the form's structure (radios,
 * checkboxes, selects) re-render the step, keeping scroll position, focus
 * and open panels intact.
 */
(function () {
  "use strict";

  const STORE_KEY = "eia-tool-state-v1";
  const UI_KEY = "eia-tool-ui-v1";

  const DEFAULTS = () => ({
    step: 1,
    seen_welcome: false,
    startup_name: "",
    startup_desc: "",
    sector: "",
    stage: "Ideation",
    // customer profile: who buys, and why (SIC consultation, Oct 2026)
    customer_types: [],
    customer_profile: "",   // the buyer
    customer_user: "",
    behaviour_actor: "",
    revenue_models: [],
    value_drivers: [],
    customer_value: "",
    // null until the diagnostic questions are answered: the classification
    // is required input and must never be silently defaulted.
    mechanism: null,
    orientation: null,
    is_hybrid: false,
    secondary_mechanism: null,
    pathway: {},
    weakest_links: "",
    selected_indicators: {},
    custom_indicators: {},
    custom_kinds: {},     // custom indicator name -> what it measures
    uncertainty: {},
    assessment_version: 1,
    next_review_milestone: "",
    review_notes: "",
    alignment: {},        // impact-business alignment: key -> {status, note}
    plan: {},             // action plan: recommendation id -> {owner, due, done_evidence}
    demo: false,          // true while exploring the built-in FieldSense example (never exported)
    estimator: {},
  });

  const STEP_META = {
    1: [L("Profile & classify", "Profil a klasifikace"), L("Understand your startup", "Poznejte svůj startup")],
    2: [L("Impact pathway", "Cesta dopadu"), L("Map your impact", "Zmapujte svůj dopad")],
    3: [L("Select indicators", "Výběr indikátorů"), L("Choose what to measure", "Vyberte, co měřit")],
    4: [L("Claims & evidence", "Tvrzení a důkazy"), L("Check claims against evidence", "Porovnejte tvrzení s důkazy")],
    5: [L("Report & export", "Zpráva a export"), L("Review and export", "Revize a export")],
  };

  const BUCKET_STYLE = {
    [SCORING.BUCKET_CORE]: ["b-core", "#1E6A47"],
    [SCORING.BUCKET_ASPIRATIONAL]: ["b-asp", "#7C5296"],
    [SCORING.BUCKET_SUPPLEMENTARY]: ["b-sup", "#34608A"],
    [SCORING.BUCKET_OPTIONAL]: ["b-opt", "#A97B0F"],
    [SCORING.BUCKET_EXCLUDED]: ["b-exc", "#A23B3B"],
  };

  // ------------------------------------------------------------ storage --

  function readJSON(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }

  const isObj = v => v && typeof v === "object" && !Array.isArray(v);

  // Coerce loaded or imported data into a valid state. Save files can carry
  // values this build no longer offers; degrade to defaults rather than fail.
  function sanitize(raw) {
    const d = DEFAULTS();
    const s = Object.assign(d, isObj(raw) ? raw : {});
    ["startup_name", "startup_desc", "sector", "weakest_links", "next_review_milestone", "review_notes",
      "customer_profile", "customer_user", "behaviour_actor", "customer_value"]
      .forEach(k => { if (typeof s[k] !== "string") s[k] = s[k] == null ? "" : String(s[k]); });
    const pick = (v, allowed) => Array.isArray(v) ? allowed.map(([k]) => k).filter(k => v.includes(k)) : [];
    s.customer_types = pick(s.customer_types, REF.CUSTOMER_TYPES);
    s.value_drivers = pick(s.value_drivers, REF.VALUE_DRIVERS);
    s.revenue_models = pick(s.revenue_models, REF.REVENUE_MODELS);
    if (!REF.STAGES.includes(s.stage)) s.stage = "Ideation";
    if (!["Direct", "Enabling"].includes(s.mechanism)) s.mechanism = null;
    if (!["Primary", "Secondary"].includes(s.orientation)) s.orientation = null;
    s.is_hybrid = !!s.is_hybrid && !!s.mechanism;
    s.secondary_mechanism = s.is_hybrid ? (s.mechanism === "Direct" ? "Enabling" : "Direct") : null;
    ["pathway", "selected_indicators", "custom_indicators", "custom_kinds", "uncertainty", "estimator", "alignment", "plan"]
      .forEach(k => { if (!isObj(s[k])) s[k] = {}; });
    Object.keys(s.custom_indicators).forEach(k => {
      if (!Array.isArray(s.custom_indicators[k])) s.custom_indicators[k] = [];
    });
    Object.values(s.selected_indicators).forEach(e => {
      if (!SCORING.LEVELS.includes(e.feasibility)) e.feasibility = "Medium";
      if (!SCORING.LEVELS.includes(e.relevance)) e.relevance = "Medium";
      if (!REF.FREQUENCIES.includes(e.frequency || "")) e.frequency = "";
    });
    s.assessment_version = parseInt(s.assessment_version, 10) || 1;
    s.demo = !!s.demo;
    s.step = [1, 2, 3, 4, 5].includes(s.step) ? s.step : 1;
    return s;
  }

  let S = sanitize(readJSON(STORE_KEY));
  const UI = Object.assign({ tab3: "select", open: {} }, readJSON(UI_KEY) || {});
  let storageOk = true;

  function save() {
    storageOk = writeJSON(STORE_KEY, S);
    writeJSON(UI_KEY, UI);
  }

  // ------------------------------------------------------------ helpers --

  const h = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const $ = sel => document.querySelector(sel);

  // stable, attribute-safe id for a free-text key (indicator names etc.)
  function slug(str) {
    let hsh = 0;
    for (let i = 0; i < str.length; i++) hsh = (hsh * 31 + str.charCodeAt(i)) | 0;
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32) + "-" + (hsh >>> 0).toString(36);
  }

  const classified = () => ["Direct", "Enabling"].includes(S.mechanism) && ["Primary", "Secondary"].includes(S.orientation);
  const profileReady = () => !!S.startup_name.trim() && classified();
  const classification = () => REF.CLASSIFICATION_MATRIX[`${S.mechanism}|${S.orientation}`];

  function templateTracks() {
    const cls = classification();
    const tracks = REF.PATHWAY_TEMPLATES[cls.pathway_template].tracks.slice();
    if (S.is_hybrid && S.secondary_mechanism) {
      const sec = REF.PATHWAY_TEMPLATES[S.secondary_mechanism === "Direct" ? "lifecycle" : "adoption"].tracks[0];
      tracks.push({ track: `Secondary track (light-touch): ${sec.track}`, stages: sec.stages });
    }
    return tracks;
  }

  // Align the stored pathway with the template for the current
  // classification, keeping anything already written for matching stages.
  function ensurePathway() {
    if (!classified()) return;
    const out = {};
    templateTracks().forEach(t => {
      const existing = {};
      (S.pathway[t.track] || []).forEach(s => { existing[s.stage] = s; });
      out[t.track] = t.stages.map(([stage, , gate]) => {
        const e = existing[stage] || {};
        return {
          stage,
          description: e.description || "",
          assumption: e.assumption || "",
          evidence: REF.EVIDENCE.includes(e.evidence) ? e.evidence : "Not rated",
          // does this step depend on customers? default from the template
          change: REF.CUSTOMER_DEPENDENCE.some(([k]) => k === e.change) ? e.change : (gate || "none"),
        };
      });
    });
    S.pathway = out;
  }

  function stageHint(track, stage) {
    for (const t of templateTracks()) {
      if (t.track === track) {
        const f = t.stages.find(([s]) => s === stage);
        return f ? f[1] : "";
      }
    }
    return "";
  }

  function pathwayStageNames() {
    const names = [];
    Object.entries(S.pathway).forEach(([track, stages]) => stages.forEach(s => names.push(`${track} → ${s.stage}`)));
    return names;
  }

  function nameSlug() {
    return (S.startup_name.trim() || "assessment").replace(/\s+/g, "_").replace(/[\\/:*?"<>|]+/g, "") || "assessment";
  }

  // Progress based on content actually filled in, never on navigation.
  function stepStatus() {
    const out = {};
    const f1 = [!!S.startup_name, !!S.sector, !!S.startup_desc, S.customer_types.length > 0,
      S.revenue_models.length > 0, !!S.customer_profile.trim(), !!S.customer_user.trim(),
      !!S.behaviour_actor.trim(), S.value_drivers.length > 0, S.mechanism != null, S.orientation != null];
    out[1] = { pct: Math.round(100 * f1.filter(Boolean).length / f1.length), done: profileReady() };

    const stages = Object.values(S.pathway).flat();
    if (stages.length) {
      const described = stages.filter(s => s.description).length;
      const rated = stages.filter(s => s.evidence && s.evidence !== "Not rated").length;
      const pct = 55 * described / stages.length + 30 * rated / stages.length + (S.weakest_links ? 15 : 0);
      out[2] = { pct: Math.round(pct), done: described >= 1 };
    } else out[2] = { pct: 0, done: false };

    const sel = Object.values(S.selected_indicators);
    if (sel.length) {
      const detailed = sel.filter(e => e.data_source || e.unit || e.current_value).length;
      out[3] = { pct: Math.round(50 + 50 * detailed / sel.length), done: true };
    } else out[3] = { pct: 0, done: false };

    const unc = Object.values(S.uncertainty);
    const documented = unc.filter(u => (u.assumptions || "").trim() || (u.claim || "").trim() || (u.conditions || "").trim()).length;
    out[4] = { pct: unc.length ? Math.round(100 * documented / unc.length) : 0, done: documented >= 1 };

    out[5] = { pct: S.next_review_milestone ? 100 : 0, done: !!S.next_review_milestone };
    return out;
  }

  function overallPct(st) {
    const w = { 1: 25, 2: 25, 3: 20, 4: 20, 5: 10 };
    let total = 0;
    Object.entries(w).forEach(([i, wt]) => { total += st[i].pct * wt; });
    return Math.min(100, Math.round(total / 100));
  }

  // ------------------------------------------------------------ artwork --

  const LOGO_TILE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="tileBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF5EF"/><stop offset="1" stop-color="#E1EDE4"/></linearGradient><clipPath id="tileClip"><rect width="48" height="48" rx="12.5"/></clipPath></defs><g clip-path="url(#tileClip)"><rect width="48" height="48" fill="url(#tileBg)"/><circle cx="25.4" cy="16.2" r="8.6" fill="#F6E4C2"/><path d="M0 32.6 C 8 30.4, 15 33.6, 24 32 C 33 30.4, 41 33.2, 48 31.4 L48 48 L0 48 Z" fill="#D6E5D9"/><path d="M0 38.6 C 10 36.4, 20 39.6, 31 38 C 39 36.9, 44 38.6, 48 37.7 L48 48 L0 48 Z" fill="#BED5C3"/></g><path d="M7.6 39.4 C 15 37.6, 24 32.4, 30.4 25.6 C 34.6 21.2, 38.4 16.6, 41.6 13.2" stroke="#2E5D43" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M41.9 12.9 L34.3 14.6 M41.9 12.9 L40.2 20.5" stroke="#2E5D43" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.6" cy="39.4" r="2.4" fill="#2E5D43"/><circle cx="18.4" cy="34.1" r="2.4" fill="#2E5D43"/><circle cx="30.4" cy="25.6" r="2.4" fill="#2E5D43"/><path d="M18.4 32.2 C 17.3 27.2, 13.9 24.1, 10.7 25.2 C 11.3 29.2, 14.3 32.1, 18.4 32.2 Z" fill="#4E8C60"/><path d="M17.9 31.6 C 15.9 29.4, 13.4 27.2, 11.1 25.6" stroke="#D9EADD" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>`;

  const LOGO_BARE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="25.4" cy="16.2" r="8.6" fill="#F6E4C2"/><ellipse cx="20" cy="43.4" rx="15" ry="3.4" fill="#DCEAD7"/><path d="M7.6 39.4 C 15 37.6, 24 32.4, 30.4 25.6 C 34.6 21.2, 38.4 16.6, 41.6 13.2" stroke="#2E5D43" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M41.9 12.9 L34.3 14.6 M41.9 12.9 L40.2 20.5" stroke="#2E5D43" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.6" cy="39.4" r="2.4" fill="#2E5D43"/><circle cx="18.4" cy="34.1" r="2.4" fill="#2E5D43"/><circle cx="30.4" cy="25.6" r="2.4" fill="#2E5D43"/><path d="M18.4 32.2 C 17.3 27.2, 13.9 24.1, 10.7 25.2 C 11.3 29.2, 14.3 32.1, 18.4 32.2 Z" fill="#4E8C60"/></svg>`;

  const HERO_ART = `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="hfx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".12" stop-color="#fff"/><stop offset=".9" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><linearGradient id="hfy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="hmx"><rect width="320" height="160" fill="url(#hfx)"/></mask><mask id="hmy"><rect width="320" height="160" fill="url(#hfy)"/></mask></defs><circle cx="256" cy="58" r="38" fill="#F2E7CF"/><g mask="url(#hmx)"><g mask="url(#hmy)"><path d="M0 132 C 60 116, 130 134, 200 122 C 255 112, 295 126, 320 118 L 320 160 L 0 160 Z" fill="#DFEAE0"/><path d="M0 146 C 90 132, 210 150, 320 136 L 320 160 L 0 160 Z" fill="#CFE0D2"/><polygon points="73,148 75.4,88 78.6,88 81,148" fill="#2F5D40"/><g transform="translate(77,84)"><g class="eia-rotor" fill="#2F5D40"><path transform="rotate(15)" d="M0 0 C -3.2 -10, -3.2 -26, 0 -34 C 3.2 -26, 3.2 -10, 0 0 Z"/><path transform="rotate(135)" d="M0 0 C -3.2 -10, -3.2 -26, 0 -34 C 3.2 -26, 3.2 -10, 0 0 Z"/><path transform="rotate(255)" d="M0 0 C -3.2 -10, -3.2 -26, 0 -34 C 3.2 -26, 3.2 -10, 0 0 Z"/></g></g><circle cx="77" cy="84" r="4.5" fill="#2F5D40"/><circle cx="77" cy="84" r="1.8" fill="#A7C4AF"/><polygon points="124,146 125.4,106 126.6,106 128,146" fill="#8FB8A1"/><g transform="translate(126,104)"><g class="eia-rotor slow" fill="#8FB8A1"><path transform="rotate(60)" d="M0 0 C -2.2 -7, -2.2 -18, 0 -23 C 2.2 -18, 2.2 -7, 0 0 Z"/><path transform="rotate(180)" d="M0 0 C -2.2 -7, -2.2 -18, 0 -23 C 2.2 -18, 2.2 -7, 0 0 Z"/><path transform="rotate(300)" d="M0 0 C -2.2 -7, -2.2 -18, 0 -23 C 2.2 -18, 2.2 -7, 0 0 Z"/></g></g><circle cx="126" cy="104" r="3" fill="#8FB8A1"/><path d="M50 148 C 50 142, 50 138, 50 134" stroke="#2F5D40" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M50 138 C 47 131, 41 126, 34 127 C 35 133, 42 138, 50 138 Z" fill="#2F5D40"/><path d="M50 132 C 52 126, 57 122, 63 123 C 62 128, 56 132, 50 132 Z" fill="#2F5D40"/></g></g><path d="M138 146 C 172 140, 205 124, 243 96" stroke="#2F5D40" stroke-width="3.6" fill="none" stroke-linecap="round"/><polygon points="252,89 244.2,103.3 243.7,95.4 236.2,93.1" fill="#2F5D40"/><circle cx="170" cy="135" r="4.5" fill="#7FA98C"/><circle cx="208" cy="122" r="4.5" fill="#7FA98C"/><path d="M190 128 C 187 119, 179 112, 169 112 C 170 121, 178 128, 190 128 Z" fill="#2F5D40"/><path d="M233 100 C 230 92, 223 86, 214 86 C 215 94, 222 100, 233 100 Z" fill="#2F5D40"/><g stroke="#8FB8A1" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M34 36 q 9 -6 18 -2 M38 46 q 8 -5 16 -1"/><path d="M290 34 q 9 -6 18 -2 M294 44 q 8 -5 16 -1"/></g></svg>`;

  // --------------------------------------------------------- components --

  function hero(step, title, subtitle, art = true) {
    return `<div class="hero"><div class="txt"><div class="step">${L(`Step ${step} of 5`, `Krok ${step} z 5`)}</div><h1>${h(title)}</h1><p>${h(subtitle)}</p></div>${art ? `<div class="art">${HERO_ART}</div>` : ""}</div>`;
  }
  const card = (title, body, icon = "", quiet = false) =>
    `<div class="card${quiet ? " quiet" : ""}"><h4>${icon ? `<span aria-hidden="true">${icon}</span>` : ""}${h(title)}</h4>${body}</div>`;
  const kv = pairs => pairs.map(([k, v]) => `<div class="kv"><span>${k}</span><b>${h(v)}</b></div>`).join("");
  const tip = (text, title = L("Tip for best results", "Tip pro nejlepší výsledek")) =>
    `<div class="tip"><span aria-hidden="true">💡</span><div><b>${h(title)}</b>${h(text)}</div></div>`;
  const ALERT_ICON = { warning: "!", info: "i", ok: "✓", error: "×" };
  const alert = (sev, html) => `<div class="alert ${sev}" role="${sev === "warning" || sev === "error" ? "alert" : "note"}"><span class="ic" aria-hidden="true">${ALERT_ICON[sev]}</span><div>${html}</div></div>`;
  const bucketTag = b => `<span class="bucket-tag ${BUCKET_STYLE[b][0]}">→ ${h(tr(b))}</span>`;

  function selectHTML(id, attrs, options, value, placeholder) {
    let o = placeholder ? `<option value=""${value ? "" : " selected"} disabled>${h(placeholder)}</option>` : "";
    o += options.map(opt => {
      // plain-string options are stored values: show their display form
      const [val, label] = Array.isArray(opt) ? opt : [opt, opt === "" ? L("(not set)", "(nenastaveno)") : tr(opt)];
      return `<option value="${h(val)}"${val === value ? " selected" : ""}>${h(label)}</option>`;
    }).join("");
    return `<select id="${id}" ${attrs}>${o}</select>`;
  }

  function expander(id, summary, body, defaultOpen) {
    const open = id in UI.open ? UI.open[id] : defaultOpen;
    return `<details class="exp" id="${id}"${open ? " open" : ""}><summary>${summary}</summary><div class="body">${body}</div></details>`;
  }

  const navButtons = (back, next) => `<div class="btn-row">${back ? `<button class="btn" data-goto="${back}">${L("← Back", "← Zpět")}</button>` : "<span></span>"}${next ? `<button class="btn primary" data-goto="${next}">${L("Save &amp; continue →", "Uložit a pokračovat →")}</button>` : ""}</div>`;

  // Registered per render: functions producing the HTML of regions that
  // refresh on every keystroke without re-rendering the form.
  let LIVE = {};
  const live = (name, fn) => { LIVE[name] = fn; return `<div data-live="${name}">${fn()}</div>`; };

  // ============================================================ sidebar ==

  function renderSidebar() {
    const st = stepStatus();
    const pct = overallPct(st);
    const nav = [1, 2, 3, 4, 5].map(i => {
      const s = st[i];
      return `<li class="${s.done ? "done" : ""}"><button data-goto="${i}"${S.step === i ? ' aria-current="step"' : ""}>` +
        `<span class="num">${s.done ? "✓" : i}</span><span class="label">${h(STEP_META[i][0])}</span>` +
        `<span class="pct" aria-label="${L(`${s.pct} percent complete`, `vyplněno ${s.pct} %`)}">${s.pct}%</span></button></li>`;
    }).join("");

    const exportBody = profileReady()
      ? `<button class="btn primary block small" data-action="docx">${L("📄 Word report (.docx)", "📄 Zpráva ve Wordu (.docx)")}</button>
         <button class="btn block small" data-action="json">${L("💾 Save progress (.json)", "💾 Uložit postup (.json)")}</button>
         <p>${L(`<b style="font-size:.78rem">The JSON file is your save file.</b> Load it later to continue. The Word report is the finished document to share.`,
           `<b style="font-size:.78rem">Soubor JSON je váš uložený postup.</b> Později ho nahrajete a budete pokračovat. Zpráva ve Wordu je hotový dokument ke sdílení.`)}</p>`
      : `<p>${L("Complete step 1 (name + the two diagnostic questions) to unlock export.", "Pro export dokončete krok 1 (název a obě diagnostické otázky).")}</p>`;

    $("#sidebar").innerHTML = `
      <div class="brand" data-action="intro" title="${L("Introduction & guide", "Úvod a průvodce")}"><div class="logo">${LOGO_TILE}</div>
        <div><div class="word">EIA</div><div class="sub">${L("Startup Environmental<br>Impact Assessment", "Hodnocení environmentálního<br>dopadu startupů")}</div></div></div>
      ${langSwitch("side-lang")}
      ${S.demo ? `<div class="demo-note"><b>${L("Example: FieldSense", "Ukázka: FieldSense")}</b>${L("A fictional startup with a complete assessment. Changes stay in this browser.", "Smyšlený startup s kompletním hodnocením. Změny zůstávají jen v tomto prohlížeči.")}<button class="btn small block" data-action="restart">${L("Start your own assessment", "Začít vlastní hodnocení")}</button></div>` : ""}
      <div class="eyebrow">${L("Workflow", "Postup")}</div>
      <ol class="nav">${nav}</ol>
      <div class="sidecard"><div class="progress-head"><b>${L("Form completion", "Vyplnění formuláře")}</b><span>${pct}%</span></div>
        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${L("Form completion", "Vyplnění formuláře")}"><div class="progress-fill" style="width:${pct}%"></div></div>
        <p style="margin:.45rem 0 0;font-size:.74rem">${L("How much of the form is filled in, not how strong the evidence is. Evidence readiness is in step 5.", "Kolik formuláře je vyplněno, ne jak silné jsou důkazy. Připravenost důkazů najdete v kroku 5.")}</p></div>
      <div class="saved-note">${storageOk ? `<span class="dot"></span>${L("Progress saved in this browser", "Postup se ukládá v tomto prohlížeči")}` : L("⚠ This browser is not saving progress. Download the JSON save file.", "⚠ Tento prohlížeč postup neukládá. Stáhněte si soubor JSON.")}</div>
      <div class="eyebrow">${L("Export", "Export")}</div>
      <div class="sidecard" style="margin-top:0">${exportBody}</div>
      <div class="eyebrow">${L("Save &amp; resume", "Uložení a pokračování")}</div>
      <div class="sidecard" style="margin-top:0"><p style="margin-top:0">${L("Load a JSON save file to resume an assessment. Each load starts a new review cycle.", "Nahrajte soubor JSON a pokračujte v hodnocení. Každé nahrání zahájí nový revizní cyklus.")}</p>
        <button class="btn block small" data-action="import">${L("⬆️ Load save file (.json)", "⬆️ Nahrát uložený soubor (.json)")}</button></div>
      <div class="side-links">
        <button class="btn small block" data-action="intro">${L("📖 Introduction &amp; guide", "📖 Úvod a průvodce")}</button>
        <button class="btn small block" data-action="restart">${L("↺ Start a new assessment", "↺ Začít nové hodnocení")}</button>
      </div>
      <div class="footer-note">v3.3 · ${L("Review cycle", "Revizní cyklus")} v${S.assessment_version}</div>`;
    const pill = $("#topbar-step");
    if (pill) pill.textContent = `${L(`Step ${S.step} of 5`, `Krok ${S.step} z 5`)} · ${STEP_META[S.step][0]}`;
  }

  // ============================================================= step 1 ==

  function step1() {
    const mechOpts = REF.DIAGNOSTIC_MECHANISM.options;
    const oriOpts = REF.DIAGNOSTIC_ORIENTATION.options;
    const radios = (name, f, opts, cur) => opts.map(([label, val], i) =>
      `<label class="choice" for="${name}-${i}"><input type="radio" id="${name}-${i}" name="${name}" value="${val}" data-f="${f}"${cur === val ? " checked" : ""}><span>${h(label)}</span></label>`).join("");

    const hybrid = S.mechanism ? `
      <label class="check hybrid" for="hybrid"><input type="checkbox" id="hybrid" data-f="hybrid"${S.is_hybrid ? " checked" : ""}>
        <span>${L("<b>Hybrid:</b> a meaningful share of the impact also arises through the <i>other</i> mechanism", "<b>Hybridní:</b> významná část dopadu vzniká i <i>druhým</i> mechanismem")}
        <span class="caption" style="display:block">${L("e.g. an enabling startup with a measurable direct footprint, or hardware with both direct and enabling effects. The secondary track gets lighter-touch screening.", "např. umožňující startup s měřitelnou přímou stopou nebo hardware s přímými i umožňujícími účinky. Sekundární linie se posuzuje zjednodušeně.")}</span>
        ${S.is_hybrid ? `<span class="caption" style="display:block">${L("Primary track", "Primární linie")}: <b>${tr(S.mechanism)}</b> · ${L("Secondary track (light-touch)", "Sekundární linie (zjednodušeně)")}: <b>${tr(S.secondary_mechanism)}</b></span>` : ""}</span></label>` : "";

    return hero(1, L("Profile & classify your startup", "Profil a klasifikace startupu"),
      L("Tell us about your startup and answer two diagnostic questions. This classifies your impact pathway and tailors the whole assessment.",
        "Popište svůj startup a odpovězte na dvě diagnostické otázky. Tím se určí typ vaší cesty dopadu a celé hodnocení se mu přizpůsobí.")) +
      `<div class="cols"><div>
        <div class="panel"><h2>${L("About your startup", "O vašem startupu")}</h2>
          <div class="grid2" style="margin:.8rem 0 .9rem">
            <div class="field"><label for="startup_name">${L("Startup name", "Název startupu")} <span aria-hidden="true" style="color:var(--red)">*</span></label>
              <input type="text" id="startup_name" data-f="startup_name" value="${h(S.startup_name)}" placeholder="${L("e.g., GreenPack Solutions", "např. GreenPack Solutions")}" autocomplete="organization" required></div>
            <div class="field"><label for="stage">${L("Development stage", "Fáze vývoje")}</label>
              ${selectHTML("stage", 'data-f="stage"', REF.STAGES, S.stage)}
              ${live("stage-short", () => `<span class="hint">${h(REF.STAGE_SHORT[S.stage])}</span>`)}</div>
            <div class="field"><label for="sector">${L("Sector / domain", "Odvětví / obor")}</label>
              <input type="text" id="sector" data-f="sector" value="${h(S.sector)}" placeholder="${L("e.g., AgTech, packaging, SaaS", "např. AgTech, obaly, SaaS")}"></div>
          </div>
          <div class="field" style="margin-bottom:0"><label for="startup_desc">${L("Short description", "Krátký popis")}</label>
            <textarea id="startup_desc" data-f="startup_desc" rows="3" placeholder="${L("What does your startup do? (1–3 sentences)", "Co váš startup dělá? (1–3 věty)")}">${h(S.startup_desc)}</textarea></div>
        </div>
        ${customerPanel()}
        <div class="panel"><h2>${L("Diagnostic classification", "Diagnostická klasifikace")}</h2>
          <p class="lead">${L(`<b style="color:var(--ink)">Both questions are required.</b> Your answers classify your impact mechanism and drive the whole assessment. <i>Why this matters:</i> a clear classification now makes your indicators, data, and claims more credible and defensible later.`,
            `<b style="color:var(--ink)">Obě otázky jsou povinné.</b> Vaše odpovědi určí mechanismus dopadu a řídí celé hodnocení. <i>Proč na tom záleží:</i> jasná klasifikace teď později udělá vaše indikátory, data i tvrzení věrohodnějšími a obhajitelnějšími.`)}</p>
          <fieldset class="question"><legend>${h(REF.DIAGNOSTIC_MECHANISM.question)}</legend><div class="opts">${radios("mech", "mechanism", mechOpts, S.mechanism)}</div></fieldset>
          ${hybrid}
          <fieldset class="question" style="margin-bottom:0"><legend>${h(REF.DIAGNOSTIC_ORIENTATION.question)}</legend><div class="opts">${radios("ori", "orientation", oriOpts, S.orientation)}</div>
            <details class="examples"><summary>${L("Examples, and what if both are true?", "Příklady, a co když platí obojí?")}</summary>
              <div class="ex-grid"><div><b>${L("Environment is the value proposition", "Životní prostředí je hodnotovou nabídkou")}</b><ul>${REF.ORIENTATION_EXAMPLES.primary.map(x => `<li>${h(x)}</li>`).join("")}</ul></div>
                <div><b>${L("Primarily commercial, environment secondary", "Primárně komerční, životní prostředí vedlejší")}</b><ul>${REF.ORIENTATION_EXAMPLES.secondary.map(x => `<li>${h(x)}</li>`).join("")}</ul></div></div>
              <p>${h(REF.ORIENTATION_EXAMPLES.both)}</p></details></fieldset>
        </div>
        ${live("continue", () => {
          const missing = [];
          if (!S.startup_name.trim()) missing.push(L("enter a startup name", "vyplňte název startupu"));
          if (!classified()) missing.push(L("answer both diagnostic questions", "odpovězte na obě diagnostické otázky"));
          return `<button class="btn primary block" data-goto="2"${missing.length ? " disabled" : ""}>${L("Save &amp; continue →", "Uložit a pokračovat →")}</button>` +
            (missing.length ? `<p class="required-note">${L("To continue", "Pro pokračování")}: ${missing.join(L(" and ", " a "))}.</p>` : "");
        })}
      </div>
      <aside class="aside">${live("aside", () =>
        card(L("Key terms", "Klíčové pojmy"), L(`<ul class="terms">
          <li><b>Impact mechanism</b>: how the environmental benefit comes about. <i>Direct</i>: your product or service delivers it by itself. <i>Enabling</i>: it only happens when customers adopt your solution and change what they do.</li>
          <li><b>Value orientation</b>. <i>Primary</i>: environmental improvement is the point of your offering. <i>Secondary</i>: your offering is commercial, and the environmental effect is a by-product.</li>
          <li><b>Impact pathway</b>: the step-by-step cause-and-effect chain from what you do to the environmental impact you claim (mapped in step 2).</li>
          <li><b>Hybrid</b>: a meaningful share of the impact arises through both mechanisms; the secondary one gets a lighter check.</li></ul>`,
          `<ul class="terms">
          <li><b>Mechanismus dopadu</b>: jak environmentální přínos vzniká. <i>Přímý</i>: váš produkt nebo služba ho přináší sám. <i>Umožňující</i>: vznikne jen tehdy, když zákazníci vaše řešení přijmou a změní, co dělají.</li>
          <li><b>Hodnotová orientace</b>. <i>Primární</i>: environmentální zlepšení je smyslem vaší nabídky. <i>Sekundární</i>: vaše nabídka je komerční a environmentální efekt je vedlejší produkt.</li>
          <li><b>Cesta dopadu</b>: příčinný řetězec krok za krokem od toho, co děláte, k environmentálnímu dopadu, který deklarujete (mapuje se v kroku 2).</li>
          <li><b>Hybridní</b>: významná část dopadu vzniká oběma mechanismy; ten sekundární se posuzuje zjednodušeně.</li></ul>`), "", true))}
      </aside></div>`;
  }

  // The customer panel: who buys, who they are, and why they buy.
  // An impact claim only matters if someone buys and uses the product, and
  // the next steps in the report depend on who that is.
  function customerPanel() {
    const boxes = (list, f, cur, idp) => list.map(([k, label], i) =>
      `<label class="choice" for="${idp}-${i}"><input type="checkbox" id="${idp}-${i}" data-f="${f}" value="${k}"${cur.includes(k) ? " checked" : ""}><span>${h(label)}</span></label>`).join("");
    const mixed = S.customer_types.length > 1
      ? `<p class="caption" style="margin:.5rem 0 0">${L("Mixed model", "Kombinovaný model")}: <b>${h(S.customer_types.join(" + "))}</b>. ${L("The report will ask which segment you prove the impact with first.", "Zpráva se zeptá, na kterém segmentu dopad prokážete nejdřív.")}</p>` : "";
    const directOnly = S.mechanism === "Direct" && !S.is_hybrid;
    const actorHint = directOnly
      ? L("If the benefit happens without anyone changing what they do, write “nobody”. That is normal for direct-impact products.", "Pokud přínos vzniká, aniž by kdokoli měnil, co dělá, napište „nikdo“. U produktů s přímým dopadem je to běžné.")
      : S.mechanism === "Enabling"
        ? L("Important for your type of startup: the impact only happens if these people change what they do. Your evidence has to cover them.", "Pro váš typ startupu důležité: dopad vznikne jen tehdy, když tito lidé změní, co dělají. Vaše důkazy se musí týkat právě jich.")
        : L("If the benefit only happens when someone changes what they do, who is it? Write “nobody” if no change is needed.", "Pokud přínos vznikne jen tehdy, když někdo změní, co dělá, kdo to je? Pokud žádná změna potřeba není, napište „nikdo“.");
    const ALL = `<span class="hint">${L("(select all that apply)", "(vyberte vše, co platí)")}</span>`;
    return `<div class="panel"><h2>${L("Your customer", "Váš zákazník")}</h2>
      <p class="lead">${L("Who buys your product or service, how you earn money, and who has to use it for the environmental benefit to happen. The recommended next steps in your report depend on these answers.",
        "Kdo kupuje váš produkt nebo službu, jak vyděláváte a kdo ho musí používat, aby environmentální přínos vznikl. Na těchto odpovědích závisí doporučené další kroky ve vaší zprávě.")}</p>
      <fieldset class="question"><legend>${L("Customer segment: who are your customers?", "Zákaznický segment: kdo jsou vaši zákazníci?")} ${ALL}</legend><div class="opts inline">${boxes(REF.CUSTOMER_TYPES, "ctype", S.customer_types, "ctype")}</div>${mixed}</fieldset>
      <fieldset class="question"><legend>${L("Revenue model: how do you earn money from them?", "Model příjmů: jak na nich vyděláváte?")} ${ALL}</legend><div class="opts two">${boxes(REF.REVENUE_MODELS, "revenue", S.revenue_models, "rev")}</div></fieldset>
      <h3 class="sub-h">${L("Buyer, user and who has to change behaviour", "Kupující, uživatel a kdo musí změnit chování")}</h3>
      <p class="caption" style="margin:0 0 .8rem">${L("These are often different people. A municipality may buy route-planning software, but only if its employees use it every day does any fuel get saved. Write “same as buyer” where a role is the same.",
        "Často jde o různé lidi. Obec může koupit software pro plánování tras, ale palivo se ušetří jen tehdy, když ho její zaměstnanci používají každý den. Kde je role stejná, napište „stejně jako kupující“.")}</p>
      <div class="field"><label for="customer_profile">${L("Buyer: who decides and pays?", "Kupující: kdo rozhoduje a platí?")}</label>
        <textarea id="customer_profile" data-f="customer_profile" rows="2" placeholder="${L("e.g. Owners of mid-size vegetable farms (50–500 ha) in dry regions", "např. majitelé středně velkých zelinářských farem (50–500 ha) v suchých oblastech")}">${h(S.customer_profile)}</textarea></div>
      <div class="field"><label for="customer_user">${L("User: who uses it day to day?", "Uživatel: kdo to používá každý den?")}</label>
        <textarea id="customer_user" data-f="customer_user" rows="2" placeholder="${L("e.g. Farm managers and irrigation staff", "např. vedoucí farem a pracovníci zavlažování")}">${h(S.customer_user)}</textarea></div>
      <div class="field"><label for="behaviour_actor">${L("Whose behaviour must change for the environmental benefit to happen?", "Kdo musí změnit chování, aby environmentální přínos vznikl?")}</label>
        <textarea id="behaviour_actor" data-f="behaviour_actor" rows="2" placeholder="${L("e.g. Whoever decides when and how much to irrigate", "např. ten, kdo rozhoduje, kdy a kolik zavlažovat")}">${h(S.behaviour_actor)}</textarea>
        <span class="hint">${h(actorHint)}</span></div>
      <fieldset class="question"><legend>${L("What makes customers want to buy your product or service?", "Proč zákazníci chtějí váš produkt nebo službu koupit?")} ${ALL}</legend><div class="opts">${boxes(REF.VALUE_DRIVERS, "vdriver", S.value_drivers, "vdrv")}</div></fieldset>
      <div class="field" style="margin-bottom:0"><label for="customer_value">${L("In one sentence: what does the customer get, and how is it linked to the environmental benefit?", "Jednou větou: co zákazník získá a jak to souvisí s environmentálním přínosem?")} <span class="hint">${L("(optional)", "(nepovinné)")}</span></label>
        <input type="text" id="customer_value" data-f="customer_value" value="${h(S.customer_value)}" placeholder="${L("e.g. Lower water bills: every m³ the farm saves is also money saved.", "např. Nižší účty za vodu: každý ušetřený m³ jsou i ušetřené peníze.")}"></div>
    </div>`;
  }

  // Steps 2-5 depend on the name and the classification.
  function gate() {
    const missing = [];
    if (!S.startup_name.trim()) missing.push(L("the startup name", "název startupu"));
    if (!classified()) missing.push(L("the two diagnostic questions", "obě diagnostické otázky"));
    return `<div style="max-width:44rem;margin-top:2rem">` + alert("warning",
      L(`<b>Complete step 1 first.</b> Still missing: ${missing.join(" and ")}. The classification determines which pathway template, indicators, and guidance apply to your startup, so the assessment cannot continue without it.`,
        `<b>Nejdřív dokončete krok 1.</b> Ještě chybí: ${missing.join(" a ")}. Klasifikace určuje, která šablona cesty dopadu, indikátory a doporučení se na váš startup vztahují, takže bez ní hodnocení nemůže pokračovat.`)) +
      `<button class="btn primary" data-goto="1">${L("← Go to step 1 (Profile &amp; classify)", "← Přejít na krok 1 (Profil a klasifikace)")}</button></div>`;
  }

  // ============================================================= step 2 ==

  // The pathway diagram with a plain-language reading of the customer side.
  function diagramHTML() {
    const actor = S.behaviour_actor.trim();
    let out = "";
    Object.entries(S.pathway).forEach(([track, stages]) => {
      const d = PATHWAY_DIAGRAM.svg(track, stages, { actor });
      if (Object.keys(S.pathway).length > 1) out += `<p class="diagram-track">${h(tr(track))}</p>`;
      out += `<div class="diagram-wrap">${d.svg}</div>`;
    });
    const flat = Object.values(S.pathway).flat();
    const cust = flat.filter(s => s.change && s.change !== "none");
    const solid = cust.filter(s => /^(Moderate|Strong)/.test(s.evidence || ""));
    if (!cust.length) {
      out += alert("info", L("No step is marked as depending on customers. If your impact needs anyone to buy, adopt or use the product differently, mark that step below. Most impact pathways have at least one.",
        "Žádný krok není označen jako závislý na zákaznících. Pokud váš dopad potřebuje, aby někdo produkt koupil, přijal nebo používal jinak, označte tento krok níže. Většina cest dopadu má alespoň jeden takový krok."));
    } else if (!solid.length) {
      out += alert("warning", L(`<b>${cust.length} of ${flat.length} steps depend on customers, and none has solid evidence yet:</b> `, `<b>Na zákaznících závisí ${cust.length} z ${flat.length} kroků a žádný zatím nemá pevné důkazy:</b> `) +
        `${h(cust.map(s => tr(s.stage)).join("; "))}. ` +
        L("Your technology can work exactly as designed and still produce no impact if these steps fail. A good technological solution is not yet a viable product.",
          "Vaše technologie může fungovat přesně podle návrhu a přesto nemít žádný dopad, pokud tyto kroky selžou. Dobré technologické řešení ještě není životaschopný produkt."));
    } else {
      out += alert("ok", L(`<b>${cust.length} of ${flat.length} steps depend on customers;</b> ${solid.length} of them ${solid.length === 1 ? "has" : "have"} at least moderate evidence.`,
        `<b>Na zákaznících závisí ${cust.length} z ${flat.length} kroků;</b> alespoň střední důkazy má ${solid.length} z nich.`));
    }
    return out;
  }

  function step2() {
    ensurePathway();
    const cls = classification();
    const template = REF.PATHWAY_TEMPLATES[cls.pathway_template];
    let tracks = "";
    Object.entries(S.pathway).forEach(([track, stages], ti) => {
      tracks += `<h2 class="track-title">${h(tr(track))}</h2>`;
      stages.forEach((s, i) => {
        const id = `pw-${ti}-${i}`;
        const attrs = k => `data-f="pw" data-track="${h(track)}" data-i="${i}" data-k="${k}"`;
        const dep = s.change && s.change !== "none";
        tracks += `<div class="panel stage-card${dep ? " customer-step" : ""}"><p class="stage-name">${h(tr(s.stage))}${dep ? ` <span class="dep-badge">${h(REF.DEPENDENCE_SHORT[s.change])}</span>` : ""}</p><p class="caption">${h(stageHint(track, s.stage))}</p>
          <div class="field"><label for="${id}-d">${L("Description", "Popis")}</label><textarea id="${id}-d" rows="2" ${attrs("description")}>${h(s.description)}</textarea></div>
          <div class="grid-3-2">
            <div class="field"><label for="${id}-a">${L("Assumption linking this step to the next", "Předpoklad, který tento krok propojuje s dalším")}</label><input type="text" id="${id}-a" ${attrs("assumption")} value="${h(s.assumption)}"></div>
            <div class="field"><label for="${id}-e">${L("Evidence strength", "Síla důkazů")}</label>${selectHTML(`${id}-e`, attrs("evidence"), REF.EVIDENCE, s.evidence)}</div>
          </div>
          <div class="field" style="margin:0"><label for="${id}-c">${L("Does this step depend on customers?", "Závisí tento krok na zákaznících?")}</label>${selectHTML(`${id}-c`, attrs("change"), REF.CUSTOMER_DEPENDENCE, s.change)}
            ${dep && S.behaviour_actor.trim() ? `<span class="hint">${L("From step 1, whose behaviour must change", "Z kroku 1, kdo musí změnit chování")}: ${h(S.behaviour_actor.trim())}</span>` : ""}</div></div>`;
      });
    });

    return hero(2, L("Map your impact pathway", "Zmapujte cestu dopadu"),
      L("Trace the causal chain from what you do to the environmental impact you claim, and state the assumption behind every link. This is what makes impact claims honest.",
        "Projděte příčinný řetězec od toho, co děláte, k environmentálnímu dopadu, který deklarujete, a u každé vazby uveďte předpoklad. Právě to dělá tvrzení o dopadu poctivými.")) +
      `<div class="template-note"><b>${L("Template applied", "Použitá šablona")} (${h(cls.label)}):</b> ${h(template.name)}<p>${h(template.description)}</p></div>
      ${expander("pw-diagram", L("🗺️ Your pathway as a cause-and-effect diagram", "🗺️ Vaše cesta dopadu jako diagram příčin a následků"), live("diagram", diagramHTML), true)}
      <div class="cols"><div>
        ${tracks}
        ${live("weak", () => {
          const weak = [];
          Object.entries(S.pathway).forEach(([t, st]) => st.forEach(s => { if (s.evidence === "Weak (assumption only)") weak.push(tr(`${t} → ${s.stage}`)); }));
          return weak.length ? alert("warning", L(`<b>Weakest links (assumption only):</b> ${h(weak.join("; "))}. These are the points where contribution analysis and future measurement are most needed.`,
            `<b>Nejslabší články (jen předpoklad):</b> ${h(weak.join("; "))}. Právě tady je nejvíc potřeba analýza příspěvku a budoucí měření.`)) : "";
        })}
        <div class="panel"><div class="field" style="margin:0"><label for="weakest_links">${L("Summarize the weakest link(s) and why they are uncertain", "Shrňte nejslabší článek (články) a proč jsou nejisté")}</label>
          <textarea id="weakest_links" data-f="weakest_links" rows="3" placeholder="${L("e.g. The assumption that farmers follow dosing recommendations is the weakest link: adoption ≠ behavior change.", "např. Nejslabším článkem je předpoklad, že se farmáři řídí doporučeným dávkováním: přijetí ≠ změna chování.")}">${h(S.weakest_links)}</textarea></div></div>
        ${navButtons(1, 3)}
      </div>
      <aside class="aside">${live("aside", () => {
        const flat = Object.values(S.pathway).flat();
        return card(L("Pathway at a glance", "Cesta dopadu v kostce"), kv([
          [L("Tracks", "Linie"), String(Object.keys(S.pathway).length)],
          [L("Stages described", "Popsané kroky"), `${flat.filter(s => s.description).length} / ${flat.length}`],
          [L("Weak links flagged", "Označené slabé články"), String(flat.filter(s => s.evidence === "Weak (assumption only)").length)],
          [L("Steps that depend on customers", "Kroky závislé na zákaznících"), String(flat.filter(s => s.change && s.change !== "none").length)],
        ]), "🗺️") + card(L("Why this matters", "Proč na tom záleží"), L("<p>Every stage carries an assumption. Naming the weak ones now is not a weakness. It tells you exactly where measurement is most needed.</p>",
          "<p>Každý krok stojí na nějakém předpokladu. Pojmenovat ty slabé už teď není slabost. Přesně vám to ukáže, kde je měření nejvíc potřeba.</p>"), "❝", true);
      })}</aside></div>` +
      tip(L("A weak link is a finding, not a failure. Mentors, customers and investors trust an honest chain more than a perfect story.",
        "Slabý článek je zjištění, ne selhání. Mentoři, zákazníci i investoři věří poctivému řetězci víc než dokonalému příběhu."));
  }

  // ============================================================= step 3 ==

  function step3() {
    const tabs = [["select", L("① Select & score", "① Výběr a hodnocení")], ["detail", L("② Indicator details", "② Podrobnosti indikátorů")], ["matrix", L("③ Scoring matrix", "③ Hodnoticí matice")], ["calc", L("④ Quick Scope 1+2 estimator", "④ Rychlý odhad Scope 1+2")]];
    if (!tabs.some(([k]) => k === UI.tab3)) UI.tab3 = "select";
    const tabBar = `<div class="tabs" role="tablist">${tabs.map(([k, l]) =>
      `<button role="tab" id="tab-${k}" aria-selected="${UI.tab3 === k}" data-action="tab3" data-tab="${k}">${l}</button>`).join("")}</div>`;
    const body = { select: tabSelect, detail: tabDetail, matrix: tabMatrix, calc: tabCalc }[UI.tab3]();

    return hero(3, L("Select your indicators", "Vyberte indikátory"),
      L("Score each candidate on relevance (is it material to your pathway?) and feasibility (can you populate it with data you hold?). Aim for a core set of 3–5.",
        "Ohodnoťte každého kandidáta podle relevance (je podstatný pro vaši cestu dopadu?) a proveditelnosti (dokážete ho naplnit daty, která máte?). Cílem je klíčová sada 3–5 indikátorů.")) +
      `<div class="cols"><div>${tabBar}<div role="tabpanel" aria-labelledby="tab-${UI.tab3}">${body}</div>${navButtons(2, 4)}</div>
      <aside class="aside">${live("aside", () => {
        const b = SCORING.groupByBucket(S.selected_indicators);
        return card(L("Indicator set", "Sada indikátorů"), kv([
          [L("Selected", "Vybráno"), String(Object.keys(S.selected_indicators).length)],
          [L("Core set", "Klíčová sada"), `${b[SCORING.BUCKET_CORE].length} ${L("(aim for 3–5)", "(cíl 3–5)")}`],
          [L("Core showing real impact", "Klíčové se skutečným dopadem"), String(b[SCORING.BUCKET_CORE].filter(([n, e]) => (REF.INDICATOR_KINDS[REF.indicatorKind(n, e)] || {}).real).length)],
          [L("Aspirational", "Aspirační"), String(b[SCORING.BUCKET_ASPIRATIONAL].length)],
          [L("Excluded", "Vyřazené"), String(b[SCORING.BUCKET_EXCLUDED].length)],
        ]), "🎯") + card(L("Why this matters", "Proč na tom záleží"), L("<p>Metrics that are easy to report but not material are how greenwashing happens by accident. The scoring excludes them by design.</p>",
          "<p>Metriky, které se snadno vykazují, ale nejsou podstatné, jsou cestou k nechtěnému greenwashingu. Hodnocení je proto záměrně vyřazuje.</p>"), "❝", true);
      })}</aside></div>` +
      tip(L("Fewer, well-evidenced indicators beat a long list. Link each core indicator to the pathway stage it proves.",
        "Méně dobře doložených indikátorů je lepší než dlouhý seznam. Každý klíčový indikátor propojte s krokem cesty dopadu, který dokládá."));
  }

  const kindTag = k => {
    const kd = REF.INDICATOR_KINDS[k];
    if (!kd) return `<span class="kind-tag k-none">${L("Kind not set", "Druh nenastaven")}</span>`;
    return `<span class="kind-tag k-${k}${kd.real ? " real" : ""}" title="${h(kd.help)}">${kd.real ? "★ " : ""}${h(kd.short)}</span>`;
  };

  const inBank = name => Object.values(REF.INDICATOR_BANK).some(rows => rows.some(r => r[0] === name));

  function tabSelect() {
    let out = `<div class="kind-legend">` + L(`<b>Prefer indicators that show real impact.</b> A working technology is not yet impact: what counts is whether customers use it and something changes as a result. ` +
      `Indicators marked <span class="kind-tag k-outcome real">★ Real-world outcome</span> or <span class="kind-tag k-adoption real">★ Adoption &amp; use</span> show that; ` +
      `<span class="kind-tag k-technology">Technology only</span> ones show what the product can do. Example: irrigation water saved per participating farm says more than the number of sensors manufactured.`,
      `<b>Upřednostněte indikátory, které ukazují skutečný dopad.</b> Fungující technologie ještě není dopad: rozhoduje, zda ji zákazníci používají a zda se díky tomu něco změní. ` +
      `To ukazují indikátory označené <span class="kind-tag k-outcome real">★ Skutečný výsledek</span> nebo <span class="kind-tag k-adoption real">★ Přijetí a používání</span>; ` +
      `indikátory <span class="kind-tag k-technology">Jen technologie</span> ukazují, co produkt umí. Příklad: ušetřená voda na zavlažování na zapojenou farmu řekne víc než počet vyrobených senzorů.`) + `</div>`;
    Object.entries(REF.INDICATOR_BANK).forEach(([category, indicators]) => {
      const custom = S.custom_indicators[category] || [];
      const rows = indicators.map(r => ({ name: r[0], source: r[1], unit: r[2], citation: r[3], kind: r[4], custom: false }))
        .concat(custom.map(n => ({ name: n, source: "Custom indicator", unit: "", citation: null, kind: S.custom_kinds[n] || "", custom: true })));
      const nSel = rows.filter(r => S.selected_indicators[r.name]).length;
      let body = "";
      rows.forEach(r => {
        const id = "ind-" + slug(r.name);
        const e = S.selected_indicators[r.name];
        const dn = `data-name="${h(r.name)}"`;
        body += `<div class="ind"><div class="ind-top">
          <div><label class="check" for="${id}"><input type="checkbox" id="${id}" data-f="sel" ${dn} data-cat="${h(category)}"${e ? " checked" : ""}><span>${h(tr(r.name))} ${kindTag(r.kind)}</span></label>
            <div class="src">${L("Data source", "Zdroj dat")}: ${h(tr(r.source))}${r.unit ? ` · ${L("typical unit", "obvyklá jednotka")}: ${h(tr(r.unit))}` : ""}${r.custom ? ` · <button class="btn small" style="min-height:auto;padding:.05rem .6rem;font-size:.74rem" data-action="rm-custom" ${dn} data-cat="${h(category)}">${L("Remove", "Odebrat")}</button>` : ""}</div></div>
          ${e ? `<div class="field"><label for="${id}-f">${L("Feasibility", "Proveditelnost")}</label>${selectHTML(`${id}-f`, `data-f="ind" ${dn} data-k="feasibility"`, SCORING.LEVELS, e.feasibility)}</div>
                 <div class="field"><label for="${id}-r">${L("Relevance", "Relevance")}</label>${selectHTML(`${id}-r`, `data-f="ind" ${dn} data-k="relevance"`, SCORING.LEVELS, e.relevance)}</div>
                 <div class="bucket-cell">${bucketTag(SCORING.bucket(e.feasibility, e.relevance))}</div>` : ""}
        </div></div>`;
      });
      const cid = "custom-" + slug(category);
      const catName = tr(category);
      body += `<div class="add-custom"><label class="sr-only" for="${cid}">${L(`Add a custom indicator to ${h(catName)}`, `Přidat vlastní indikátor do kategorie ${h(catName)}`)}</label>
        <input type="text" id="${cid}" placeholder="${L(`Add a custom indicator to “${h(catName)}”`, `Přidat vlastní indikátor do „${h(catName)}“`)}" data-enter="add-custom" data-cat="${h(category)}">
        <label class="sr-only" for="${cid}-k">${L("What does it measure?", "Co měří?")}</label>
        ${selectHTML(`${cid}-k`, 'class="kind-select"', Object.entries(REF.INDICATOR_KINDS).map(([k, v]) => [k, v.label]), "", L("What does it measure?", "Co měří?"))}
        <button class="btn small" data-action="add-custom" data-cat="${h(category)}" data-input="${cid}">${L("Add", "Přidat")}</button></div>`;
      out += expander("cat-" + slug(category), `${h(catName)}${nSel ? `<span class="count">${L(`${nSel} selected`, `vybráno ${nSel}`)}</span>` : ""}`, body, nSel > 0);
    });

    const n = Object.keys(S.selected_indicators).length;
    if (n) {
      const b = SCORING.groupByBucket(S.selected_indicators);
      const core = b[SCORING.BUCKET_CORE].length;
      out += `<div class="bucket-summary">` + alert(core >= 1 && core <= 5 ? "ok" : "warning", L(`<b>Core set: ${core} indicator(s).</b> Recommended: 3–5 at early stages.`, `<b>Klíčová sada: ${core} ${I18N.plural(core, "indikátor", "indikátory", "indikátorů")}.</b> V raných fázích se doporučuje 3–5.`)) +
        SCORING.BUCKET_ORDER.filter(k => b[k].length).map(k => `<p><b>${h(tr(k))}</b>: ${h(b[k].map(([nm]) => tr(nm)).join("; "))}</p>`).join("") + `</div>`;
    }
    return out;
  }

  function tabDetail() {
    const sel = Object.entries(S.selected_indicators);
    if (!sel.length) return alert("info", L("Select indicators in the first tab (<b>① Select &amp; score</b>) to fill in their details.", "Nejdřív vyberte indikátory na první záložce (<b>① Výběr a hodnocení</b>), pak doplníte podrobnosti."));
    const stageOptions = [["", L("(not linked)", "(nepropojeno)")]].concat(pathwayStageNames().map(n => [n, tr(n)]));
    return sel.map(([name, e]) => {
      const id = "det-" + slug(name);
      const a = k => `data-f="ind" data-name="${h(name)}" data-k="${k}"`;
      const link = stageOptions.some(([v]) => v === e.pathway_link) ? (e.pathway_link || "") : "";
      const body = `<div class="grid3" style="margin-bottom:.9rem">
          <div class="field"><label for="${id}-u">${L("Unit", "Jednotka")}</label><input type="text" id="${id}-u" ${a("unit")} value="${h(tr(e.unit))}"></div>
          <div class="field"><label for="${id}-v">${L("Current value", "Současná hodnota")} <span class="hint">${L("(blank if none yet)", "(prázdné, pokud zatím není)")}</span></label><input type="text" id="${id}-v" ${a("current_value")} value="${h(e.current_value)}"></div>
          <div class="field"><label for="${id}-t">${L("Target", "Cíl")} <span class="hint">${L("(optional)", "(nepovinné)")}</span></label><input type="text" id="${id}-t" ${a("target")} value="${h(e.target)}"></div></div>
        <div class="grid2" style="margin-bottom:.9rem">
          <div class="field"><label for="${id}-q">${L("Measurement frequency", "Četnost měření")}</label>${selectHTML(`${id}-q`, a("frequency"), REF.FREQUENCIES, e.frequency || "")}</div>
          <div class="field"><label for="${id}-s">${L("Actual data source you will use", "Skutečný zdroj dat, který použijete")}</label><input type="text" id="${id}-s" ${a("data_source")} value="${h(tr(e.data_source))}"></div></div>
        <div class="field" style="margin:0"><label for="${id}-l">${L("Which impact-pathway stage does this indicator evidence?", "Který krok cesty dopadu tento indikátor dokládá?")}</label>${selectHTML(`${id}-l`, a("pathway_link"), stageOptions, link)}</div>` +
        (inBank(name) ? "" : `<div class="field" style="margin:.9rem 0 0"><label for="${id}-k">${L("What does this indicator measure?", "Co tento indikátor měří?")}</label>${selectHTML(`${id}-k`, a("kind"), Object.entries(REF.INDICATOR_KINDS).map(([k, v]) => [k, v.label]), e.kind || "", L("Choose…", "Vyberte…"))}</div>`);
      return expander(id, `${h(tr(name))} ${kindTag(REF.indicatorKind(name, e))} <span class="sum-sub">· ${h(tr(SCORING.bucket(e.feasibility, e.relevance)))}</span>`, body, false);
    }).join("");
  }

  function tabMatrix() {
    const sel = Object.entries(S.selected_indicators);
    if (!sel.length) return alert("info", L("Select indicators in the first tab to see the matrix.", "Matici uvidíte, až vyberete indikátory na první záložce."));
    const LV = { Low: 0, Medium: 1, High: 2 };
    const W = 560, H = 460, ml = 86, mt = 28, cw = (W - ml - 16) / 3, ch = (H - mt - 62) / 3;
    const cells = {};
    sel.forEach(([name, e], idx) => {
      const key = `${LV[e.feasibility]}|${LV[e.relevance]}`;
      (cells[key] = cells[key] || []).push([idx + 1, name, e]);
    });
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${L("Feasibility–relevance scoring matrix", "Matice proveditelnosti a relevance")}" font-family="Inter, sans-serif">`;
    for (let fx = 0; fx < 3; fx++) for (let ry = 0; ry < 3; ry++) {
      const b = SCORING.bucket(SCORING.LEVELS[fx], SCORING.LEVELS[ry]);
      const x = ml + fx * cw, y = mt + (2 - ry) * ch;
      svg += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${BUCKET_STYLE[b][1]}" fill-opacity=".07" stroke="#E7E7DB"/>`;
      svg += `<text x="${x + 8}" y="${y + 16}" font-size="10.5" fill="${BUCKET_STYLE[b][1]}" fill-opacity=".85" font-weight="600">${h(tr(b).replace(/ \(.*\)$/, ""))}</text>`;
      const pts = cells[`${fx}|${ry}`] || [];
      const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(pts.length))));
      pts.forEach(([num, name], k) => {
        const r = Math.floor(k / cols), c = k % cols;
        const rows = Math.ceil(pts.length / cols);
        const px = x + cw / 2 + (c - (cols - 1) / 2) * 30;
        const py = y + ch / 2 + 8 + (r - (rows - 1) / 2) * 30;
        svg += `<g><title>${h(tr(name))} (${h(tr(b))})</title><circle cx="${px}" cy="${py}" r="12" fill="${BUCKET_STYLE[b][1]}" stroke="#fff" stroke-width="2"/><text x="${px}" y="${py + 4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${num}</text></g>`;
      });
    }
    ["Low", "Medium", "High"].forEach((lv, i) => {
      svg += `<text x="${ml + i * cw + cw / 2}" y="${mt + 3 * ch + 18}" font-size="12" fill="#1C2A22" text-anchor="middle">${tr(lv)}</text>`;
      svg += `<text x="${ml - 10}" y="${mt + (2 - i) * ch + ch / 2 + 4}" font-size="12" fill="#1C2A22" text-anchor="end">${tr(lv)}</text>`;
    });
    svg += `<text x="${ml + 1.5 * cw}" y="${H - 14}" font-size="12.5" font-weight="700" fill="#1C2A22" text-anchor="middle">${L("Feasibility →", "Proveditelnost →")}</text>`;
    svg += `<text transform="translate(18 ${mt + 1.5 * ch}) rotate(-90)" font-size="12.5" font-weight="700" fill="#1C2A22" text-anchor="middle">${L("Relevance →", "Relevance →")}</text></svg>`;
    const list = sel.map(([name, e], i) => `<li><b>${i + 1}.</b> ${h(tr(name))} <span class="hint">· ${h(tr(SCORING.bucket(e.feasibility, e.relevance)))}</span></li>`).join("");
    return `<div class="matrix-wrap"><h3 style="margin:0 0 .6rem;font-size:1rem">${L("Feasibility–Relevance Scoring Matrix", "Matice proveditelnosti a relevance")}</h3>${svg}
      <ol style="list-style:none;padding:0;margin:.8rem 0 0;font-size:.84rem;display:grid;gap:.25rem">${list}</ol></div>
      <p class="caption">${L("Top-right = core set. Top-left = aspirational (relevant but not yet feasible). Bottom row = excluded regardless of feasibility.", "Vpravo nahoře = klíčová sada. Vlevo nahoře = aspirační (relevantní, ale zatím neproveditelné). Spodní řádek = vyřazené bez ohledu na proveditelnost.")}</p>`;
  }

  function estimatorTotals() {
    let s1 = 0, s2 = 0;
    Object.entries(REF.EMISSION_FACTORS).forEach(([src, m]) => {
      const kg = (parseFloat(S.estimator[src]) || 0) * m.factor;
      if (m.scope === 1) s1 += kg; else s2 += kg;
    });
    return [s1, s2];
  }
  const tco2 = kg => (kg / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function tabCalc() {
    const rows = Object.entries(REF.EMISSION_FACTORS).map(([src, m], i) => {
      const id = `ef-${i}`;
      return `<div class="est-row"><div class="field"><label for="${id}">${h(tr(src))} ${L("per year", "za rok")}</label>
          <input type="number" id="${id}" min="0" step="any" inputmode="decimal" data-f="est" data-src="${h(src)}" value="${h(S.estimator[src] || "")}" placeholder="0"></div>
        ${live(`est-${i}`, () => `<div class="calc">× ${m.factor} ${h(m.unit_note)} → <b>${tco2((parseFloat(S.estimator[src]) || 0) * m.factor)} t CO₂e</b> (Scope ${m.scope})</div>`)}</div>`;
    }).join("");
    return `<div class="panel"><p style="margin-top:0">${L("Screening-level estimate of operational Scope 1 &amp; 2 emissions using <b>generic emission factors</b>. Results are <b>modelled</b> claims: replace the factors with country- and year-specific published values before external reporting.",
      "Orientační odhad provozních emisí Scope 1 a 2 pomocí <b>obecných emisních faktorů</b>. Výsledky jsou <b>modelovaná</b> tvrzení: před externím vykazováním nahraďte faktory zveřejněnými hodnotami pro danou zemi a rok.")}</p>
      ${rows}
      ${live("est-total", () => {
        const [s1, s2] = estimatorTotals();
        return `<div class="metrics"><div class="metric"><div class="m-label">${L("Estimated Scope 1", "Odhad Scope 1")}</div><div class="m-value">${tco2(s1)} <span style="font-size:.8rem;font-weight:600">${tr("t CO₂e / yr")}</span></div></div>
          <div class="metric"><div class="m-label">${L("Estimated Scope 2 (location-based)", "Odhad Scope 2 (podle lokality)")}</div><div class="m-value">${tco2(s2)} <span style="font-size:.8rem;font-weight:600">${tr("t CO₂e / yr")}</span></div></div></div>`;
      })}
      <p class="caption" style="margin-top:.8rem">${L("If you use these values to populate an emissions indicator, label the claim <b>Modelled</b> in step 4 and record the factors used as its assumptions.", "Pokud tyto hodnoty použijete pro indikátor emisí, označte v kroku 4 tvrzení jako <b>modelované</b> a použité faktory uveďte jako jeho předpoklady.")}</p></div>`;
  }

  // ============================================================= step 4 ==

  function labelList() {
    const b = SCORING.groupByBucket(S.selected_indicators);
    return [SCORING.BUCKET_CORE, SCORING.BUCKET_ASPIRATIONAL, SCORING.BUCKET_SUPPLEMENTARY].flatMap(k => b[k].map(([n]) => n));
  }

  // Keep uncertainty entries in step with the indicators that need a label.
  function syncUncertainty() {
    const toLabel = labelList();
    Object.keys(S.uncertainty).forEach(n => { if (!toLabel.includes(n)) delete S.uncertainty[n]; });
    toLabel.forEach(n => {
      const u = S.uncertainty[n] || {};
      S.uncertainty[n] = {
        level: REF.CONFIDENCE_LEVELS[u.level] ? u.level : "Modelled",
        claim: u.claim || "", assumptions: u.assumptions || "", conditions: u.conditions || "",
        quality: REF.EVIDENCE_QUALITY.some(([k]) => k === u.quality) ? u.quality : "",
        baseline: u.baseline || "", sources: u.sources || "", boundary: u.boundary || "",
      };
    });
    return toLabel;
  }

  // One row per claim: how it is labelled, and how many gaps it has.
  function claimOverviewHTML() {
    const names = Object.keys(S.uncertainty);
    if (!names.length) return "";
    const yes = v => v ? `<span class="yes">✓</span>` : `<span class="no">${L("missing", "chybí")}</span>`;
    const rows = names.map(n => {
      const u = S.uncertainty[n];
      const gaps = SCORING.claimGaps(n, u, S.selected_indicators[n], S.pathway);
      const w = gaps.filter(g => g.sev === "warning").length;
      return `<tr><td><b>${h(tr(n))}</b>${u.claim ? `<div class="claim-q">${h(L(`“${u.claim}”`, `„${u.claim}“`))}</div>` : `<div class="claim-q none">${L("no public claim written", "veřejné tvrzení zatím není napsané")}</div>`}</td>
        <td><span class="lvl lvl-${h(u.level)}">${h(tr(u.level))}</span></td>
        <td><span class="qual q-${u.quality || "none"}">${h(REF.QUALITY_SHORT[u.quality || ""])}</span></td>
        <td>${(u.baseline || "").trim() || SCORING.COMPARATIVE.test(u.claim || "") ? yes((u.baseline || "").trim()) : `<span class="na" title="${L("The claim does not compare anything", "Tvrzení nic nesrovnává")}">${L("not needed", "není potřeba")}</span>`}</td><td>${yes((u.sources || "").trim())}</td>
        <td>${w ? `<span class="gap-n">${L(`${w} issue${w > 1 ? "s" : ""}`, `${w} ${I18N.plural(w, "nesoulad", "nesoulady", "nesouladů")}`)}</span>` : SCORING.claimWritten(u) ? `<span class="na" title="${L("No issue found by the automated checks", "Automatické kontroly nic nenašly")}">${L("none found", "nenalezeny")}</span>` : `<span class="no">${L("not checked", "nezkontrolováno")}</span>`}</td></tr>`;
    }).join("");
    return `<div class="panel claim-overview"><h2>${L("Claims and evidence at a glance", "Tvrzení a důkazy v přehledu")}</h2>
      <p class="caption" style="margin:.1rem 0 .7rem">${L("Where a claim says more than its evidence supports, it shows here as an issue. The confidence level says where a number comes from; quality says how far it can be trusted. The checks look for missing baselines, sources, quality ratings and boundaries; wording checks are simple text patterns, so read them as prompts. “None found” means none of these checks fired, not that the claim is proven.",
        "Kde tvrzení říká víc, než podporují důkazy, zobrazí se tu jako nesoulad. Míra podloženosti říká, odkud číslo pochází; kvalita říká, nakolik se mu dá věřit. Kontroly hledají chybějící výchozí stavy, zdroje, hodnocení kvality a hranice; kontroly formulace jsou jednoduché textové vzory, berte je proto jako podněty. „Nenalezeny“ znamená, že žádná z kontrol nezabrala, ne že je tvrzení prokázané.")}</p>
      <div class="table-scroll"><table class="claims"><thead><tr><th>${L("Indicator and claim", "Indikátor a tvrzení")}</th><th>${L("Level", "Podloženost")}</th><th>${L("Quality", "Kvalita")}</th><th>${L("Baseline", "Výchozí stav")}</th><th>${L("Sources", "Zdroje")}</th><th>${L("Issues", "Nesoulady")}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function step4() {
    const toLabel = syncUncertainty();
    let body = toLabel.length ? "" : alert("warning", L("No core, aspirational or supplementary indicators yet. Go back to step 3 and select some.", "Zatím nemáte žádné klíčové, aspirační ani doplňkové indikátory. Vraťte se do kroku 3 a nějaké vyberte.")) +
      `<button class="btn" data-goto="3">${L("← Go to step 3", "← Přejít na krok 3")}</button>`;
    toLabel.forEach(name => {
      const e = S.selected_indicators[name];
      const u = S.uncertainty[name];
      const id = "unc-" + slug(name);
      const a = k => `data-f="unc" data-name="${h(name)}" data-k="${k}"`;
      const radios = Object.keys(REF.CONFIDENCE_LEVELS).map((lv, i) =>
        `<label class="choice" for="${id}-l${i}"><input type="radio" id="${id}-l${i}" name="${id}-lvl" value="${lv}" ${a("level")}${u.level === lv ? " checked" : ""}><span>${tr(lv)}</span></label>`).join("");
      const st = SCORING.pathwayStage(S.pathway, e.pathway_link);
      const link = st
        ? `<div class="link-box"><b>${L("Relies on pathway step", "Opírá se o krok cesty dopadu")}:</b> ${h(tr(e.pathway_link))}<br>
            <span class="caption">${L("Assumption there", "Předpoklad v tomto kroku")}: ${st.assumption ? h(L(`“${st.assumption}”`, `„${st.assumption}“`)) : `<i>${L("none stated in step 2", "v kroku 2 neuveden")}</i>`} · ${L("evidence", "důkazy")}: ${h(tr(st.evidence || "Not rated"))}</span></div>`
        : `<div class="link-box none">${L("Not linked to a pathway step yet.", "Zatím nepropojeno s krokem cesty dopadu.")} <button class="btn small" data-goto="3">${L("Link it in step 3 → Indicator details", "Propojte v kroku 3 → Podrobnosti indikátorů")}</button></div>`;
      body += `<div class="panel"><div class="unc-head"><div class="name">${h(tr(name))}</div>
          <div class="sub">${h(tr(e.category))} · ${h(tr(SCORING.bucket(e.feasibility, e.relevance)))}${e.current_value ? ` · ${L("current value", "současná hodnota")}: ${h(e.current_value)} ${h(tr(e.unit || ""))}` : ""}</div></div>
        <div class="field"><label for="${id}-c">${L("The impact claim as you would state it publicly", "Tvrzení o dopadu tak, jak byste ho řekli veřejně")} <span class="hint">${L("(optional)", "(nepovinné)")}</span></label>
          <input type="text" id="${id}-c" ${a("claim")} value="${h(u.claim)}" placeholder="${L("e.g. “Our users reduce pesticide application by 14% per hectare.”", "např. „Naši uživatelé snižují aplikaci pesticidů o 14 % na hektar.“")}"></div>
        <div class="two-dim">
          <fieldset class="question"><legend>${L("1 · Evidential confidence: where does the number come from?", "1 · Míra podloženosti: odkud číslo pochází?")}</legend><div class="opts inline">${radios}</div>
            <p class="conf-desc" style="margin:.6rem 0 0">${h(REF.CONFIDENCE_LEVELS[u.level])}</p></fieldset>
          <div class="question"><div class="field" style="margin:0"><label for="${id}-q" style="font-weight:700;font-size:.96rem">${L("2 · Evidence quality: how far can it be trusted?", "2 · Kvalita důkazů: nakolik se jim dá věřit?")}</label>
            ${selectHTML(`${id}-q`, a("quality"), REF.EVIDENCE_QUALITY, u.quality || "")}</div></div>
        </div>
        ${u.level === "Projected" ? alert("warning", L("<b>Projected:</b> report this in the impact-pathway narrative, clearly separated from evidence.", "<b>Projektované:</b> uvádějte to v popisu cesty dopadu, jasně oddělené od důkazů.")) : ""}
        ${link}
        <div class="grid2" style="margin-bottom:.9rem">
          <div class="field" style="margin:0"><label for="${id}-b">${L("Baseline: compared with what?", "Výchozí stav: ve srovnání s čím?")}</label><input type="text" id="${id}-b" ${a("baseline")} value="${h(u.baseline)}" placeholder="${L("e.g. Same farms' metered use in the 2025 season", "např. naměřená spotřeba stejných farem v sezóně 2025")}"></div>
          <div class="field" style="margin:0"><label for="${id}-s">${L("Evidence and data sources", "Důkazy a zdroje dat")}</label><input type="text" id="${id}-s" ${a("sources")} value="${h(u.sources)}" placeholder="${L("e.g. Pilot survey, n = 22; app usage logs", "např. dotazník v pilotu, n = 22; záznamy z aplikace")}"></div>
        </div>
        <div class="field"><label for="${id}-y">${L("Boundary: what the figure includes and leaves out", "Hranice: co číslo zahrnuje a co ne")} <span class="hint">${L("(scope, period, which customers or sites, which life-cycle stages)", "(rozsah, období, kteří zákazníci nebo která místa, které fáze životního cyklu)")}</span></label><input type="text" id="${id}-y" ${a("boundary")} value="${h(u.boundary)}" placeholder="${L("e.g. Water applied on 22 pilot farms, 2026 season; excludes pumping energy and farms that left the pilot", "např. voda použitá na 22 pilotních farmách v sezóně 2026; bez energie na čerpání a bez farem, které z pilotu odešly")}"></div>
        <div class="field"><label for="${id}-a">${L("Assumptions behind the number", "Předpoklady, na kterých číslo stojí")}</label><textarea id="${id}-a" rows="2" ${a("assumptions")}>${h(u.assumptions)}</textarea></div>
        <div class="field"><label for="${id}-k">${L("Conditions under which the estimate could be significantly different", "Podmínky, za kterých by se odhad mohl výrazně lišit")}</label><textarea id="${id}-k" rows="2" ${a("conditions")}>${h(u.conditions)}</textarea></div>
        ${live(`gaps-${id}`, () => {
          const g = SCORING.claimGaps(name, S.uncertainty[name], S.selected_indicators[name], S.pathway);
          return g.length ? `<div class="gap-list">${g.map(x => alert(x.sev, h(x.msg))).join("")}</div>`
            : alert("info", L("No issues detected by these automated checks. They cannot tell whether the figure itself is right.", "Tyto automatické kontroly nenašly žádný problém. Nedokážou ale posoudit, zda je samotné číslo správné."));
        })}
      </div>`;
    });

    return hero(4, L("Check your claims against the evidence", "Porovnejte tvrzení s důkazy"),
      L("Label each claim by where its number comes from (measured, modelled or projected) and by how far the evidence can be trusted, then tie it to its baseline, sources and assumptions. Gaps between what you claim and what you can show become visible.",
        "U každého tvrzení označte, odkud číslo pochází (měřené, modelované, nebo projektované) a nakolik se důkazům dá věřit, a propojte ho s výchozím stavem, zdroji a předpoklady. Mezery mezi tím, co tvrdíte, a tím, co dokážete doložit, se tak ukážou.")) +
      live("claim-overview", claimOverviewHTML) +
      `<div class="cols"><div>${body}${navButtons(3, 5)}</div>
      <aside class="aside">${live("aside", () => {
        const c = { Measured: 0, Modelled: 0, Projected: 0 };
        Object.values(S.uncertainty).forEach(u => { if (u.level in c) c[u.level]++; });
        const gw = SCORING.allClaimGaps(S.selected_indicators, S.uncertainty, S.pathway).filter(g => g.sev === "warning").length;
        return card(L("Evidence mix", "Skladba důkazů"), kv([
          [`<span class="dot-i" style="background:#2E7D52"></span>${tr("Measured")}`, String(c.Measured)],
          [`<span class="dot-i" style="background:#B8860B"></span>${tr("Modelled")}`, String(c.Modelled)],
          [`<span class="dot-i" style="background:#7C5296"></span>${tr("Projected")}`, String(c.Projected)],
          [L("Claim–evidence issues", "Nesoulady tvrzení a důkazů"), String(gw)],
        ]), "⚖️") + card(L("Why this matters", "Proč na tom záleží"), L("<p>A number can be measured and still weak: a survey of a few customers is measured, but low quality. Showing both, and what each claim is compared with, is what makes the report trustworthy.</p>",
          "<p>Číslo může být měřené a přesto slabé: dotazník mezi několika zákazníky je měřený, ale nízké kvality. Důvěryhodnost zprávě dává, když ukážete obojí a uvedete, s čím každé tvrzení srovnáváte.</p>"), "❝", true);
      })}</aside></div>` +
      tip(L("A modelled or projected claim is fine. An unlabelled one, or one worded as fact, is not.", "Modelované nebo projektované tvrzení je v pořádku. Neoznačené, nebo formulované jako fakt, není."));
  }

  // ============================================================= step 5 ==

  // Evidence readiness: plain counts, kept apart from form completion and
  // never combined into a score.
  function readiness() {
    const unc = Object.entries(S.uncertainty);
    const kind = n => REF.indicatorKind(n, S.selected_indicators[n]);
    const al = SCORING.alignment(S);
    return {
      measuredOutcome: unc.filter(([n, u]) => u.level === "Measured" && kind(n) === "outcome").length,
      highQuality: unc.filter(([, u]) => u.quality === "high").length,
      claims: unc.length,
      verified: al.verified, assumptions: al.assumptions.length,
      issues: SCORING.allClaimGaps(S.selected_indicators, S.uncertainty, S.pathway).filter(g => g.sev === "warning").length,
    };
  }

  const basedOn = trace => trace.length
    ? `<dt>${L("Based on", "Na základě")}</dt><dd><ul class="trace">${trace.map(t => `<li>${h(t)}</li>`).join("")}</ul></dd>` : "";

  const recWhy = a => `<details class="rec-why"><summary>${L("Why this, and why now", "Proč právě tohle a proč teď")}</summary><dl>
      <dt>${L("Detected condition", "Zjištěný stav")}</dt><dd>${h(a.condition)}</dd>
      <dt>${L("Why it matters", "Proč na tom záleží")}</dt><dd>${h(a.implication)}</dd>
      <dt>${L("Why now", "Proč teď")} (${h(tr(S.stage))})</dt><dd>${h(a.why_now)}</dd>
      ${basedOn(a.trace)}</dl></details>`;

  function recCard(a, withPlan) {
    const p = S.plan[a.id] || {};
    const pa = k => `data-f="plan" data-id="${h(a.id)}" data-k="${k}"`;
    const pid = "plan-" + slug(a.id);
    const plan = withPlan ? `<div class="plan-row">
        <div class="field"><label for="${pid}-o">${L("Owner", "Odpovědná osoba")}</label><input type="text" id="${pid}-o" ${pa("owner")} value="${h(p.owner || "")}" placeholder="${L("Who does it", "Kdo to udělá")}"></div>
        <div class="field"><label for="${pid}-d">${L("Deadline", "Termín")}</label><input type="date" id="${pid}-d" ${pa("due")} value="${h(p.due || "")}"></div>
        <div class="field"><label for="${pid}-e">${L("Done when… / evidence of completion", "Hotovo, když… / doklad o splnění")}</label><input type="text" id="${pid}-e" ${pa("done_evidence")} value="${h(p.done_evidence || "")}" placeholder="${L("e.g. interview notes from 5 pilot farms", "např. zápisy z rozhovorů s 5 pilotními farmami")}"></div>
      </div>` : "";
    return `<li class="rec p${a.priority}${a.type === "strength" ? " strength" : ""}">
      <div class="rec-head"><span class="prio">${a.type === "strength" ? L("Strength", "Silná stránka") : h(L(`${SCORING.PRIORITY_LABEL[a.priority]} priority`, `${SCORING.PRIORITY_LABEL[a.priority]} priorita`))}</span><b>${h(a.title)}</b><span class="rule-id" title="${L("Decision rule", "Rozhodovací pravidlo")}">${h(a.id.split(".")[0])}</span></div>
      <p class="rec-action">${h(a.action)}</p>${plan}${recWhy(a)}</li>`;
  }

  // The action plan: the three highest-priority recommendations, each with
  // an owner, deadline and evidence of completion; the rest are expandable.
  function nextStepsHTML() {
    ensurePathway();
    const ns = SCORING.nextSteps(S);
    const all = ns.actions.concat(ns.hidden || []);
    const top = all.slice(0, SCORING.PLAN_SIZE), rest = all.slice(SCORING.PLAN_SIZE);
    const actions = top.length
      ? `<ol class="rec-list">${top.map(a => recCard(a, true)).join("")}</ol>` +
        (rest.length ? expander("more-recs", `${L("More recommendations", "Další doporučení")} <span class="count">${rest.length}</span>`,
          `<ol class="rec-list">${rest.map(a => recCard(a, false)).join("")}</ol>`, false) : "")
      : alert("ok", L("No open gaps found by the rules. Keep the assessment current at your next review milestone.", "Pravidla nenašla žádné otevřené mezery. Při dalším milníku revize hodnocení aktualizujte."));
    const strengths = ns.strengths.length
      ? `<h3 class="sub-h">${L("What you can already show", "Co už můžete doložit")}</h3><ol class="rec-list">${ns.strengths.map(a => recCard(a, false)).join("")}</ol>` : "";
    const consider = ns.consider.length
      ? `<div class="consider"><h3>${L("Points to consider", "Ke zvážení")}</h3><p class="caption" style="margin:0 0 .5rem">${L("Questions worth a thought. Ignore any that do not apply.", "Otázky k zamyšlení. Ty, které se vás netýkají, klidně přeskočte.")}</p>
          <ul>${ns.consider.map(c => `<li><b>${h(c.title)}</b> ${h(c.text)}<span class="why-shown">${h(c.id)} · ${L("shown because", "zobrazeno, protože")}: ${h(c.trace.join("; "))}</span></li>`).join("")}</ul></div>` : "";
    return actions + strengths + consider + rulesTableHTML(ns.fired);
  }

  // Every decision rule, and whether it fired for this assessment.
  function rulesTableHTML(fired) {
    const on = new Set(fired);
    const KIND = { gap: L("Recommendation", "Doporučení"), strength: L("Strength", "Silná stránka"), consider: L("Point to consider", "Ke zvážení") };
    const rows = SCORING.RULES.map(([id, kind, title, cond]) =>
      `<tr class="${on.has(id) ? "fired" : ""}"><td><b>${h(id)}</b></td><td>${h(title)}<div class="caption">${h(KIND[kind])}</div></td><td>${h(cond)}</td><td>${on.has(id) ? L("✓ applies", "✓ platí") : "–"}</td></tr>`).join("");
    return expander("rules", L("⚙️ How recommendations are made", "⚙️ Jak vznikají doporučení"), `<p style="margin-top:0">${L("Recommendations come from fixed, transparent decision rules applied to your answers, not from a language model. Each recommendation names its rule and the answers that triggered it, so it can be traced back and checked. Priority depends on your development stage.",
      "Doporučení vznikají z pevných, transparentních rozhodovacích pravidel použitých na vaše odpovědi, ne z jazykového modelu. U každého doporučení je uvedeno jeho pravidlo a odpovědi, které ho spustily, takže ho lze dohledat a ověřit. Priorita závisí na fázi vývoje.")}</p>
      <div class="table-scroll"><table class="claims rules"><thead><tr><th>${L("Rule", "Pravidlo")}</th><th>${L("Recommendation", "Doporučení")}</th><th>${L("Fires when", "Uplatní se, když")}</th><th>${L("Here", "Zde")}</th></tr></thead><tbody>${rows}</tbody></table></div>`, false);
  }

  // Impact-business alignment: where the environmental benefit depends on
  // commercial assumptions. Not a viability score.
  function alignmentHTML() {
    ensurePathway();
    const al = SCORING.alignment(S);
    const fully = al.assumptions.length && al.verified === al.assumptions.length;
    const sev = { aligned: fully ? "ok" : "info", partly: "info", independent: "warning", unclear: "warning" }[al.verdict];
    const vlabel = al.verdict_label;
    const items = al.assumptions.map(a => {
      const id = "al-" + a.key;
      const attrs = k => `data-f="align" data-key="${a.key}" data-k="${k}"`;
      return `<li class="al-item st-${a.status}"><div class="al-top"><span class="al-ic" aria-hidden="true">${a.status === "validated" ? "✓" : "!"}</span>
          <div><b>${h(a.text)}</b>${a.step ? `<span class="caption" style="display:block">${L("Pathway step", "Krok cesty dopadu")}: ${h(tr(a.step))}</span>` : ""}
          <p class="al-why">${h(a.why)}</p><p class="al-test"><b>${L("How to check", "Jak to ověřit")}:</b> ${h(a.test)}</p></div></div>
        <div class="al-mark"><div class="field" style="margin:0"><label for="${id}-s">${L("Status", "Stav")}</label>${selectHTML(`${id}-s`, attrs("status"), SCORING.ALIGN_STATUS, a.status)}</div>
          <div class="field" style="margin:0"><label for="${id}-n">${L("Evidence or note", "Doklad nebo poznámka")} <span class="hint">${L("(optional)", "(nepovinné)")}</span></label><input type="text" id="${id}-n" ${attrs("note")} value="${h(a.note)}" placeholder="${L("e.g. 5 of 8 pilot farms agreed to a paid second season", "např. 5 z 8 pilotních farem souhlasilo s placenou druhou sezónou")}"></div></div></li>`;
    }).join("");
    return `<div class="panel align-panel"><h2>${L("Impact–business alignment", "Soulad dopadu a byznysu")}</h2>
      <p class="caption" style="margin:.1rem 0 .8rem">${L("Where your environmental benefit depends on commercial assumptions. This is not a commercial viability score and not business due diligence: commercial questions appear here only where they decide whether the environmental benefit happens or can be evidenced.",
        "Kde váš environmentální přínos závisí na obchodních předpokladech. Nejde o skóre obchodní životaschopnosti ani o obchodní due diligence: obchodní otázky se tu objevují jen tam, kde rozhodují o tom, zda environmentální přínos nastane nebo zda ho lze doložit.")}</p>
      <div class="al-values"><div><span>${L("Customer value", "Hodnota pro zákazníka")}</span><p>${al.customer_value ? h(al.customer_value) : `<i>${L("Not described yet (step 1)", "Zatím nepopsáno (krok 1)")}</i>`}</p></div>
        <div><span>${L("Environmental value", "Environmentální hodnota")}</span><p>${al.env_value ? h(al.env_value) : `<i>${L("Impact step not described yet (step 2)", "Krok dopadu zatím není popsán (krok 2)")}</i>`}</p></div></div>
      ${alert(sev, `<b>${h(vlabel)}.</b> ${h(al.verdict_text)}`)}
      ${al.assumptions.length ? `<h3 class="sub-h">${L("Critical assumptions", "Kritické předpoklady")}</h3><ul class="al-list">${items}</ul>`
        : `<p class="caption">${L("No commercial assumption on the impact path was found. Fill in the customer section (step 1) and mark the customer steps in step 2 to see them.", "Na cestě dopadu nebyl nalezen žádný obchodní předpoklad. Zobrazí se, až vyplníte oddíl o zákazníkovi (krok 1) a v kroku 2 označíte kroky závislé na zákaznících.")}</p>`}
    </div>`;
  }


  function step5() {
    ensurePathway();
    const checks = SCORING.integrityChecks(S.selected_indicators, S.uncertainty, S.pathway);
    const checksHTML = checks.map(([sev, msg]) => alert(sev, h(msg))).join("");

    return hero(5, L("Review, report & export", "Revize, zpráva a export"),
      L("Check where your impact depends on commercial assumptions, work through the prioritised recommendations, run the integrity checks and export your report. This assessment is designed for updating, not for completion.",
        "Podívejte se, kde váš dopad závisí na obchodních předpokladech, projděte doporučení seřazená podle priority, spusťte kontroly integrity a vyexportujte zprávu. Hodnocení je určeno k průběžné aktualizaci, ne k jednorázovému dokončení."), false) +
      `<div class="cols"><div>
        <div class="panel"><h2>${L("Review &amp; updating plan", "Plán revizí a aktualizací")}</h2>
          <div class="grid2 grid-review" style="margin-top:.8rem">
            <div class="field"><label for="milestone">${L("Next review milestone", "Milník další revize")}</label>${selectHTML("milestone", 'data-f="next_review_milestone"', REF.REVIEW_MILESTONES, S.next_review_milestone, L("Select a milestone…", "Vyberte milník…"))}</div>
            <div class="field"><label for="review_notes">${L("Notes for the next review", "Poznámky pro další revizi")} <span class="hint">${L("(optional)", "(nepovinné)")}</span></label><input type="text" id="review_notes" data-f="review_notes" value="${h(S.review_notes)}"></div>
          </div></div>
        ${alignmentHTML()}
        <h2 style="font-size:1.1rem;margin:1.4rem 0 .3rem">${L("Your action plan", "Váš akční plán")}</h2>
        <p class="caption" style="margin:0 0 .7rem">${L(`The three highest-priority actions for your stage (${h(S.stage)}). Give each an owner, a deadline and what will count as done. Open “Why this, and why now” to see the answers each one follows from. The plan is in the report too.`,
          `Tři kroky s nejvyšší prioritou pro vaši fázi (${h(tr(S.stage))}). Ke každému určete odpovědnou osobu, termín a co se bude počítat jako splněné. V části „Proč právě tohle a proč teď“ uvidíte odpovědi, ze kterých krok vychází. Plán je i ve zprávě.`)}</p>
        ${nextStepsHTML()}
        <h2 style="font-size:1.1rem;margin:1.4rem 0 .7rem">${L("Integrity checks", "Kontroly integrity")}</h2>
        ${checksHTML}
        <h2 style="font-size:1.1rem;margin:1.4rem 0 .7rem">${L("Export", "Export")}</h2>
        <div class="export-grid">
          <div class="export-card primary-card"><h4>${L("📄 The report, for sharing", "📄 Zpráva ke sdílení")}</h4>
            <button class="btn primary block" data-action="docx">${L("Download Word report (.docx)", "Stáhnout zprávu ve Wordu (.docx)")}</button>
            <p>${L("The complete document: headings, table of contents, indicator tables, confidence badges. When Word asks to update fields on opening, choose <b>Yes</b> to fill in the table of contents.",
              "Kompletní dokument: nadpisy, obsah, tabulky indikátorů, štítky podloženosti. Když se Word při otevření zeptá na aktualizaci polí, zvolte <b>Ano</b>, aby se vyplnil obsah.")}</p></div>
          <div class="export-card"><h4>${L("💾 The save file, for continuing later", "💾 Uložený soubor pro pozdější pokračování")}</h4>
            <button class="btn block" data-action="json">${L("Save progress (.json)", "Uložit postup (.json)")}</button>
            <p>${L("<b>JSON is the only format that loads back into the tool.</b> Keep it to resume at your next review milestone. Loading it starts a new review cycle.",
              "<b>JSON je jediný formát, který lze do nástroje znovu nahrát.</b> Uschovejte si ho pro pokračování při dalším milníku revize. Nahráním začne nový revizní cyklus.")}</p></div>
        </div>
        ${expander("other-formats", L("Other formats (PDF, HTML, Markdown)", "Další formáty (PDF, HTML, Markdown)"), `<div style="display:flex;gap:.6rem;flex-wrap:wrap">
            <button class="btn small" data-action="print">${L("🖨️ Print / save as PDF", "🖨️ Tisk / uložit jako PDF")}</button>
            <button class="btn small" data-action="html">⬇️ HTML</button>
            <button class="btn small" data-action="md">⬇️ Markdown</button></div>
          <p class="caption">${L("Alternative formats of the same report. None of them can be loaded back in. Use the JSON save file for that.", "Jiné formáty téže zprávy. Žádný z nich nelze znovu nahrát; k tomu slouží soubor JSON.")}</p>`, false)}
        ${expander("preview", L("📄 Report preview", "📄 Náhled zprávy"), live("preview", () => `<div class="report-preview">${REPORT.toHtmlBody(REPORT.assemble(S))}</div>`), false)}
        <div class="btn-row"><button class="btn" data-goto="4">${L("← Back", "← Zpět")}</button></div>
      </div>
      <aside class="aside">${live("aside", () => {
        const b = SCORING.groupByBucket(S.selected_indicators);
        const of = L("of", "z");
        return card(L("Assessment summary", "Shrnutí hodnocení"), kv([
          [L("Startup", "Startup"), S.startup_name || L("Not set", "Nevyplněno")],
          [L("Classification", "Klasifikace"), classification().label],
          [L("Core indicators", "Klíčové indikátory"), String(b[SCORING.BUCKET_CORE].length)],
          [L("Automated warnings", "Automatická varování"), String(checks.filter(([s]) => s === "warning").length)],
          [L("Next review", "Další revize"), S.next_review_milestone ? tr(S.next_review_milestone) : L("Not set", "Nenastaveno")],
        ]), "📋") + (() => {
          const r = readiness();
          return card(L("Evidence readiness", "Připravenost důkazů"), kv([
            [L("Measured real-world outcomes", "Měřené skutečné výsledky"), String(r.measuredOutcome)],
            [L("Claims with high-quality evidence", "Tvrzení s vysoce kvalitními důkazy"), `${r.highQuality} ${of} ${r.claims}`],
            [L("Commercial assumptions verified", "Ověřené obchodní předpoklady"), `${r.verified} ${of} ${r.assumptions}`],
            [L("Claim–evidence issues", "Nesoulady tvrzení a důkazů"), String(r.issues)],
          ]) + `<p style="margin:.5rem 0 0;font-size:.78rem">${L("Counts, not a score. Zero automated warnings does not mean the evidence is strong.", "Počty, ne skóre. Nula automatických varování neznamená, že jsou důkazy silné.")}</p>`, "🔎");
        })() + card(L("Review cycles", "Revizní cykly"), L(`<p>You are on review cycle <b>v${S.assessment_version}</b>. Loading the exported JSON later starts cycle v${S.assessment_version + 1}. The framework treats this as a living document.</p>`,
          `<p>Jste v revizním cyklu <b>v${S.assessment_version}</b>. Pozdější nahrání exportovaného souboru JSON zahájí cyklus v${S.assessment_version + 1}. Rámec s hodnocením pracuje jako s živým dokumentem.</p>`), "🔁", true);
      })}</aside></div>` +
      tip(L("Warnings are guidance, not blockers, but each one you resolve makes the report harder to challenge.", "Varování jsou vodítka, ne překážky, ale každé, které vyřešíte, udělá zprávu odolnější vůči námitkám."), L("Before you export", "Před exportem"));
  }

  // ========================================================== language ===

  // ENG / CZ switch. Switching saves the choice and reloads; progress is
  // already saved, and the scroll position is restored after the reload.
  function langSwitch(extraClass) {
    const b = (code, label, full) => `<button type="button" data-action="lang" data-lang="${code}" lang="${code}" aria-pressed="${I18N.lang === code}" title="${full}">${label}</button>`;
    return `<div class="lang-switch ${extraClass || ""}" role="group" aria-label="${L("Language", "Jazyk")}">${b("en", "ENG", "English")}${b("cs", "CZ", "Čeština")}</div>`;
  }

  function switchLanguage(lang) {
    if (lang === I18N.lang) return;
    save();
    try { sessionStorage.setItem("eia-scroll", String(window.scrollY)); } catch (e) { /* ignore */ }
    I18N.set(lang);
    location.reload();
  }

  // Homepage: static text carries data-i18n keys; Czech replaces the
  // English HTML from PAGE_CS (page-cs.js).
  function applyPageLanguage() {
    document.querySelectorAll("[data-lang-slot]").forEach(el => { el.innerHTML = langSwitch(el.dataset.langSlot); });
    if (I18N.lang !== "cs" || typeof PAGE_CS === "undefined") return;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const v = PAGE_CS[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      el.dataset.i18nAttr.split(";").forEach(pair => {
        const [attr, key] = pair.split(":");
        if (PAGE_CS[key] != null) el.setAttribute(attr, PAGE_CS[key]);
      });
    });
    if (PAGE_CS["meta.title"]) document.title = PAGE_CS["meta.title"];
    const md = document.querySelector('meta[name="description"]');
    if (md && PAGE_CS["meta.description"]) md.setAttribute("content", PAGE_CS["meta.description"]);
  }

  // ============================================================ render ===

  const STEPS = { 1: step1, 2: step2, 3: step3, 4: step4, 5: step5 };

  function renderMain() {
    LIVE = {};
    const html = S.step === 1 || profileReady() ? STEPS[S.step]() : gate();
    $("#main-inner").innerHTML = html;
  }

  function refreshLive() {
    document.querySelectorAll("[data-live]").forEach(el => {
      const fn = LIVE[el.dataset.live];
      if (!fn) return;
      const html = fn();
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    renderSidebar();
  }

  // Full re-render that keeps the reader's place: scroll position, focus
  // and text selection survive.
  function rerender() {
    const active = document.activeElement;
    const focusId = active && active.id;
    let selStart = null, selEnd = null;
    try { if (active && "selectionStart" in active) { selStart = active.selectionStart; selEnd = active.selectionEnd; } } catch (e) { /* not a text control */ }
    const y = window.scrollY;
    renderMain();
    renderSidebar();
    window.scrollTo(0, y);
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus({ preventScroll: true });
        try { if (selStart != null) el.setSelectionRange(selStart, selEnd); } catch (e) { /* ignore */ }
      }
    }
  }

  function render() {
    const welcome = !S.seen_welcome;
    $("#welcome-view").hidden = !welcome;
    $("#tool-view").hidden = welcome;
    if (welcome) {
      const cont = $("#welcome-continue");
      const inProgress = !!S.startup_name.trim();
      document.querySelectorAll('[data-action="start"]').forEach(b => {
        b.textContent = inProgress ? L("Continue your assessment", "Pokračovat v hodnocení") : L("Start the assessment", "Začít hodnocení");
      });
      cont.hidden = !inProgress;
      if (inProgress) cont.textContent = L(`Your assessment for “${S.startup_name}” is saved in this browser. Continue picks up where you left off.`,
        `Vaše hodnocení pro „${S.startup_name}“ je uložené v tomto prohlížeči. Pokračováním navážete tam, kde jste skončili.`);
      armReveal();
    } else {
      renderMain();
      renderSidebar();
    }
  }

  function goto(step) {
    S.step = step;
    save();
    document.body.classList.remove("nav-open");
    renderMain();
    renderSidebar();
    window.scrollTo(0, 0);
    const h1 = document.querySelector("#main-inner h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  }

  // ============================================================ events ===

  // Apply a control's value to state. Returns true when the change affects
  // the form's structure and the step must re-render.
  function applyField(el) {
    const f = el.dataset.f;
    const val = el.type === "checkbox" ? el.checked : el.value;
    switch (f) {
      case "startup_name": case "startup_desc": case "sector": case "weakest_links": case "review_notes":
      case "customer_profile": case "customer_user": case "behaviour_actor": case "customer_value":
        S[f] = val; return false;
      case "stage": S.stage = val; return false;
      case "ctype": {
        const set = new Set(S.customer_types);
        if (val) set.add(el.value); else set.delete(el.value);
        S.customer_types = REF.CUSTOMER_TYPES.map(([k]) => k).filter(k => set.has(k));
        return true;
      }
      case "revenue": {
        const set = new Set(S.revenue_models);
        if (val) set.add(el.value); else set.delete(el.value);
        S.revenue_models = REF.REVENUE_MODELS.map(([k]) => k).filter(k => set.has(k));
        return true;
      }
      case "vdriver": {
        // "no direct financial benefit" excludes the other reasons
        let set = new Set(S.value_drivers);
        if (val) {
          if (el.value === "none") set = new Set(["none"]);
          else { set.delete("none"); set.add(el.value); }
        } else set.delete(el.value);
        S.value_drivers = REF.VALUE_DRIVERS.map(([k]) => k).filter(k => set.has(k));
        return true;
      }
      case "next_review_milestone": S.next_review_milestone = val; return true;
      case "mechanism":
        S.mechanism = val;
        if (S.is_hybrid) S.secondary_mechanism = val === "Direct" ? "Enabling" : "Direct";
        return true;
      case "orientation": S.orientation = val; return true;
      case "hybrid":
        S.is_hybrid = val;
        S.secondary_mechanism = val ? (S.mechanism === "Direct" ? "Enabling" : "Direct") : null;
        return true;
      case "pw": {
        const stage = (S.pathway[el.dataset.track] || [])[+el.dataset.i];
        if (stage) stage[el.dataset.k] = val;
        return el.dataset.k === "change";  // moves the card's badge
      }
      case "sel": {
        const name = el.dataset.name, cat = el.dataset.cat;
        if (val) {
          const bank = (REF.INDICATOR_BANK[cat] || []).find(r => r[0] === name);
          S.selected_indicators[name] = S.selected_indicators[name] || {
            category: cat, feasibility: "Medium", relevance: "Medium",
            unit: bank ? bank[2] : "", current_value: "", target: "", frequency: "",
            data_source: bank ? bank[1] : "Custom indicator", pathway_link: "", citation: bank ? bank[3] : null,
            kind: bank ? bank[4] : (S.custom_kinds[name] || ""),
          };
          UI.open["cat-" + slug(cat)] = true;
        } else {
          delete S.selected_indicators[name];
        }
        return true;
      }
      case "ind": {
        const e = S.selected_indicators[el.dataset.name];
        if (e) e[el.dataset.k] = val;
        if (el.dataset.k === "kind") S.custom_kinds[el.dataset.name] = val;
        return el.tagName === "SELECT";
      }
      case "unc": {
        const u = S.uncertainty[el.dataset.name];
        if (u) u[el.dataset.k] = val;
        return el.type === "radio";
      }
      case "est": S.estimator[el.dataset.src] = val; return false;
      case "plan": {
        const m = S.plan[el.dataset.id] = S.plan[el.dataset.id] || {};
        m[el.dataset.k] = val;
        return false;
      }
      case "align": {
        const m = S.alignment[el.dataset.key] = S.alignment[el.dataset.key] || {};
        m[el.dataset.k] = val;
        // a status change reshuffles the recommendations; the note does not
        return el.dataset.k === "status";
      }
    }
    return false;
  }

  document.addEventListener("input", ev => {
    const el = ev.target;
    if (!el.dataset || !el.dataset.f || el.tagName === "SELECT" || el.type === "radio" || el.type === "checkbox") return;
    applyField(el);
    save();
    refreshLive();
  });

  document.addEventListener("change", ev => {
    const el = ev.target;
    if (el.id === "import-file") return handleImport(el);
    if (!el.dataset || !el.dataset.f) return;
    if (el.tagName !== "SELECT" && el.type !== "radio" && el.type !== "checkbox") return;
    const structural = applyField(el);
    save();
    if (structural) rerender(); else refreshLive();
  });

  // remember which expanders are open across re-renders
  document.addEventListener("toggle", ev => {
    const el = ev.target;
    if (el.classList && el.classList.contains("exp") && el.id) {
      UI.open[el.id] = el.open;
      save();
      if (el.id === "preview" && el.open) refreshLive();
    }
  }, true);

  document.addEventListener("keydown", ev => {
    const el = ev.target;
    if (ev.key === "Enter" && el.dataset && el.dataset.enter === "add-custom") {
      ev.preventDefault();
      addCustom(el.dataset.cat, el);
    }
    if (ev.key === "Escape" && document.body.classList.contains("nav-open")) closeNav();
  });

  document.addEventListener("click", ev => {
    const go = ev.target.closest("[data-goto]");
    if (go && !go.disabled) { goto(+go.dataset.goto); return; }
    const act = ev.target.closest("[data-action]");
    if (!act || act.disabled) return;
    const a = act.dataset.action;
    switch (a) {
      case "start": S.seen_welcome = true; save(); render(); window.scrollTo(0, 0); break;
      case "resume-file": case "import": $("#import-file").click(); break;
      case "demo": loadDemo(); break;
      case "lang": switchLanguage(act.dataset.lang); break;
      case "intro": S.seen_welcome = false; save(); closeNav(); render(); window.scrollTo(0, 0); break;
      case "restart":
        if (S.demo || confirm(L("Start a new assessment? Everything entered so far will be cleared from this browser. Download the JSON save file first if you want to keep it.",
          "Začít nové hodnocení? Vše, co jste dosud zadali, bude z tohoto prohlížeče smazáno. Pokud to chcete zachovat, stáhněte si nejdřív soubor JSON."))) {
          S = DEFAULTS(); S.seen_welcome = true; UI.open = {}; UI.tab3 = "select";
          save(); closeNav(); render(); window.scrollTo(0, 0);
          toast(L("Started a new assessment.", "Začalo nové hodnocení."));
        }
        break;
      case "tab3": UI.tab3 = act.dataset.tab; save(); rerender(); break;
      case "add-custom": addCustom(act.dataset.cat, document.getElementById(act.dataset.input)); break;
      case "rm-custom": {
        const list = S.custom_indicators[act.dataset.cat] || [];
        S.custom_indicators[act.dataset.cat] = list.filter(n => n !== act.dataset.name);
        delete S.custom_kinds[act.dataset.name];
        delete S.selected_indicators[act.dataset.name];
        save(); rerender();
        break;
      }
      case "docx": exportDocx(act); break;
      case "json": download(`${nameSlug()}_assessment_v${S.assessment_version}.json`, REPORT.exportState(S), "application/json"); toast(L("Save file downloaded.", "Soubor s postupem byl stažen.")); break;
      case "html": download(`${nameSlug()}_impact_report.html`, REPORT.toHtml(assembled()), "text/html"); break;
      case "md": download(`${nameSlug()}_impact_report.md`, REPORT.toMarkdown(assembled()), "text/markdown"); break;
      case "print": printReport(); break;
      case "toggle-nav": {
        const open = !document.body.classList.contains("nav-open");
        document.body.classList.toggle("nav-open", open);
        act.setAttribute("aria-expanded", String(open));
        break;
      }
      case "close-nav": closeNav(); break;
    }
  });

  function closeNav() {
    document.body.classList.remove("nav-open");
    const b = document.querySelector('[data-action="toggle-nav"]');
    if (b) b.setAttribute("aria-expanded", "false");
  }

  function addCustom(cat, input) {
    const name = (input && input.value || "").trim();
    if (!name) { toast(L("Type the indicator's name first.", "Nejdřív napište název indikátoru."), true); return; }
    const exists = Object.values(REF.INDICATOR_BANK).flat().some(r => r[0] === name) ||
      Object.values(S.custom_indicators).flat().includes(name);
    if (exists) { toast(L("An indicator with that name already exists.", "Indikátor s tímto názvem už existuje."), true); return; }
    const kindSel = document.getElementById(input.id + "-k");
    const kind = kindSel && kindSel.value;
    if (!REF.INDICATOR_KINDS[kind]) { toast(L("Choose what the indicator measures (outcome, adoption, technology…).", "Vyberte, co indikátor měří (výsledek, přijetí, technologie…)."), true); if (kindSel) kindSel.focus(); return; }
    (S.custom_indicators[cat] = S.custom_indicators[cat] || []).push(name);
    S.custom_kinds[name] = kind;
    UI.open["cat-" + slug(cat)] = true;
    save(); rerender();
    const again = document.getElementById("custom-" + slug(cat));
    if (again) again.focus();
    toast(L(`Added “${name}”. Tick it to include it.`, `Přidáno: „${name}“. Zaškrtněte ho, pokud ho chcete zahrnout.`));
  }

  // ============================================================ export ===

  function assembled() {
    ensurePathway();
    return REPORT.assemble(S);
  }

  function download(filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function exportDocx(btn) {
    const label = btn.innerHTML;
    btn.disabled = true; btn.textContent = L("Preparing…", "Připravuji…");
    try {
      const r = assembled();
      // the pathway diagrams go into Word as images; a failure here only
      // drops the picture, never the report
      const diagrams = {};
      for (const [track, stages] of Object.entries(r.pathway)) {
        if (!stages.length) continue;
        try {
          const d = PATHWAY_DIAGRAM.svg(track, stages, { actor: r.customer.actor });
          diagrams[track] = { data: await PATHWAY_DIAGRAM.toPng(d.svg, d.width, d.height), width: d.width, height: d.height };
        } catch (e) { console.warn("diagram skipped:", e); }
      }
      const blob = await REPORT.toDocx(r, { diagrams });
      download(`${nameSlug()}_impact_report.docx`, blob);
      toast(L("Word report downloaded.", "Zpráva ve Wordu byla stažena."));
    } catch (err) {
      console.error(err);
      toast(L("Word export failed: ", "Export do Wordu selhal: ") + (err && err.message || err) + L(". Try the PDF or HTML export instead.", ". Zkuste místo toho export do PDF nebo HTML."), true);
    } finally {
      btn.disabled = false; btn.innerHTML = label;
    }
  }

  function printReport() {
    const w = window.open("", "_blank");
    if (!w) { toast(L("Pop-up blocked. Allow pop-ups for this site, or use the HTML download and print that.", "Vyskakovací okno bylo zablokováno. Povolte pro tento web vyskakovací okna, nebo stáhněte HTML a vytiskněte to."), true); return; }
    w.document.open();
    w.document.write(REPORT.toHtml(assembled()).replace("</body>", "<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body>"));
    w.document.close();
  }

  // Load the fictional FieldSense assessment so a visitor can explore every
  // step and the report without typing. Replaces what is in this browser,
  // so ask first when a real assessment is in progress.
  async function loadDemo() {
    if (S.startup_name.trim() && !S.demo &&
        !confirm(L(`Open the FieldSense example? Your assessment for “${S.startup_name}” in this browser will be replaced. Download its JSON save file first if you want to keep it.`,
          `Otevřít ukázku FieldSense? Vaše hodnocení „${S.startup_name}“ v tomto prohlížeči bude nahrazeno. Pokud ho chcete zachovat, stáhněte si nejdřív jeho soubor JSON.`))) return;
    try {
      // the example's own texts exist in both languages; the answers
      // (stages, indicators, levels) are identical in both files
      const res = await fetch(L("samples/FieldSense.json", "samples/FieldSense.cs.json"), { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const next = DEFAULTS();
      REPORT.PERSISTED_KEYS.forEach(k => { const v = payload.state[k]; if (v !== undefined && v !== null) next[k] = v; });
      next.seen_welcome = true;
      next.demo = true;
      next.step = 1;
      S = sanitize(next);
      UI.open = {}; UI.tab3 = "select";
      save(); closeNav(); render(); window.scrollTo(0, 0);
      toast(L("Opened the FieldSense example. Click through the steps, or jump to step 5 for the results.", "Otevřena ukázka FieldSense. Projděte jednotlivé kroky, nebo přejděte rovnou na krok 5 k výsledkům."));
    } catch (err) {
      toast(L("Could not open the example: ", "Ukázku se nepodařilo otevřít: ") + (err && err.message || err), true);
    }
  }

  function handleImport(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const loaded = REPORT.importState(String(reader.result));
        const next = DEFAULTS();
        REPORT.PERSISTED_KEYS.forEach(k => { if (loaded[k] !== undefined && loaded[k] !== null) next[k] = loaded[k]; });
        next.seen_welcome = true;
        next.step = 1;
        S = sanitize(next);
        UI.open = {};
        save(); render(); window.scrollTo(0, 0);
        toast(L(`Loaded. You are now on review cycle v${S.assessment_version}.`, `Nahráno. Nyní jste v revizním cyklu v${S.assessment_version}.`));
      } catch (err) {
        toast(L("Could not load file: ", "Soubor se nepodařilo nahrát: ") + (err && err.message || err), true);
      }
      input.value = "";
    };
    reader.onerror = () => { toast(L("Could not read that file.", "Tento soubor se nepodařilo přečíst."), true); input.value = ""; };
    reader.readAsText(file);
  }

  let toastTimer = null;
  function toast(msg, isError) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("error", !!isError);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), isError ? 6000 : 3200);
  }

  // ====================================================== welcome reveal ==

  // Sections fade in as they scroll into view. Progressive enhancement:
  // content is visible unless this script arms the hidden state.
  let revealArmed = false;
  function armReveal() {
    if (revealArmed) return;
    revealArmed = true;
    const wrap = $("#welcome");
    const items = wrap.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(el => el.classList.add("is-in"));
      return;
    }
    wrap.classList.add("js");
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    items.forEach(el => io.observe(el));
    // backstop: never leave on-screen content hidden
    setTimeout(() => items.forEach(el => { if (el.getBoundingClientRect().top < innerHeight + 40) el.classList.add("is-in"); }), 900);
  }

  // =============================================================== init ==

  applyPageLanguage();
  document.querySelectorAll('[data-mark="bare"]').forEach(el => { el.innerHTML = LOGO_BARE; });
  document.querySelectorAll('[data-mark="tile"]').forEach(el => { el.innerHTML = LOGO_TILE; });
  render();
  try {
    const y = sessionStorage.getItem("eia-scroll");
    if (y != null) { sessionStorage.removeItem("eia-scroll"); window.scrollTo(0, +y || 0); }
  } catch (e) { /* ignore */ }
})();
