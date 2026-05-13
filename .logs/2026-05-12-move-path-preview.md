# Move Path Preview

Date: 2026-05-12

## Scope

- Added a renderer-only movement path preview for legal move hovers.
- The path line uses the same board state, tile occupancy, obstacle, and grid bounds as the visible battle state, but does not mutate or replace the simulation reducer.
- Added step markers, destination emphasis, and hazard-aware move-card text so players can see both route and consequence before committing.
- Updated Playwright hover coverage to target a multi-step reachable tile instead of a one-step move.

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed with escalation for macOS Chromium launch: 17/17.
- Browser proof through Playwright against `http://127.0.0.1:4173/` completed with no console errors.

## Browser Proof

- `.logs/2026-05-12-move-path-preview.png`

## Notes

- This is deliberately presentation-only: movement legality still comes from the existing battle simulation and click dispatch path.
- The current path is shortest-path readable rather than player-selectable. A later polish pass could add alternate route cycling if terrain rules become more complex.
