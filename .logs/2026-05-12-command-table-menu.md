# Command Table Menu

Date: 2026-05-12

## Scope Completed

- Reworked the Phaser menu canvas from a simple title card into an imperial command table.
- Added a route-map composition with four district nodes and connecting route lines.
- Added the starting court token lineup using the manifest-driven unit SVG assets.
- Added a Dawn Exarch threat marker to establish the final-run pressure from the first screen.
- Adjusted title, subtitle, route caption, map, and threat marker placement after screenshot review to avoid overlap with the DOM run controls.

## Files Changed Summary

- `src/phaser/scenes/MenuScene.ts`: added the command-table map, token lineup, and Dawn Exarch marker.
- `PLAN.md`: updated current-state evidence for the menu presentation pass.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification Performed

- Started the Vite dev server on `http://127.0.0.1:4173/`.
- Captured initial menu screenshot: `.logs/2026-05-12-command-table-menu.png`.
- Found and fixed title/caption and right-panel composition crowding.
- Captured corrected menu screenshot: `.logs/2026-05-12-command-table-menu-polished.png`.
- Confirmed all nine unit asset resources loaded.
- Browser console errors during screenshot capture: none.

## Known Follow-ups

- The menu now reads as an actual command-table game surface.
- Future polish could add subtle parallax or animated route glows, but the placeholder title-card issue is resolved.
