# Tactical Preview Polish

Date: 2026-05-12

## Scope Completed

- Audited the completed roadmap against the broader goal of making the game feel like a polished tactical roguelite.
- Identified a remaining playability gap: the battle field showed attackable targets, but the HUD did not explain projected damage or active-unit combat context.
- Added a `Tactical Preview` HUD panel that shows active unit AP, move, armor, status, selected ability, legal movement count, and target-by-target projected attack damage.
- Kept the implementation in the DOM overlay layer so Phaser remains responsible for tactical visualization while simulation state remains outside scenes.
- Added focused Playwright coverage for preview readability.

## Files Changed Summary

- `src/ui/overlay.ts`: added tactical preview rendering and projected damage helpers.
- `src/style.css`: added preview panel, target row, lethal-state, and scroll-safe battle panel styling.
- `tests/e2e/smoke.spec.ts`: added the tactical preview e2e test.
- `PLAN.md`: updated current-state and test coverage notes to include tactical preview readability.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification Performed

- Started the Vite dev server on `http://127.0.0.1:4173/`.
- Opened the game with Chromium through Playwright.
- Started `ritual-hold`, selected the Veil Occultist, moved to `{ x: 2, y: 2 }`, selected attack, and confirmed the rendered `Tactical Preview` panel.
- Captured screenshot: `.logs/2026-05-12-tactical-preview.png`.
- Browser console errors during screenshot capture: none.

## Known Follow-ups

- The roadmap is complete, but the broad "looks and plays incredibly" goal should not be called complete without a final quality audit.
- Visual units are still procedural silhouettes rather than finished sprite assets.
- Combat feedback has readable previews, but richer animation, impact timing, and stronger victory/defeat presentation would still improve perceived quality.
- Production build still emits the Vite large chunk warning because Phaser ships in the main bundle.
