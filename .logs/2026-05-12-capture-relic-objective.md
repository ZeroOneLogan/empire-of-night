# Capture Relic Objective

## Slice

- Added a typed `capture_relic` objective state with target relic cache tiles and captured progress.
- Promoted `market-relic` from a hold objective into a distinct capture objective.
- Updated tactical interaction so reaching the objective cache and spending interact seizes the ledger, claims the cache, wards/heals the unit, and wins the encounter.
- Added DOM and Phaser preview support for the objective, including objective progress text, route labels, result ledger text, tile rings, and `Seize Relic Ledger` interaction previews.
- Added Playwright coverage for the full capture flow.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "capture relic objective"`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-capture-relic-objective-preview.png`

## Browser Proof

Captured the battle screen at 1440x980 after moving the Regent onto the market relic cache and selecting `Interact`. The proof screenshot shows the `Seize Relic Ledger` preview.

The proof script then executed the interact command and reported:

```json
{"screen":"result","phase":"victory","result":"victory","objective":{"type":"capture_relic","relicTiles":[{"x":3,"y":2}],"captured":true,"description":"Seize the auction relic ledger from the cache before dawn locks the market."},"claimedCaches":["3,2"],"latestEvent":"The relic ledger is seized. Market oaths bend toward the night court.","captureEvent":"Nocturne Regent seizes the relic ledger, restoring 2 health and gaining a ward.","errors":[]}
```
