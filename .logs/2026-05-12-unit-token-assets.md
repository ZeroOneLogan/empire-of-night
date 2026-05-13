# Unit Token Assets

Date: 2026-05-12

## Scope Completed

- Added manifest-driven SVG token assets for every current unit archetype.
- Added Phaser preload coverage in `BootScene` for all unit token assets.
- Updated the battle renderer to draw loaded token assets on a dedicated image layer.
- Kept procedural shape rendering as a fallback if a token texture is unavailable.
- Added overlay rendering for target rings, health bars, status pips, action pips, and labels so unit tokens do not obscure tactical state.
- Added Playwright coverage that verifies all nine unit assets load in the browser.

## Files Changed Summary

- `src/game/assets/manifest.ts`: added unit token keys, paths, and helper exports.
- `src/phaser/scenes/BootScene.ts`: preloads all unit token SVGs.
- `src/phaser/view/battleRenderer.ts`: renders unit token images with overlay UI state.
- `tests/e2e/smoke.spec.ts`: checks unit asset resource loading.
- `PLAN.md`: updated current-state and verification notes.
- `public/assets/units/*.svg`: added nine stylized tactical tokens.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification Performed

- Started the Vite dev server on `http://127.0.0.1:4173/`.
- Confirmed all nine unit asset requests loaded:
  - `regent.svg`
  - `knight.svg`
  - `occultist.svg`
  - `dawn-soldier.svg`
  - `sun-acolyte.svg`
  - `inquisitor.svg`
  - `lantern-marksman.svg`
  - `bell-warden.svg`
  - `dawn-exarch.svg`
- Captured standard battle token screenshot: `.logs/2026-05-12-unit-token-assets-battle.png`.
- Captured boss token screenshot: `.logs/2026-05-12-unit-token-assets-boss.png`.
- Browser console errors during screenshot capture: none.

## Known Follow-ups

- The board now uses real tactical token assets instead of only procedural silhouettes.
- Future art polish could add animation strips or larger illustrated portraits, but the core in-battle asset gap is closed for this vertical slice.
