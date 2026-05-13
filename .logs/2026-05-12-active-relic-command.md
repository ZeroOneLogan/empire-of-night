# Active Relic Command

Date: 2026-05-12

## Scope

- Added a once-per-battle active relic command for campaign battles with bound relics.
- Added `relic` as a selectable tactical command and `useRelic` as the commit action.
- Added hotkey `R`: first press previews the carried relic, second press invokes it.
- Added deterministic active effects by relic name:
  - `Canal Mirror` reopens the invoker's movement and grants Warded 2.
  - `Market Mask` reopens court movement and wards the invoker.
  - `Bell Ash Reliquary` dazes the dawn front.
  - `Wall-Key of Thorns` grants armor, guard, and a ward.
  - `Palace Nightglass` reduces dawn pressure and wards the court.
  - Other relics restore health and ward the invoker.
- Added Tactical Preview copy for active relic availability and spent state.
- Added debug bridge support for `useRelic`.
- Updated `PLAN.md` to record active relic command coverage.

## Files Changed

- `src/game/simulation/types.ts`
- `src/game/simulation/battle.ts`
- `src/game/content/encounters.ts`
- `src/game/input/actions.ts`
- `src/game/app.ts`
- `src/game/debugBridge.ts`
- `src/phaser/scenes/BattleScene.ts`
- `src/phaser/view/battleRenderer.ts`
- `src/ui/overlay.ts`
- `tests/e2e/smoke.spec.ts`
- `PLAN.md`

## Verification

- `npm run build` passed.
- `npm run test:e2e -- --grep "bound relics"` passed: 1/1 test.
- `npm run test:e2e` passed: 25/25 tests.
- Browser proof captured `.logs/2026-05-12-active-relic-command.png`.
- Focused browser check returned `{"hasRelic":true,"errors":[]}`.

## Known Follow-ups

- Add distinct canvas effects for relic invocation by relic family.
- Add active relic affordances to reward cards so players can preview both passive and active effects before choosing.
