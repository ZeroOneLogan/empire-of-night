# Objective-specific defeat copy

## Slice

- Added result-screen defeat copy that identifies why the battle was lost:
  - protected-unit objective failure
  - full dawn meter exposure
  - all court units broken
  - generic fallback defeat
- Extended the ritual defeat smoke test to assert the dawn-exposure eyebrow and result heading.
- Updated `PLAN.md` so the outcome presentation and test coverage bullets describe objective-specific victory and defeat copy.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "ritual battle can be lost"`
- `npm run test:e2e`
- Browser proof through Playwright against `http://127.0.0.1:4173/`:
  - screen: `result`
  - result: `defeat`
  - title visible: `The dawn meter is full.`
  - eyebrow visible: `Dawn exposure`
  - latest event: `The dawn meter is full. The court is exposed and the run is lost.`
  - console errors: `[]`

## Artifact

- `.logs/2026-05-12-objective-specific-defeat-copy.png`
