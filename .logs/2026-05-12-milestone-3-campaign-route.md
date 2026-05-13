# 2026-05-12 Milestone 3 Campaign Route And Rewards

## Scope Completed

- Added a three-tier campaign route with branching district choices.
- Added run state with seed, selected route node, completed encounters, resources, relics, doctrine, victories, and run result.
- Added post-battle reward choices for resources, relic unlocks, and doctrine shifts.
- Added run summary and restart flow.
- Added versioned local meta progression in `localStorage` for completed runs, victories, unlocked relics, and last result.
- Extended the debug bridge with `startRun`, `chooseRouteNode`, `continueAfterBattle`, and `chooseReward`.
- Added DOM route, reward, and run-summary screens that sit on top of the Phaser shell.
- Expanded Playwright coverage to complete three encounters in one run and verify meta persistence.

## Files Changed Summary

- `src/game/content/route.ts`: authored route nodes and reward options.
- `src/game/persistence/metaProgress.ts`: versioned local meta save/load.
- `src/game/simulation/types.ts`: run, route, reward, meta, and app-screen types.
- `src/game/app.ts`: run lifecycle, route selection, reward application, run summary, and persistence.
- `src/game/debugBridge.ts`, `src/game/input/actions.ts`: campaign automation intents.
- `src/phaser/scenes/MenuScene.ts`, `src/phaser/scenes/BattleScene.ts`: campaign start and scene transitions.
- `src/ui/overlay.ts`, `src/style.css`: route, reward, and summary UI.
- `tests/e2e/smoke.spec.ts`: three-encounter campaign completion test.
- `PLAN.md`: current-state and milestone status update.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification

- Playwright suite passed: 6 tests.
- Visual verification launched the Vite app at `http://127.0.0.1:4173/`, started a run through `window.__empireOfNight.startRun()`, captured `.logs/2026-05-12-milestone-3-route.png`, completed three ritual encounters through deterministic debug actions, and captured `.logs/2026-05-12-milestone-3-run-summary.png`.
- Verified final browser state: `screen=runSummary`, `result=victory`, `victories=3`, `meta.completedRuns=1`, `meta.victories=1`.
- Browser console errors during screenshot pass: none.

## Known Follow-ups

- Next product slice should begin Milestone 4: broaden content so route choices differ more materially by encounter, relic, doctrine, hazard, and district identity.
- Commander encounters are authored and testable, but the default route proof currently uses ritual nodes for deterministic speed.
- Reward effects are intentionally simple; later milestones should make relics and doctrines alter tactical rules in visible ways.
