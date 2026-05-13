# Hover Preview Polish

Date: 2026-05-12

## Scope

- Added a Phaser hover-preview layer that tracks the hovered grid tile without mutating battle state.
- Added tile outlines and compact preview cards for legal moves, invalid move/attack tiles, selectable court units, attack targets, projected damage, lethal/survival result text, and hazard context.
- Kept the simulation boundary intact: reducers still own legality, while `BattleScene` only tracks pointer position and `BattleRenderer` visualizes derived preview data.
- Added Playwright coverage that verifies canvas output changes for both move and attack hover states using internal-canvas-to-page coordinate conversion.

## Verification

- `npm run build` passed.
- `npm run test:e2e` initially hit the macOS Chromium sandbox launch failure, then passed when rerun with escalation: 17/17.
- Browser proof through Playwright against `http://127.0.0.1:4173/` completed with no console errors.

## Browser Proof

- `.logs/2026-05-12-hover-preview-move.png`
- `.logs/2026-05-12-hover-preview-attack.png`

## Notes

- The hover card intentionally sits inside the tactical board instead of adding another persistent DOM panel, keeping the right-side HUD focused on durable state.
- Further feel polish could add path arrows for move previews and target-specific hit-stop timing, but the core pre-commit affordance is now visible.
