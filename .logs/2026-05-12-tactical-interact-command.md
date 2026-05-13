# Tactical Interact Command

Date: 2026-05-12

## Scope

- Added a tactical `Interact` command on hotkey `5`.
- Ritual interaction: a court unit that begins its turn on a ritual tile can spend AP to channel the objective, advance ritual progress, and gain a short ward.
- Relic-cache interaction: a court unit on an unclaimed relic cache can spend AP to restore 2 health, gain a stronger ward, and mark the cache claimed.
- Added HUD preview copy, command hints, Phaser interact rings, relic-cache claimed marks, and hover-card support.
- Fixed the main menu shell pointer-events gap so the visible Start Run button is actually clickable.
- Updated `PLAN.md` and Playwright coverage for tactical interactions and visible menu start controls.

## Files Changed

- `src/game/simulation/types.ts`
- `src/game/simulation/battle.ts`
- `src/game/input/actions.ts`
- `src/game/app.ts`
- `src/game/debugBridge.ts`
- `src/phaser/scenes/BattleScene.ts`
- `src/phaser/view/battleRenderer.ts`
- `src/ui/overlay.ts`
- `src/style.css`
- `tests/e2e/smoke.spec.ts`
- `PLAN.md`

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed: 21/21 tests.
- Browser verification:
  - In-app browser confirmed the menu pointer-events issue before the fix.
  - Focused Playwright browser proof captured `.logs/2026-05-12-tactical-interact-preview.png`.
  - Screenshot proof confirmed the `Interact` command is selected and the Tactical Preview shows `Channel Ritual`.
  - Browser proof returned `{"hasChannel":true,"hasInteractButton":true,"errors":[]}`.

## Known Follow-ups

- Add a richer in-run relic-use command once relics have per-battle active effects rather than only passive modifiers.
- Consider a shorter tooltip for interact on laptop-height screens so the preview is visible without panel scrolling.
