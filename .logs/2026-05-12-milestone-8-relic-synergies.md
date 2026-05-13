# Milestone 8 Slice: Named Relic Synergies

Date: 2026-05-12

## Scope Completed

- Added distinct tactical effects for every relic:
  - Moon-Splinter Crown: Regent gains health and command damage.
  - Canal Mirror: Occultist gains movement and longer blood hex reach.
  - Bell Ash Reliquary: early dawn enemies start dazed.
  - Wall-Key of Thorns: Knight gains armor and strike damage.
  - Market Mask: court units gain movement tempo.
  - Palace Nightglass: dawn meter capacity expands sharply.
- Updated relic reward comparison copy so the player sees the future modifier before choosing.
- Expanded the reward-effect Playwright test to verify Canal Mirror changes the next battle state.

## Files Changed Summary

- `src/game/simulation/battle.ts`: named relic modifiers during battle setup.
- `src/game/content/route.ts`: relic comparison copy now previews the specific synergy.
- `tests/e2e/smoke.spec.ts`: Canal Mirror movement/range assertions.
- `PLAN.md`: current repo state and Milestone 8 status updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 14 tests after running Chromium outside the macOS browser sandbox.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-8-relic-synergies.png`
- Verified the `Canal Mirror` reward card displays the future effect: Occultist gains movement and longer blood hex reach.

## Known Follow-Ups

- Add elite encounter variants and more narrative event variety before considering Milestone 8 complete.
