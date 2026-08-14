# Changelog

## 1.1.0 — 2026-08-14

- **Onboarding**: on first install, a welcome page asks which tools you use
  (Magnific, Higgsfield, or both) and sets up your plans
- **Adaptive popup**: shows only the services you enabled; one-click
  "+ Add" button for the others, "Remove" to disable
- Service logos throughout the UI
- Content script only runs pricing for enabled services
- Seamless migration from 1.0.0 configs

## 1.0.0 — 2026-08-14

First public release.

- Price pills next to credit costs on Magnific / Freepik and Higgsfield
- Per-service plan configuration (subscription cost + credits included) with live rate preview
- Overlay architecture immune to SPA re-renders; auto-updates on cost changes,
  scroll, resize, and window edge overflow
- Higgsfield: reads the effective discounted price, ignores the crossed-out one
- Dark Apple-style popup, custom icon
- Chromium (Chrome, Edge, Brave, Opera) + Firefox (separate manifest)
