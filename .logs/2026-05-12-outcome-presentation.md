# Outcome Presentation

Date: 2026-05-12

## Scope Completed

- Replaced the plain battle result modal with a richer battle ledger.
- Added survivor counts, dawn casualties, dawn meter state, objective record, and spoils state to battle outcomes.
- Upgraded the run summary into a campaign ledger with route conquered, blood, authority, doctrine, meta record, spoils and pressure, and codex recap.
- Kept outcome UI in the DOM overlay layer so Phaser remains focused on tactical visualization.
- Added Playwright assertions for battle outcome ledger and campaign ledger content.

## Files Changed Summary

- `src/ui/overlay.ts`: expanded result and run summary rendering.
- `src/style.css`: added outcome ledger and campaign summary styles.
- `tests/e2e/smoke.spec.ts`: added assertions for battle and campaign outcome presentation.
- `PLAN.md`: updated current-state and verification notes for outcome ledgers.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification Performed

- Started the Vite dev server on `http://127.0.0.1:4173/`.
- Captured standalone battle victory ledger screenshot: `.logs/2026-05-12-outcome-ledger-victory.png`.
- Captured completed campaign ledger screenshot: `.logs/2026-05-12-outcome-ledger-run-summary.png`.
- Browser console errors during screenshot capture: none.

## Known Follow-ups

- The run conclusion now reads like a finished flow, but combat timing and hit animation still need a higher-juice pass.
- Finished sprite assets remain a separate visual polish gap.
- The production build still emits the existing Vite large chunk warning because Phaser is shipped in the main bundle.
