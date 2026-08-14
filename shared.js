// Shared config helpers (popup, onboarding, content script).

const TC_DEFAULTS = {
  onboarded: false,
  services: {
    magnific:   { enabled: false, cost: 864, credits: 1000000 },
    higgsfield: { enabled: false, cost: 292, credits: 6000 },
  },
};

const TC_META = {
  magnific:   { label: "Magnific · Freepik", logo: "assets/magnific.png",   accent: "#ff375f" },
  higgsfield: { label: "Higgsfield",         logo: "assets/higgsfield.png", accent: "#d4f24b" },
};

// Normalizes any stored shape (including pre-onboarding v1.0 configs) to the current schema.
function tcNormalize(raw) {
  const out = JSON.parse(JSON.stringify(TC_DEFAULTS));
  if (!raw) return out;
  if (raw.services) {
    out.onboarded = !!raw.onboarded;
    for (const k of Object.keys(out.services)) {
      if (raw.services[k]) Object.assign(out.services[k], raw.services[k]);
    }
    return out;
  }
  // v1.0 shape: { magnific: {cost, credits}, higgsfield: {cost, credits} } — both were active
  for (const k of Object.keys(out.services)) {
    if (raw[k]) Object.assign(out.services[k], raw[k], { enabled: true });
  }
  out.onboarded = true;
  return out;
}

function tcLoad(cb) {
  chrome.storage.sync.get({ config: null }, ({ config }) => cb(tcNormalize(config)));
}

function tcSave(config, cb) {
  chrome.storage.sync.set({ config }, cb || (() => {}));
}
