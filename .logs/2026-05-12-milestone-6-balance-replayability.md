# Milestone 6: Balance And Replayability

Date: 2026-05-12

## Scope Completed

- Added deterministic run seeds that shuffle route choices while preserving authored tier structure.
- Added `standard`, `hard`, and `nightmare` difficulty bands with tighter dawn meters and stronger enemy pressure on higher difficulties.
- Added run estimates in the 20-40 minute target range: 24 minutes for standard, 30 for hard, and 36 for nightmare.
- Added route balance diagnostics to snapshots and the route UI: risk counts, reward type coverage, doctrine coverage, route signature, and dominant risk share.
- Added menu controls for seed and difficulty selection.
- Persisted seed and difficulty in run history entries.
- Expanded Playwright smoke coverage for deterministic seed replay, alternate seed variety, reward coverage, risk spread, and nightmare pressure.

## Files Changed Summary

- `src/game/content/route.ts`: seeded route generation, run creation, reward balance summaries, and run estimates.
- `src/game/simulation/battle.ts`: difficulty scaling for enemy health, enemy damage on nightmare, and dawn meter pressure.
- `src/game/app.ts`: seed/difficulty run setup, snapshot balance diagnostics, run-history metadata, and route battle difficulty inheritance.
- `src/game/debugBridge.ts`: deterministic debug bridge support for seeded/difficulty run starts.
- `src/ui/overlay.ts` and `src/style.css`: menu seed/difficulty controls and route diagnostics.
- `tests/e2e/smoke.spec.ts`: seeded replay and difficulty-band regression coverage.
- `PLAN.md`: Milestone 6 status and current repo state updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 9 tests after rerunning outside the macOS browser sandbox.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-6-seeded-route.png`
- Verified route snapshot for `seed=night-9999`, `difficulty=nightmare`:
  - route signature: `crypt-inquisitor>market-ambush>crypt-rite>chapel-bell>market-relic>canal-rite>canal-smugglers>chapel-pyre>wall-siege>palace-gate>wall-inquisitor>palace-rite`
  - estimated minutes: 36
  - risk counts: 2 low, 6 standard, 4 high
  - reward types: resource, relic, doctrine, upgrade
  - doctrine options: blood, shadow, terror, pact, crown
  - dominant risk share: 50%

## Known Follow-Ups

- Milestone 7 should harden restart/transition loops, responsive layouts, and render/update cleanup.
- Future balance work can replace smoke-test heuristics with deeper simulated-run telemetry once more abilities and relic rules exist.
