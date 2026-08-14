const $ = (id) => document.getElementById(id);
const picked = new Set();

// ---- step 1: service picker ----
document.querySelectorAll(".pick").forEach((card) => {
  card.addEventListener("click", () => {
    const s = card.dataset.service;
    if (picked.has(s)) { picked.delete(s); card.classList.remove("selected"); }
    else { picked.add(s); card.classList.add("selected"); }
    $("continue").disabled = picked.size === 0;
  });
});

function goto(step) {
  document.querySelectorAll(".step").forEach((el) => el.classList.remove("active"));
  $(step).classList.add("active");
}

const FIELDS = {
  magnific:   { cost: "mag-cost", credits: "mag-credits", rate: "mag-rate", per: 1000 },
  higgsfield: { cost: "hig-cost", credits: "hig-credits", rate: "hig-rate", per: 10 },
};

function showRate(s) {
  const f = FIELDS[s];
  const cost = parseFloat($(f.cost).value) || 0;
  const credits = parseInt($(f.credits).value, 10) || 1;
  $(f.rate).textContent =
    f.per.toLocaleString("en-US") + " credits = $" + (f.per * cost / credits).toFixed(2);
}

$("continue").addEventListener("click", () => {
  tcLoad((cfg) => {
    for (const s of Object.keys(FIELDS)) {
      const on = picked.has(s);
      $("plan-" + s).classList.toggle("on", on);
      if (on) {
        $(FIELDS[s].cost).value = cfg.services[s].cost;
        $(FIELDS[s].credits).value = cfg.services[s].credits;
        showRate(s);
      }
    }
    goto("step2");
  });
});

Object.keys(FIELDS).forEach((s) => {
  [FIELDS[s].cost, FIELDS[s].credits].forEach((id) =>
    $(id).addEventListener("input", () => showRate(s))
  );
});

$("back").addEventListener("click", () => goto("step1"));

$("finish").addEventListener("click", () => {
  tcLoad((cfg) => {
    cfg.onboarded = true;
    for (const s of Object.keys(FIELDS)) {
      const svc = cfg.services[s];
      svc.enabled = picked.has(s);
      if (svc.enabled) {
        svc.cost = parseFloat($(FIELDS[s].cost).value) || svc.cost;
        svc.credits = parseInt($(FIELDS[s].credits).value, 10) || svc.credits;
      }
    }
    tcSave(cfg, () => {
      goto("step3");
      setTimeout(() => window.close(), 2600);
    });
  });
});
