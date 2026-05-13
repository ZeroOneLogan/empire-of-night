# Objective-Specific Result Copy

## Slice

- Replaced the generic victory headline in the result panel with objective-specific outcome copy.
- Added tailored victory presentation for hold ritual, eliminate commander, capture relic, survive dawn, escape route, and protect unit objectives.
- Preserved the existing defeat copy.
- Added Playwright coverage proving an escape-route victory does not show the old crypt-gate headline.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "result panel uses objective-specific"`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-objective-specific-result-copy.png`

## Browser Proof

Captured the result screen at 1440x980 after an escape-route victory. The proof screenshot shows `The fog bridge closes behind the court.` instead of the old generic crypt-gate headline.

The proof script reported:

```json
{"screen":"result","titleVisible":true,"oldTitleVisible":false,"objectiveText":{"type":"escape_route","exitTiles":[{"x":0,"y":4}],"escapedUnitIds":["regent"],"requiredEscapes":1,"description":"Escape one court unit through the fog bridge before the canal patrol closes."},"errors":[]}
```
