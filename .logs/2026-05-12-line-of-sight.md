# Line Of Sight

Date: 2026-05-12

## Scope

- Added obstacle-blocked line of sight for ranged attacks.
- Melee attacks remain unchanged.
- Ranged attacks now require a straight row or column lane, and obstacle tiles block that lane.
- Player attacks reject blocked sightlines with a clear chronicle event instead of spending AP.
- Enemy intent now respects line of sight before choosing ranged attacks.
- Tactical Preview lists in-range blocked targets as `Line blocked` / `No sightline` rather than hiding them.
- Phaser hover cards identify blocked ranged targets as `Line of sight blocked`.
- Updated `PLAN.md` to record the line-of-sight slice and coverage.

## Files Changed

- `src/game/simulation/battle.ts`
- `src/phaser/view/battleRenderer.ts`
- `src/ui/overlay.ts`
- `src/style.css`
- `tests/e2e/smoke.spec.ts`
- `PLAN.md`

## Verification

- `npm run build` passed.
- `npm run test:e2e -- --grep "line of sight"` passed: 1/1 test.
- `npm run test:e2e` passed: 23/23 tests.
- Browser proof captured `.logs/2026-05-12-line-of-sight-preview.png`.
- Focused browser check returned `{"hasBlocked":true,"hasSightline":true,"errors":[]}`.
- Visual proof shows the Lantern Marksman in range with `Line blocked · Range 4/4` and `No sightline`.

## Known Follow-ups

- Add a visible blocked-sight ray or obstacle pulse on hover so players can identify the exact blocking tile faster.
- Consider authored maps with more deliberate sightline lanes and cover pockets now that obstacles matter to ranged attacks.
