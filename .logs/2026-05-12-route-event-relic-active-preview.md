# Route Event Relic Active Preview

## Slice

- Added `activeDetail` support to `RouteEventChoice`.
- Derived route-event relic active details from the same relic detail table used by reward cards.
- Rendered relic active command copy on route-event bargain cards before comparison text.
- Added Playwright coverage for a seeded route-event relic bargain.
- Updated `PLAN.md` current-state and coverage notes.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "route event relic bargains"`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-route-event-relic-active-preview.png`

## Browser Proof

Captured the event screen at 1440x980 after a deterministic route-event setup. The proof landed on `Nightglass Audience` with the `Take the nightglass` bargain and showed:

`Active: spend AP to reduce dawn pressure and ward the court once per battle.`

The browser proof script reported:

```json
{"screen":"event","eventTitle":"Nightglass Audience","choiceTitle":"Take the nightglass","relic":"Palace Nightglass","activeDetail":"Active: spend AP to reduce dawn pressure and ward the court once per battle.","errors":[]}
```
