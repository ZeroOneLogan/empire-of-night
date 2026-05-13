# Relic Reward Active Preview

## Slice

- Added typed `activeDetail` copy to relic reward options so reward cards explain each relic's once-per-battle battle command before selection.
- Rendered the active relic detail as a distinct reward-card chip without changing non-relic reward cards.
- Added Playwright coverage for the Canal Mirror reward card and snapshot reward data.
- Updated `PLAN.md` current-state and coverage notes.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "relic reward cards"`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-relic-reward-active-preview.png`

## Browser Proof

Captured the reward screen at 1440x980 after a deterministic `crypt-rite` victory. The relic reward card showed:

`Active: spend AP to reopen this unit movement and gain Warded 2 once per battle.`

The browser proof script reported:

```json
{"screen":"reward","activeDetail":"Active: spend AP to reopen this unit movement and gain Warded 2 once per battle.","errors":[]}
```
