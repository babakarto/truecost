// AI Credits to Price — shows USD price pills next to credit costs.
// Per-site strategies; overlay layer in <body> so SPA re-renders can't wipe us.

const DEFAULTS = {
  magnific:   { cost: 864, credits: 1000000 },  // $864 / 1M credits
  higgsfield: { cost: 292, credits: 6000 },     // $292 / 6000 credits
};

let USD_PER_CREDIT = 0;

function service() {
  const h = location.hostname;
  if (h.includes("higgsfield")) return "higgsfield";
  return "magnific"; // magnific.com / magnific.ai / freepik.com
}

function loadConfig() {
  chrome.storage.sync.get({ config: DEFAULTS }, ({ config }) => {
    const c = config[service()] || DEFAULTS[service()];
    USD_PER_CREDIT = c.credits > 0 ? c.cost / c.credits : 0;
    render();
  });
}
chrome.storage.onChanged.addListener((ch) => { if (ch.config) loadConfig(); });

const CREDIT_WORD_RE = /(\d[\d.,]*)\s*credits?\b/i;
const NUM_ONLY_RE = /^(\d[\d.,]*)$/;

function parseCredits(str) {
  const n = parseInt(str.replace(/[.,\s]/g, ""), 10);
  return isNaN(n) ? null : n;
}

function priceLabel(credits) {
  return "≈ $" + (credits * USD_PER_CREDIT).toFixed(2);
}

// ---- overlay layer ----
const layer = document.createElement("div");
layer.id = "mgc-price-layer";
layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
(document.body || document.documentElement).appendChild(layer);

function anchorOf(el) {
  let n = el;
  for (let i = 0; i < 5 && n; i++, n = n.parentElement) {
    const r = n.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) return n;
  }
  return null;
}

// MAGNIFIC: #credits sprite icon next to a bare number
function findMagnificCosts(out) {
  document.querySelectorAll("svg use").forEach((u) => {
    const href = u.getAttribute("href") || u.getAttribute("xlink:href") || "";
    if (!href.endsWith("#credits")) return;
    const svg = u.closest("svg");
    if (!svg) return;
    let box = svg.parentElement;
    for (let d = 0; d < 3 && box; d++, box = box.parentElement) {
      const t = (box.textContent || "").trim();
      if (t.length > 30) break;
      const m = t.match(NUM_ONLY_RE);
      if (!m) continue;
      const credits = parseCredits(m[1]);
      if (credits > 0) {
        const a = anchorOf(box);
        if (a) out.push({ credits, anchor: a });
      }
      return;
    }
  });
}

// HIGGSFIELD: "Generate" buttons — cost = LAST numeric text node
// (a preceding numeric node is the crossed-out pre-discount price)
function findHiggsfieldCosts(out) {
  document.querySelectorAll("button").forEach((b) => {
    const text = b.textContent || "";
    if (!/generate/i.test(text) || text.length > 40) return;
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let last = null;
    while (walker.nextNode()) {
      const t = walker.currentNode.textContent.trim();
      if (NUM_ONLY_RE.test(t)) last = t;
    }
    if (!last) return;
    const credits = parseCredits(last);
    if (credits > 0) out.push({ credits, anchor: b });
  });
}

// BOTH: explicit "1680 credits" text (pricing pages, tooltips)
function findWordCosts(out) {
  const all = document.body.querySelectorAll("*:not(script):not(style)");
  for (const el of all) {
    const text = el.textContent;
    if (!text || text.length > 120) continue;
    if (!CREDIT_WORD_RE.test(text)) continue;
    let deepest = true;
    for (const child of el.children) {
      if (CREDIT_WORD_RE.test(child.textContent)) { deepest = false; break; }
    }
    if (!deepest) continue;
    const credits = parseCredits(text.match(CREDIT_WORD_RE)[1]);
    if (credits > 0) {
      const a = anchorOf(el);
      if (a) out.push({ credits, anchor: a });
    }
  }
}

function render() {
  if (!USD_PER_CREDIT) return;
  const found = [];
  if (service() === "higgsfield") findHiggsfieldCosts(found);
  else findMagnificCosts(found);
  findWordCosts(found);

  const seen = new Set();
  layer.textContent = "";
  for (const { credits, anchor } of found) {
    if (seen.has(anchor)) continue;
    seen.add(anchor);
    const r = anchor.getBoundingClientRect();
    if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
    const pill = document.createElement("div");
    pill.textContent = priceLabel(credits);
    pill.style.cssText =
      "position:fixed;left:" + (r.right + 8) + "px;top:" + (r.top + r.height / 2 - 10) + "px;" +
      "background:#1a1d29;border:1px solid #3a4152;color:#ffd766;" +
      "font:600 12px/20px Inter,system-ui,sans-serif;padding:0 8px;border-radius:10px;" +
      "white-space:nowrap;pointer-events:none;";
    layer.appendChild(pill);
    // no room on the right? tuck it just above the anchor's right corner
    const pw = pill.getBoundingClientRect().width;
    if (r.right + 8 + pw > innerWidth - 4) {
      pill.style.left = Math.max(4, r.right - pw) + "px";
      pill.style.top = (r.top >= 26 ? r.top - 24 : r.bottom + 4) + "px";
    }
  }
}

// ---- keep in sync with the SPA ----
let t = null;
function schedule() {
  clearTimeout(t);
  t = setTimeout(render, 300);
}
new MutationObserver(schedule).observe(document.documentElement, {
  childList: true, subtree: true, characterData: true,
});
addEventListener("scroll", schedule, true);
addEventListener("resize", schedule);
setInterval(render, 1200);

loadConfig();
