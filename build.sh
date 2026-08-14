#!/usr/bin/env bash
# TrueCost build — produces store-ready zips in dist/
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist/_stage
cp -r content.js popup.html popup.js icons dist/_stage/

# Chromium package
cp manifest.json dist/_stage/manifest.json
(cd dist/_stage && zip -qr ../truecost-chrome.zip .)

# Firefox package
cp manifest.firefox.json dist/_stage/manifest.json
(cd dist/_stage && zip -qr ../truecost-firefox.zip .)

rm -rf dist/_stage
ls -la dist/
