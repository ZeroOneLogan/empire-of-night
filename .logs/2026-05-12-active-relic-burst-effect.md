# Active Relic Burst Effect

## Slice

- Added a relic-specific effect path to the Phaser battle renderer before generic objective pulses.
- Added distinct colors and labels for `Canal Mirror`, `Bell Ash Reliquary`, `Wall-Key of Thorns`, `Market Mask`, `Palace Nightglass`, and `Moon-Splinter Crown` invocation events.
- Added secondary pulses for affected dawn or court units and board pressure where relevant.
- Hardened Playwright local execution to one worker so canvas screenshot and UI interaction checks remain stable under `npm run test:e2e`.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "bound relics"`
- `npm run test:e2e -- --workers=1`
- `npm run test:e2e`
- Browser proof: `.logs/2026-05-12-active-relic-burst-effect.png`

## Browser Proof

Captured the battle screen at 1440x980 immediately after invoking `Canal Mirror`. The proof screenshot shows the relic burst over the Veil Occultist, and the script reported:

```json
{"screen":"battle","selectedAction":"move","relicPowerUsed":true,"occultistWarded":2,"latestEvent":"Veil Occultist invokes Canal Mirror, reopening a mirrored path.","errors":[]}
```
