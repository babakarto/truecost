// Opens the onboarding page on first install.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") return;
  chrome.storage.sync.get({ config: null }, ({ config }) => {
    if (config && config.onboarded) return;
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  });
});
