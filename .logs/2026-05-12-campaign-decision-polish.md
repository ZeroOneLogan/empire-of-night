# Campaign Decision Polish

Date: 2026-05-12

## Scope

- Added campaign route progress stages so each district choice sits inside the current run arc.
- Added carried-pressure and archive intel panels to summarize relics, upgrades, event debt, and secured districts before the next choice.
- Added route card meta hints for objective type, risk, and expected reward shape.
- Added reward ledger context for relics, upgrades, and challenge debt before post-battle reward selection.
- Added route event stakes chips so event choices expose current blood, authority, doctrine, and challenge pressure.
- Expanded Playwright coverage for route progress, carried-pressure/archive intel, and reward ledger visibility.

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed: 16/16.
- Browser proof through Playwright against `http://127.0.0.1:4173/` completed with no console errors.

## Browser Proof

- `.logs/2026-05-12-campaign-decision-route.png`
- `.logs/2026-05-12-campaign-decision-reward.png`
- `.logs/2026-05-12-campaign-decision-event.png`

## Notes

- The route, reward, and event layouts were visually inspected at a desktop viewport after capture.
- The remaining polish frontier is a full-run readability audit across the whole flow, not a blocker for this slice.
