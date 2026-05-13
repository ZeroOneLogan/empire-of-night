# Audio Cue Palette

Date: 2026-05-12

## Scope

- Replaced the single-frequency placeholder cue table with an authored WebAudio cue palette.
- Added explicit cue categories for select, menu confirm, move, attack, hit, guard, turn start, dawn warning, reward, victory, and defeat.
- Wired menu/run confirmation, attack impact, and high-dawn turn warnings to distinct cue names.
- Exposed `content.audioCues` through the debug snapshot so browser tests can verify the cue surface without depending on physical speaker output.
- Updated the settings drawer label from placeholder audio to game audio.

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed with escalation for macOS Chromium launch: 17/17.
- Browser proof through Playwright against `http://127.0.0.1:4173/` completed with no console errors and returned:
  `["select","menuConfirm","move","attack","hit","guard","turnStart","dawnWarning","reward","victory","defeat"]`

## Browser Proof

- `.logs/2026-05-12-audio-cue-palette-settings.png`

## Notes

- The cue palette still uses generated WebAudio rather than shipped audio files, keeping the project local-only and asset-light.
- Playwright verifies the categories and mute setting, but subjective sound quality still needs manual listening in a real browser session.
