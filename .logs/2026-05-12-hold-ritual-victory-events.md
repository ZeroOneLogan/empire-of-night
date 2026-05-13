# Hold ritual victory events

## Slice

- Added district-aware hold-ritual victory event copy in the battle simulation.
- Canal rites now resolve with `The canal shrine is bound. Fog-banners rise over the black water.` instead of the crypt-gate fallback.
- Added pure Playwright smoke coverage that wins `canal-rite` through the reducer and asserts the latest event.
- Updated `PLAN.md` so the coverage bullet names commander and district victory event copy.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "hold ritual victory event"`
- `npm run test:e2e`
- Browser proof through Playwright against `http://127.0.0.1:4173/`:
  - screen: `result`
  - result: `victory`
  - held turns: `2`
  - latest event: `The canal shrine is bound. Fog-banners rise over the black water.`
  - event visible: `true`
  - console errors: `[]`

## Artifact

- `.logs/2026-05-12-hold-ritual-victory-events.png`
