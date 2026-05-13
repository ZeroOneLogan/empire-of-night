# Flanking Pressure

Date: 2026-05-12

## Scope

- Added deterministic flank pressure to player attacks.
- A dawn target gains a `+1` incoming damage pressure bonus when another living court unit is adjacent to that target.
- Centralized projected attack damage in the simulation reducer through `getAttackDamagePreview`.
- Updated player attack resolution to use the same preview path as the HUD and canvas hover preview.
- Added HUD target details for `Flanked` and `+1 flank`.
- Added Phaser hover-card copy for flank pressure.
- Updated `PLAN.md` to record the flanking slice and test coverage.

## Files Changed

- `src/game/simulation/battle.ts`
- `src/phaser/view/battleRenderer.ts`
- `src/ui/overlay.ts`
- `tests/e2e/smoke.spec.ts`
- `PLAN.md`

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed: 22/22 tests.
- Browser proof captured `.logs/2026-05-12-flanking-preview.png`.
- Focused browser check returned `{"hasFlanked":true,"hasDamage":true,"errors":[]}`.
- Visual proof shows Dawn Vanguard marked with cover plus flanked pressure, projected as `Damage 3 · HP 10->7 · +1 flank`.

## Known Follow-ups

- Add line-of-sight blockers for ranged attacks so cover and obstacles matter before range checks.
- Consider an enemy-side flank rule after player-side preview language is stable.
