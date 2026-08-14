const $ = (id) => document.getElementById(id);
const PER = { magnific: 1000, higgsfield: 10 };
let cfg = null;

function rateText(s) {
  const svc = cfg.services[s];
  return PER[s].toLocaleString("en-US") + " credits = $" +
         (PER[s] * svc.cost / svc.credits).toFixed(2);
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
    card.innerHTML =
      '<div class="card-title"><img src="' + meta.logo + '" alt=""><span>' + meta.label + "</span>" +
      '<button class="remove" data-s="' + s + '">Remove</button></div>' +
      '<div class="row"><label>Subscription<span class="hint">what you pay, in USD</span></label>' +
      '<input type="number" min="0" step="0.01" data-s="' + s + '" data-f="cost"></div>' +
      '<div class="row"><label>Credits included<span class="hint">in your plan</span></label>' +
      '<input type="number" min="1" step="1" data-s="' + s + '" data-f="credits"></div>' +
      '<div class="rate" id="rate-' + s + '"></div>';
    host.appendChild(card);
    card.querySelector('[data-f="cost"]').value = cfg.services[s].cost;
    card.querySelector('[data-f="credits"]').value = cfg.services[s].credits;
    $("rate-" + s).textContent = rateText(s);
  }

  // disabled services → "+ Add" button
  for (const s of Object.keys(cfg.services)) {
    if (cfg.services[s].enabled) continue;
    const meta = TC_META[s];
    const btn = document.createElement("button");
    btn.className = "add-btn";
    btn.innerHTML = '<img src="' + meta.logo + '" alt="">+ Add ' + meta.label;
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
