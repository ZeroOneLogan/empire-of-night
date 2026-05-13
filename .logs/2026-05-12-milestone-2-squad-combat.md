# 2026-05-12 Milestone 2 Squad Combat And Objectives

## Scope Completed

- Added the full three-unit court squad: Nocturne Regent, Grave Knight, and Veil Occultist.
- Added three dawn enemy archetypes: Dawn Vanguard, Sun Acolyte, and Gate Inquisitor.
- Expanded the battle reducer with active-unit selection, unit cycling, movement plus major actions, guard, statuses, downed units, readable enemy intent, dawn loss pressure, and objective scoring.
- Added two objective implementations:
  - `hold_ritual`: hold a marked ritual tile for two court turns.
  - `eliminate_commander`: defeat the Gate Inquisitor commander.
- Updated the DOM HUD with clickable squad rows, active-unit state, archetype/status details, ritual progress, and richer intent text.
- Updated Phaser rendering with distinct unit silhouettes/colors, ritual markers, status indicators, and multi-enemy intent lines.
- Expanded Playwright coverage for squad state, commander objective, ritual victory, and ritual defeat without console errors.

## Files Changed Summary

- `src/game/simulation/types.ts`: squad, status, objective, and encounter types.
- `src/game/content/encounters.ts`: authored ritual and commander battle definitions.
- `src/game/simulation/battle.ts`: Milestone 2 reducer and objective logic.
- `src/game/app.ts`, `src/game/input/actions.ts`, `src/game/debugBridge.ts`: encounter selection, unit selection, cycling, and versioned debug bridge.
- `src/phaser/view/battleRenderer.ts`, `src/phaser/scenes/BattleScene.ts`: tactical rendering and click/keyboard input updates.
- `src/ui/overlay.ts`, `src/style.css`: squad HUD and command-table presentation.
- `tests/e2e/smoke.spec.ts`: 5 deterministic e2e checks.
- `PLAN.md`: current-state and milestone status update.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification

- Playwright suite passed: 5 tests.
- Visual verification launched the Vite app at `http://127.0.0.1:4173/`, entered `ritual-hold` through `window.__empireOfNight.startBattle("ritual-hold")`, confirmed `screen=battle`, `phase=player`, `objective=hold_ritual`, and captured `.logs/2026-05-12-milestone-2-squad-battle.png`.
- Browser console errors during screenshot pass: none.

## Known Follow-ups

- Next product slice should begin Milestone 3: campaign route map, district choices, battle rewards, restart flow, and local meta progression.
- Enemy pathing is intentionally simple and greedy for this milestone; later tactical depth should add better pathfinding and line-of-sight rules.
- Production build still emits the Phaser bundle-size warning; defer chunking work to browser hardening unless it starts blocking iteration.
