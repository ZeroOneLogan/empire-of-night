# Milestone 8 Completion

Date: 2026-05-12

## Scope Completed

Milestone 8 is now complete against the current `PLAN.md` criteria:

- Additional leaders: Nocturne Regent, Grave Marshal, and Veil Oracle.
- Faction boss: Dawn Exarch at the palace gate.
- Elite encounters: high-risk route nodes promote an elite dawn unit.
- Relic synergies: all six relics now have distinct battle effects.
- Narrative events: six authored deterministic route events.
- Optional challenge modifiers: Sun Edict, Blood Moon, and Oath Debt.

## Files Changed Summary

- `PLAN.md`: Milestone 8 marked complete.
- `src/game/content/route.ts`: leader catalog, route events, relic reward copy, and content summary support.
- `src/game/content/encounters.ts`: Dawn Exarch boss encounter.
- `src/game/simulation/battle.ts`: leader, relic, challenge, elite, and boss battle modifiers.
- `src/game/simulation/types.ts`: leader, route event, challenge, history, and content-summary types.
- `src/game/app.ts`: leader/event/reward run-state plumbing.
- `src/ui/overlay.ts` and `src/style.css`: leader, event, route, reward, and summary UI support.
- `tests/e2e/smoke.spec.ts`: 15 deterministic browser smoke tests.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 15 tests after running Chromium outside the macOS browser sandbox.

## Browser Verification

Screenshots captured for the Milestone 8 slices:

- `.logs/2026-05-12-milestone-8-leader-select.png`
- `.logs/2026-05-12-milestone-8-relic-synergies.png`
- `.logs/2026-05-12-milestone-8-route-event.png`
- `.logs/2026-05-12-milestone-8-elite-variant.png`
- `.logs/2026-05-12-milestone-8-dawn-exarch.png`

## Known Follow-Ups

- The broader thread goal is still larger than the current plan. A final completion audit should decide whether polish, assets, performance, and richer content are now sufficient for "full fleshed out" before marking the active goal complete.
