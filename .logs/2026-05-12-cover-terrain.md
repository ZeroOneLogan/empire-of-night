# Cover Terrain

Date: 2026-05-12

## Scope

- Added `cover` as a first-class terrain kind.
- Authored cover tiles across all tactical encounters.
- Cover remains walkable but reduces incoming ranged damage by 1.
- Updated simulation damage resolution for player and enemy attacks.
- Updated DOM tactical previews and Phaser hover cards so covered targets show reduced projected damage.
- Added cover board rendering with low wall geometry distinct from blockers, hazards, and ritual tiles.

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed with escalation for macOS Chromium launch: 19/19.
- Browser proof through Playwright against `http://127.0.0.1:4173/` completed with no console errors.

## Browser Proof

- `.logs/2026-05-12-cover-terrain-preview.png`

## Notes

- The rule is intentionally narrow: cover helps against ranged attacks only, so melee still matters and close units can force protected enemies out of position.
- The focused Playwright test verifies both preview text and actual reduced damage against a covered Dawn Vanguard.
