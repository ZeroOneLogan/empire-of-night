# Milestone 8 Slice: Reward Effects

Date: 2026-05-12

## Scope Completed

- Added deterministic run reward effects to later route battles.
- Doctrine effects:
  - `crown`: Regent gains +1 max HP and +1 armor.
  - `shadow`: court units gain +1 movement range.
  - `terror`: dawn units lose 1 max HP.
  - `blood`: court unit primary abilities gain +1 damage.
  - `pact`: dawn meter max increases by 1.
- Upgrade effects:
  - `Knight Oathmark`: Grave Knight gains +2 max HP and +1 primary ability damage.
  - `Occultist Focus`: Veil Occultist gains +1 primary ability damage and +1 range.
- Relic effects:
  - up to two relics increase dawn meter max and apply opening wards to court units.
- Blood economy effect:
  - 4 or more blood gives the Regent +1 primary ability damage.
- Battle event log now records when run pressure modifiers are applied.

## Files Changed Summary

- `src/game/simulation/battle.ts`: reward modifier application during battle creation and restart.
- `src/game/app.ts`: route battles and restarts pass the active run into battle setup.
- `tests/e2e/smoke.spec.ts`: browser regression earns upgrade, doctrine, and relic rewards through the route loop, then verifies the next battle changes.
- `PLAN.md`: Current repo state and Milestone 8 status updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 11 tests after running Chromium outside the macOS browser sandbox.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-8-reward-effect-battle.png`
- Verified a normal route sequence where the player:
  - wins `crypt-rite`
  - chooses `Canal Mirror`
  - enters `canal-rite`
  - sees Nocturne Regent start with `Warded`
  - sees dawn meter max increase to 8

## Known Follow-Ups

- Add explicit UI copy on reward cards that previews the exact future modifier.
- Add bosses, leaders, elite encounters, narrative route events, and optional challenge modifiers before declaring Milestone 8 complete.
