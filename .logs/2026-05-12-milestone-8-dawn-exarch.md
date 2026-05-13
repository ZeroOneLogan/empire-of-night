# Milestone 8 Slice: Dawn Exarch Boss

Date: 2026-05-12

## Scope Completed

- Added a distinct `dawn_exarch` enemy archetype.
- Added the `Solar Decree` boss ability: range 2, 5 damage, dazed status.
- Reworked `palace-gate` into a boss commander encounter against the Dawn Exarch.
- Added renderer treatment for the boss with a larger sun-triangle silhouette.
- Added Playwright coverage that verifies the boss objective, commander flag, HP, archetype, and ability.

## Files Changed Summary

- `src/game/simulation/types.ts`: new `dawn_exarch` unit archetype.
- `src/game/content/encounters.ts`: boss stats, boss ability, palace-gate objective, and enemy roster.
- `src/game/content/route.ts`: palace-gate codex updated to call out the boss commander.
- `src/phaser/view/battleRenderer.ts`: Dawn Exarch visual language.
- `tests/e2e/smoke.spec.ts`: Dawn Exarch boss regression.
- `PLAN.md`: current repo state and Milestone 8 status updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 13 tests after running Chromium outside the macOS browser sandbox.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-8-dawn-exarch.png`
- Verified `palace-gate` battle:
  - objective: kill the Dawn Exarch
  - boss HP: 20
  - armor: 2
  - ability: Solar Decree
  - commander: true

## Known Follow-Ups

- Add alternate leaders and leader selection.
- Add elite encounter variants that combine route-event challenges with boss-like mechanics.
