# Destination Threat Preview

Date: 2026-05-12

## Scope

- Added destination danger readout to legal move hovers.
- Threatened move destinations now draw red strike lines from enemies that can hit the hovered tile, plus a warning ring around the destination.
- The move card now names threatening enemies while preserving step count, hazard consequence, and grid coordinate context.
- Kept the feature renderer-only: enemy range is derived from the current `BattleState`; movement legality and enemy resolution remain owned by simulation reducers.

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed with escalation for macOS Chromium launch: 17/17.
- Browser proof through Playwright against `http://127.0.0.1:4173/` completed with no console errors.

## Browser Proof

- `.logs/2026-05-12-destination-threat-preview.png`

## Notes

- This closes another tactical readability gap: legal movement is no longer merely reachable; it now communicates immediate enemy exposure before the player commits.
- Future depth could separate attack-of-opportunity threat from next-enemy-turn threat if the rules add reactions later.
