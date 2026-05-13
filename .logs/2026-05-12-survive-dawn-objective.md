# Survive Dawn Objective

## Slice

- Added typed `survive_dawn` objective state with survived-turn progress.
- Promoted `chapel-pyre` from a hold objective into a distinct survival encounter.
- Added simulation scoring on player turn end: each endured wave advances the objective and victory triggers after the required number of waves.
- Added DOM progress and result ledger handling for survival objectives.
- Added Playwright coverage for the full two-wave survival flow.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "survive dawn objective"`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-survive-dawn-objective-progress.png`

## Browser Proof

Captured the battle screen at 1440x980 after the first endured dawn wave. The proof screenshot shows `Dawn waves endured 1/2.`

The proof script then ended the second player turn and reported:

```json
{"screen":"result","phase":"victory","result":"victory","objective":{"type":"survive_dawn","survivedTurns":2,"requiredTurns":2,"description":"Survive 2 dawn waves under chapel sunfire."},"latestEvent":"The court survives the dawn pyre. Chapel fires gutter into imperial ash.","waveEvent":"The court endures dawn wave 2/2.","errors":[]}
```
