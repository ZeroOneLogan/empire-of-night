# 2026-05-12 Milestone 0-1 Opening Battle Slice

## Scope Completed

- Replaced the single-scene scaffold with boot, menu, and battle Phaser scenes.
- Added pure TypeScript battle simulation state, reducer-style actions, enemy intent, dawn pressure, victory, and defeat.
- Added authored opening encounter content with one court unit, one dawn enemy, obstacles, ritual tiles, and a deterministic objective.
- Added a development-only `window.__empireOfNight` bridge for smoke tests and state inspection.
- Added DOM HUD panels for objective, dawn meter, forces, commands, enemy intent, combat chronicle, and battle results.
- Added Playwright coverage for boot, debug bridge state, and deterministic battle victory.

## Files Changed Summary

- `src/main.ts`: Phaser scene wiring, overlay setup, debug bridge install.
- `src/game/`: simulation, content, input action, and manifest modules.
- `src/phaser/`: boot/menu/battle scenes and battle renderer.
- `src/ui/overlay.ts`: DOM menu shell and tactical HUD.
- `src/style.css`: imperial command-table presentation.
- `tests/e2e/smoke.spec.ts`: deterministic smoke and battle victory coverage.
- `PLAN.md`: current-state and milestone status update.

## Commands Run

- `npm install`
- `npm run build`
- `npx playwright install chromium`
- `npm run test:e2e`

## Browser Verification

- Playwright suite passed: 3 tests.
- Visual verification launched the Vite app at `http://127.0.0.1:4173/`, entered battle through `window.__empireOfNight.startBattle()`, confirmed `screen=battle`, `phase=player`, and captured `.logs/2026-05-12-opening-battle.png`.
- Browser console errors during screenshot pass: none.

## Known Follow-ups

- `npm install` reported two moderate dependency advisories; do not run `npm audit fix --force` casually because it may change tool versions.
- Production build emits a large Phaser bundle warning; defer code splitting or warning tuning until later browser-hardening work.
- Next product slice should begin Milestone 2: add the full three-unit squad, more enemy archetypes, objectives, statuses, and loss-state depth.
