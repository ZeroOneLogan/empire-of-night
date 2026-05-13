# Milestone 7: Browser Hardening

Date: 2026-05-12

## Scope Completed

- Added explicit `BattleRenderer.destroy()` cleanup for graphics and text labels.
- Replaced anonymous BattleScene input callbacks with stable handler references and removed those handlers on scene shutdown.
- Kept scene transitions deterministic across battle, route, reward, menu, and run-summary states.
- Added responsive hardening for common desktop/laptop viewports:
  - route, reward, and summary shells can scroll safely on shorter heights
  - route headers scale down on short laptop displays
  - wider desktop viewports get a slightly wider tactical panel and route map
- Expanded Playwright coverage to stress repeated run starts, route-to-battle transitions, double battle restarts, returns to menu, and persisted run-history reloads.

## Files Changed Summary

- `src/phaser/scenes/BattleScene.ts`: lifecycle-safe pointer and keyboard handlers; renderer disposal on shutdown.
- `src/phaser/view/battleRenderer.ts`: explicit graphics and label cleanup.
- `src/style.css`: laptop-height and wide-desktop layout rules.
- `tests/e2e/smoke.spec.ts`: repeated restart/scene-transition test and run-history reload assertions.
- `PLAN.md`: Milestone 7 status and current repo state updated.

## Commands Run

- `npm run build` passed.
- `npm run test:e2e` passed with 10 tests after running Chromium outside the macOS browser sandbox.

## Browser Verification

- Captured Playwright screenshot: `.logs/2026-05-12-milestone-7-responsive-route.png`
- Verified 1366x720 route view for `seed=m7-laptop`, `difficulty=hard`:
  - current screen: route
  - estimated minutes: 30
  - risk counts: 2 low, 6 standard, 4 high
  - route header and three available district cards fit without overlap

## Known Follow-Ups

- Milestone 8 can now build on a stable browser loop with larger content, bosses, relic synergies, and optional challenge modifiers.
- Bundle size remains above Vite's default warning threshold because Phaser is bundled into the main chunk; future hardening can add manual chunking if load performance becomes a practical issue.
