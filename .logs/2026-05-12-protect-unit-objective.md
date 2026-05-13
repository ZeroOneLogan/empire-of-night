# Protect Unit Objective

## Slice

- Added typed `protect_unit` objective state with protected unit id, protected-turn progress, and required turns.
- Promoted `wall-siege` from a hold encounter into a distinct protected-anchor objective centered on the Veil Occultist.
- Added simulation victory and failure rules: the protected unit must stay alive until the required protected turns complete; if they fall, the battle fails.
- Added DOM progress/result handling and route-map objective labeling.
- Added a protected-unit canvas halo/marker to the Phaser renderer.
- Added Playwright coverage for the successful protect flow.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "protect unit objective"`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-protect-unit-objective-progress.png`

## Browser Proof

Captured the battle screen at 1440x980 after the first protected turn. The proof screenshot shows `Veil Occultist guarded 1/2 turns.` and the protected unit marker on the canvas.

The proof script then ended the second player turn and reported:

```json
{"screen":"result","phase":"victory","result":"victory","objective":{"type":"protect_unit","protectedUnitId":"occultist","protectedTurns":2,"requiredTurns":2,"description":"Protect the Veil Occultist for 2 turns while they seal the wall breach."},"occultistHp":10,"latestEvent":"Veil Occultist seals the breach. The wall opens to the night court.","protectEvent":"Veil Occultist holds the breach ward (2/2).","errors":[]}
```
