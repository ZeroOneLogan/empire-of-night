# Combat Effects

Date: 2026-05-12

## Scope Completed

- Added a transient Phaser effect layer driven by the latest simulation event id.
- Added strike lines and floating damage numbers for player attacks and enemy hits.
- Added unit pulses for movement, guard, hazard, ward, bleeding, and other unit-state events.
- Added board pulses for objective and dawn-pressure events.
- Ensured effects do not replay on every render by keying them to encounter id, event id, and event message.
- Ensured renderer shutdown kills active tweens and destroys transient effect objects.

## Files Changed Summary

- `src/phaser/view/battleRenderer.ts`: added event-derived effect emission, cleanup, strike effects, unit pulses, board pulses, and floating damage labels.
- `PLAN.md`: updated current-state evidence for the combat effects pass.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification Performed

- Started the Vite dev server on `http://127.0.0.1:4173/`.
- Captured objective board pulse screenshot: `.logs/2026-05-12-combat-effects-objective-pulse.png`.
- Captured movement/unit pulse screenshot: `.logs/2026-05-12-combat-effects-move-pulse.png`.
- Captured attack strike and floating damage screenshot: `.logs/2026-05-12-combat-effects-strike.png`.
- Browser console errors during screenshot capture: none.

## Known Follow-ups

- Combat now has visible impact timing, but the units are still procedural silhouettes rather than finished sprite sheets.
- A future pass could add tweened unit displacement or shake, but the current pass intentionally avoids scene-local gameplay flags.
