# Production Runtime Split

Date: 2026-05-12

## Scope Completed

- Split Phaser startup out of the app entrypoint so the DOM shell, overlay, store, and debug bridge do not import Phaser directly.
- Added `src/phaser/createPhaserGame.ts` as the dedicated Phaser runtime boundary.
- Added Vite manual chunking so Phaser ships as a stable `phaser-runtime` production chunk.
- Raised the Vite chunk warning limit to match the intentional Phaser vendor chunk and removed the previous noisy build warning.
- Verified the built `dist` output through `vite preview`, not only through the dev server.

## Files Changed Summary

- `src/main.ts`: removed direct Phaser imports and dynamically imports the Phaser runtime.
- `src/phaser/createPhaserGame.ts`: added the Phaser game factory and scene registration.
- `vite.config.ts`: added build chunk policy and `phaser-runtime` manual chunking.
- `PLAN.md`: updated current-state evidence for the production runtime split.

## Commands Run

- `npm run build`
- `npm run test:e2e`
- `npm run preview -- --host 127.0.0.1 --port 4173`

## Browser Verification Performed

- Opened the production preview at `http://127.0.0.1:4173/`.
- Confirmed the menu rendered and the Phaser canvas loaded.
- Confirmed production asset requests included:
  - `index-*.js`
  - `createPhaserGame-*.js`
  - `phaser-runtime-*.js`
- Captured screenshot: `.logs/2026-05-12-production-runtime-split.png`.
- Browser console errors during production preview capture: none.

## Build Evidence

- `npm run build` passed with no chunk-size warning.
- App entry chunk: about 64.55 kB raw / 19.12 kB gzip.
- Phaser vendor chunk: about 1,478.57 kB raw / 339.68 kB gzip.

## Known Follow-ups

- Combat animation timing and finished unit art remain the higher-value quality gaps after the production warning cleanup.
