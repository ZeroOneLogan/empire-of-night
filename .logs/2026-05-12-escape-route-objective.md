# Escape Route Objective

## Slice

- Added typed `escape_route` objective state with exit tiles, escaped unit ids, and required escape count.
- Promoted `canal-smugglers` from a commander-kill encounter into a distinct fog-bridge escape objective.
- Added simulation interaction support: a unit on an exit tile can spend interact to escape, gain a ward, and complete the encounter once the required count is reached.
- Added DOM progress/result handling and route-map objective labeling.
- Added Phaser exit-tile board treatment and `Escape Fog Bridge` interaction previews.
- Added Playwright coverage for the full escape flow.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "escape route objective"`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-escape-route-objective-preview.png`

## Browser Proof

Captured the battle screen at 1440x980 after moving the Regent onto the canal exit tile and selecting `Interact`. The proof screenshot shows the `Escape Fog Bridge` preview.

The proof script then executed the interact command and reported:

```json
{"screen":"result","phase":"victory","result":"victory","objective":{"type":"escape_route","exitTiles":[{"x":0,"y":4}],"escapedUnitIds":["regent"],"requiredEscapes":1,"description":"Escape one court unit through the fog bridge before the canal patrol closes."},"regentWarded":2,"latestEvent":"The court slips through the fog bridge. Canal patrols lose the trail.","escapeEvent":"Nocturne Regent escapes through the fog bridge (1/1).","errors":[]}
```
