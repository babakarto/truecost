// AI Credits to Price — shows USD price pills next to credit costs.
// Per-site strategies; overlay layer in <body> so SPA re-renders can't wipe us.

const DEFAULTS = {
  onboarded: false,
  services: {
    magnific:   { enabled: false, cost: 864, credits: 1000000 },  // $864 / 1M credits
    higgsfield: { enabled: false, cost: 292, credits: 6000 },     // $292 / 6000 credits
  },
};

let USD_PER_CREDIT = 0;

function service() {
  const h = location.hostname;
  if (h.includes("higgsfield")) return "higgsfield";
  return "magnific"; // magnific.com / magnific.ai / freepik.com
}

function normalize(raw) {
  const out = JSON.parse(JSON.stringify(DEFAULTS));
  if (!raw) return out;
  if (raw.services) {
    for (const k of Object.keys(out.services)) {
      if (raw.services[k]) Object.assign(out.services[k], raw.services[k]);
    }
    return out;
  }
  // v1.0 shape without enabled flags — both services were active
  for (const k of Object.keys(out.services)) {
    if (raw[k]) Object.assign(out.services[k], raw[k], { enabled: true });
  }
  return out;
}

function loadConfig() {
  chrome.storage.sync.get({ config: null }, ({ config }) => {
    const c = normalize(config).services[service()];
    USD_PER_CREDIT = c.enabled && c.credits > 0 ? c.cost / c.credits : 0;
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

// Numeric text nodes inside `root`, in document order, each tagged with
// whether it sits inside a struck-out element (<s>, <del>, line-through).
function numericNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const t = node.textContent.trim();
    if (!NUM_ONLY_RE.test(t)) continue;
    const credits = parseCredits(t);
    if (!(credits > 0)) continue;
    found.push({ credits, struck: isStruck(node.parentElement, root) });
  }
  return found;
}

function isStruck(el, stopAt) {
  for (let n = el; n && n !== stopAt; n = n.parentElement) {
    if (n.tagName === "S" || n.tagName === "DEL" || n.tagName === "STRIKE") return true;
    const cls = typeof n.className === "string" ? n.className : "";
    if (/(^|\s)line-through(\s|$)/.test(cls)) return true;
  }
  return false;
}

// Discount-aware cost pick: the price to pay is the LAST non-struck number;
// a struck number before it is the original (pre-discount) price.
function pickCost(root) {
  const nums = numericNodes(root);
  if (!nums.length) return null;
  const live = nums.filter((n) => !n.struck);
  if (!live.length) return null;
  const credits = live[live.length - 1].credits;
  const struck = nums.filter((n) => n.struck);
  const original = struck.length ? struck[struck.length - 1].credits : null;
  return { credits, original: original && original > credits ? original : null };
}

// MAGNIFIC: #credits sprite icon next to a bare number
// (with a promo, the badge reads "<s>4286</s> 3000")
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
      const cost = pickCost(box);
      if (!cost) continue;
      const a = anchorOf(box);
      if (a) out.push({ ...cost, anchor: a });
      return;
    }
  });
}

// HIGGSFIELD: "Generate" buttons — cost = LAST non-struck numeric text node
// (a preceding numeric node is the crossed-out pre-discount price)
function findHiggsfieldCosts(out) {
  document.querySelectorAll("button").forEach((b) => {
    const text = b.textContent || "";
    if (!/generate/i.test(text) || text.length > 40) return;
    const cost = pickCost(b);
    if (cost) out.push({ ...cost, anchor: b });
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
  if (!USD_PER_CREDIT) { layer.textContent = ""; return; }
  const found = [];
  if (service() === "higgsfield") findHiggsfieldCosts(found);
  else findMagnificCosts(found);
  findWordCosts(found);

  const seen = new Set();
  layer.textContent = "";
  for (const { credits, original, anchor } of found) {
    if (seen.has(anchor)) continue;
    seen.add(anchor);
    const r = anchor.getBoundingClientRect();
    if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
    const pill = document.createElement("div");
    pill.textContent = priceLabel(credits);
    if (original) {
      const was = document.createElement("span");
      was.textContent = "$" + (original * USD_PER_CREDIT).toFixed(2);
      was.style.cssText = "margin-left:6px;color:#8b93a7;text-decoration:line-through;font-weight:500;";
      pill.appendChild(was);
    }
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
