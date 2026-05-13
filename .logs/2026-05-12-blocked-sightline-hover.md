# Blocked Sightline Hover Feedback

Date: 2026-05-12

## Scope

- Added canvas hover feedback for blocked ranged sightlines.
- Hovering an in-range dawn target without line of sight now draws:
  - the interrupted sightline from the active unit,
  - a red blocked segment,
  - a muted blocked segment past the obstacle,
  - a marked obstacle tile with an X.
- Kept the canvas hover card readable while layering the blocked ray over the card backing.
- Added Playwright canvas screenshot-diff coverage for blocked line-of-sight hover feedback.
- Updated `PLAN.md` to record blocked-sightline hover feedback and coverage.

## Files Changed

- `src/phaser/view/battleRenderer.ts`
- `tests/e2e/smoke.spec.ts`
- `PLAN.md`

## Verification

- `npm run build` passed.
- `npm run test:e2e -- --grep "blocked line of sight"` passed: 1/1 test.
- `npm run test:e2e` passed: 24/24 tests.
- Browser proof captured `.logs/2026-05-12-blocked-sightline-hover.png`.
- Focused browser check returned `{"errors":[],"hovered":true}`.

## Known Follow-ups

- Consider moving blocked-hover cards outside the board bounds when the card would overlap the blocking obstacle.
- Add a short tutorial prompt the first time the player sees a blocked ranged target.
