# TrueCost build — produces store-ready zips in dist/
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$dist = Join-Path $root "dist"
$stage = Join-Path $dist "_stage"

Remove-Item $dist -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $stage | Out-Null

$shared = @("content.js", "popup.html", "popup.js", "icons")
foreach ($f in $shared) { Copy-Item (Join-Path $root $f) $stage -Recurse }

# Chromium package (Chrome Web Store, Edge Add-ons, Brave, Opera)
Copy-Item (Join-Path $root "manifest.json") (Join-Path $stage "manifest.json") -Force
Compress-Archive -Path "$stage\*" -DestinationPath (Join-Path $dist "truecost-chrome.zip") -Force

# Firefox package (AMO)
Copy-Item (Join-Path $root "manifest.firefox.json") (Join-Path $stage "manifest.json") -Force
Compress-Archive -Path "$stage\*" -DestinationPath (Join-Path $dist "truecost-firefox.zip") -Force

Remove-Item $stage -Recurse -Force
Get-ChildItem $dist | ForEach-Object { "{0}  {1:N0} bytes" -f $_.Name, $_.Length }
