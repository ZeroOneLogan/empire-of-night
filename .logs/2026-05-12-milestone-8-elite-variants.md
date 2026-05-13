# Milestone 8 Slice: Elite Encounter Variants

Date: 2026-05-12

## Scope Completed

- Added deterministic elite variants for high-risk route battles.
- High-risk nodes now promote the first non-commander dawn unit into an `Elite` variant.
- Elite units gain +2 max HP and +1 armor.
- Battle chronicle records the elite unit anchoring the district.
- Added Playwright coverage that reaches a high-risk node through the normal route flow and verifies the elite unit.

## Files Changed Summary

- `src/game/simulation/battle.ts`: high-risk route elite promotion during battle setup.
- `tests/e2e/smoke.spec.ts`: elite encounter variant regression.
- `PLAN.md`: Milestone 8 status updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 15 tests after running Chromium outside the macOS browser sandbox.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-8-elite-variant.png`
- Verified `chapel-bell` after route progression:
  - elite unit: Elite Sun Acolyte
  - HP: 10
  - armor: 1
  - chronicle includes high-risk anchoring event

## Known Follow-Ups

- Add more narrative event variants so runs see a broader set of inter-battle choices.
