# Milestone 8 Slice: Route Events And Challenge Modifiers

Date: 2026-05-12

## Scope Completed

- Added deterministic route events that appear after non-final battle rewards.
- Added event choices with clear tradeoffs:
  - challenge bargains that grant resources or strategic shifts while adding future pressure
  - boon choices that add doctrine, relic, or upgrade momentum
  - a safe `Hold formation` option that keeps the route stable
- Added event history and challenge modifier tracking to run state.
- Added challenge modifiers to later battle setup:
  - `sun_edict`: dawn units deal +1 primary ability damage
  - `blood_moon`: battle starts with +1 dawn pressure
  - `oath_debt`: dawn units gain +1 max HP
- Added DOM event screen with readable choice cards and current run resources.
- Added debug bridge and Playwright coverage for choosing a route event and verifying challenge pressure in the next battle.
- Expanded the event catalog to six authored events:
  - Dawn Edict Posted
  - Moon Market Pact
  - Blood Moon Overpass
  - Ash Chapel Choir
  - Thorn Gate Toll
  - Nightglass Audience

## Files Changed Summary

- `src/game/content/route.ts`: route event catalog and deterministic event selection.
- `src/game/simulation/types.ts`: route event, event choice, event history, and challenge modifier state.
- `src/game/simulation/battle.ts`: challenge modifier application during battle setup.
- `src/game/app.ts`: event screen state, event choice reducer, challenge persistence in run history.
- `src/ui/overlay.ts` and `src/style.css`: route-event DOM screen.
- `src/game/debugBridge.ts` and `src/game/input/actions.ts`: debug/test action for route event choices.
- `tests/e2e/smoke.spec.ts`: route-event challenge regression, content breadth assertion for six event titles, and updated campaign route progression.
- `PLAN.md`: Milestone 8 status and current repo state updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 15 tests after running Chromium outside the macOS browser sandbox in the final Milestone 8 verification.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-8-route-event.png`
- Verified event state for `seed=event-proof`, `difficulty=hard`:
  - current screen: event
  - event: Blood Moon Overpass
  - choices: Consecrate the omen, Veil the marching column, Hold formation
  - challenge bargain: Blood Moon

## Known Follow-Ups

- Route events now satisfy the current Milestone 8 variety target; future expansion can still add more event text and district-specific branches.
