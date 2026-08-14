// Defaults: Magnific 800 EUR ≈ $864 for 1M credits; Higgsfield 270 EUR ≈ $292 for 6000 credits
const DEFAULTS = {
  magnific:   { cost: 864, credits: 1000000 },
  higgsfield: { cost: 292, credits: 6000 },
};

const $ = (id) => document.getElementById(id);

function fmtRate(cost, credits, per) {
  return per.toLocaleString("en-US") + " credits = $" + (per * cost / credits).toFixed(2);
}

function showRates(cfg) {
  $("mag-rate").textContent = fmtRate(cfg.magnific.cost, cfg.magnific.credits, 1000);
  $("hig-rate").textContent = fmtRate(cfg.higgsfield.cost, cfg.higgsfield.credits, 10);
}

function currentConfig() {
  return {
    magnific: {
      cost: parseFloat($("mag-cost").value) || DEFAULTS.magnific.cost,
      credits: parseInt($("mag-credits").value, 10) || DEFAULTS.magnific.credits,
    },
    higgsfield: {
      cost: parseFloat($("hig-cost").value) || DEFAULTS.higgsfield.cost,
      credits: parseInt($("hig-credits").value, 10) || DEFAULTS.higgsfield.credits,
    },
  };
}

chrome.storage.sync.get({ config: DEFAULTS }, ({ config }) => {
  $("mag-cost").value = config.magnific.cost;
  $("mag-credits").value = config.magnific.credits;
  $("hig-cost").value = config.higgsfield.cost;
  $("hig-credits").value = config.higgsfield.credits;
  showRates(config);
});

// live rate preview while typing
["mag-cost", "mag-credits", "hig-cost", "hig-credits"].forEach((id) =>
  $(id).addEventListener("input", () => showRates(currentConfig()))
);

$("save").addEventListener("click", () => {
  const config = currentConfig();
  chrome.storage.sync.set({ config }, () => {
    showRates(config);
    $("saved").classList.add("show");
    setTimeout(() => $("saved").classList.remove("show"), 2200);
  });
});
