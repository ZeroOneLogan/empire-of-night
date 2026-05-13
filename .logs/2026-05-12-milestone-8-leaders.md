# Milestone 8 Slice: Alternate Leaders

Date: 2026-05-12

## Scope Completed

- Added three selectable run leaders:
  - Nocturne Regent: crown doctrine, +1 starting authority, balanced durability.
  - Grave Marshal: terror doctrine, Grave Knight gains +1 max HP and +1 armor in battles.
  - Veil Oracle: shadow doctrine, Veil Occultist gains +1 range and starts warded.
- Added leader metadata to run state, content summary, debug bridge start hooks, and run history.
- Added leader cards to the main run setup UI.
- Removed the stale Phaser canvas start button so the DOM run setup is the single authoritative start path.
- Added Playwright coverage for leader catalog exposure and battle-state effects.

## Files Changed Summary

- `src/game/content/route.ts`: leader catalog and leader-aware run creation.
- `src/game/simulation/types.ts`: leader types and run/history fields.
- `src/game/app.ts`: leader-aware start run and history persistence.
- `src/game/simulation/battle.ts`: leader battle modifiers.
- `src/ui/overlay.ts` and `src/style.css`: leader setup cards.
- `src/phaser/scenes/MenuScene.ts`: removed duplicate canvas start button.
- `src/game/debugBridge.ts`, `src/game/input/actions.ts`: leader-aware debug/action plumbing.
- `tests/e2e/smoke.spec.ts`: alternate leader regression.
- `PLAN.md`: current repo state and Milestone 8 status updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 14 tests after running Chromium outside the macOS browser sandbox.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-8-leader-select.png`
- Verified menu setup exposes Nocturne Regent, Grave Marshal, and Veil Oracle.
- Verified the stale canvas `Begin Campaign Run` button is no longer present.

## Known Follow-Ups

- Add deeper relic synergies that interact with leader identity.
- Add elite encounter variants that respond to selected leader and challenge modifiers.
