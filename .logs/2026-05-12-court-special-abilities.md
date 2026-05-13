# Court Special Abilities

Date: 2026-05-12

## Scope

- Added a `special` player action on hotkey `4`.
- Added second court abilities:
  - Regent: Imperial Decree, ranged daze and chip damage.
  - Knight: Oath Hook, short reach disruption.
  - Occultist: Veil Bind, long range daze setup.
- Updated battle simulation so targeted actions select the correct active ability while enemies continue using their primary intent ability.
- Updated Phaser click handling, keyboard handling, attack previews, hover cards, and DOM tactical preview to support special abilities.
- Added Playwright coverage proving Imperial Decree deals damage, applies dazed, and advances active-unit sequencing.

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed with escalation for macOS Chromium launch: 18/18.
- Browser proof through Playwright against `http://127.0.0.1:4173/` completed with no console errors.

## Browser Proof

- `.logs/2026-05-12-special-ability-preview.png`

## Notes

- This keeps the action system deterministic and local while giving the court more unit identity than basic attack plus guard.
- The next depth step would be non-damage support abilities, but that should be a separate reducer slice because it changes targeting rules.
