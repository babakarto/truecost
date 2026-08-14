const $ = (id) => document.getElementById(id);
const PER = { magnific: 1000, higgsfield: 10 };
let cfg = null;

function rateText(s) {
  const svc = cfg.services[s];
  return PER[s].toLocaleString("en-US") + " credits = $" +
         (PER[s] * svc.cost / svc.credits).toFixed(2);
}

// DOM-API builders only — no innerHTML anywhere (defense in depth: nothing
// dynamic can ever be parsed as HTML, even if a future change makes it dynamic).
function buildRow(s, f, labelText, hintText, value, min, step) {
  const row = document.createElement("div");
  row.className = "row";
  const label = document.createElement("label");
  label.textContent = labelText;
  const hint = document.createElement("span");
  hint.className = "hint";
  hint.textContent = hintText;
  label.appendChild(hint);
  const inp = document.createElement("input");
  inp.type = "number"; inp.min = min; inp.step = step;
  inp.dataset.s = s; inp.dataset.f = f; inp.value = value;
  row.append(label, inp);
  return row;
}

function render() {
  const host = $("cards");
  host.textContent = "";

  // enabled services → full config card
  for (const s of Object.keys(cfg.services)) {
    if (!cfg.services[s].enabled) continue;
    const meta = TC_META[s];
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("div");
    title.className = "card-title";
    const logo = document.createElement("img");
    logo.src = meta.logo; logo.alt = "";
    const name = document.createElement("span");
    name.textContent = meta.label;
    const rm = document.createElement("button");
    rm.className = "remove"; rm.dataset.s = s; rm.textContent = "Remove";
    title.append(logo, name, rm);

    const rate = document.createElement("div");
    rate.className = "rate"; rate.id = "rate-" + s;

    card.append(
      title,
      buildRow(s, "cost", "Subscription", "what you pay, in USD", cfg.services[s].cost, "0", "0.01"),
      buildRow(s, "credits", "Credits included", "in your plan", cfg.services[s].credits, "1", "1"),
      rate
    );
    host.appendChild(card);
    rate.textContent = rateText(s);
  }

  // disabled services → "+ Add" button
  for (const s of Object.keys(cfg.services)) {
    if (cfg.services[s].enabled) continue;
    const meta = TC_META[s];
    const btn = document.createElement("button");
    btn.className = "add-btn";
    const logo = document.createElement("img");
    logo.src = meta.logo; logo.alt = "";
    btn.append(logo, document.createTextNode("+ Add " + meta.label));
    btn.addEventListener("click", () => {
      cfg.services[s].enabled = true;
      tcSave(cfg, render);
    });
    host.appendChild(btn);
  }

  // wire inputs
  host.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("input", () => {
      const s = inp.dataset.s, f = inp.dataset.f;
      cfg.services[s][f] = f === "cost"
        ? (parseFloat(inp.value) || 0)
        : (parseInt(inp.value, 10) || 1);
      $("rate-" + s).textContent = rateText(s);
    });
  });

  // wire remove
  host.querySelectorAll(".remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      cfg.services[btn.dataset.s].enabled = false;
      tcSave(cfg, render);
    });
  });
}

tcLoad((c) => { cfg = c; render(); });

$("save").addEventListener("click", () => {
  cfg.onboarded = true;
  tcSave(cfg, () => {
    $("saved").classList.add("show");
    setTimeout(() => $("saved").classList.remove("show"), 2200);
  });
});
