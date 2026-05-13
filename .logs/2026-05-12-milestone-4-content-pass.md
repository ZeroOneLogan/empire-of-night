# 2026-05-12 Milestone 4 Content Pass

## Scope Completed

- Expanded the route to 12 authored encounter nodes across four tiers.
- Added district identity for crypt, market, chapel, canal, wall, and palace.
- Added six relic reward identities: Moon-Splinter Crown, Canal Mirror, Bell Ash Reliquary, Wall-Key of Thorns, Market Mask, and Palace Nightglass.
- Added five doctrine identities for reward and run-state divergence: crown, terror, shadow, blood, and pact.
- Added five dawn enemy archetypes across encounters: dawn soldier, sun acolyte, inquisitor, lantern marksman, and bell warden.
- Added four hazard tile types with tactical effects and visual markings: blood mire, veil fog, sunflare, and relic cache.
- Added route codex notes and reward comparison copy directly into the route/reward UI.
- Extended run state with upgrades and codex entries so reward and route choices are visible in the run summary.

## Files Changed Summary

- `src/game/content/route.ts`: 12-node route, relic catalog, doctrine catalog, reward comparison data, district codex notes.
- `src/game/content/encounters.ts`: data-driven encounter configs, five enemy archetypes, four hazard layouts, 12 route encounters plus debug aliases.
- `src/game/simulation/types.ts`: content pass types for hazards, expanded encounters, upgrades, codex entries, and content summary.
- `src/game/simulation/battle.ts`: hazard-on-enter effects and Milestone 4 battle version.
- `src/game/app.ts`: Milestone 4 snapshot version, content summary, reward application for resources, relics, doctrines, upgrades, and codex.
- `src/phaser/view/battleRenderer.ts`: hazard rendering and new enemy silhouettes/colors.
- `src/ui/overlay.ts`, `src/style.css`: route codex copy, reward comparison UI, dynamic route length, and summary counts.
- `tests/e2e/smoke.spec.ts`: content catalog breadth check and four-encounter campaign route proof.
- `PLAN.md`: current-state and milestone status update.

## Commands Run

- `npm run build`
- `npm run test:e2e`

## Browser Verification

- Playwright suite passed: 7 tests.
- Visual verification launched the Vite app at `http://127.0.0.1:4173/`.
- Captured route variety proof: `.logs/2026-05-12-milestone-4-route-variety.png`.
- Captured hazard-heavy palace battle proof: `.logs/2026-05-12-milestone-4-hazard-battle.png`.
- Captured reward comparison proof: `.logs/2026-05-12-milestone-4-reward-comparison.png`.
- Verified browser state for `palace-gate`: enemies included inquisitor, bell warden, lantern marksman, and sun acolyte; hazards included relic cache, sunflare, veil fog, and blood mire.
- Browser console errors during screenshot passes: none.

## Known Follow-ups

- Next product slice should begin Milestone 5: polish the tactical HUD, main/pause/settings surfaces, feedback effects, combat log readability, and placeholder audio pass.
- Route choices now differ materially by content, rewards, doctrine, and codex notes, but relics/upgrades still mostly record state; future passes should make more of them alter combat rules.
- Enemy pathing remains intentionally simple and greedy; tactical pathfinding and line-of-sight remain later depth work.
