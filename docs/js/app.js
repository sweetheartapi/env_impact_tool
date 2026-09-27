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
    uncertainty: {},
    assessment_version: 1,
    next_review_milestone: "",
    review_notes: "",
    estimator: {},
  });

  const STEP_META = {
    1: ["Profile & classify", "Understand your startup"],
    2: ["Impact pathway", "Map your impact"],
    3: ["Select indicators", "Choose what to measure"],
    4: ["Label uncertainty", "Assess confidence"],
    5: ["Report & export", "Review and export"],
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
    ["startup_name", "startup_desc", "sector", "weakest_links", "next_review_milestone", "review_notes"]
      .forEach(k => { if (typeof s[k] !== "string") s[k] = s[k] == null ? "" : String(s[k]); });
    if (!REF.STAGES.includes(s.stage)) s.stage = "Ideation";
    if (!["Direct", "Enabling"].includes(s.mechanism)) s.mechanism = null;
    if (!["Primary", "Secondary"].includes(s.orientation)) s.orientation = null;
    s.is_hybrid = !!s.is_hybrid && !!s.mechanism;
    s.secondary_mechanism = s.is_hybrid ? (s.mechanism === "Direct" ? "Enabling" : "Direct") : null;
    ["pathway", "selected_indicators", "custom_indicators", "uncertainty", "estimator"]
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
      out[t.track] = t.stages.map(([stage]) => {
        const e = existing[stage] || {};
        return {
          stage,
          description: e.description || "",
          assumption: e.assumption || "",
          evidence: REF.EVIDENCE.includes(e.evidence) ? e.evidence : "Not rated",
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
    const f1 = [!!S.startup_name, !!S.sector, !!S.startup_desc, S.mechanism != null, S.orientation != null];
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
    return `<div class="hero"><div class="txt"><div class="step">Step ${step} of 5</div><h1>${h(title)}</h1><p>${h(subtitle)}</p></div>${art ? `<div class="art">${HERO_ART}</div>` : ""}</div>`;
  }
  const card = (title, body, icon = "", quiet = false) =>
    `<div class="card${quiet ? " quiet" : ""}"><h4>${icon ? `<span aria-hidden="true">${icon}</span>` : ""}${h(title)}</h4>${body}</div>`;
  const kv = pairs => pairs.map(([k, v]) => `<div class="kv"><span>${k}</span><b>${h(v)}</b></div>`).join("");
  const tip = (text, title = "Tip for best results") =>
    `<div class="tip"><span aria-hidden="true">💡</span><div><b>${h(title)}</b>${h(text)}</div></div>`;
  const ALERT_ICON = { warning: "!", info: "i", ok: "✓", error: "×" };
  const alert = (sev, html) => `<div class="alert ${sev}" role="${sev === "warning" || sev === "error" ? "alert" : "note"}"><span class="ic" aria-hidden="true">${ALERT_ICON[sev]}</span><div>${html}</div></div>`;
  const bucketTag = b => `<span class="bucket-tag ${BUCKET_STYLE[b][0]}">→ ${h(b)}</span>`;

  function selectHTML(id, attrs, options, value, placeholder) {
    let o = placeholder ? `<option value=""${value ? "" : " selected"} disabled>${h(placeholder)}</option>` : "";
    o += options.map(opt => {
      const [val, label] = Array.isArray(opt) ? opt : [opt, opt === "" ? "(not set)" : opt];
      return `<option value="${h(val)}"${val === value ? " selected" : ""}>${h(label)}</option>`;
    }).join("");
    return `<select id="${id}" ${attrs}>${o}</select>`;
  }

  function expander(id, summary, body, defaultOpen) {
    const open = id in UI.open ? UI.open[id] : defaultOpen;
    return `<details class="exp" id="${id}"${open ? " open" : ""}><summary>${summary}</summary><div class="body">${body}</div></details>`;
  }

  const navButtons = (back, next) => `<div class="btn-row">${back ? `<button class="btn" data-goto="${back}">← Back</button>` : "<span></span>"}${next ? `<button class="btn primary" data-goto="${next}">Save &amp; continue →</button>` : ""}</div>`;

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
        `<span class="pct" aria-label="${s.pct} percent complete">${s.pct}%</span></button></li>`;
    }).join("");

    const exportBody = profileReady()
      ? `<button class="btn primary block small" data-action="docx">📄 Word report (.docx)</button>
         <button class="btn block small" data-action="json">💾 Save progress (.json)</button>
         <p><b style="font-size:.78rem">The JSON file is your save file.</b> Load it later to continue. The Word report is the finished document to share.</p>`
      : `<p>Complete step 1 (name + the two diagnostic questions) to unlock export.</p>`;

    $("#sidebar").innerHTML = `
      <div class="brand" data-action="intro" title="Introduction & guide"><div class="logo">${LOGO_TILE}</div>
        <div><div class="word">EIA</div><div class="sub">Startup Environmental<br>Impact Assessment</div></div></div>
      <div class="eyebrow">Workflow</div>
      <ol class="nav">${nav}</ol>
      <div class="sidecard"><div class="progress-head"><b>Assessment progress</b><span>${pct}%</span></div>
        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Assessment progress"><div class="progress-fill" style="width:${pct}%"></div></div></div>
      <div class="saved-note">${storageOk ? '<span class="dot"></span>Progress saved in this browser' : "⚠ This browser is not saving progress. Download the JSON save file."}</div>
      <div class="eyebrow">Export</div>
      <div class="sidecard" style="margin-top:0">${exportBody}</div>
      <div class="eyebrow">Save &amp; resume</div>
      <div class="sidecard" style="margin-top:0"><p style="margin-top:0">Load a JSON save file to resume an assessment. Each load starts a new review cycle.</p>
        <button class="btn block small" data-action="import">⬆️ Load save file (.json)</button></div>
      <div class="side-links">
        <button class="btn small block" data-action="intro">📖 Introduction &amp; guide</button>
        <button class="btn small block" data-action="restart">↺ Start a new assessment</button>
      </div>
      <div class="footer-note">v3.0 · Review cycle v${S.assessment_version}</div>`;
    const pill = $("#topbar-step");
    if (pill) pill.textContent = `Step ${S.step} of 5 · ${STEP_META[S.step][0]}`;
  }

  // ============================================================= step 1 ==

  function step1() {
    const mechOpts = REF.DIAGNOSTIC_MECHANISM.options;
    const oriOpts = REF.DIAGNOSTIC_ORIENTATION.options;
    const radios = (name, f, opts, cur) => opts.map(([label, val], i) =>
      `<label class="choice" for="${name}-${i}"><input type="radio" id="${name}-${i}" name="${name}" value="${val}" data-f="${f}"${cur === val ? " checked" : ""}><span>${h(label)}</span></label>`).join("");

    const hybrid = S.mechanism ? `
      <label class="check hybrid" for="hybrid"><input type="checkbox" id="hybrid" data-f="hybrid"${S.is_hybrid ? " checked" : ""}>
        <span><b>Hybrid:</b> a meaningful share of the impact also arises through the <i>other</i> mechanism
        <span class="caption" style="display:block">e.g. an enabling startup with a measurable direct footprint, or hardware with both direct and enabling effects. The secondary track gets lighter-touch screening.</span>
        ${S.is_hybrid ? `<span class="caption" style="display:block">Primary track: <b>${S.mechanism}</b> · Secondary track (light-touch): <b>${S.secondary_mechanism}</b></span>` : ""}</span></label>` : "";

    return hero(1, "Profile & classify your startup",
      "Tell us about your startup and answer two diagnostic questions. This classifies your impact pathway and tailors the whole assessment.") +
      `<div class="cols"><div>
        <div class="panel"><h2>About your startup</h2>
          <div class="grid2" style="margin:.8rem 0 .9rem">
            <div class="field"><label for="startup_name">Startup name <span aria-hidden="true" style="color:var(--red)">*</span></label>
              <input type="text" id="startup_name" data-f="startup_name" value="${h(S.startup_name)}" placeholder="e.g., GreenPack Solutions" autocomplete="organization" required></div>
            <div class="field"><label for="stage">Development stage</label>
              ${selectHTML("stage", 'data-f="stage"', REF.STAGES, S.stage)}
              ${live("stage-short", () => `<span class="hint">${h(REF.STAGE_SHORT[S.stage])}</span>`)}</div>
            <div class="field"><label for="sector">Sector / domain</label>
              <input type="text" id="sector" data-f="sector" value="${h(S.sector)}" placeholder="e.g., AgTech, packaging, SaaS"></div>
          </div>
          <div class="field" style="margin-bottom:0"><label for="startup_desc">Short description</label>
            <textarea id="startup_desc" data-f="startup_desc" rows="3" placeholder="What does your startup do, and for whom? (1–3 sentences)">${h(S.startup_desc)}</textarea></div>
        </div>
        <div class="panel"><h2>Diagnostic classification</h2>
          <p class="lead"><b style="color:var(--ink)">Both questions are required.</b> Your answers classify your impact mechanism and drive the whole assessment. <i>Why this matters:</i> a clear classification now makes your indicators, data, and claims more credible and defensible later.</p>
          <fieldset class="question"><legend>${h(REF.DIAGNOSTIC_MECHANISM.question)}</legend><div class="opts">${radios("mech", "mechanism", mechOpts, S.mechanism)}</div></fieldset>
          ${hybrid}
          <fieldset class="question" style="margin-bottom:0"><legend>${h(REF.DIAGNOSTIC_ORIENTATION.question)}</legend><div class="opts">${radios("ori", "orientation", oriOpts, S.orientation)}</div></fieldset>
        </div>
        ${live("continue", () => {
          const missing = [];
          if (!S.startup_name.trim()) missing.push("enter a startup name");
          if (!classified()) missing.push("answer both diagnostic questions");
          return `<button class="btn primary block" data-goto="2"${missing.length ? " disabled" : ""}>Save &amp; continue →</button>` +
            (missing.length ? `<p class="required-note">To continue: ${missing.join(" and ")}.</p>` : "");
        })}
      </div>
      <aside class="aside">${live("aside", () =>
        card("Key terms", `<ul class="terms">
          <li><b>Impact mechanism</b>: how the environmental benefit comes about. <i>Direct</i>: your product or service delivers it by itself. <i>Enabling</i>: it only happens when customers adopt your solution and change what they do.</li>
          <li><b>Value orientation</b>. <i>Primary</i>: environmental improvement is the point of your offering. <i>Secondary</i>: your offering is commercial, and the environmental effect is a by-product.</li>
          <li><b>Impact pathway</b>: the step-by-step cause-and-effect chain from what you do to the environmental impact you claim (mapped in step 2).</li>
          <li><b>Hybrid</b>: a meaningful share of the impact arises through both mechanisms; the secondary one gets a lighter check.</li></ul>`, "", true))}
      </aside></div>`;
  }

  // Steps 2-5 depend on the name and the classification.
  function gate() {
    const missing = [];
    if (!S.startup_name.trim()) missing.push("the startup name");
    if (!classified()) missing.push("the two diagnostic questions");
    return `<div style="max-width:44rem;margin-top:2rem">` + alert("warning",
      `<b>Complete step 1 first.</b> Still missing: ${missing.join(" and ")}. The classification determines which pathway template, indicators, and guidance apply to your startup, so the assessment cannot continue without it.`) +
      `<button class="btn primary" data-goto="1">← Go to step 1 (Profile &amp; classify)</button></div>`;
  }

  // ============================================================= step 2 ==

  function step2() {
    ensurePathway();
    const cls = classification();
    const template = REF.PATHWAY_TEMPLATES[cls.pathway_template];
    let tracks = "";
    Object.entries(S.pathway).forEach(([track, stages], ti) => {
      tracks += `<h2 class="track-title">${h(track)}</h2>`;
      stages.forEach((s, i) => {
        const id = `pw-${ti}-${i}`;
        const attrs = k => `data-f="pw" data-track="${h(track)}" data-i="${i}" data-k="${k}"`;
        tracks += `<div class="panel stage-card"><p class="stage-name">${h(s.stage)}</p><p class="caption">${h(stageHint(track, s.stage))}</p>
          <div class="field"><label for="${id}-d">Description</label><textarea id="${id}-d" rows="2" ${attrs("description")}>${h(s.description)}</textarea></div>
          <div class="grid-3-2">
            <div class="field"><label for="${id}-a">Assumption linking this step to the next</label><input type="text" id="${id}-a" ${attrs("assumption")} value="${h(s.assumption)}"></div>
            <div class="field"><label for="${id}-e">Evidence strength</label>${selectHTML(`${id}-e`, attrs("evidence"), REF.EVIDENCE, s.evidence)}</div>
          </div></div>`;
      });
    });

    return hero(2, "Map your impact pathway",
      "Trace the causal chain from what you do to the environmental impact you claim, and state the assumption behind every link. This is what makes impact claims honest.") +
      `<div class="cols"><div>
        <div class="template-note"><b>Template applied (${h(cls.label)}):</b> ${h(template.name)}<p>${h(template.description)}</p></div>
        ${tracks}
        ${live("weak", () => {
          const weak = [];
          Object.entries(S.pathway).forEach(([t, st]) => st.forEach(s => { if (s.evidence === "Weak (assumption only)") weak.push(`${t} → ${s.stage}`); }));
          return weak.length ? alert("warning", `<b>Weakest links (assumption only):</b> ${h(weak.join("; "))}. These are the points where contribution analysis and future measurement are most needed.`) : "";
        })}
        <div class="panel"><div class="field" style="margin:0"><label for="weakest_links">Summarize the weakest link(s) and why they are uncertain</label>
          <textarea id="weakest_links" data-f="weakest_links" rows="3" placeholder="e.g. The assumption that farmers follow dosing recommendations is the weakest link: adoption ≠ behavior change.">${h(S.weakest_links)}</textarea></div></div>
        ${navButtons(1, 3)}
      </div>
      <aside class="aside">${live("aside", () => {
        const flat = Object.values(S.pathway).flat();
        return card("Pathway at a glance", kv([
          ["Tracks", String(Object.keys(S.pathway).length)],
          ["Stages described", `${flat.filter(s => s.description).length} / ${flat.length}`],
          ["Weak links flagged", String(flat.filter(s => s.evidence === "Weak (assumption only)").length)],
        ]), "🗺️") + card("Why this matters", "<p>Every stage carries an assumption. Naming the weak ones now is not a weakness. It tells you exactly where measurement is most needed.</p>", "❝", true);
      })}</aside></div>` +
      tip("A weak link is a finding, not a failure. Investors trust an honest chain more than a perfect story.");
  }

  // ============================================================= step 3 ==

  function step3() {
    const tabs = [["select", "① Select & score"], ["detail", "② Indicator details"], ["matrix", "③ Scoring matrix"], ["calc", "④ Quick Scope 1+2 estimator"]];
    if (!tabs.some(([k]) => k === UI.tab3)) UI.tab3 = "select";
    const tabBar = `<div class="tabs" role="tablist">${tabs.map(([k, l]) =>
      `<button role="tab" id="tab-${k}" aria-selected="${UI.tab3 === k}" data-action="tab3" data-tab="${k}">${l}</button>`).join("")}</div>`;
    const body = { select: tabSelect, detail: tabDetail, matrix: tabMatrix, calc: tabCalc }[UI.tab3]();

    return hero(3, "Select your indicators",
      "Score each candidate on relevance (is it material to your pathway?) and feasibility (can you populate it with data you hold?). Aim for a core set of 3–5.") +
      `<div class="cols"><div>${tabBar}<div role="tabpanel" aria-labelledby="tab-${UI.tab3}">${body}</div>${navButtons(2, 4)}</div>
      <aside class="aside">${live("aside", () => {
        const b = SCORING.groupByBucket(S.selected_indicators);
        return card("Indicator set", kv([
          ["Selected", String(Object.keys(S.selected_indicators).length)],
          ["Core set", `${b[SCORING.BUCKET_CORE].length} (aim for 3–5)`],
          ["Aspirational", String(b[SCORING.BUCKET_ASPIRATIONAL].length)],
          ["Excluded", String(b[SCORING.BUCKET_EXCLUDED].length)],
        ]), "🎯") + card("Why this matters", "<p>Metrics that are easy to report but not material are how greenwashing happens by accident. The scoring excludes them by design.</p>", "❝", true);
      })}</aside></div>` +
      tip("Fewer, well-evidenced indicators beat a long list. Link each core indicator to the pathway stage it proves.");
  }

  function tabSelect() {
    let out = "";
    Object.entries(REF.INDICATOR_BANK).forEach(([category, indicators]) => {
      const custom = S.custom_indicators[category] || [];
      const rows = indicators.map(r => ({ name: r[0], source: r[1], unit: r[2], citation: r[3], custom: false }))
        .concat(custom.map(n => ({ name: n, source: "Custom indicator", unit: "", citation: null, custom: true })));
      const nSel = rows.filter(r => S.selected_indicators[r.name]).length;
      let body = "";
      rows.forEach(r => {
        const id = "ind-" + slug(r.name);
        const e = S.selected_indicators[r.name];
        const dn = `data-name="${h(r.name)}"`;
        body += `<div class="ind"><div class="ind-top">
          <div><label class="check" for="${id}"><input type="checkbox" id="${id}" data-f="sel" ${dn} data-cat="${h(category)}"${e ? " checked" : ""}><span>${h(r.name)}</span></label>
            <div class="src">Data source: ${h(r.source)}${r.unit ? ` · typical unit: ${h(r.unit)}` : ""}${r.custom ? ` · <button class="btn small" style="min-height:auto;padding:.05rem .6rem;font-size:.74rem" data-action="rm-custom" ${dn} data-cat="${h(category)}">Remove</button>` : ""}</div></div>
          ${e ? `<div class="field"><label for="${id}-f">Feasibility</label>${selectHTML(`${id}-f`, `data-f="ind" ${dn} data-k="feasibility"`, SCORING.LEVELS, e.feasibility)}</div>
                 <div class="field"><label for="${id}-r">Relevance</label>${selectHTML(`${id}-r`, `data-f="ind" ${dn} data-k="relevance"`, SCORING.LEVELS, e.relevance)}</div>
                 <div class="bucket-cell">${bucketTag(SCORING.bucket(e.feasibility, e.relevance))}</div>` : ""}
        </div></div>`;
      });
      const cid = "custom-" + slug(category);
      body += `<div class="add-custom"><label class="sr-only" for="${cid}">Add a custom indicator to ${h(category)}</label>
        <input type="text" id="${cid}" placeholder="Add a custom indicator to “${h(category)}”" data-enter="add-custom" data-cat="${h(category)}">
        <button class="btn small" data-action="add-custom" data-cat="${h(category)}" data-input="${cid}">Add</button></div>`;
      out += expander("cat-" + slug(category), `${h(category)}${nSel ? `<span class="count">${nSel} selected</span>` : ""}`, body, nSel > 0);
    });

    const n = Object.keys(S.selected_indicators).length;
    if (n) {
      const b = SCORING.groupByBucket(S.selected_indicators);
      const core = b[SCORING.BUCKET_CORE].length;
      out += `<div class="bucket-summary">` + alert(core >= 1 && core <= 5 ? "ok" : "warning", `<b>Core set: ${core} indicator(s).</b> Recommended: 3–5 at early stages.`) +
        SCORING.BUCKET_ORDER.filter(k => b[k].length).map(k => `<p><b>${h(k)}</b>: ${h(b[k].map(([nm]) => nm).join("; "))}</p>`).join("") + `</div>`;
    }
    return out;
  }

  function tabDetail() {
    const sel = Object.entries(S.selected_indicators);
    if (!sel.length) return alert("info", "Select indicators in the first tab (<b>① Select &amp; score</b>) to fill in their details.");
    const stageOptions = [["", "(not linked)"]].concat(pathwayStageNames().map(n => [n, n]));
    return sel.map(([name, e]) => {
      const id = "det-" + slug(name);
      const a = k => `data-f="ind" data-name="${h(name)}" data-k="${k}"`;
      const link = stageOptions.some(([v]) => v === e.pathway_link) ? (e.pathway_link || "") : "";
      const body = `<div class="grid3" style="margin-bottom:.9rem">
          <div class="field"><label for="${id}-u">Unit</label><input type="text" id="${id}-u" ${a("unit")} value="${h(e.unit)}"></div>
          <div class="field"><label for="${id}-v">Current value <span class="hint">(blank if none yet)</span></label><input type="text" id="${id}-v" ${a("current_value")} value="${h(e.current_value)}"></div>
          <div class="field"><label for="${id}-t">Target <span class="hint">(optional)</span></label><input type="text" id="${id}-t" ${a("target")} value="${h(e.target)}"></div></div>
        <div class="grid2" style="margin-bottom:.9rem">
          <div class="field"><label for="${id}-q">Measurement frequency</label>${selectHTML(`${id}-q`, a("frequency"), REF.FREQUENCIES, e.frequency || "")}</div>
          <div class="field"><label for="${id}-s">Actual data source you will use</label><input type="text" id="${id}-s" ${a("data_source")} value="${h(e.data_source)}"></div></div>
        <div class="field" style="margin:0"><label for="${id}-l">Which impact-pathway stage does this indicator evidence?</label>${selectHTML(`${id}-l`, a("pathway_link"), stageOptions, link)}</div>`;
      return expander(id, `${h(name)} <span class="sum-sub">· ${h(SCORING.bucket(e.feasibility, e.relevance))}</span>`, body, false);
    }).join("");
  }

  function tabMatrix() {
    const sel = Object.entries(S.selected_indicators);
    if (!sel.length) return alert("info", "Select indicators in the first tab to see the matrix.");
    const L = { Low: 0, Medium: 1, High: 2 };
    const W = 560, H = 460, ml = 86, mt = 28, cw = (W - ml - 16) / 3, ch = (H - mt - 62) / 3;
    const cells = {};
    sel.forEach(([name, e], idx) => {
      const key = `${L[e.feasibility]}|${L[e.relevance]}`;
      (cells[key] = cells[key] || []).push([idx + 1, name, e]);
    });
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Feasibility–relevance scoring matrix" font-family="Inter, sans-serif">`;
    for (let fx = 0; fx < 3; fx++) for (let ry = 0; ry < 3; ry++) {
      const b = SCORING.bucket(SCORING.LEVELS[fx], SCORING.LEVELS[ry]);
      const x = ml + fx * cw, y = mt + (2 - ry) * ch;
      svg += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${BUCKET_STYLE[b][1]}" fill-opacity=".07" stroke="#E7E7DB"/>`;
      svg += `<text x="${x + 8}" y="${y + 16}" font-size="10.5" fill="${BUCKET_STYLE[b][1]}" fill-opacity=".85" font-weight="600">${h(b.replace(" (future indicator)", "").replace(" (low relevance)", ""))}</text>`;
      const pts = cells[`${fx}|${ry}`] || [];
      const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(pts.length))));
      pts.forEach(([num, name], k) => {
        const r = Math.floor(k / cols), c = k % cols;
        const rows = Math.ceil(pts.length / cols);
        const px = x + cw / 2 + (c - (cols - 1) / 2) * 30;
        const py = y + ch / 2 + 8 + (r - (rows - 1) / 2) * 30;
        svg += `<g><title>${h(name)} (${h(b)})</title><circle cx="${px}" cy="${py}" r="12" fill="${BUCKET_STYLE[b][1]}" stroke="#fff" stroke-width="2"/><text x="${px}" y="${py + 4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${num}</text></g>`;
      });
    }
    ["Low", "Medium", "High"].forEach((lv, i) => {
      svg += `<text x="${ml + i * cw + cw / 2}" y="${mt + 3 * ch + 18}" font-size="12" fill="#1C2A22" text-anchor="middle">${lv}</text>`;
      svg += `<text x="${ml - 10}" y="${mt + (2 - i) * ch + ch / 2 + 4}" font-size="12" fill="#1C2A22" text-anchor="end">${lv}</text>`;
    });
    svg += `<text x="${ml + 1.5 * cw}" y="${H - 14}" font-size="12.5" font-weight="700" fill="#1C2A22" text-anchor="middle">Feasibility →</text>`;
    svg += `<text transform="translate(18 ${mt + 1.5 * ch}) rotate(-90)" font-size="12.5" font-weight="700" fill="#1C2A22" text-anchor="middle">Relevance →</text></svg>`;
    const list = sel.map(([name, e], i) => `<li><b>${i + 1}.</b> ${h(name)} <span class="hint">· ${h(SCORING.bucket(e.feasibility, e.relevance))}</span></li>`).join("");
    return `<div class="matrix-wrap"><h3 style="margin:0 0 .6rem;font-size:1rem">Feasibility–Relevance Scoring Matrix</h3>${svg}
      <ol style="list-style:none;padding:0;margin:.8rem 0 0;font-size:.84rem;display:grid;gap:.25rem">${list}</ol></div>
      <p class="caption">Top-right = core set. Top-left = aspirational (relevant but not yet feasible). Bottom row = excluded regardless of feasibility.</p>`;
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
      return `<div class="est-row"><div class="field"><label for="${id}">${h(src)} per year</label>
          <input type="number" id="${id}" min="0" step="any" inputmode="decimal" data-f="est" data-src="${h(src)}" value="${h(S.estimator[src] || "")}" placeholder="0"></div>
        ${live(`est-${i}`, () => `<div class="calc">× ${m.factor} ${h(m.unit_note)} → <b>${tco2((parseFloat(S.estimator[src]) || 0) * m.factor)} t CO₂e</b> (Scope ${m.scope})</div>`)}</div>`;
    }).join("");
    return `<div class="panel"><p style="margin-top:0">Screening-level estimate of operational Scope 1 &amp; 2 emissions using <b>generic emission factors</b>. Results are <b>modelled</b> claims: replace the factors with country- and year-specific published values before external reporting.</p>
      ${rows}
      ${live("est-total", () => {
        const [s1, s2] = estimatorTotals();
        return `<div class="metrics"><div class="metric"><div class="m-label">Estimated Scope 1</div><div class="m-value">${tco2(s1)} <span style="font-size:.8rem;font-weight:600">t CO₂e / yr</span></div></div>
          <div class="metric"><div class="m-label">Estimated Scope 2 (location-based)</div><div class="m-value">${tco2(s2)} <span style="font-size:.8rem;font-weight:600">t CO₂e / yr</span></div></div></div>`;
      })}
      <p class="caption" style="margin-top:.8rem">If you use these values to populate an emissions indicator, label the claim <b>Modelled</b> in step 4 and record the factors used as its assumptions.</p></div>`;
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
      };
    });
    return toLabel;
  }

  function step4() {
    const toLabel = syncUncertainty();
    let body = toLabel.length ? "" : alert("warning", "No core, aspirational or supplementary indicators yet. Go back to step 3 and select some.") +
      `<button class="btn" data-goto="3">← Go to step 3</button>`;
    toLabel.forEach(name => {
      const e = S.selected_indicators[name];
      const u = S.uncertainty[name];
      const id = "unc-" + slug(name);
      const a = k => `data-f="unc" data-name="${h(name)}" data-k="${k}"`;
      const radios = Object.keys(REF.CONFIDENCE_LEVELS).map((lv, i) =>
        `<label class="choice" for="${id}-l${i}"><input type="radio" id="${id}-l${i}" name="${id}-lvl" value="${lv}" ${a("level")}${u.level === lv ? " checked" : ""}><span>${lv}</span></label>`).join("");
      body += `<div class="panel"><div class="unc-head"><div class="name">${h(name)}</div>
          <div class="sub">${h(e.category)} · ${h(SCORING.bucket(e.feasibility, e.relevance))}${e.current_value ? ` · current value: ${h(e.current_value)} ${h(e.unit || "")}` : ""}</div></div>
        <div class="field"><label for="${id}-c">The impact claim as you would state it publicly <span class="hint">(optional)</span></label>
          <input type="text" id="${id}-c" ${a("claim")} value="${h(u.claim)}" placeholder="e.g. “Our users reduce pesticide application by 14% per hectare.”"></div>
        <fieldset class="question"><legend>Evidential confidence</legend><div class="opts inline">${radios}</div></fieldset>
        <p class="conf-desc">${h(REF.CONFIDENCE_LEVELS[u.level])}</p>
        ${u.level === "Projected" ? alert("warning", "<b>Projected:</b> report this in the impact-pathway narrative, clearly separated from evidence.") : ""}
        <div class="field"><label for="${id}-a">Assumptions and data sources driving this estimate</label><textarea id="${id}-a" rows="2" ${a("assumptions")}>${h(u.assumptions)}</textarea></div>
        <div class="field" style="margin:0"><label for="${id}-k">Conditions under which the estimate could be significantly different</label><textarea id="${id}-k" rows="2" ${a("conditions")}>${h(u.conditions)}</textarea></div>
      </div>`;
    });

    return hero(4, "Label your uncertainty",
      "Every impact claim gets an evidential confidence level (measured, modelled, or projected) plus the assumptions behind it. All three are legitimate; conflating them is not.") +
      `<div class="cols"><div>${body}${navButtons(3, 5)}</div>
      <aside class="aside">${live("aside", () => {
        const c = { Measured: 0, Modelled: 0, Projected: 0 };
        Object.values(S.uncertainty).forEach(u => { if (u.level in c) c[u.level]++; });
        return card("Evidence mix", kv([
          ['<span class="dot-i" style="background:#2E7D52"></span>Measured', String(c.Measured)],
          ['<span class="dot-i" style="background:#B8860B"></span>Modelled', String(c.Modelled)],
          ['<span class="dot-i" style="background:#7C5296"></span>Projected', String(c.Projected)],
        ]), "⚖️") + card("Why this matters", "<p>Only measured claims count as evidence. Projected claims belong in the narrative. Labelling the difference is what makes the report trustworthy.</p>", "❝", true);
      })}</aside></div>` +
      tip("A modelled or projected claim is fine. An unlabelled one is not. State the assumptions and move on.");
  }

  // ============================================================= step 5 ==

  function step5() {
    ensurePathway();
    const checks = SCORING.integrityChecks(S.selected_indicators, S.uncertainty);
    const checksHTML = checks.map(([sev, msg]) => alert(sev, h(msg))).join("");

    return hero(5, "Review, report & export",
      "Set the next review milestone, run the integrity checks, and export your report. This assessment is designed for updating, not for completion.", false) +
      `<div class="cols"><div>
        <div class="panel"><h2>Review &amp; updating plan</h2>
          <div class="grid2 grid-review" style="margin-top:.8rem">
            <div class="field"><label for="milestone">Next review milestone</label>${selectHTML("milestone", 'data-f="next_review_milestone"', REF.REVIEW_MILESTONES, S.next_review_milestone, "Select a milestone…")}</div>
            <div class="field"><label for="review_notes">Notes for the next review <span class="hint">(optional)</span></label><input type="text" id="review_notes" data-f="review_notes" value="${h(S.review_notes)}"></div>
          </div></div>
        <h2 style="font-size:1.1rem;margin:1.4rem 0 .7rem">Integrity checks</h2>
        ${checksHTML}
        <h2 style="font-size:1.1rem;margin:1.4rem 0 .7rem">Export</h2>
        <div class="export-grid">
          <div class="export-card primary-card"><h4>📄 The report, for sharing</h4>
            <button class="btn primary block" data-action="docx">Download Word report (.docx)</button>
            <p>The complete document: headings, table of contents, indicator tables, confidence badges. When Word asks to update fields on opening, choose <b>Yes</b> to fill in the table of contents.</p></div>
          <div class="export-card"><h4>💾 The save file, for continuing later</h4>
            <button class="btn block" data-action="json">Save progress (.json)</button>
            <p><b>JSON is the only format that loads back into the tool.</b> Keep it to resume at your next review milestone. Loading it starts a new review cycle.</p></div>
        </div>
        ${expander("other-formats", "Other formats (PDF, HTML, Markdown)", `<div style="display:flex;gap:.6rem;flex-wrap:wrap">
            <button class="btn small" data-action="print">🖨️ Print / save as PDF</button>
            <button class="btn small" data-action="html">⬇️ HTML</button>
            <button class="btn small" data-action="md">⬇️ Markdown</button></div>
          <p class="caption">Alternative formats of the same report. None of them can be loaded back in. Use the JSON save file for that.</p>`, false)}
        ${expander("preview", "📄 Report preview", live("preview", () => `<div class="report-preview">${REPORT.toHtmlBody(REPORT.assemble(S))}</div>`), false)}
        <div class="btn-row"><button class="btn" data-goto="4">← Back</button></div>
      </div>
      <aside class="aside">${live("aside", () => {
        const b = SCORING.groupByBucket(S.selected_indicators);
        return card("Assessment summary", kv([
          ["Startup", S.startup_name || "Not set"],
          ["Classification", classification().label],
          ["Core indicators", String(b[SCORING.BUCKET_CORE].length)],
          ["Warnings", String(checks.filter(([s]) => s === "warning").length)],
          ["Next review", S.next_review_milestone || "Not set"],
        ]), "📋") + card("Review cycles", `<p>You are on review cycle <b>v${S.assessment_version}</b>. Loading the exported JSON later starts cycle v${S.assessment_version + 1}. The framework treats this as a living document.</p>`, "🔁", true);
      })}</aside></div>` +
      tip("Warnings are guidance, not blockers, but each one you resolve makes the report harder to challenge.", "Before you export");
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
        b.textContent = inProgress ? "Continue your assessment" : "Start the assessment";
      });
      cont.hidden = !inProgress;
      if (inProgress) cont.textContent = `Your assessment for “${S.startup_name}” is saved in this browser. Continue picks up where you left off.`;
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
        S[f] = val; return false;
      case "stage": S.stage = val; return false;
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
        return false;
      }
      case "sel": {
        const name = el.dataset.name, cat = el.dataset.cat;
        if (val) {
          const bank = (REF.INDICATOR_BANK[cat] || []).find(r => r[0] === name);
          S.selected_indicators[name] = S.selected_indicators[name] || {
            category: cat, feasibility: "Medium", relevance: "Medium",
            unit: bank ? bank[2] : "", current_value: "", target: "", frequency: "",
            data_source: bank ? bank[1] : "Custom indicator", pathway_link: "", citation: bank ? bank[3] : null,
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
        return el.tagName === "SELECT";
      }
      case "unc": {
        const u = S.uncertainty[el.dataset.name];
        if (u) u[el.dataset.k] = val;
        return el.type === "radio";
      }
      case "est": S.estimator[el.dataset.src] = val; return false;
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
      case "intro": S.seen_welcome = false; save(); closeNav(); render(); window.scrollTo(0, 0); break;
      case "restart":
        if (confirm("Start a new assessment? Everything entered so far will be cleared from this browser. Download the JSON save file first if you want to keep it.")) {
          S = DEFAULTS(); S.seen_welcome = true; UI.open = {}; UI.tab3 = "select";
          save(); closeNav(); render(); window.scrollTo(0, 0);
          toast("Started a new assessment.");
        }
        break;
      case "tab3": UI.tab3 = act.dataset.tab; save(); rerender(); break;
      case "add-custom": addCustom(act.dataset.cat, document.getElementById(act.dataset.input)); break;
      case "rm-custom": {
        const list = S.custom_indicators[act.dataset.cat] || [];
        S.custom_indicators[act.dataset.cat] = list.filter(n => n !== act.dataset.name);
        delete S.selected_indicators[act.dataset.name];
        save(); rerender();
        break;
      }
      case "docx": exportDocx(act); break;
      case "json": download(`${nameSlug()}_assessment_v${S.assessment_version}.json`, REPORT.exportState(S), "application/json"); toast("Save file downloaded."); break;
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
    if (!name) { toast("Type the indicator's name first.", true); return; }
    const exists = Object.values(REF.INDICATOR_BANK).flat().some(r => r[0] === name) ||
      Object.values(S.custom_indicators).flat().includes(name);
    if (exists) { toast("An indicator with that name already exists.", true); return; }
    (S.custom_indicators[cat] = S.custom_indicators[cat] || []).push(name);
    UI.open["cat-" + slug(cat)] = true;
    save(); rerender();
    const again = document.getElementById("custom-" + slug(cat));
    if (again) again.focus();
    toast(`Added “${name}”. Tick it to include it.`);
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
    btn.disabled = true; btn.textContent = "Preparing…";
    try {
      const blob = await REPORT.toDocx(assembled());
      download(`${nameSlug()}_impact_report.docx`, blob);
      toast("Word report downloaded.");
    } catch (err) {
      console.error(err);
      toast("Word export failed: " + (err && err.message || err) + ". Try the PDF or HTML export instead.", true);
    } finally {
      btn.disabled = false; btn.innerHTML = label;
    }
  }

  function printReport() {
    const w = window.open("", "_blank");
    if (!w) { toast("Pop-up blocked. Allow pop-ups for this site, or use the HTML download and print that.", true); return; }
    w.document.open();
    w.document.write(REPORT.toHtml(assembled()).replace("</body>", "<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body>"));
    w.document.close();
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
        toast(`Loaded. You are now on review cycle v${S.assessment_version}.`);
      } catch (err) {
        toast("Could not load file: " + (err && err.message || err), true);
      }
      input.value = "";
    };
    reader.onerror = () => { toast("Could not read that file.", true); input.value = ""; };
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

  document.querySelectorAll('[data-mark="bare"]').forEach(el => { el.innerHTML = LOGO_BARE; });
  document.querySelectorAll('[data-mark="tile"]').forEach(el => { el.innerHTML = LOGO_TILE; });
  render();
})();
