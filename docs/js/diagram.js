/*
 * diagram.js: the cause-and-effect diagram of an impact pathway (step 2 and
 * the report). Each stage is placed in one of three lanes:
 *
 *   Your startup       what the team controls (technology, product, delivery)
 *   Customers & users  steps that only happen if customers adopt the product
 *                      or change their behaviour
 *   Environment        the claimed environmental effect
 *
 * The point of the lanes: a technology can work perfectly and still produce
 * no impact if the customer steps fail. The arrow that crosses from the
 * startup lane into the customer lane is drawn in orange: that handover is
 * where a good technology has to become a viable product.
 *
 * Plain SVG strings, no dependencies. toPng() rasterises a diagram for the
 * Word export.
 */

const PATHWAY_DIAGRAM = {};

PATHWAY_DIAGRAM.EVIDENCE_COLOR = {
  "Not rated": "#9AA39D",
  "Weak (assumption only)": "#B4443C",
  "Moderate (some evidence)": "#B8860B",
  "Strong (validated / observed)": "#1E6A47",
};

PATHWAY_DIAGRAM.dependence = function (s) {
  return s && (s.change === "adoption" || s.change === "behaviour") ? s.change : "none";
};

PATHWAY_DIAGRAM.lane = function (s) {
  if (PATHWAY_DIAGRAM.dependence(s) !== "none") return 1;
  return /^impact/i.test(s.stage || "") ? 2 : 0;
};

(function () {
  const esc = t => String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Greedy word wrap by character count; the last allowed line is cut with …
  function wrap(text, maxChars, maxLines) {
    const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (next.length <= maxChars) { cur = next; continue; }
      if (cur) lines.push(cur);
      cur = w.length > maxChars ? w.slice(0, maxChars - 1) + "…" : w;
      if (lines.length === maxLines) break;
    }
    if (lines.length < maxLines && cur) lines.push(cur);
    if (lines.length > maxLines) lines.length = maxLines;
    const used = lines.join(" ").length;
    if (used < words.join(" ").length && lines.length) {
      let last = lines[lines.length - 1];
      if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
      lines[lines.length - 1] = last.replace(/[\s,.;:]+$/, "") + "…";
    }
    return lines;
  }

  const LANES = [
    { name: "Your startup", sub: "what you control", fill: "#F1F6F2", ink: "#1E6A47" },
    { name: "Customers & users", sub: "adoption and behaviour", fill: "#FFF5EB", ink: "#B4531A" },
    { name: "Environment", sub: "the claimed effect", fill: "#EEF4F8", ink: "#34608A" },
  ];
  const FONT = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif";

  /*
   * stages: [{stage, description, assumption, evidence, change}]
   * opts.actor: who has to change behaviour (from step 1), shown in the lane
   * Returns {svg, width, height}.
   */
  PATHWAY_DIAGRAM.svg = function (trackName, stages, opts = {}) {
    const n = Math.max(1, stages.length);
    const W = 900, labelW = 132, top = 6, legendH = 46;
    // lanes with no step in them shrink, so the diagram stays compact
    const used = [0, 1, 2].map(l => stages.some(s => PATHWAY_DIAGRAM.lane(s) === l));
    const laneHs = used.map(u => u ? 124 : 56);
    const laneY = [top, top + laneHs[0], top + laneHs[0] + laneHs[1]];
    const H = top + laneHs[0] + laneHs[1] + laneHs[2] + legendH;
    const colW = (W - labelW - 12) / n;
    const bw = Math.min(200, colW - 34), bh = 96;
    const chars = Math.floor((bw - 18) / 6.3);
    const o = [];

    o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}" role="img" aria-label="${esc(`Cause-and-effect diagram: ${trackName}`)}">`);
    o.push(`<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#5F6B63"/></marker>` +
      `<marker id="ah-o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#D9661F"/></marker></defs>`);
    o.push(`<rect width="${W}" height="${H}" fill="#FFFFFF"/>`);

    // lanes
    LANES.forEach((ln, i) => {
      const y = laneY[i];
      o.push(`<rect x="0" y="${y}" width="${W}" height="${laneHs[i] - 4}" rx="10" fill="${ln.fill}"/>`);
      o.push(`<text x="14" y="${y + 22}" font-size="12.5" font-weight="700" fill="${ln.ink}">${esc(ln.name)}</text>`);
      o.push(`<text x="14" y="${y + 38}" font-size="10.5" fill="#5F6B63">${esc(ln.sub)}</text>`);
      if (!used[i] && i === 1) {
        o.push(`<text x="${labelW + 10}" y="${y + 30}" font-size="10.5" font-style="italic" fill="#8A5A2B">No step here: nothing in this pathway depends on customers.</text>`);
      }
      if (i === 1 && used[1] && opts.actor) {
        wrap(opts.actor, 19, 3).forEach((l, k) =>
          o.push(`<text x="14" y="${y + 64 + k * 13}" font-size="10" font-style="italic" fill="#8A5A2B">${esc(l)}</text>`));
      }
    });

    // boxes
    const pos = stages.map((s, i) => {
      const lane = PATHWAY_DIAGRAM.lane(s);
      const x = labelW + i * colW + (colW - bw) / 2;
      const y = laneY[lane] + (laneHs[lane] - 4 - bh) / 2 + 2;
      return { x, y, lane };
    });

    // arrows first, so boxes sit on top
    for (let i = 0; i < stages.length - 1; i++) {
      const a = pos[i], b = pos[i + 1];
      const handover = a.lane === 0 && b.lane === 1;
      const x1 = a.x + bw, y1 = a.y + bh / 2, x2 = b.x - 2, y2 = b.y + bh / 2;
      const mx = (x1 + x2) / 2;
      o.push(`<path d="M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" fill="none" stroke="${handover ? "#D9661F" : "#5F6B63"}" stroke-width="${handover ? 2.6 : 1.6}"${handover ? "" : ""} marker-end="url(#${handover ? "ah-o" : "ah"})"/>`);
    }

    stages.forEach((s, i) => {
      const { x, y } = pos[i];
      const dep = PATHWAY_DIAGRAM.dependence(s);
      const ev = PATHWAY_DIAGRAM.EVIDENCE_COLOR[s.evidence] || PATHWAY_DIAGRAM.EVIDENCE_COLOR["Not rated"];
      const [head, ...rest] = String(s.stage || "").split(":");
      const title = rest.join(":").trim() || head;
      o.push(`<g><title>${esc(`${s.stage}\n${s.description || "(not described yet)"}\nEvidence: ${s.evidence || "Not rated"}`)}</title>`);
      o.push(`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="9" fill="#FFFFFF" stroke="${dep !== "none" ? "#D9661F" : "#C9D4CC"}" stroke-width="${dep !== "none" ? 1.8 : 1.2}"/>`);
      o.push(`<rect x="${x}" y="${y}" width="6" height="${bh}" rx="3" fill="${ev}"/>`);
      let ty = y + 17;
      o.push(`<text x="${x + 14}" y="${ty}" font-size="9.5" font-weight="700" letter-spacing=".06em" fill="#5F6B63">${esc(head.toUpperCase())}</text>`);
      wrap(title, chars, 2).forEach(l => { ty += 14; o.push(`<text x="${x + 14}" y="${ty}" font-size="11.5" font-weight="700" fill="#1C2A22">${esc(l)}</text>`); });
      const desc = (s.description || "").trim();
      wrap(desc || "Not described yet", chars + 2, ty > y + 40 ? 2 : 3).forEach(l => {
        ty += 13;
        o.push(`<text x="${x + 14}" y="${ty}" font-size="10" fill="${desc ? "#4A564F" : "#9AA39D"}"${desc ? "" : ' font-style="italic"'}>${esc(l)}</text>`);
      });
      if (dep !== "none") {
        const label = REF.DEPENDENCE_SHORT[dep];
        const pw = label.length * 5.6 + 16;
        o.push(`<rect x="${x + bw - pw - 6}" y="${y - 9}" width="${pw}" height="18" rx="9" fill="#D9661F"/>`);
        o.push(`<text x="${x + bw - pw / 2 - 6}" y="${y + 3.5}" font-size="9.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">${esc(label)}</text>`);
      }
      o.push(`</g>`);
    });

    // legend
    const ly = laneY[2] + laneHs[2] + 18;
    let lx = 14;
    o.push(`<text x="${lx}" y="${ly}" font-size="10.5" font-weight="700" fill="#1C2A22">Evidence:</text>`);
    lx += 62;
    Object.entries(PATHWAY_DIAGRAM.EVIDENCE_COLOR).forEach(([k, c]) => {
      const lbl = k.split(" (")[0];
      o.push(`<rect x="${lx}" y="${ly - 9}" width="10" height="10" rx="2" fill="${c}"/><text x="${lx + 14}" y="${ly}" font-size="10.5" fill="#4A564F">${esc(lbl)}</text>`);
      lx += 24 + lbl.length * 6;
    });
    lx += 14;
    o.push(`<path d="M${lx} ${ly - 4} L${lx + 26} ${ly - 4}" stroke="#D9661F" stroke-width="2.6" marker-end="url(#ah-o)"/>`);
    o.push(`<text x="${lx + 34}" y="${ly}" font-size="10.5" fill="#4A564F">handover to customers</text>`);
    o.push(`<text x="14" y="${ly + 19}" font-size="10" fill="#5F6B63">Orange boxes only happen if customers adopt the product or change what they do. A working technology alone does not get you past them.</text>`);
    o.push(`</svg>`);
    return { svg: o.join(""), width: W, height: H };
  };

  // Rasterise an SVG string to PNG bytes (for the Word export). Browser only.
  PATHWAY_DIAGRAM.toPng = function (svg, width, height, scale = 2) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = width * scale; c.height = height * scale;
          const ctx = c.getContext("2d");
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          c.toBlob(b => b ? b.arrayBuffer().then(buf => resolve(new Uint8Array(buf)), reject) : reject(new Error("canvas export failed")), "image/png");
        } catch (e) { reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("could not render the diagram")); };
      img.src = url;
    });
  };
})();
